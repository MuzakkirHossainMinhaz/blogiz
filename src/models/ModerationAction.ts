import mongoose, { Document, Model, Schema } from "mongoose";

export type ModerationActionType =
  | "suspend_user"
  | "unsuspend_user"
  | "suspend_commenting"
  | "unsuspend_commenting"
  | "reset_password"
  | "delete_user"
  | "delete_blog"
  | "unpublish_blog"
  | "hide_comment"
  | "delete_comment"
  | "approve_role_upgrade"
  | "reject_role_upgrade"
  | "change_role";

export interface IModerationAction extends Document {
  actorId: mongoose.Types.ObjectId;
  subjectUserId?: mongoose.Types.ObjectId | null;
  subjectBlogId?: mongoose.Types.ObjectId | null;
  subjectCommentId?: mongoose.Types.ObjectId | null;
  action: ModerationActionType;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ModerationActionSchema = new Schema<IModerationAction>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subjectUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    subjectBlogId: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      default: null,
    },
    subjectCommentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    action: {
      type: String,
      enum: [
        "suspend_user",
        "unsuspend_user",
        "suspend_commenting",
        "unsuspend_commenting",
        "reset_password",
        "delete_user",
        "delete_blog",
        "unpublish_blog",
        "hide_comment",
        "delete_comment",
        "approve_role_upgrade",
        "reject_role_upgrade",
        "change_role",
      ],
      required: true,
    },
    reason: {
      type: String,
      maxlength: [1000, "Reason cannot exceed 1000 characters"],
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ModerationActionSchema.index({ subjectUserId: 1, createdAt: -1 });
ModerationActionSchema.index({ actorId: 1, createdAt: -1 });
ModerationActionSchema.index({ action: 1, createdAt: -1 });

const ModerationAction: Model<IModerationAction> =
  mongoose.models.ModerationAction ||
  mongoose.model<IModerationAction>("ModerationAction", ModerationActionSchema);

export default ModerationAction;
