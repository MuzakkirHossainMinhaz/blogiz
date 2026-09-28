import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { denied, requireUser } from "@/lib/authz";
import { jsonError, serverError } from "@/lib/http";
import { accountLink, sendAccountEmail } from "@/lib/mail";
import { createSecretToken } from "@/lib/tokens";

const schema = z.object({
  email: z.email(),
  currentPassword: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const actor = await requireUser();
    if (denied(actor)) return actor;

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError("Invalid input", 400);

    const email = parsed.data.email.toLowerCase();
    await connectDB();

    const user = await User.findById(actor.id);
    if (!user || !user.isActive) return jsonError("Unauthorized", 401);

    const matches = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!matches) return jsonError("Invalid input", 400);

    const taken = await User.findOne({ email, _id: { $ne: user._id } }).select("_id");
    if (taken) {
      return NextResponse.json({ message: "If that address is available, a verification email has been sent." });
    }

    const token = createSecretToken();
    user.pendingEmail = email;
    user.emailVerified = false;
    user.emailVerificationTokenHash = token.hash;
    user.emailVerificationExpires = token.expires;
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    await user.save();

    await sendAccountEmail(
      email,
      "Confirm your new Blogiz email",
      `Confirm this email address: ${accountLink("/auth/verify-email", token.raw)}`
    );

    return NextResponse.json({ message: "If that address is available, a verification email has been sent." });
  } catch (error) {
    return serverError("Email change failed:", error);
  }
}
