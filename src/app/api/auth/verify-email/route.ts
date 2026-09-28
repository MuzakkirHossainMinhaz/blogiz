import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { jsonError, serverError } from "@/lib/http";
import { hashToken } from "@/lib/tokens";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token : "";
    if (!token) return jsonError("Invalid or expired token", 400);

    await connectDB();

    const user = await User.findOne({
      emailVerificationTokenHash: hashToken(token),
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) return jsonError("Invalid or expired token", 400);

    if (user.pendingEmail) {
      user.email = user.pendingEmail;
      user.pendingEmail = undefined;
    }
    user.emailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpires = undefined;
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    await user.save();

    return NextResponse.json({ message: "Email verified" });
  } catch (error) {
    return serverError("Email verification failed:", error);
  }
}
