import mongoose, { Document, Model, Schema } from "mongoose";

export type MediaKind = "avatar" | "blog_thumbnail" | "other";
export type MediaSource = "upload" | "ai";

export interface IMediaAsset extends Document {
  ownerId: mongoose.Types.ObjectId;
  /** Local `/api/media/...` path or external HTTPS (e.g. Pollinations cover). */
  url: string;
  /** Local storage key (`kind/filename`) for uploads; omit/empty for external URLs. */
  publicId: string;
  kind: MediaKind;
  blogId?: mongoose.Types.ObjectId | null;
  source: MediaSource;
  bytes?: number;
  width?: number;
  height?: number;
  createdAt: Date;
  updatedAt: Date;
}

const MediaAssetSchema = new Schema<IMediaAsset>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    kind: {
      type: String,
      enum: ["avatar", "blog_thumbnail", "other"],
      required: true,
    },
    blogId: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      default: null,
    },
    source: {
      type: String,
      enum: ["upload", "ai"],
      required: true,
    },
    bytes: Number,
    width: Number,
    height: Number,
  },
  {
    timestamps: true,
  }
);

MediaAssetSchema.index({ ownerId: 1, kind: 1 });
MediaAssetSchema.index({ blogId: 1 });
MediaAssetSchema.index({ publicId: 1 }, { unique: true, sparse: true });

const MediaAsset: Model<IMediaAsset> =
  mongoose.models.MediaAsset || mongoose.model<IMediaAsset>("MediaAsset", MediaAssetSchema);

export default MediaAsset;
