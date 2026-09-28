import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { jsonError, serverError } from "@/lib/http";
import { accountLink, sendAccountEmail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";
import { createSecretToken } from "@/lib/tokens";
import { NextRequest, NextResponse } from "next/server";

const GENERIC = "If an account exists for that email, a reset link has been sent.";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
    if (!email || !email.includes("@")) return jsonError("Invalid input", 400);

    const attempt = rateLimit(`reset:${email}`, 5, 60 * 60 * 1000);
    if (!attempt.ok) return jsonError("Too many requests", 429);

    await connectDB();
    const user = await User.findOne({ email });
    if (user && user.isActive) {
      const token = createSecretToken();
      user.passwordResetTokenHash = token.hash;
      user.passwordResetExpires = token.expires;
      await user.save();
      await sendAccountEmail(
        user.email,
        "Reset your Blogiz password",
        `Reset your password: ${accountLink("/auth/reset-password", token.raw)}`
      );
    }

    return NextResponse.json({ message: GENERIC });
  } catch (error) {
    return serverError("Password reset request failed:", error);
  }
}
