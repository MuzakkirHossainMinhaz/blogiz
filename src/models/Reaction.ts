import mongoose, { Document, Model, Schema } from "mongoose";

export type ReactionKind = "like" | "dislike";

export interface IReaction extends Document {
  blogId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: ReactionKind;
  createdAt: Date;
  updatedAt: Date;
}

const ReactionSchema = new Schema<IReaction>(
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

ReactionSchema.index({ blogId: 1, userId: 1 }, { unique: true });
ReactionSchema.index({ blogId: 1, type: 1 });

const Reaction: Model<IReaction> =
  mongoose.models.Reaction || mongoose.model<IReaction>("Reaction", ReactionSchema);

export default Reaction;
