import { NextRequest, NextResponse } from "next/server";
import { huggingFaceAI } from "@/lib/huggingface";
import { auth } from "@/lib/auth";

// POST /api/ai/analyze-content - Analyze blog content and generate metadata
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
    const { title, content, generateSEO = true, generateTags = true, generateSummary = true } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const analysis: any = {};

    // Generate tags
    if (generateTags) {
      const tags = await huggingFaceAI.generateTags(content);
      analysis.tags = tags;
    }

    // Generate SEO metadata
    if (generateSEO) {
      const seoData = await huggingFaceAI.generateSEOMetadata(title || "", content);
      analysis.seo = seoData;
    }

    // Generate summary
    if (generateSummary) {
      const summary = await huggingFaceAI.generateBlogSummary(content);
      analysis.summary = summary;
    }

    // Analyze sentiment
    const sentiment = await huggingFaceAI.analyzeSentiment(content);
    analysis.sentiment = sentiment;

    // Extract keywords
    const keywords = await huggingFaceAI.extractKeywords(content);
    analysis.keywords = keywords;

    // Calculate reading time (improved with AI)
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // 200 words per minute
    analysis.readingTime = readingTime;
    analysis.wordCount = wordCount;

    return NextResponse.json({
      analysis,
    });
  } catch (error: any) {
    console.error("Content analysis failed:", error);
    return NextResponse.json(
      { error: "Failed to analyze content", message: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/ai/analyze-content/improve - Improve writing quality
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
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    const improvedText = await huggingFaceAI.improveWriting(text);
    
    return NextResponse.json({
      original: text,
      improved: improvedText,
    });
  } catch (error: any) {
    console.error("Writing improvement failed:", error);
    return NextResponse.json(
      { error: "Failed to improve writing", message: error.message },
      { status: 500 }
    );
  }
}
