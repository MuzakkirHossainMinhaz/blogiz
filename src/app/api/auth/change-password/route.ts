import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { denied, requireUser } from "@/lib/authz";
import { jsonError, serverError } from "@/lib/http";
import { passwordSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const actor = await requireUser();
    if (denied(actor)) return actor;

    const body = await request.json().catch(() => null);
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const parsed = passwordSchema.safeParse(body?.password);
    if (!currentPassword || !parsed.success) return jsonError("Invalid input", 400);

    await connectDB();
    const user = await User.findById(actor.id);
    if (!user || !user.isActive) return jsonError("Unauthorized", 401);

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) return jsonError("Invalid input", 400);

    user.password = await bcrypt.hash(parsed.data, 12);
    user.sessionVersion = (user.sessionVersion ?? 0) + 1;
    await user.save();

    return NextResponse.json({ message: "Password updated" });
  } catch (error) {
    return serverError("Password change failed:", error);
  }
}
