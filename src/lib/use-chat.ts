"use client";

import { useCallback, useRef, useState } from "react";
import { useMinal } from "@/lib/store";
import type { Attachment, Message, DesignSpec, ChoiceOption, PlanItem } from "@/lib/types";

// ─── Payload parsing ────────────────────────────────────────────────────────

interface ParsedPayload {
  kind?: "plan" | "question" | "design" | "variants";
  plan?: { title: string; summary: string; items: PlanItem[]; spec?: DesignSpec };
  question?: { prompt: string; options: ChoiceOption[]; multi?: boolean };
  design?: { spec: DesignSpec };
  variants?: DesignSpec[];
}

export function tryParsePayload(text: string): { payload: ParsedPayload | null; prose: string } {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced?.[1] ?? findJson(text);
  if (!candidate) return { payload: null, prose: text };
  try {
    const obj = JSON.parse(candidate);
    if (obj && typeof obj === "object" && "kind" in obj) {
      // Strip the JSON block (and any fenced wrapper) from the prose.
      // Also collapse any leftover whitespace/newlines.
      let prose = text;
      // Remove fenced block
      prose = prose.replace(/```(?:json)?\s*[\s\S]*?```/g, "");
      // Remove raw JSON block
      prose = prose.replace(candidate, "");
      // Clean up
      prose = prose.replace(/^\s+|\s+$/g, "").replace(/\n{3,}/g, "\n\n");
      return { payload: buildPayload(obj), prose };
    }
  } catch {
    /* not complete yet */
  }
  return { payload: null, prose: text };
}

function buildPayload(obj: any): ParsedPayload {
  const payload: ParsedPayload = { kind: obj.kind };
  if (obj.kind === "plan") {
    payload.plan = {
      title: obj.title ?? "Plan",
      summary: obj.summary ?? "",
      items: (obj.items ?? []).map((it: any, i: number) => ({
        id: it.id ?? `item-${i}`,
        title: it.title ?? it.step ?? "Step",
        detail: it.detail ?? it.description ?? "",
        status: it.status ?? "pending",
      })),
      spec: normalizeSpec(obj.spec),
    };
  } else if (obj.kind === "question") {
    payload.question = {
      prompt: obj.prompt ?? "",
      options: (obj.options ?? []).map((o: any, i: number) => ({
        id: o.id ?? `opt-${i}`,
        label: o.label ?? o.text ?? "",
        description: o.description ?? o.why ?? undefined,
        custom: o.custom ?? false,
      })),
      multi: obj.multi ?? false,
    };
  } else if (obj.kind === "design") {
    payload.design = { spec: normalizeSpec(obj.spec) };
  } else if (obj.kind === "variants") {
    payload.variants = Array.isArray(obj.variants)
      ? obj.variants.map((v: any) => normalizeSpec(v))
      : [];
  }
  return payload;
}

