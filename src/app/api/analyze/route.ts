import { NextRequest, NextResponse } from "next/server";
import { analyzeImage } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  image: string;
  prompt?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body?.image) {
      return NextResponse.json({ error: "image required" }, { status: 400 });
    }
    const out = await analyzeImage(
      body.image,
      body.prompt ??
        "Describe this product/logo in detail: dominant colors (as hex), material hints, mood, style keywords. Be concise (max 5 lines)."
    );
    return NextResponse.json({ analysis: out });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "internal" },
      { status: 500 }
    );
  }
}
