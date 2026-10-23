import NextAuth, { CredentialsSignin, type Session, type User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { sessionUserCacheKey } from "@/lib/cache-invalidation";
import { requireAuthSecret, requireAuthUrl } from "@/lib/env";
import { rateLimit, RateLimitUnavailable } from "@/lib/rate-limit";
import { cacheDel, cacheGetJson, cacheSetJson } from "@/lib/redis-cache";
import { canSignIn, evaluateSession, type SessionUserRecord } from "@/lib/session-policy";

const authSecret = requireAuthSecret();
requireAuthUrl();

const SESSION_MAX_AGE_SECONDS = 60 * 60;
const SESSION_USER_CACHE_TTL_SECONDS = 30;

/** Surfaces Redis / rate-limit outages instead of a fake bad-password message. */
class RateLimitSigninError extends CredentialsSignin {
  code = "rate_limit_unavailable";
}

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

type CachedSessionUser = SessionUserRecord & {
  email: string;
  name: string;
  avatar: string;
};

async function fetchSessionUserFromMongo(userId: string): Promise<CachedSessionUser | null> {
  const { connectDB } = await import("./mongodb");
  const User = (await import("@/models/User")).default;
  await connectDB();
  const dbUser = await User.findById(userId).select(
    "role isActive emailVerified commentSuspended sessionVersion email name profile.avatar"
  );
  if (!dbUser) return null;

  return {
    role: dbUser.role,
    isActive: dbUser.isActive,
    emailVerified: dbUser.emailVerified,
    commentSuspended: Boolean(dbUser.commentSuspended),
    sessionVersion: dbUser.sessionVersion ?? 0,
    email: dbUser.email,
    name: dbUser.name,
    avatar: dbUser.profile?.avatar || "",
  };
}

async function loadSessionUser(
  userId: string,
  tokenVersion: number | undefined
): Promise<CachedSessionUser | null> {
  const key = sessionUserCacheKey(userId);
  const cached = await cacheGetJson<CachedSessionUser>(key);

  // On cache hit still require sessionVersion match; mismatch → reload Mongo.
  if (cached) {
    if (typeof tokenVersion !== "number" || cached.sessionVersion === tokenVersion) {
      return cached;
    }
    await cacheDel(key);
  }

  const snapshot = await fetchSessionUserFromMongo(userId);
  if (!snapshot) return null;
  await cacheSetJson(key, snapshot, SESSION_USER_CACHE_TTL_SECONDS);
  return snapshot;
}

const authConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { connectDB } = await import("./mongodb");
        const User = (await import("@/models/User")).default;
        const bcrypt = await import("bcryptjs");

        const email = typeof credentials?.email === "string" ? credentials.email.toLowerCase().trim() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) {
          throw new InvalidCredentialsError();
        }

        try {
          const attempt = await rateLimit(`login:${email}`, 10, 15 * 60 * 1000);
          if (!attempt.ok) {
            throw new InvalidCredentialsError();
          }
        } catch (error) {
          if (error instanceof RateLimitUnavailable) {
            throw new RateLimitSigninError();
          }
          throw error;
        }

        await connectDB();

        const user = await User.findOne({ email });
        if (!user) {
          throw new InvalidCredentialsError();
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid || !canSignIn(user)) {
          throw new InvalidCredentialsError();
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          sessionVersion: user.sessionVersion ?? 0,
          avatar: user.profile?.avatar || "",
          commentSuspended: Boolean(user.commentSuspended),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({
      token,
      user,
      trigger,
      session,
    }: {
      token: JWT;
      user?: User;
      trigger?: "signIn" | "signUp" | "update";
      session?: Session;
    }) {
      if (user) {
        token.id = user.id;
        token.sessionVersion = user.sessionVersion ?? 0;
        token.avatar = user.avatar || "";
      }

      if (trigger === "update" && session?.user) {
        if (typeof session.user.name === "string") token.name = session.user.name;
        if (typeof session.user.avatar === "string") token.avatar = session.user.avatar;
      }

      if (!token.id) {
        return { ...token, invalid: true };
      }

      try {
        const tokenVersion =
          typeof token.sessionVersion === "number" ? token.sessionVersion : undefined;
        const dbUser = await loadSessionUser(String(token.id), tokenVersion);
        const decision = evaluateSession(dbUser, tokenVersion);

        if (!decision.ok) {
          return { ...token, invalid: true };
        }

        token.role = decision.role;
        token.emailVerified = decision.emailVerified;
        token.commentSuspended = decision.commentSuspended;
        token.email = decision.email;
        token.name = decision.name;
        token.avatar = decision.avatar;
        token.invalid = false;
        return token;
      } catch (error) {
        console.error("Session refresh failed", error);
        return { ...token, invalid: true };
      }
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (!token || token.invalid || !token.id || !token.role) {
        return null as unknown as typeof session;
      }

      session.user.id = token.id;
      session.user.role = token.role;
      session.user.email = token.email || session.user.email;
      session.user.name = token.name || session.user.name;
      session.user.avatar = token.avatar || "";
      session.user.emailVerified = Boolean(token.emailVerified);
      session.user.commentSuspended = Boolean(token.commentSuspended);
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: 15 * 60,
  },
  secret: authSecret,
};

export const { handlers, auth } = NextAuth(authConfig);
export { authConfig };
