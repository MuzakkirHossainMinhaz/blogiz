import bcrypt from "bcryptjs";
import { connectDB } from "../src/lib/mongodb";
import User from "../src/models/User";
import { passwordSchema } from "../src/lib/validation";

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

  const existing = await User.findOne({ role: "superadmin" }).select("email");
  if (existing) {
    console.log("Superadmin already exists");
    process.exit(0);
  }

  await User.create({
    email,
    password: await bcrypt.hash(password, 12),
    name: "Super Admin",
    role: "superadmin",
    profile: {
      fullName: "Super Administrator",
      bio: "System administrator with full access to all features and settings.",
    },
    isApproved: true,
    isActive: true,
    emailVerified: true,
  });

  console.log(`Superadmin created for ${email}`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Seed failed");
  console.error(error instanceof Error ? error.name : "Error");
  process.exit(1);
});
