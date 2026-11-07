import Jimp from "jimp";

export const COLOR_WORDS: Record<string, string> = {
  black: "#141412", white: "#F7F5F0", ivory: "#F1EAD9", cream: "#F2E8CF",
  grey: "#8A8A86", gray: "#8A8A86", silver: "#C9C9C4", charcoal: "#2B2B28",
  red: "#E23B2E", crimson: "#B3122F", maroon: "#6E1423", orange: "#FF6B2C",
  amber: "#F2A413", yellow: "#F5D90A", gold: "#C9A227", lime: "#C6F24E",
  green: "#1E7A4F", mint: "#9FE0C1", sage: "#A8B79B", teal: "#0E6E6B",
  cyan: "#45C8D8", blue: "#2743D8", navy: "#16224D", sky: "#A8C8EC",
  purple: "#6E3BD8", violet: "#8B5CF6", lavender: "#C8B6E2",
  pink: "#F2A0C4", blush: "#F3C7C9", rose: "#E96A8B", magenta: "#D81B8C",
  brown: "#5A3A22", kraft: "#C7A87B", tan: "#C8A77B", beige: "#D8CBB2",
  peach: "#FFC9A3", coral: "#F26D5B",
};

export const PALETTE_PRESETS: { name: string; colors: string[]; blurb: string }[] = [
  { name: "Ink & Lime", colors: ["#141412", "#C6F24E"], blurb: "Modern, punchy, very minal" },
  { name: "Kraft & Forest", colors: ["#1E4A34", "#C7A87B"], blurb: "Earthy eco seller vibe" },
  { name: "Navy & Gold", colors: ["#16224D", "#C9A227"], blurb: "Premium luxury shelf" },
  { name: "Blush & Cocoa", colors: ["#5A3A22", "#F3C7C9"], blurb: "Soft beauty brand feel" },
  { name: "Mono Ink", colors: ["#141412", "#F7F5F0"], blurb: "Timeless black on white" },
  { name: "Coral Pop", colors: ["#E23B2E", "#F5D90A"], blurb: "Loud, can't-miss retail" },
];

function toHex(n: number) {
  return "#" + n.toString(16).padStart(6, "0").toUpperCase();
}

/** Extract a dominant palette from an uploaded image (data URL). */
export async function extractPalette(dataUrl: string): Promise<string[]> {
  try {
    const base64 = dataUrl.split(",")[1];
    if (!base64) return [];
    const img = await Jimp.read(Buffer.from(base64, "base64"));
    const S = 44;
    img.resize(S, S);
    const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const rgba = Jimp.intToRGBA(img.getPixelColor(x, y));
        if (rgba.a < 140) continue;
        const key = [rgba.r >> 4, rgba.g >> 4, rgba.b >> 4].join("-");
        const b = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
        b.n++; b.r += rgba.r; b.g += rgba.g; b.b += rgba.b;
        buckets.set(key, b);
      }
    }
    const ranked = [...buckets.values()]
      .map((b) => ({ r: b.r / b.n, g: b.g / b.n, b: b.b / b.n, n: b.n }))
      .sort((a, b) => b.n - a.n);
    const picked: { r: number; g: number; b: number }[] = [];
    for (const c of ranked) {
      if (picked.length >= 5) break;
      const dupe = picked.some((p) => {
        const d = Math.hypot(p.r - c.r, p.g - c.g, p.b - c.b);
        return d < 46;
      });
      if (!dupe) picked.push(c);
    }
    return picked.map((c) =>
      toHex((Math.round(c.r) << 16) | (Math.round(c.g) << 8) | Math.round(c.b))
    );
  } catch {
    return [];
  }
}

/** Parse color words / hex codes / preset names out of free text. */
export function parseColors(text: string): string[] {
  const found: string[] = [];
  const hexes = text.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g);
  if (hexes) {
    for (const h of hexes) {
      let hex = h.toUpperCase();
      if (hex.length === 4) hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
      if (!found.includes(hex)) found.push(hex);
    }
  }
  const lower = text.toLowerCase();
  const preset = PALETTE_PRESETS.find((p) => lower.includes(p.name.toLowerCase()));
  if (preset) return [...preset.colors];
  for (const [word, hex] of Object.entries(COLOR_WORDS)) {
    if (new RegExp(`\\b${word}\\b`).test(lower) && !found.includes(hex)) found.push(hex);
    if (found.length >= 3) break;
  }
  return found;
}
