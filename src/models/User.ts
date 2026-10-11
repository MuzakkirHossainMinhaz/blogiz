import mongoose, { Document, Model, Schema } from "mongoose";

export type UserRole = "admin" | "author" | "reader";

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  profile: {
    fullName: string;
    bio: string;
    avatar?: string;
    avatarPublicId?: string;
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
  commentSuspended: boolean;
  commentSuspendedAt?: Date;
  commentSuspendedReason?: string;
  commentSuspendedBy?: mongoose.Types.ObjectId;
  emailVerified: boolean;
  sessionVersion: number;
  emailVerificationTokenHash?: string;
  emailVerificationExpires?: Date;
  passwordResetTokenHash?: string;
  passwordResetExpires?: Date;
  pendingEmail?: string;
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
      minlength: 10,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "author", "reader"],
      default: "reader",
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
      avatarPublicId: {
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
    commentSuspended: {
      type: Boolean,
      default: false,
    },
    commentSuspendedAt: Date,
    commentSuspendedReason: {
      type: String,
      maxlength: [500, "Comment suspension reason cannot exceed 500 characters"],
    },
    commentSuspendedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    sessionVersion: {
      type: Number,
      default: 0,
    },
    emailVerificationTokenHash: String,
    emailVerificationExpires: Date,
    passwordResetTokenHash: String,
    passwordResetExpires: Date,
    pendingEmail: String,
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1, role: 1 });
UserSchema.index({ commentSuspended: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
