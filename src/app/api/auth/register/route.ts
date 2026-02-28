import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  role: z.enum(["user", "author"]).default("user"),
});

// POST /api/auth/register - Register a new user
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, email, password, fullName, role } = validation.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, message: "User with this email already exists" }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with profile
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      profile: {
        fullName,
        bio: "",
      },
      isApproved: role === "author" ? false : true, // Authors need approval
    });

    // Remove password from response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile: user.profile,
      isApproved: user.isApproved,
      createdAt: user.createdAt,
    };

    return NextResponse.json(
      {
        success: true,
        message:
          role === "author"
            ? "Registration successful! Your account is pending approval from an admin."
            : "User created successfully",
        user: userResponse,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);

    // Handle duplicate key error (MongoDB)
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: "User with this email already exists" }, { status: 409 });
    }

    return NextResponse.json(
      { success: false, message: "Failed to create user", error: error.message },
      { status: 500 }
    );
  }
}
