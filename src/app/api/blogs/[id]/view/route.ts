import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import BlogView from "@/models/BlogView";
import { auth } from "@/lib/auth";
import { jsonError, serverError } from "@/lib/http";
import { readTrustedClientAddress, hashIdentifier } from "@/lib/request-utils";
import { publicPostFilter } from "@/lib/public-posts";
import { cacheSetNx } from "@/lib/redis-cache";

const COOKIE = "blogiz_sid";
const HOUR_MS = 60 * 60 * 1000;
const HOUR_SECONDS = 60 * 60;

function viewDedupeKey(blogId: string, identity: string): string {
  return `blogiz:viewdedupe:${blogId}:${identity}`;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return jsonError("Invalid blog ID", 400);
    }

    await connectDB();

    const blog = await Blog.findOne({ _id: id, ...publicPostFilter() }).select("_id");
    if (!blog) return jsonError("Blog not found", 404);

    const session = await auth();
    const userId = session?.user?.id || undefined;
    const existingSessionId = request.cookies.get(COOKIE)?.value;
    const sessionId =
      existingSessionId && /^[0-9a-f-]{36}$/i.test(existingSessionId) ? existingSessionId : randomUUID();
    const mintedSession = sessionId !== existingSessionId;

    const trustedIp = readTrustedClientAddress((name) => request.headers.get(name));
    const ipHash = trustedIp ? hashIdentifier(trustedIp) : undefined;

    const oneHourAgo = new Date(Date.now() - HOUR_MS);
    let shouldTrackView = true;

    const dedupeIdentity = userId || (!mintedSession ? sessionId : undefined);
    if (dedupeIdentity) {
      // Redis SET NX: true = first view this hour; false = already seen; null = Redis down → Mongo.
      const nx = await cacheSetNx(viewDedupeKey(id, dedupeIdentity), HOUR_SECONDS);
      if (nx === false) {
        shouldTrackView = false;
      } else if (nx === null) {
        if (userId) {
          const recentView = await BlogView.findOne({
            blogId: id,
            userId,
            viewedAt: { $gte: oneHourAgo },
          }).select("_id");
          if (recentView) shouldTrackView = false;
        } else {
          const recentView = await BlogView.findOne({
            blogId: id,
            sessionId,
            viewedAt: { $gte: oneHourAgo },
          }).select("_id");
          if (recentView) shouldTrackView = false;
        }
      }
    }

    if (shouldTrackView) {
      await BlogView.create({
        blogId: id,
        userId,
        sessionId,
        ...(ipHash ? { ipHash } : {}),
        viewedAt: new Date(),
      });
      await Blog.updateOne({ _id: id }, { $inc: { total_views: 1 } });
    }

    const response = NextResponse.json({
      message: "View tracked successfully",
      tracked: shouldTrackView,
    });

    if (mintedSession) {
      response.cookies.set(COOKIE, sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 90 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (error) {
    return serverError("Error tracking blog view:", error);
  }
}
