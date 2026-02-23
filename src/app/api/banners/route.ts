import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Banner from "@/models/Banner";
import { auth } from "@/lib/auth";

// GET /api/banners - Get active banners for public display
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || ""; // hero, featured, announcement, promotion
    const limit = parseInt(searchParams.get("limit") || "10");
    const carousel = searchParams.get("carousel") === "true"; // Get carousel banners

    // Get user session for audience targeting (optional)
    const session = await auth();
    let targetAudience = "all";
    
    if (session && session.user) {
      const userRole = (session.user as any).role;
      if (userRole === "admin" || userRole === "superadmin") {
        targetAudience = "admins";
      } else if (userRole === "author") {
        targetAudience = "authors";
      } else {
        targetAudience = "users";
      }
    }

    // Build query
    const query: any = {
      isActive: true,
      $or: [
        { targetAudience: "all" },
        { targetAudience: targetAudience },
      ],
    };

    // Add date filtering
    const now = new Date();
    query.$and = [
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
    ];

    if (type) {
      query.type = type;
    }

    // Get banners
    let banners;
    if (carousel) {
      // Get carousel banners with specific order
      banners = await Banner.getCarouselBanners(targetAudience, limit);
    } else {
      // Get regular banners
      banners = await Banner.find(query)
        .sort({ order: 1, createdAt: -1 })
        .limit(limit)
        .select("-createdBy -__v") // Exclude admin fields
        .lean();
    }

    // Process banners for frontend
    const processedBanners = banners.map((banner: any) => ({
      id: banner._id,
      title: banner.title,
      subtitle: banner.subtitle,
      description: banner.description,
      image: banner.image,
      backgroundImage: banner.backgroundImage,
      ctaText: banner.ctaText,
      ctaLink: banner.ctaLink,
      type: banner.type,
      metadata: banner.metadata || {},
    }));

    // Get carousel settings if requested
    let carouselSettings = null;
    if (carousel && processedBanners.length > 0) {
      // Use settings from the first banner or defaults
      const firstBanner = banners[0];
      carouselSettings = {
        autoSlide: firstBanner.metadata?.autoSlide ?? true,
        slideInterval: (firstBanner.metadata?.slideInterval ?? 5) * 1000, // Convert to milliseconds
        animation: firstBanner.metadata?.animation ?? "slide",
        showIndicators: true,
        showNavigation: true,
        infinite: true,
      };
    }

    return NextResponse.json({
      banners: processedBanners,
      carouselSettings,
      count: processedBanners.length,
      targetAudience,
    });
  } catch (error: any) {
    console.error("Error fetching banners:", error);
    return NextResponse.json(
      { error: "Failed to fetch banners", message: error.message },
      { status: 500 }
    );
  }
}
