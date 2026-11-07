import type { ChatState } from "@/db/schema";
import { extractPalette, parseColors, PALETTE_PRESETS } from "./colors";
import { STYLES, BOX_TYPES, recommendBox, boxTypeName, quote, pkr, FINISHES } from "@/lib/design/spec";

export type Reply = {
  role: "assistant";
  kind: "text" | "plan" | "design";
  content: string;
  meta?: Record<string, unknown>;
};

function hasWord(t: string, w: string) {
  return new RegExp(`\\b${w}\\b`, "i").test(t);
}

function matchStyle(t: string): string | null {
  const m = STYLES.find(
    (s) =>
      t.toLowerCase().includes(s.id) ||
      t.toLowerCase().includes(s.name.toLowerCase()) ||
      (s.id === "eco" && /kraft|eco|natural|recycled/i.test(t)) ||
      (s.id === "luxury" && /lux|premium|gold|elegant|fancy/i.test(t)) ||
      (s.id === "playful" && /fun|colorful|colourful|kids|cute/i.test(t)) ||
      (s.id === "bold" && /loud|big|pop|statement/i.test(t))
  );
  return m ? m.id : null;
}

function matchBox(t: string): string | null {
  const lower = t.toLowerCase();
  if (/rigid|magnet|gift|luxury box/.test(lower)) return "rigid";
  if (/mailer|shipping|corrugat|e-?com|ecom/.test(lower)) return "mailer";
  if (/sleeve|slide/.test(lower)) return "sleeve";
  if (/tuck|normal|standard|classic|regular|retail/.test(lower)) return "tuck";
  const hit = BOX_TYPES.find((b) => lower.includes(b.name.toLowerCase()));
  return hit ? hit.id : null;
}

function matchFinish(t: string): string | null {
  const lower = t.toLowerCase();
  if (/soft|velvet/.test(lower)) return "soft";
  if (/gloss|shiny/.test(lower)) return "gloss";
  if (/uncoated|natural|raw|kraft/.test(lower)) return "uncoated";
  if (/matte|matt/.test(lower)) return "matte";
  const hit = FINISHES.find((f) => lower.includes(f.name.toLowerCase()));
  return hit ? hit.id : null;
}

export function emptyState(): ChatState {
  return { step: "product", slots: {} };
}

export function greeting(): Reply {
  return {
    role: "assistant",
    kind: "text",
    content:
      "Hey — I'm Minal, your packaging designer. Tell me what you're selling and I'll design the box around it.\n\nSo — what product are we boxing today?",
  };
}

