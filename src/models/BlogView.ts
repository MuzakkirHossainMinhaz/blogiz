import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBlogView extends Document {
  blogId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId; // Optional for anonymous views
  ipAddress: string;
  userAgent: string;
  viewedAt: Date;
  sessionId?: string; // For tracking unique sessions
}

const BlogViewSchema = new Schema<IBlogView>(
  {
    blogId: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null, // Allow anonymous views
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    sessionId: {
      type: String,
      default: null,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
BlogViewSchema.index({ blogId: 1, viewedAt: -1 });
BlogViewSchema.index({ userId: 1, viewedAt: -1 });
BlogViewSchema.index({ ipAddress: 1, sessionId: 1 });
BlogViewSchema.index({ viewedAt: -1 });

// Compound index to prevent duplicate views from same user in short time
BlogViewSchema.index({ blogId: 1, userId: 1, viewedAt: 1 });

const BlogView: Model<IBlogView> = mongoose.models.BlogView || mongoose.model<IBlogView>("BlogView", BlogViewSchema);

export default BlogView;
