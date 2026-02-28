import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: "superadmin" | "admin" | "author" | "user";
  profile: {
    fullName: string;
    bio: string;
    avatar?: string;
    website?: string;
    socialLinks?: {
      twitter?: string;
      linkedin?: string;
      github?: string;
    };
    location?: string;
    expertise?: string[];
  };
  isActive: boolean;
  isApproved: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    role: {
      type: String,
      enum: ["superadmin", "admin", "author", "user"],
      default: "user",
    },
    profile: {
      fullName: {
        type: String,
        required: [true, "Full name is required"],
        trim: true,
      },
      bio: {
        type: String,
        maxlength: [500, "Bio cannot exceed 500 characters"],
        default: "",
      },
      avatar: {
        type: String,
        default: "",
      },
      website: {
        type: String,
        default: "",
      },
      socialLinks: {
        twitter: String,
        linkedin: String,
        github: String,
      },
      location: {
        type: String,
        default: "",
      },
      expertise: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isApproved: {
      type: Boolean,
      default: false, // Only authors need approval
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1, isApproved: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
