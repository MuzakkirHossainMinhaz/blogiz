import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILike extends Document {
  blogId: mongoose.Types.ObjectId;
  ipAddress: string;
  userAgent?: string;
  createdAt: Date;
}

const LikeSchema = new Schema<ILike>(
  {
    blogId: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one like per IP per blog
LikeSchema.index({ blogId: 1, ipAddress: 1 }, { unique: true });

const Like: Model<ILike> =
  mongoose.models.Like || mongoose.model<ILike>("Like", LikeSchema);

export default Like;
