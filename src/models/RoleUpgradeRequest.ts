import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRoleUpgradeRequest extends Document {
  userId: mongoose.Types.ObjectId;
  requestedRole: "author" | "admin";
  currentRole: "user" | "author";
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoleUpgradeRequestSchema = new Schema<IRoleUpgradeRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestedRole: {
      type: String,
      enum: ["author", "admin"],
      required: true,
    },
    currentRole: {
      type: String,
      enum: ["user", "author"],
      required: true,
    },
    reason: {
      type: String,
      required: [true, "Reason for role upgrade is required"],
      maxlength: [1000, "Reason cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      maxlength: [500, "Rejection reason cannot exceed 500 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
RoleUpgradeRequestSchema.index({ userId: 1 });
RoleUpgradeRequestSchema.index({ status: 1 });
RoleUpgradeRequestSchema.index({ requestedRole: 1, status: 1 });
RoleUpgradeRequestSchema.index({ createdAt: -1 });

const RoleUpgradeRequest: Model<IRoleUpgradeRequest> =
  mongoose.models.RoleUpgradeRequest || mongoose.model<IRoleUpgradeRequest>("RoleUpgradeRequest", RoleUpgradeRequestSchema);

export default RoleUpgradeRequest;