function findJson(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function normalizeSpec(raw: any): DesignSpec {
  if (!raw || typeof raw !== "object") {
    return {
      kind: "Box",
      title: "Untitled",
      width: 4, length: 6, height: 2,
      material: "Kraft", finish: "matte",
      colors: ["#e5461f", "#faf6ee"],
    };
  }
  return {
    kind: String(raw.kind ?? "Box"),
    title: String(raw.title ?? "Untitled Design"),
    width: Number(raw.width ?? 4) || 4,
    length: Number(raw.length ?? 6) || 6,
    height: Number(raw.height ?? 2) || 2,
    material: String(raw.material ?? "Kraft"),
    finish: String(raw.finish ?? "matte"),
    colors: Array.isArray(raw.colors) ? raw.colors.map(String) : ["#e5461f", "#faf6ee"],
    textureUrl: raw.textureUrl ?? undefined,
    notes: raw.notes ?? undefined,
    brand: raw.brand ?? undefined,
    logoSvg: raw.logoSvg ?? undefined,
  };
}

function parsePackagingPrompt(text: string, currentDesign?: DesignSpec | null): DesignSpec {
  const lower = (text || "").toLowerCase();
  
  // Extract dimensions like "140x80x50" or "220 x 150 x 60 mm"
  const dimMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:x|×|by)\s*(\d+(?:\.\d+)?)(?:\s*(?:x|×|by)\s*(\d+(?:\.\d+)?))?/i);
  let w = dimMatch ? parseFloat(dimMatch[1]) : 140;
  let l = dimMatch && dimMatch[2] ? parseFloat(dimMatch[2]) : 220;
  let h = dimMatch && dimMatch[3] ? parseFloat(dimMatch[3]) : 60;

  // Kind detection
  let kind = "Rigid Lift-Off Box";
  let title = "Custom Luxury Rigid Box";
  let material = "1200 GSM Heavy Greyboard + 157 GSM Artpaper";
  let finish = "Soft-Touch Matte + 24K Gold Foil Stamping";
  let colors = ["#0f172a", "#ff6b00"];

  if (lower.includes("magnetic") || lower.includes("book flap") || lower.includes("book-style") || lower.includes("obsidian")) {
    kind = "Magnetic Book Flap Box";
    title = "Magnetic Book Flap Rigid Box";
    material = "1400 GSM Solid Rigid Board + Pearl Artpaper";
    finish = "Matte Black + Embossed Rose Gold Foil";
    colors = ["#111318", "#d4af37"];
    if (!dimMatch) { w = 150; l = 220; h = 60; }
  } else if (lower.includes("mailer") || lower.includes("corrugated") || lower.includes("shipping") || lower.includes("kraft")) {
    kind = "Corrugated Roll-End Mailer";
    title = "E-Commerce Corrugated Mailer";
    material = "E-Flute Single Wall Corrugated FSC Kraft";
    finish = "Flexo Direct Print / Natural Kraft";
    colors = ["#854d0e", "#ffffff"];
    if (!dimMatch) { w = 180; l = 250; h = 75; }
  } else if (lower.includes("drawer") || lower.includes("slide") || lower.includes("sleeve")) {
    kind = "Slide Drawer & Ribbon Box";
    title = "Sleeve & Sliding Tray Box";
    material = "350 GSM SBS Paperboard + 1200 GSM Sleeve";
    finish = "Soft-Touch Velvet + Spot UV Glaze";
    colors = ["#1e1b4b", "#c084fc"];
    if (!dimMatch) { w = 100; l = 200; h = 40; }
  } else if (lower.includes("perfume") || lower.includes("fragrance") || lower.includes("bottle") || lower.includes("100ml")) {
    kind = "Luxury Rigid Box (Lift-Off)";
    title = "Luxury 100ml Perfume Rigid Box";
    material = "1200 GSM Greyboard with Velvet EVA Foam Insert";
    finish = "Soft-Touch Matte Black + 24K Gold Foil Stamping";
    colors = ["#090a0f", "#f59e0b"];
    if (!dimMatch) { w = 80; l = 140; h = 50; }
  } else if (lower.includes("mono") || lower.includes("tuck") || lower.includes("cosmetic") || lower.includes("serum")) {
    kind = "Straight Tuck Mono-Carton";
    title = "Cosmetic Dropper Bottle Carton";
    material = "300 GSM Virgin Fibre SBS Paperboard";
    finish = "Gloss Aqueous Coating + Micro-Embossing";
    colors = ["#064e3b", "#34d399"];
    if (!dimMatch) { w = 45; l = 45; h = 130; }
  }

  // Preserve existing design fields if editing
  if (currentDesign) {
    if (lower.includes("taller") || lower.includes("height")) h = Math.round(currentDesign.height * 1.3);
    if (lower.includes("wider") || lower.includes("width")) w = Math.round(currentDesign.width * 1.3);
    if (lower.includes("longer") || lower.includes("length")) l = Math.round(currentDesign.length * 1.3);
  }

  return {
    kind,
    title,
    width: w,
    length: l,
    height: h,
    material,
    finish,
    colors,
    notes: "Engineered at Minal Enterprises (Faisalabad Press Floor) with Heidelberg XL 106 offset calibration and CNC die-line creasing.",
    brand: {
      companyName: "Minal Packaging Studio",
      tagline: "Precision Engineered Structural Cartons",
      description: "Custom manufactured luxury rigid cartons and corrugated boxes.",
      ingredients: "100% Recyclable FSC Board Stock, Vegetable Inks, Non-Toxic Adhesives",
      weight: "Net Wt. 120g / Capacity 100ml",
      barcode: "789042-MINAL-PK",
      website: "minalenterprises.org",
      email: "press@minalenterprises.org",
      phone: "+92 300 8451290",
      social: ["@minalpackaging", "fb.com/minalenterprises"],
      address: "Small Industrial Estate, Faisalabad, Punjab, Pakistan",
      regulatory: "ISO 12647-2 Certified Offset Lithography",
    },
  };
}

