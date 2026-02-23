import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBanner extends Document {
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  backgroundImage?: string;
  ctaText?: string; // Call-to-action text
  ctaLink?: string; // Call-to-action link
  isActive: boolean;
  order: number; // For carousel ordering
  type: "hero" | "featured" | "announcement" | "promotion";
  targetAudience: "all" | "users" | "authors" | "admins";
  startDate?: Date;
  endDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    backgroundColor?: string;
    textColor?: string;
    buttonColor?: string;
    animation?: "fade" | "slide" | "zoom" | "none";
    autoSlide?: boolean;
    slideInterval?: number; // in seconds
  };
}

export interface IBannerModel extends Model<IBanner> {
  getActiveBanners(audience?: string): any;
  getCarouselBanners(audience?: string, limit?: number): any;
}

const BannerSchema = new Schema<IBanner>(
  {
    title: {
      type: String,
      required: [true, "Banner title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [150, "Subtitle cannot exceed 150 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    image: {
      type: String,
      required: [true, "Banner image is required"],
      trim: true,
    },
    backgroundImage: {
      type: String,
      trim: true,
    },
    ctaText: {
      type: String,
      trim: true,
      maxlength: [50, "CTA text cannot exceed 50 characters"],
    },
    ctaLink: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      enum: ["hero", "featured", "announcement", "promotion"],
      default: "featured",
    },
    targetAudience: {
      type: String,
      enum: ["all", "users", "authors", "admins"],
      default: "all",
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    metadata: {
      backgroundColor: {
        type: String,
        default: "#ffffff",
      },
      textColor: {
        type: String,
        default: "#000000",
      },
      buttonColor: {
        type: String,
        default: "#3b82f6",
      },
      animation: {
        type: String,
        enum: ["fade", "slide", "zoom", "none"],
        default: "slide",
      },
      autoSlide: {
        type: Boolean,
        default: true,
      },
      slideInterval: {
        type: Number,
        default: 5, // 5 seconds
        min: 1,
        max: 30,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient querying
BannerSchema.index({ isActive: 1, order: 1 });
BannerSchema.index({ type: 1, isActive: 1 });
BannerSchema.index({ targetAudience: 1, isActive: 1 });
BannerSchema.index({ startDate: 1, endDate: 1, isActive: 1 });

// Pre-save middleware to validate dates
BannerSchema.pre("save", function (next) {
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    next(new Error("End date must be after start date"));
  } else {
    next();
  }
});

// Static method to get active banners for audience
BannerSchema.statics.getActiveBanners = function (audience: string = "all") {
  const now = new Date();
  const query: any = {
    isActive: true,
    $and: [
      {
        $or: [
          { targetAudience: "all" },
          { targetAudience: audience },
        ],
      },
      {
        $or: [
          { startDate: { $exists: false } },
          { startDate: { $lte: now } },
        ],
      },
      {
        $or: [
          { endDate: { $exists: false } },
          { endDate: { $gte: now } },
        ],
      },
    ],
  };

  return this.find(query).sort({ order: 1, createdAt: -1 });
};

// Static method to get carousel banners
BannerSchema.statics.getCarouselBanners = function (audience: string = "all", limit: number = 5) {
  return (this as any).getActiveBanners(audience).limit(limit);
};

const Banner = (mongoose.models.Banner as IBannerModel) || 
  mongoose.model<IBanner, IBannerModel>("Banner", BannerSchema);

export default Banner;
