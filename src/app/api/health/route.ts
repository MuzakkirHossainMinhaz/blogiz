import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// GET /api/health - Health check endpoint
export async function GET(request: NextRequest) {
  try {
    // Check MongoDB connection
    await connectDB();

    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      database: {
        status: dbStatus,
        name: mongoose.connection.name || "unknown",
      },
    });
  } catch (error: any) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        success: false,
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
        database: {
          status: "disconnected",
          error: error.message,
        },
      },
      { status: 500 }
    );
  }
}
