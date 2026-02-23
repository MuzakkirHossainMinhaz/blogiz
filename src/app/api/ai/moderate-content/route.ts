import { NextRequest, NextResponse } from "next/server";
import { tensorflowAI } from "@/lib/tensorflow";
import { auth } from "@/lib/auth";

// POST /api/ai/moderate-content - Moderate content using TensorFlow.js
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
    const { content, type = "comment" } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Initialize TensorFlow.js models if not already done
    await tensorflowAI.initializeModels();

    let moderationResult: any = {};

    switch (type) {
      case "comment":
        moderationResult = await tensorflowAI.validateComment(content);
        break;
      case "content":
        moderationResult = await tensorflowAI.analyzeContent(content);
        break;
      case "toxicity":
        moderationResult = await tensorflowAI.detectToxicity(content);
        break;
      case "sentiment":
        moderationResult = await tensorflowAI.analyzeSentiment(content);
        break;
      case "quality":
        moderationResult = await tensorflowAI.getContentQualityScore(content);
        break;
      default:
        moderationResult = await tensorflowAI.analyzeContent(content);
    }

    return NextResponse.json({
      moderation: moderationResult,
      content: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
      type,
    });
  } catch (error: any) {
    console.error("Content moderation failed:", error);
    return NextResponse.json(
      { error: "Failed to moderate content", message: error.message },
      { status: 500 }
    );
  }
}

// GET /api/ai/moderate-content/similarity - Calculate content similarity
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
    const text1 = searchParams.get("text1");
    const text2 = searchParams.get("text2");

    if (!text1 || !text2) {
      return NextResponse.json(
        { error: "Both text1 and text2 are required" },
        { status: 400 }
      );
    }

    // Initialize TensorFlow.js models if not already done
    await tensorflowAI.initializeModels();

    const similarity = await tensorflowAI.calculateSimilarity(text1, text2);
    
    return NextResponse.json({
      similarity,
      text1: text1.substring(0, 50) + (text1.length > 50 ? "..." : ""),
      text2: text2.substring(0, 50) + (text2.length > 50 ? "..." : ""),
    });
  } catch (error: any) {
    console.error("Similarity calculation failed:", error);
    return NextResponse.json(
      { error: "Failed to calculate similarity", message: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/ai/moderate-content/batch - Batch analyze multiple content pieces
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
    const { contents } = body;

    if (!contents || !Array.isArray(contents)) {
      return NextResponse.json(
        { error: "Contents array is required" },
        { status: 400 }
      );
    }

    // Initialize TensorFlow.js models if not already done
    await tensorflowAI.initializeModels();

    const batchResults = await tensorflowAI.batchAnalyzeContent(contents);
    
    return NextResponse.json({
      results: batchResults,
      count: contents.length,
    });
  } catch (error: any) {
    console.error("Batch content analysis failed:", error);
    return NextResponse.json(
      { error: "Failed to analyze batch content", message: error.message },
      { status: 500 }
    );
  }
}
