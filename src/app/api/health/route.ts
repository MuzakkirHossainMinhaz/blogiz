import { connectDB } from "@/lib/mongodb";
import { jsonError, serverError } from "@/lib/http";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

/**
 * Health details are not public. Callers must present HEALTH_CHECK_SECRET.
 * The response does not include the environment name or the database name.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.HEALTH_CHECK_SECRET?.trim();
  const provided = request.headers.get("x-health-token");
  if (!secret || !provided || provided !== secret) {
    return jsonError("Not found", 404);
  }

  try {
    await connectDB();
    const connected = mongoose.connection.readyState === 1;
    if (!connected) {
      return jsonError("Unavailable", 503);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError("Health check failed:", error);
  }
}
