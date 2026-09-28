import mongoose, { Document, Model, Schema } from "mongoose";

export interface ILike extends Document {
  blogId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const LikeSchema = new Schema<ILike>(
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
  },
  {
    timestamps: true,
  }
);

LikeSchema.index({ blogId: 1, userId: 1 }, { unique: true });

const Like: Model<ILike> = mongoose.models.Like || mongoose.model<ILike>("Like", LikeSchema);

export default Like;
