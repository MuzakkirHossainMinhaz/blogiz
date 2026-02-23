import { NextRequest, NextResponse } from "next/server";
import { huggingFaceAI } from "@/lib/huggingface";
import { auth } from "@/lib/auth";

// POST /api/ai/generate-image - Generate blog cover image
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
    const { prompt, style = "realistic", title, category } = body;

    let finalPrompt = prompt;
    
    // Generate from title if prompt not provided
    if (!finalPrompt && title) {
      finalPrompt = await huggingFaceAI.generateBlogCoverImage(title, category);
    } else if (!finalPrompt) {
      return NextResponse.json(
        { error: "Prompt or title is required" },
        { status: 400 }
      );
    }

    const imageData = await huggingFaceAI.generateImage(finalPrompt, style);
    
    if (!imageData) {
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 }
      );
    }

    // Convert base64 to uploadable format if needed
    const base64Data = imageData.startsWith('data:image') 
      ? imageData 
      : `data:image/png;base64,${imageData}`;

    return NextResponse.json({
      image: base64Data,
      prompt: finalPrompt,
      style,
    });
  } catch (error: any) {
    console.error("Image generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate image", message: error.message },
      { status: 500 }
    );
  }
}

// GET /api/ai/generate-image/blog-cover - Generate blog cover from title
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
    const title = searchParams.get("title");
    const category = searchParams.get("category") || "technology";

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const imageData = await huggingFaceAI.generateBlogCoverImage(title, category);
    
    if (!imageData) {
      return NextResponse.json(
        { error: "Failed to generate blog cover" },
        { status: 500 }
      );
    }

    const base64Data = imageData.startsWith('data:image') 
      ? imageData 
      : `data:image/png;base64,${imageData}`;

    return NextResponse.json({
      image: base64Data,
      title,
      category,
    });
  } catch (error: any) {
    console.error("Blog cover generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate blog cover", message: error.message },
      { status: 500 }
    );
  }
}
