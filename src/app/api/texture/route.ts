import { NextRequest, NextResponse } from "next/server";
import { generateTexture } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 90;

interface Body {
  prompt: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    if (!body?.prompt) {
      return NextResponse.json({ error: "prompt required" }, { status: 400 });
    }
    const url = await generateTexture(body.prompt);
    if (!url) {
      return NextResponse.json({ error: "texture generation failed" }, { status: 502 });
    }
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "internal" },
      { status: 500 }
    );
  }
}
