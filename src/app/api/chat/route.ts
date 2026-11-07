import { NextRequest, NextResponse } from "next/server";
import { streamChat, analyzeImage, type AIMessage } from "@/lib/ai";
import type { Attachment, DesignSpec } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ChatBody {
  messages: {
    role: "user" | "assistant" | "system";
    content: string;
    attachments?: Attachment[];
  }[];
  mode: "ai" | "plan" | "sketch" | "agent";
  currentDesign?: DesignSpec | null;
  temperature?: number;
  customSystemPrompt?: string;
  connector?: string;
  model?: string;
  apiKey?: string;
}

// Detect URLs in user messages and fetch their content for research.
async function maybeResearch(text: string): Promise<string | null> {
  const urlMatches = text.match(
    /https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*/g
  );
  if (!urlMatches?.length) {
    // Also detect bare domains like "minalenterprises.org"
    const bare = text.match(/\b([a-zA-Z0-9-]+\.(?:com|org|net|io|ai|co|pk|uk|dev))\b/g);
    if (!bare?.length) return null;
    const url = bare[0];
    try {
      const r = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/research`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        }
      );
      if (!r.ok) return null;
      const data = await r.json();
      return formatResearch(data, url);
    } catch {
      return null;
    }
  }

  const results: string[] = [];
  for (const url of urlMatches.slice(0, 2)) {
    try {
      const r = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/research`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        }
      );
      if (!r.ok) continue;
      const data = await r.json();
      results.push(formatResearch(data, url));
    } catch {
      /* skip failed fetches */
    }
  }
  return results.length ? results.join("\n\n") : null;
}

function formatResearch(data: any, url: string): string {
  const parts: string[] = [`[Website research for ${url}]:`];
  if (data.title) parts.push(`Title: ${data.title}`);
  if (data.description) parts.push(`Description: ${data.description}`);
  if (data.siteName) parts.push(`Site: ${data.siteName}`);
  if (data.emails?.length) parts.push(`Emails: ${data.emails.join(", ")}`);
  if (data.phones?.length) parts.push(`Phones: ${data.phones.join(", ")}`);
  if (data.socials?.length) parts.push(`Socials: ${data.socials.join(", ")}`);
  if (data.snippet) parts.push(`Snippet: ${data.snippet.slice(0, 400)}`);
  return parts.join("\n");
}

// Convert attachments to image data URLs the SDK can consume.
// For chat, we pre-analyze images via the vision endpoint and inject the
// analysis into the user message text, because the regular chat completions
// path doesn't accept image_url content.
async function flatten(messages: ChatBody["messages"]): Promise<AIMessage[]> {
  const out: AIMessage[] = [];
  for (const m of messages) {
    const imgs = (m.attachments ?? []).filter((a) =>
      a.mime.startsWith("image/")
    );
    let content = m.content;
    if (imgs.length > 0 && m.role === "user") {
      const analyses = await Promise.all(
        imgs.map((img) =>
          analyzeImage(
            img.dataUrl,
            `You are analyzing a ${img.kind} image for a packaging design project. In 3-4 lines, describe:
1. Dominant colors (as hex codes, e.g. #E5461F)
2. Material / texture hints
3. Mood / style keywords (max 4)
4. If it's a logo: describe the shape, wordmark, and any iconic mark.
Be concise and specific.`
          ).catch(() => "")
        )
      );
      const valid = analyses.filter(Boolean);
      if (valid.length) {
        content += `\n\n[Attached ${imgs.length} image(s) — ${imgs
          .map((i) => i.kind)
          .join(", ")}. Vision analysis:\n${valid
          .map((a, i) => `  ${i + 1}. ${a}`)
          .join("\n")}\n]`;
      }
    }

    // Auto-research: if user message contains a URL, fetch and inject
    if (m.role === "user" && content) {
      const research = await maybeResearch(content).catch(() => null);
      if (research) {
        content += `\n\n${research}`;
      }
    }

    out.push({ role: m.role, content });
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatBody;
    if (!body?.messages?.length) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    const aiMessages = await flatten(body.messages);

    // Build a mode + context hint
    const contextLines: string[] = [];
    if (body.mode === "plan") {
      contextLines.push(
        "MODE: PLAN (Discovery). Have a real conversation. Ask ONE clarifying question at a time using the question schema. Cover: brand/company, product, packaging type, size, material, finish, palette, and what goes on the back panel. Only emit a plan JSON once you've gathered enough — typically after 2-4 questions."
      );
    } else if (body.mode === "sketch") {
      contextLines.push(
        "MODE: SKETCH (Fast Drafts). Skip the discovery phase. Produce 3 distinct design variants as a variants JSON based on what the user said. Lean on assumptions. Keep brand info consistent across all three but vary the palette, material, or proportions. Include a logoSvg for each."
      );
    } else if (body.mode === "agent") {
      contextLines.push(
        "MODE: AGENT (Voice). The user is talking to you via voice. Keep responses SHORT — 2-3 sentences max, plain text only, no JSON. Be warm, confident, conversational. If they ask for a design, ask ONE clarifying question. If they want to proceed, suggest switching to Plan or Sketch mode. Match their energy."
      );
    } else {
      contextLines.push(
        "MODE: AI (Execution). The user approved a plan (or is editing an existing design). Execute / refine and return a design JSON with COMPLETE brand info and a generated logoSvg. If the user asks for an edit ('make it taller', 'change color'), return an UPDATED design JSON — don't re-plan. If the user asks for 'variations' or 'options', return a variants JSON with 3 options."
      );
    }
    if (body.currentDesign) {
      contextLines.push(
        `CURRENT DESIGN (for editing): ${JSON.stringify(body.currentDesign)}`
      );
    }
    if (body.customSystemPrompt?.trim()) {
      contextLines.push(`USER CUSTOM INSTRUCTIONS: ${body.customSystemPrompt.trim()}`);
    }
    aiMessages.push({ role: "system", content: contextLines.join("\n\n") });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (obj: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        };
        try {
          send({ type: "start" });
          await streamChat(
            aiMessages,
            (chunk) => send({ type: "chunk", chunk }),
            {
              temperature: body.temperature,
              model: body.model,
              apiKey: body.apiKey,
            }
          );
          send({ type: "done" });
        } catch (err) {
          send({ type: "error", error: err instanceof Error ? err.message : "unknown" });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "internal" },
      { status: 500 }
    );
  }
}
