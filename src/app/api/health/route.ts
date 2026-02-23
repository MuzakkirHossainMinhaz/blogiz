import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

// GET /api/health - Health check endpoint
export async function GET(request: NextRequest) {
  try {
    // Check MongoDB connection
    await connectDB();

    const dbStatus =
      mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        name: mongoose.connection.name || "unknown",
      },
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error: any) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        database: {
          status: "disconnected",
          error: error.message,
        },
        environment: process.env.NODE_ENV || "development",
      },
      { status: 500 }
    );
  }
}
