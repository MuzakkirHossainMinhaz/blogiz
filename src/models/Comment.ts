import mongoose, { Document, Model, Schema } from "mongoose";

export interface IComment extends Document {
  blogId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  parentId?: mongoose.Types.ObjectId; // For nested comments (replies)
  isApproved: boolean;
  isEdited: boolean;
  editedAt?: Date;
  likes: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    blogId: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null, // null for top-level comments
    },
    isApproved: {
      type: Boolean,
      default: false, // Comments need approval from admin
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
CommentSchema.index({ blogId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1 });
CommentSchema.index({ parentId: 1 });
CommentSchema.index({ isApproved: 1 });
CommentSchema.index({ blogId: 1, isApproved: 1, createdAt: -1 });

const Comment: Model<IComment> = mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema);

export default Comment;