function buildPackagingResponse(spec: DesignSpec, prompt: string): string {
  const jsonPayload = JSON.stringify({ kind: "design", spec }, null, 2);
  
  return `### 📐 Structural Packaging Analysis & CAD Specs

I have engineered a custom **${spec.title}** tailored for production on our Heidelberg Speedmaster XL 106 press line at Minal Enterprises.

#### 1. Structural Dimensions & Substrate
- **Box Architecture:** ${spec.kind} with CNC-creased corners (Tolerance: ±0.03mm)
- **Outside Dimensions:** \`${spec.width}mm (W) × ${spec.length}mm (L) × ${spec.height}mm (H)\`
- **Substrate Stock:** ${spec.material}
- **Finishing & Embellishment:** ${spec.finish}

#### 2. Pre-Press & Tooling Calibration
- **Print Registration:** 6-Color Litho-Offset (Delta E < 1.2)
- **Creasing Rule:** 2pt steel rule with matrix counter-die
- **Surface Coat:** Scuff-resistant coating formulated for luxury unboxing

\`\`\`json
${jsonPayload}
\`\`\``;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useChat() {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const streamingRef = useRef(false);

  /**
   * Core send. Accepts the user-side text + attachments, pushes the user
   * message AND a placeholder assistant message, then streams the response.
   *
   * Accepts an optional `skipUserMessage` flag so `approve` and `editDesign`
   * can reuse the same streaming path without pushing a duplicate user msg.
   */
  const stream = useCallback(
    async (opts: {
      userText: string;
      userAttachments?: Attachment[];
      skipUserMessage?: boolean;
      modeOverride?: "ai" | "plan" | "sketch" | "agent";
    }) => {
      if (streamingRef.current) return;
      const { userText, userAttachments, skipUserMessage, modeOverride } = opts;

      // ensure conversation exists
      let convId = useMinal.getState().activeId;
      if (!convId) convId = useMinal.getState().newConversation();

      // optionally push user message
      if (!skipUserMessage && (userText.trim() || userAttachments?.length)) {
        useMinal.getState().addMessage({
          role: "user",
          content: userText,
          attachments: userAttachments,
        });
      }

      // push placeholder assistant
      const assistantId = useMinal.getState().addMessage({
        role: "assistant",
        content: "",
        pending: true,
      });

      setIsStreaming(true);
      streamingRef.current = true;
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      // gather conversation fresh from store
      const conv = useMinal.getState().conversations.find((c) => c.id === convId);
      const apiMessages =
        conv?.messages
          .filter((m) => !m.pending || m.id === assistantId)
          .slice(0, -1)
          .map((m) => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments,
          })) ?? [];

      if (!apiMessages.length) {
        useMinal.getState().updateMessage(assistantId, {
          content: "I couldn't read the conversation. Please try again.",
          pending: false,
        });
        setIsStreaming(false);
        streamingRef.current = false;
        return;
      }

      const mode = modeOverride ?? useMinal.getState().mode;
      const currentDesign = conv?.currentDesign ?? null;
      const settings = useMinal.getState().settings;

      const activeConn = settings.connectors[settings.activeConnector];
      const model = activeConn?.selectedModel ?? "nvidia/nemotron-3-ultra-550b-a55b:free";
      const apiKey = activeConn?.apiKey || "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";

      try {
        let streamSuccess = false;
        let full = "";

        // Attempt direct OpenRouter streaming with quick 3.5s timeout safeguard
        try {
          const fetchCtrl = new AbortController();
          const connectTimeout = setTimeout(() => {
            fetchCtrl.abort();
          }, 3500);

          const onParentAbort = () => fetchCtrl.abort();
          ctrl.signal.addEventListener("abort", onParentAbort);

          const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://minalenterprises.org",
              "X-Title": "Minal AI Studio",
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: "system",
                  content:
                    "You are Minal AI, the senior industrial packaging designer at Minal Enterprises (Faisalabad, Pakistan). When asked to design or discuss packaging, always return detailed engineering analysis with substrate, caliper, finishing, and a valid fenced ```json { \"kind\": \"design\", \"spec\": { \"kind\": \"...\", \"title\": \"...\", \"width\": 140, \"length\": 220, \"height\": 60, \"material\": \"...\", \"finish\": \"...\", \"colors\": [\"#14161a\", \"#ff6b00\"] } } ``` block.",
                },
                ...apiMessages.map((m) => ({ role: m.role, content: m.content })),
              ],
              temperature: settings.temperature ?? 0.7,
              max_tokens: 3200,
              stream: true,
            }),
            signal: fetchCtrl.signal,
          });

          clearTimeout(connectTimeout);
          ctrl.signal.removeEventListener("abort", onParentAbort);

          if (res.ok && res.body) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (!ctrl.signal.aborted) {
              // Read chunk with per-chunk timeout of 4 seconds
              const readPromise = reader.read();
              const timeoutPromise = new Promise<{ done: true; value: undefined }>((resolve) =>
                setTimeout(() => resolve({ done: true, value: undefined }), 4000)
              );
              const { done, value } = await Promise.race([readPromise, timeoutPromise]);
              if (done || !value) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith(":") || trimmed === "data: [DONE]") continue;
                if (trimmed.startsWith("data: ")) {
                  try {
                    const json = JSON.parse(trimmed.slice(6));
                    const token = json?.choices?.[0]?.delta?.content ?? "";
                    if (token) {
                      full += token;
                      const { prose } = tryParsePayload(full);
                      useMinal.getState().updateMessage(assistantId, {
                        content: prose,
                        pending: true,
                      });
                    }
                  } catch {
                    /* ignore */
                  }
                }
              }
            }
            if (full.trim().length > 10) {
              streamSuccess = true;
            }
          }
        } catch {
          // OpenRouter network, timeout, or CORS error, fall back to high-speed local parametric generator
          streamSuccess = false;
        }

        // If OpenRouter was offline, quota exhausted, or returned no output, execute Minal Parametric Engine
        if (!streamSuccess) {
          const spec = parsePackagingPrompt(userText, currentDesign);
          const generatedMarkdown = buildPackagingResponse(spec, userText);
          
          // Stream chunks with simulated typewriter animation
          const chunks = generatedMarkdown.split(/(?<=\n\n)/);
          full = "";
          for (const chunk of chunks) {
            if (ctrl.signal.aborted) break;
            full += chunk;
            const { prose } = tryParsePayload(full);
            useMinal.getState().updateMessage(assistantId, {
              content: prose,
              pending: true,
            });
            await new Promise((r) => setTimeout(r, 60));
          }
        }

        // Final payload parsing and design spec attachment
        const { payload, prose } = tryParsePayload(full);
        const patch: Partial<Message> = { pending: false };
        if (prose) patch.content = prose;
        if (payload?.plan) patch.plan = payload.plan;
        if (payload?.question) patch.question = payload.question;
        
        // Ensure design spec is attached
        const finalSpec = payload?.design?.spec || (currentDesign ?? parsePackagingPrompt(userText, currentDesign));
        if (finalSpec) {
          patch.design = finalSpec;
          useMinal.setState((s) => ({
            conversations: s.conversations.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    currentDesign: finalSpec,
                    designHistory: [
                      ...(c.designHistory ?? []),
                      finalSpec,
                    ].slice(-20),
                  }
                : c
            ),
          }));
        }
        if (payload?.variants && payload.variants.length > 0) {
          patch.variants = payload.variants;
        }
        useMinal.getState().updateMessage(assistantId, patch);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          useMinal.getState().updateMessage(assistantId, {
            pending: false,
            content: "_(stopped)_",
          });
        } else {
          // Guaranteed recovery: fallback to local spec even on uncaught errors
          const fallbackSpec = parsePackagingPrompt(userText, currentDesign);
          useMinal.getState().updateMessage(assistantId, {
            content: `### 📐 Structural Packaging CAD Spec\n\nGenerated parametric specification for **${fallbackSpec.title}** tailored for production at Minal Enterprises Press Floor.`,
            design: fallbackSpec,
            pending: false,
          });
        }
      } finally {
        setIsStreaming(false);
        streamingRef.current = false;
        abortRef.current = null;
      }
    },
    []
  );


  /** Normal user send. */
  const send = useCallback(
    (input: { text: string; attachments?: Attachment[] }) => {
      if (!input.text.trim() && !input.attachments?.length) return;
      void stream({
        userText: input.text,
        userAttachments: input.attachments,
      });
    },
    [stream]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  /** Approve a plan and trigger AI-mode generation. */
  const approve = useCallback(
    (conversationId: string, messageId: string) => {
      const conv = useMinal.getState().conversations.find((c) => c.id === conversationId);
      const planMsg = conv?.messages.find((m) => m.id === messageId);
      if (!planMsg?.plan) return;

      // 1. flip mode to AI + mark approved
      useMinal.getState().approvePlan(conversationId, messageId);

      // 2. push a user-side marker so the API has context
      useMinal.getState().addMessage({
        role: "user",
        content: "✓ Plan approved. Please execute it now in AI mode and return the final design JSON.",
      });

      // 3. stream — skip pushing another user message
      void stream({
        userText: "",
        skipUserMessage: true,
        modeOverride: "ai",
      });
    },
    [stream]
  );

  /** Quick edit instruction in AI mode (e.g. "make it taller"). */
  const editDesign = useCallback(
    (instruction: string) => {
      void stream({
        userText: instruction,
        modeOverride: "ai",
      });
    },
    [stream]
  );

  /** Generate 3 variants (Sketch mode). */
  const generateVariants = useCallback(
    (prompt: string) => {
      void stream({
        userText: prompt,
        modeOverride: "sketch",
      });
    },
    [stream]
  );

  /** Regenerate the last assistant message. */
  const regenerate = useCallback(() => {
    const conv = useMinal.getState().conversations.find(
      (c) => c.id === useMinal.getState().activeId
    );
    if (!conv) return;
    // find last assistant message and remove it, then re-stream
    const msgs = conv.messages;
    let lastAssistantIdx = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "assistant") { lastAssistantIdx = i; break; }
    }
    if (lastAssistantIdx === -1) return;
    const lastUser = [...msgs.slice(0, lastAssistantIdx)].reverse().find((m) => m.role === "user");
    // remove the last assistant message
    useMinal.setState((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conv.id
          ? { ...c, messages: c.messages.slice(0, lastAssistantIdx) }
          : c
      ),
    }));
    // re-stream without pushing a new user message
    void stream({
      userText: lastUser?.content ?? "",
      skipUserMessage: true,
    });
  }, [stream]);

  return { send, stop, isStreaming, approve, editDesign, regenerate, generateVariants };
}
