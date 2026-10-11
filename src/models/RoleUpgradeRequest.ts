import mongoose, { Document, Model, Schema } from "mongoose";

export interface IRoleUpgradeRequest extends Document {
  userId: mongoose.Types.ObjectId;
  requestedRole: "author";
  currentRole: "reader";
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: mongoose.Types.ObjectId | null;
  reviewedAt?: Date | null;
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
      enum: ["author"],
      required: true,
      default: "author",
    },
    currentRole: {
      type: String,
      enum: ["reader"],
      required: true,
      default: "reader",
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

RoleUpgradeRequestSchema.index({ userId: 1 });
RoleUpgradeRequestSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { status: "pending" }, name: "unique_pending_role_upgrade" }
);
RoleUpgradeRequestSchema.index({ status: 1, createdAt: -1 });
RoleUpgradeRequestSchema.index({ requestedRole: 1, status: 1 });

const RoleUpgradeRequest: Model<IRoleUpgradeRequest> =
  mongoose.models.RoleUpgradeRequest ||
  mongoose.model<IRoleUpgradeRequest>("RoleUpgradeRequest", RoleUpgradeRequestSchema);

export default RoleUpgradeRequest;
