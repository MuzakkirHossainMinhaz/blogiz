import NextAuth, { CredentialsSignin, type Session, type User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { requireAuthSecret, requireAuthUrl } from "@/lib/env";
import { rateLimit, RateLimitUnavailable } from "@/lib/rate-limit";
import { canSignIn, evaluateSession } from "@/lib/session-policy";

const authSecret = requireAuthSecret();
requireAuthUrl();

const SESSION_MAX_AGE_SECONDS = 60 * 60;

/** Surfaces Redis / rate-limit outages instead of a fake bad-password message. */
class RateLimitSigninError extends CredentialsSignin {
  code = "rate_limit_unavailable";
}

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
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
          isApproved: user.isApproved,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.id = user.id;
        token.sessionVersion = user.sessionVersion ?? 0;
      }

      if (!token.id) {
        return { ...token, invalid: true };
      }

      try {
        const { connectDB } = await import("./mongodb");
        const User = (await import("@/models/User")).default;
        await connectDB();
        const dbUser = await User.findById(token.id).select(
          "role isActive isApproved emailVerified sessionVersion email name"
        );
        const decision = evaluateSession(
          dbUser
            ? {
                role: dbUser.role,
                isActive: dbUser.isActive,
                isApproved: dbUser.isApproved,
                emailVerified: dbUser.emailVerified,
                sessionVersion: dbUser.sessionVersion ?? 0,
                email: dbUser.email,
                name: dbUser.name,
              }
            : null,
          typeof token.sessionVersion === "number" ? token.sessionVersion : undefined
        );

        if (!decision.ok) {
          return { ...token, invalid: true };
        }

        token.role = decision.role;
        token.isApproved = decision.isApproved;
        token.emailVerified = decision.emailVerified;
        token.email = decision.email;
        token.name = decision.name;
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
      session.user.isApproved = Boolean(token.isApproved);
      session.user.emailVerified = Boolean(token.emailVerified);
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
