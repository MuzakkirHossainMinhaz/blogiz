import bcrypt from "bcryptjs";
import { connectDB } from "../src/lib/mongodb";
import User from "../src/models/User";
import { passwordSchema } from "../src/lib/validation";
import { canSignIn } from "../src/lib/session-policy";

/**
 * Upsert a single superadmin from ADMIN_EMAIL / ADMIN_PASSWORD.
 * Prefer `npm run seed` for a full truncate + fixture load.
 * Flags match authorize + canSignIn: isActive, isApproved, emailVerified, role=superadmin.
 */
async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("Refusing to seed while NODE_ENV=production");
    process.exit(1);
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!process.env.MONGODB_URI || !email || !password) {
    console.error("MONGODB_URI, ADMIN_EMAIL, and ADMIN_PASSWORD are required");
    process.exit(1);
  }

  if (!passwordSchema.safeParse(password).success) {
    console.error("ADMIN_PASSWORD does not meet the password policy");
    process.exit(1);
  }

  await connectDB();

  const hashed = await bcrypt.hash(password, 12);
  const existing = await User.findOne({ email });

  if (existing) {
    existing.password = hashed;
    existing.role = "superadmin";
    existing.isApproved = true;
    existing.isActive = true;
    existing.emailVerified = true;
    existing.sessionVersion = (existing.sessionVersion ?? 0) + 1;
    if (!existing.profile?.fullName) {
      existing.profile = {
        fullName: "Super Administrator",
        bio: existing.profile?.bio || "System administrator with full access.",
      };
    }
    await existing.save();

    const ok = canSignIn(existing) && (await bcrypt.compare(password, existing.password));
    if (!ok) {
      console.error("Updated superadmin failed login alignment check");
      process.exit(1);
    }
    console.log(`Superadmin password updated for ${email}`);
    process.exit(0);
  }

  const created = await User.create({
    email,
    password: hashed,
    name: "Super Admin",
    role: "superadmin",
    profile: {
      fullName: "Super Administrator",
      bio: "System administrator with full access to all features and settings.",
    },
    isApproved: true,
    isActive: true,
    emailVerified: true,
    sessionVersion: 0,
  });

  const ok = canSignIn(created) && (await bcrypt.compare(password, created.password));
  if (!ok) {
    console.error("Created superadmin failed login alignment check");
    process.exit(1);
  }

  console.log(`Superadmin created for ${email}`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Seed failed");
  console.error(error instanceof Error ? error.name : "Error");
  process.exit(1);
});
