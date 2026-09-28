import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { isDuplicateKey } from "@/lib/engagement";
import { jsonError, serverError } from "@/lib/http";
import { accountLink, sendAccountEmail } from "@/lib/mail";
import { rateLimit, RateLimitUnavailable } from "@/lib/rate-limit";
import { readTrustedClientAddress, hashIdentifier } from "@/lib/request-utils";
import { createSecretToken } from "@/lib/tokens";
import { passwordSchema } from "@/lib/validation";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email(),
  password: passwordSchema,
  fullName: z.string().trim().min(2).max(120),
  role: z.enum(["user", "author"]).default("user"),
});

const GENERIC_MESSAGE =
  "If this address can be registered, check your email to verify the account. Author accounts also need admin approval before they can publish.";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return jsonError("Invalid input", 400);
    }

    const email = validation.data.email.toLowerCase();
    const ip = readTrustedClientAddress((name) => request.headers.get(name));
    const emailLimit = await rateLimit(`register:${email}`, 5, 60 * 60 * 1000);
    const ipLimit = ip ? await rateLimit(`register-ip:${hashIdentifier(ip)}`, 20, 60 * 60 * 1000) : { ok: true as const };
    if (!emailLimit.ok || !ipLimit.ok) {
      return jsonError("Too many requests", 429);
    }

    await connectDB();

    const { name, password, fullName, role } = validation.data;
    const token = createSecretToken();
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(password, 12);
      try {
        await User.create({
          name,
          email,
          password: hashedPassword,
          role,
          profile: { fullName, bio: "" },
          isApproved: role !== "author",
          emailVerified: false,
          emailVerificationTokenHash: token.hash,
          emailVerificationExpires: token.expires,
        });
      } catch (error) {
        if (!isDuplicateKey(error)) throw error;
      }
    } else if (!existingUser.emailVerified) {
      existingUser.emailVerificationTokenHash = token.hash;
      existingUser.emailVerificationExpires = token.expires;
      await existingUser.save();
    }

    if (!existingUser || !existingUser.emailVerified) {
      await sendAccountEmail(
        email,
        "Verify your Blogiz email",
        `Verify your email: ${accountLink("/auth/verify-email", token.raw)}`
      );
    }

    return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
  } catch (error) {
    if (error instanceof RateLimitUnavailable) return jsonError(error.message, 503);
    return serverError("Registration error:", error);
  }
}
