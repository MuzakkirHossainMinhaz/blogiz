import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import BlogView from "@/models/BlogView";
import { getClientIP, getUserAgent } from "@/lib/request-utils";
import { auth } from "@/lib/auth";

// POST /api/blogs/[id]/view - Track blog view
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Check if blog exists and is published
    const blog = await Blog.findById(id);
    if (!blog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    if (blog.status !== "published" || !blog.isApproved) {
      return NextResponse.json(
        { error: "Blog is not published" },
        { status: 403 }
      );
    }

    // Get user info (optional)
    const session = await auth();
    const userId = session?.user ? (session.user as any).id : null;

    // Get request info
    const ipAddress = await getClientIP();
    const userAgent = await getUserAgent();
    
    // Get session ID from headers or generate one
    const sessionId = request.headers.get("x-session-id") || 
                     `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Check if this user/session has viewed this blog recently (within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    let shouldTrackView = true;
    
    if (userId) {
      // For logged-in users, check their recent views
      const recentView = await BlogView.findOne({
        blogId: id,
        userId,
        viewedAt: { $gte: oneHourAgo },
      });
      
      if (recentView) {
        shouldTrackView = false;
      }
    } else {
      // For anonymous users, check by IP and session
      const recentView = await BlogView.findOne({
        blogId: id,
        ipAddress,
        sessionId,
        viewedAt: { $gte: oneHourAgo },
      });
      
      if (recentView) {
        shouldTrackView = false;
      }
    }

    if (shouldTrackView) {
      // Create view record
      await BlogView.create({
        blogId: id,
        userId,
        ipAddress,
        userAgent,
        sessionId,
        viewedAt: new Date(),
      });

      // Optionally update blog view count (if you add this field to Blog model)
      // await Blog.findByIdAndUpdate(id, { $inc: { totalViews: 1 } });
    }

    return NextResponse.json({
      message: "View tracked successfully",
      tracked: shouldTrackView,
    });
  } catch (error: any) {
    console.error("Error tracking blog view:", error);
    return NextResponse.json(
      { error: "Failed to track view", message: error.message },
      { status: 500 }
    );
  }
}
