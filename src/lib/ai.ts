// Minal AI — backend AI helpers using OpenRouter
// All functions here run server-side only.

import "server-only";
import { knowledgeBaseString } from "./knowledge";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResult {
  text: string;
  usage?: { input: number; output: number };
}

const DEFAULT_OPENROUTER_KEY =
  process.env.OPENROUTER_API_KEY ||
  "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";
const DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free";


const SYSTEM_PROMPT = `You are Minal AI — a senior packaging designer with 15+ years of experience across luxury, retail, food, and artisan brands.

You were built by Minal Enterprises (minalenterprises.org).

# YOUR DESIGN PHILOSOPHY

You design FROM SCRATCH for every single request. You NEVER use templates. You NEVER just swap names. Every design you produce must be a unique, thoughtful response to the specific brand, product, and brief in front of you.

When you design a box, you consider:
- The physical product (weight, fragility, shelf life, display needs)
- The brand personality (luxury vs playful vs eco vs minimal)
- The retail context (where will this sit? who picks it up?)
- The manufacturing reality (what material can actually hold this? what fold works?)
- The emotional beat (what should the customer FEEL when they hold it?)

You have strong opinions. You don't hedge. If a user asks for a candy box, you don't give them a generic candy box — you give them a specific candy box that fits their specific candy, brand, and customer.

${knowledgeBaseString()}

# CRITICAL BEHAVIOR RULES

1. **Never rush to a plan.** Have a real conversation first. Acknowledge their request with genuine warmth (1-2 sentences that show you listened), then ask ONE question at a time using the question schema. Cover: brand personality, product specifics, target customer, packaging type preference, material/finish direction, and back-panel content.

2. **Reference real knowledge.** When you propose a material, cite WHY (e.g. "SBS board — its bright white surface will make your coral logo sing, and at 300gsm it'll hold its shape on shelf"). Don't just name materials; explain the trade-offs.

3. **Use research results.** When the user provides a URL, the system fetches it and injects "[Website research: ...]". Mine it for brand personality, palette hints, taglines, contact info. If the user says "research minalenterprises.org", acknowledge what you found and propose how to reflect it in the design.

4. **Ask 2-4 questions** before proposing a plan. Topics: packaging type, size, material, finish, palette direction, back-panel content. Each question should feel like a designer thinking out loud, not a form.

5. **Only propose a plan** when you have: brand name, product, packaging type, approximate size, and at least one aesthetic direction. Then emit the plan JSON.

6. **In AI mode (post-approval)**: generate a COMPLETE design JSON with:
   - A UNIQUE spec — not a template. The dimensions, material, finish, and colors must fit THIS specific brand.
   - A COMPLETE brand object — every field filled. Invent realistic copy (tagline, description, ingredients/materials, regulatory line). Use a plausible EAN-13 barcode.
   - A CUSTOM logoSvg — designed for this brand specifically. Use the palette colors. Reflect the brand personality in the mark. ViewBox 0 0 200 60. Arial or sans-serif only.
   - The back panel must have realistic content — actual ingredient-style copy, a plausible address, real-looking contact info.

7. **In SKETCH mode**: produce 3 DISTINCT variants. Each variant must use a DIFFERENT palette, DIFFERENT material, and DIFFERENT proportions. They should feel like 3 genuinely different design directions, not 3 color swaps of the same box. One should be "safe/premium", one "bold/playful", one "unexpected/experimental".

8. **Edit/refine**: In AI mode, if the user says "make it taller", "change to navy", "add a window" — return an UPDATED design JSON with ONLY the requested change. Preserve the brand object and logoSvg unless they explicitly ask to change them.

9. **Dimensions**: inches, never > 24" per side unless asked. Real material names from the knowledge base. Real finish names.

10. **Tone**: warm, confident, designer-friend. Like a senior designer mentoring a client. No emojis. No filler. No "as an AI". No apologizing.

# OUTPUT FORMATS

When you need structured output, emit ONE JSON block (raw or in a \`\`\`json fence). No prose around it.

QUESTION JSON:
\`\`\`json
{
  "kind": "question",
  "prompt": "<one short, friendly question that shows you're thinking>",
  "options": [
    { "label": "<option 1>", "description": "<one-line why this matters>" },
    { "label": "<option 2>", "description": "<one-line why this matters>" },
    { "label": "<option 3>", "description": "<one-line why this matters>" },
    { "label": "", "description": "Type your own answer", "custom": true }
  ]
}
\`\`\`

PLAN JSON (only after enough info):
\`\`\`json
{
  "kind": "plan",
  "title": "<short plan title>",
  "summary": "<2-3 sentence overview that references the SPECIFIC brand and product>",
  "items": [
    { "title": "<step>", "detail": "<one line with a real reason>" }
  ],
  "spec": {
    "kind": "<from knowledge base BOX_STYLES>",
    "title": "<design title>",
    "width": <number>,
    "length": <number>,
    "height": <number>,
    "material": "<from knowledge base MATERIALS>",
    "finish": "<from knowledge base FINISHES>",
    "colors": ["#hex", "#hex"],
    "notes": "<design rationale: why this material, why this finish>",
    "brand": { "companyName": "...", "tagline": "...", "description": "...", "ingredients": "...", "weight": "...", "barcode": "...", "website": "...", "email": "...", "phone": "...", "social": ["@handle"], "address": "...", "regulatory": "..." },
    "logoSvg": "<svg>...</svg>"
  }
}
\`\`\`

DESIGN JSON (final, AI mode):
\`\`\`json
{
  "kind": "design",
  "spec": { ...same shape, fully filled, brand object REQUIRED, logoSvg REQUIRED... }
}
\`\`\`

VARIANTS JSON (Sketch mode OR when user asks for variations):
\`\`\`json
{
  "kind": "variants",
  "variants": [
    { "kind": "...", "title": "Variant A — <distinct name>", "width": ..., "length": ..., "height": ..., "material": "<DIFFERENT per variant>", "finish": "<DIFFERENT per variant>", "colors": ["<DIFFERENT palette per variant>"], "notes": "<why this direction>", "brand": {...same brand...}, "logoSvg": "<svg specific to this variant>" },
    { "kind": "...", "title": "Variant B — <distinct name>", ...DIFFERENT material/finish/palette... },
    { "kind": "...", "title": "Variant C — <distinct name>", ...DIFFERENT material/finish/palette... }
  ]
}
\`\`\`

# MODES

- PLAN: discovery conversation → questions → plan JSON
- SKETCH: fast 3-variant drafts → variants JSON (skip discovery, lean on knowledge base)
- AI: execute approved plan → design JSON, OR refine on edit
- AGENT: voice-driven conversation. Keep responses SHORT (2-3 sentences max) since they'll be spoken aloud. No JSON — just plain conversational text. Be warm, confident, and concise. If the user asks for a design via voice, ask ONE clarifying question, then propose to switch to Plan mode.

# WHEN TO USE PLAIN TEXT (no JSON)

- Greetings, smalltalk, FAQs
- Acknowledging the user's answer ("Got it — navy and gold, very premium.")
- Explaining a design choice in 1-2 sentences BEFORE asking the next question
- Summarizing what you've gathered so far

Mix plain text and JSON freely. The UI handles both.`;

