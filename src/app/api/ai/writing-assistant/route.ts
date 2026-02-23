import { NextRequest, NextResponse } from "next/server";
import { huggingFaceAI } from "@/lib/huggingface";
import { auth } from "@/lib/auth";

// POST /api/ai/writing-assistant/generate-title - Generate blog titles
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { topic, count = 5 } = body;

    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    const titles = await huggingFaceAI.generateBlogTitle(topic);
    
    return NextResponse.json({
      titles: titles.slice(0, count),
    });
  } catch (error: any) {
    console.error("Title generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate titles", message: error.message },
      { status: 500 }
    );
  }
}

// GET /api/ai/writing-assistant/generate-outline - Generate blog outline
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic");

    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    const outline = await huggingFaceAI.generateBlogOutline(topic);
    
    return NextResponse.json({
      outline,
    });
  } catch (error: any) {
    console.error("Outline generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate outline", message: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/ai/writing-assistant/continue-writing - Continue writing
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const continuation = await huggingFaceAI.continueWriting(content);
    
    return NextResponse.json({
      continuation,
    });
  } catch (error: any) {
    console.error("Continue writing failed:", error);
    return NextResponse.json(
      { error: "Failed to continue writing", message: error.message },
      { status: 500 }
    );
  }
}
