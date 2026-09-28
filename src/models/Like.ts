import mongoose, { Document, Model, Schema } from "mongoose";

export type ReactionKind = "like" | "dislike";

export interface ILike extends Document {
  blogId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: ReactionKind;
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
    type: {
      type: String,
      enum: ["like", "dislike"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

LikeSchema.index({ blogId: 1, userId: 1 }, { unique: true });
LikeSchema.index({ blogId: 1, type: 1 });

const Like: Model<ILike> = mongoose.models.Like || mongoose.model<ILike>("Like", LikeSchema);

export default Like;