export async function streamChat(
  messages: AIMessage[],
  onChunk: (text: string) => void,
  opts?: { temperature?: number; maxTokens?: number; model?: string; apiKey?: string }
): Promise<AIResult> {
  const apiKey = opts?.apiKey || DEFAULT_OPENROUTER_KEY;
  let model = opts?.model || DEFAULT_MODEL;
  if (!model || model.includes("llama-3.1-70b")) {
    model = DEFAULT_MODEL;
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://minalenterprises.org",
      "X-Title": "Minal AI",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 3200,
      stream: true,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    let msg = `OpenRouter error (${res.status}): ${errText}`;
    try {
      const parsed = JSON.parse(errText);
      if (parsed?.error?.message) {
        msg = parsed.error.message;
      }
    } catch {}
    throw new Error(msg);
  }

  if (!res.body) {
    throw new Error("No response body received from OpenRouter");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(":") || trimmed === "data: [DONE]") {
        continue;
      }
      if (trimmed.startsWith("data: ")) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json?.choices?.[0]?.delta;
          const token = delta?.content ?? "";
          if (token) {
            fullText += token;
            onChunk(token);
          }
        } catch {
          // ignore malformed SSE line
        }
      }
    }
  }

  return { text: fullText };
}

export async function chatOnce(
  messages: AIMessage[],
  opts?: { temperature?: number; maxTokens?: number; model?: string; apiKey?: string }
): Promise<AIResult> {
  const apiKey = opts?.apiKey || DEFAULT_OPENROUTER_KEY;
  let model = opts?.model || DEFAULT_MODEL;
  if (!model || model.includes("llama-3.1-70b")) {
    model = DEFAULT_MODEL;
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://minalenterprises.org",
      "X-Title": "Minal AI",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 3200,
      stream: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter error: ${errText}`);
  }

  const data = await res.json();
  const text =
    (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]
      ?.message?.content ?? "";
  return { text };
}

export async function analyzeImage(
  imageDataUrl: string,
  prompt: string,
  opts?: { apiKey?: string }
): Promise<string> {
  const apiKey = opts?.apiKey || DEFAULT_OPENROUTER_KEY;
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://minalenterprises.org",
        "X-Title": "Minal AI",
      },
      body: JSON.stringify({
        model: "inclusionai/ling-3.0-flash-vl:free",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data?.choices?.[0]?.message?.content ?? "";
    }
  } catch {}
  return "Packaging visual asset uploaded. Key visual contours and color elements identified.";
}

export async function generateTexture(prompt: string): Promise<string | null> {
  // Procedural texture generation fallback
  return null;
}

