import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Banner from "@/models/Banner";
import { auth } from "@/lib/auth";
import { jsonError, serverError } from "@/lib/http";
import { parsePageLimit } from "@/lib/pagination";
import { isUserRole } from "@/lib/permissions";
import { isSafeNavigationUrl, isStoredImageUrl } from "@/lib/urls";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "";
    const paging = parsePageLimit(null, searchParams.get("limit"));
    if ("error" in paging) return jsonError(paging.error, 400);
    const carousel = searchParams.get("carousel") === "true";

    const session = await auth();
    const role = isUserRole(session?.user?.role) ? session.user.role : undefined;
    const targetAudience = role === "admin" || role === "superadmin" ? "admins" : role === "author" ? "authors" : role ? "users" : "all";

    await connectDB();

    const banners = carousel
      ? await Banner.getCarouselBanners(targetAudience, paging.limit, type || undefined)
      : await Banner.getActiveBanners(targetAudience, type || undefined).limit(paging.limit);

    const processedBanners = banners
      .map((banner: { _id: unknown; title: string; subtitle?: string; description?: string; image: string; backgroundImage?: string; ctaText?: string; ctaLink?: string; type: string; metadata?: Record<string, unknown> }) => {
        if (!isStoredImageUrl(banner.image)) return null;
        const backgroundImage = banner.backgroundImage && isStoredImageUrl(banner.backgroundImage) ? banner.backgroundImage : undefined;
        const ctaLink = banner.ctaLink && isSafeNavigationUrl(banner.ctaLink) ? banner.ctaLink : undefined;
        return {
          id: banner._id,
          title: banner.title,
          subtitle: banner.subtitle,
          description: banner.description,
          image: banner.image,
          backgroundImage,
          ctaText: ctaLink ? banner.ctaText : undefined,
          ctaLink,
          type: banner.type,
          metadata: banner.metadata || {},
        };
      })
      .filter(Boolean);

    let carouselSettings = null;
    if (carousel && processedBanners.length > 0) {
      const firstBanner = banners[0];
      carouselSettings = {
        autoSlide: firstBanner.metadata?.autoSlide ?? true,
        slideInterval: (firstBanner.metadata?.slideInterval ?? 5) * 1000,
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
  } catch (error) {
    return serverError("Error fetching banners:", error);
  }
}
