import mongoose, { Document, Model, Schema } from "mongoose";

export type BlogStatus = "draft" | "published";
export type ThumbnailSource = "upload" | "ai" | "none";

export interface IBlog extends Document {
  title: string;
  description: string;
  content: string;
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  thumbnail?: string;
  thumbnailPublicId?: string;
  thumbnailSource?: ThumbnailSource;
  status: BlogStatus;
  publishedAt?: Date | null;
  tags: string[];
  readingTime: number;
  totalLikes: number;
  totalDislikes: number;
  totalComments: number;
  totalViews: number;
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
      maxlength: [100000, "Content cannot exceed 100000 characters"],
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
    },
    thumbnail: {
      type: String,
      default: "",
    },
    thumbnailPublicId: {
      type: String,
      default: "",
    },
    thumbnailSource: {
      type: String,
      enum: ["upload", "ai", "none"],
      default: "none",
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    readingTime: {
      type: Number,
      default: 5,
    },
    totalLikes: {
      type: Number,
      default: 0,
    },
    totalDislikes: {
      type: Number,
      default: 0,
    },
    totalComments: {
      type: Number,
      default: 0,
    },
    totalViews: {
      type: Number,
      default: 0,
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

BlogSchema.index({ status: 1, publishedAt: -1 });
BlogSchema.index({ authorId: 1, status: 1, updatedAt: -1 });
BlogSchema.index({ createdBy: 1 });
BlogSchema.index({ tags: 1 });

const Blog: Model<IBlog> = mongoose.models.Blog || mongoose.model<IBlog>("Blog", BlogSchema);

export default Blog;