export async function respond(
  state: ChatState,
  rawText: string,
  attachment: string | null
): Promise<{ state: ChatState; replies: Reply[] }> {
  const next: ChatState = JSON.parse(JSON.stringify(state));
  const t = (rawText || "").trim();
  const lower = t.toLowerCase();
  const replies: Reply[] = [];
  const say = (content: string, chips?: string[]) =>
    replies.push({ role: "assistant", kind: "text", content, meta: chips ? { chips } : undefined });

  const isSkip = /skip|no logo|don't have|dont have|no\b|nope|nah|later/.test(lower);

  switch (next.step) {
    case "product": {
      if (!t || t.length < 2) {
        say("Just tell me the product — like \"spoons\", \"candles\", or \"hoodies\".");
        break;
      }
      {
        const segs = t.split(",");
        let base = segs[0];
        if (/(i'm|i am).*(seller|sell|store|shop|brand)/i.test(base) && segs[1]) base = segs[1];
        if (/^(i sell|i make|we sell|we make)\s+/i.test(base.trim()) && segs[1]) base = segs[1];
        let p = base.toLowerCase().trim();
        const strip = /^(i('| a)?m (a|an) (seller|brand)[^.]*?\.?\s*|(i (want|need|sell|make))|(we (sell|make))|(([\w-]+\s+){0,2}(box(es)?|packaging)\s+(of|for))|box(es)?|packaging|for|of|the|a|an|some|my|new|hi|hello)\s+/i;
        while (strip.test(p)) p = p.replace(strip, "").trim();
        p = p
          .replace(/\s*(i('| a| a)?m (a|an) ?(seller|brand|shop|store)[^.]*|as (a|an) (seller|brand)[^.]*|so (i|we) can (sell|ship|move)[^.]*)[.!]?$/i, "")
          .replace(/\s+(box|boxes|packaging|brand)\.?$/, "")
          .replace(/[.!]$/, "")
          .trim();
        next.slots.product = p || base.trim();
      }
      next.step = "brand";
      say(
        `${cap(next.slots.product)} — perfect, very sellable. What's the brand or name we should print big on the front?`
      );
      break;
    }

    case "brand": {
      if (!t || t.length < 1) {
        say("One or two words is perfect — what's the name on the box?");
        break;
      }
      next.slots.brand = t.split("\n")[0].slice(0, 40);
      next.step = "logo";
      say(
        `"${next.slots.brand}" — good name. Got a logo? Drop the image here and I'll read its colors straight off it.\n\nNo logo? No problem, just skip.`,
        ["Skip logo"]
      );
      break;
    }

    case "logo": {
      if (attachment) {
        next.slots.logo = attachment;
        const palette = await extractPalette(attachment);
        if (palette.length >= 2) {
          next.slots.paletteOffer = palette;
          next.step = "colorConfirm";
          say(
            "Nice mark — I can see it. Here's the palette I pulled from your logo. Should we build the box on these colors, or do you want to pick your own?",
            ["Use these colors", "Pick my own"]
          );
        } else {
          next.step = "colors";
          say(
            "Got the logo — I'll print it clean on the box. I couldn't read a strong palette from it though, so tell me your colors. Type names like \"black and lime\", paste hex codes, or pick a ready palette.",
            PALETTE_PRESETS.map((p) => p.name)
          );
        }
      } else if (!t || isSkip) {
        next.slots.logo = undefined;
        next.step = "colors";
        say(
          "All good — we'll do a clean type-led design, no logo needed.\n\nWhat colors feel right? Type them (e.g. \"navy and gold\"), paste hex codes, or grab a palette:",
          PALETTE_PRESETS.map((p) => p.name)
        );
      } else {
        say("You can drag the image in with the attach button — or just say skip and we'll go type-only.", ["Skip logo"]);
      }
      break;
    }

    case "colorConfirm": {
      if (attachment) {
        next.slots.logo = attachment;
        const palette = await extractPalette(attachment);
        if (palette.length >= 2) {
          next.slots.paletteOffer = palette;
          say("Updated logo — fresh palette pulled from it. Use these, or pick your own?", ["Use these colors", "Pick my own"]);
          break;
        }
      }
      if (/own|pick|custom|choose|different|other/.test(lower)) {
        next.step = "colors";
        say("Sure — tell me your colors. Names like \"black and lime\", hex codes, or a preset:", PALETTE_PRESETS.map((p) => p.name));
      } else {
        const offer = next.slots.paletteOffer ?? [];
        next.slots.colors = offer.slice(0, 2);
        next.step = "style";
        const rec = recommendBox(next.slots.product ?? "");
        say(
          `Locked — those colors will carry the whole line.\n\nNow the vibe. How should ${next.slots.brand ?? "it"} feel on a shelf?`,
          STYLES.map((s) => s.name)
        );
        // stash recommendation for next turn
        next.slots.boxType = rec;
      }
      break;
    }

    case "colors": {
      const colors = parseColors(t);
      if (colors.length === 0) {
        say(
          "Hmm, I didn't catch a color there. Try names like \"forest green and cream\", paste a hex like #16224D, or tap a preset:",
          PALETTE_PRESETS.map((p) => p.name)
        );
        break;
      }
      if (colors.length === 1) colors.push(colors[0].toLowerCase() === "#141412" ? "#C6F24E" : "#141412");
      next.slots.colors = colors.slice(0, 3);
      next.step = "style";
      next.slots.boxType = recommendBox(next.slots.product ?? "");
      say(
        `${colors.slice(0, 2).join(" + ")} — noted.\n\nNow the vibe. Minimal and calm, loud and bold, luxury, playful, or raw eco kraft?`,
        STYLES.map((s) => s.name)
      );
      break;
    }

    case "style": {
      const style = matchStyle(t);
      if (!style) {
        say("Pick a vibe — or describe it and I'll match it: minimal, luxury, playful, bold, or eco kraft.", STYLES.map((s) => s.name));
        break;
      }
      next.slots.style = style;
      const rec = next.slots.boxType ?? recommendBox(next.slots.product ?? "");
      next.step = "box";
      say(
        `${STYLES.find((s) => s.id === style)?.name} it is.\n\nFor ${next.slots.product ?? "your product"}, I'd put it in a ${boxTypeName(rec)} — but your call:`,
        BOX_TYPES.map((b) => b.name)
      );
      break;
    }

    case "box": {
      const box = matchBox(t) ?? next.slots.boxType ?? "tuck";
      next.slots.boxType = box;
      next.step = "quantity";
      say(
        `${boxTypeName(box)} — solid choice. How many boxes do you need in this run? Bigger runs drop the unit price a lot.`,
        ["100", "250", "500", "1000", "Custom amount"]
      );
      break;
    }

    case "quantity": {
      const num = parseInt(lower.replace(/,/g, "").match(/\d+/)?.[0] ?? "", 10);
      if (!num || num < 1 || /custom/.test(lower)) {
        say("Just type the number — 50 minimum, and 1000+ gets you the best rate.");
        if (!/custom/.test(lower)) next.step = "quantity";
        break;
      }
      next.slots.quantity = Math.min(100000, Math.max(50, num));
      next.step = "finish";
      say(
        `${next.slots.quantity.toLocaleString()} units — that's roughly ${pkr(quote(next.slots.boxType ?? "tuck", "matte", next.slots.quantity))} per box before finish.\n\nLast one: what should it feel like in hand?`,
        ["Matte lamination", "Gloss lamination", "Soft-touch velvet", "Uncoated natural"]
      );
      break;
    }

    case "finish": {
      const finish = matchFinish(t) ?? "matte";
      next.slots.finish = finish;
      next.slots.paper = finish === "uncoated" || next.slots.style === "eco" ? "kraft" : "white";
      next.step = "done";
      // The route handler creates the design + the plan message from `next`.
      say("That's everything I need. Drawing up your plan — one sec.");
      break;
    }

    case "done":
    default: {
      if (attachment) {
        next.slots.logo = attachment;
        const palette = await extractPalette(attachment);
        if (palette.length >= 2) next.slots.paletteOffer = palette;
        say("Got it — logo updated on your design. If you want the box recolored to the new logo, edit the swatches in your plan card above.");
        break;
      }
      if (/price|cost|how much|rate|quote/.test(lower) && next.slots.boxType) {
        const unit = quote(next.slots.boxType, next.slots.finish ?? "matte", next.slots.quantity ?? 250);
        say(
          `Your current spec runs ${pkr(unit)}/box — ${pkr(unit * (next.slots.quantity ?? 250))} all-in for ${(next.slots.quantity ?? 250).toLocaleString()} units. Approve the plan above and you can order right from the preview.`
        );
        break;
      }
      if (/color|colour/.test(lower)) {
        const colors = parseColors(t);
        if (colors.length) {
          say("Nice — update the two color swatches in your plan card above and the 3D preview will repaint itself instantly.");
          break;
        }
      }
      say(
        "Your plan card above is fully editable — change anything, watch the preview update, then hit Approve design. After that you can open the full 3D preview, fold and unfold it, and place your order."
      );
      break;
    }
  }

  return { state: next, replies };
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
