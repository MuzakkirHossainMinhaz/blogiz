import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBlog extends Document {
  title: string;
  description: string;
  content: string;
  author_name: string;
  authorId: mongoose.Types.ObjectId;
  blog_image: string;
  publish_date: Date;
  status: "draft" | "pending" | "published" | "rejected";
  isApproved: boolean;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  total_likes: number;
  total_comments: number;
  total_views: number;
  tags: string[];
  readingTime: number; // in minutes
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    author_name: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blog_image: {
      type: String,
      required: false,
    },
    publish_date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["draft", "pending", "published", "rejected"],
      default: "draft",
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      maxlength: [500, "Rejection reason cannot exceed 500 characters"],
      default: "",
    },
    total_likes: {
      type: Number,
      default: 0,
    },
    total_comments: {
      type: Number,
      default: 0,
    },
    total_views: {
      type: Number,
      default: 0,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    readingTime: {
      type: Number,
      default: 5, // 5 minutes default reading time
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
BlogSchema.index({ status: 1, publish_date: -1 });
BlogSchema.index({ authorId: 1 });
BlogSchema.index({ createdBy: 1 });
BlogSchema.index({ isApproved: 1, status: 1 });
BlogSchema.index({ tags: 1 });

const Blog: Model<IBlog> =
  mongoose.models.Blog || mongoose.model<IBlog>("Blog", BlogSchema);

export default Blog;
