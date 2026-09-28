import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { jsonError, serverError } from "@/lib/http";
import { hashToken } from "@/lib/tokens";
import { passwordSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token : "";
    const parsed = passwordSchema.safeParse(body?.password);
    if (!token || !parsed.success) return jsonError("Invalid input", 400);

    await connectDB();
    const user = await User.findOne({
      passwordResetTokenHash: hashToken(token),
      passwordResetExpires: { $gt: new Date() },
    });
    if (!user || !user.isActive) return jsonError("Invalid or expired token", 400);

    user.password = await bcrypt.hash(parsed.data, 12);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    await user.save();

    return NextResponse.json({ message: "Password updated" });
  } catch (error) {
    return serverError("Password reset failed:", error);
  }
}
