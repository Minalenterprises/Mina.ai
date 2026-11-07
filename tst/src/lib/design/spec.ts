import type { DesignSpec } from "@/db/schema";

export const BOX_TYPES = [
  { id: "tuck", name: "Straight Tuck End", hint: "Classic retail box, opens from the top", base: 45 },
  { id: "mailer", name: "Mailer Box", hint: "Sturdy e-commerce shipper", base: 68 },
  { id: "sleeve", name: "Sleeve Box", hint: "Slide-open, premium feel", base: 40 },
  { id: "rigid", name: "Rigid Box", hint: "Luxury, magnetic-style gift box", base: 125 },
] as const;

export const STYLES = [
  { id: "minimal", name: "Minimal", hint: "Clean type, lots of space", pattern: "none" },
  { id: "luxury", name: "Luxury", hint: "Dark, letter-spaced, gold rules", pattern: "lines" },
  { id: "playful", name: "Playful", hint: "Big shapes, fun energy", pattern: "dots" },
  { id: "bold", name: "Bold", hint: "Huge type that bleeds off edges", pattern: "none" },
  { id: "eco", name: "Eco Kraft", hint: "Raw kraft paper, honest print", pattern: "hatch" },
] as const;

export const FINISHES = [
  { id: "matte", name: "Matte lamination", mult: 1 },
  { id: "gloss", name: "Gloss lamination", mult: 1.06 },
  { id: "soft", name: "Soft-touch velvet", mult: 1.24 },
  { id: "uncoated", name: "Uncoated natural", mult: 0.92 },
] as const;

const SIZE_MAP: [string[], { w: number; h: number; d: number }][] = [
  [["spoon", "fork", "knife", "cutlery", "straw", "chopstick", "pen"], { w: 215, h: 32, d: 45 }],
  [["bottle", "perfume", "spray", "serum", "oil", "shampoo", "juice"], { w: 62, h: 165, d: 62 }],
  [["candle", "mug", "cup", "jar", "honey", "jam"], { w: 88, h: 105, d: 88 }],
  [["soap", "wax", "chocolate", "bar"], { w: 95, h: 32, d: 62 }],
  [["phone", "case", "mobile", "wallet", "notebook"], { w: 175, h: 22, d: 88 }],
  [["shoe", "sneaker", "sandals"], { w: 320, h: 120, d: 210 }],
  [["shirt", "tshirt", "t-shirt", "clothes", "hoodie", "scarf", "cloth"], { w: 300, h: 45, d: 230 }],
  [["watch", "jewelry", "ring", "bracelet", "earring"], { w: 95, h: 42, d: 95 }],
  [["cookie", "bakery", "cake", "brownie", "donut"], { w: 185, h: 65, d: 185 }],
  [["tea", "coffee", "spice", "powder"], { w: 95, h: 145, d: 62 }],
  [["cream", "cosmetic", "lotion", "lips", "makeup"], { w: 55, h: 135, d: 42 }],
  [["toy", "game", "puzzle"], { w: 240, h: 58, d: 185 }],
];

export function sizeFor(product: string): { w: number; h: number; d: number } {
  const p = product.toLowerCase();
  for (const [keys, dims] of SIZE_MAP) {
    if (keys.some((k) => p.includes(k))) return dims;
  }
  return { w: 130, h: 80, d: 62 };
}

export function recommendBox(product: string): string {
  const p = product.toLowerCase();
  if (["shirt", "hoodie", "toy", "shoe", "cloth", "scarf"].some((k) => p.includes(k))) return "mailer";
  if (["watch", "jewelry", "ring", "perfume", "gift"].some((k) => p.includes(k))) return "rigid";
  if (["soap", "chocolate", "bar"].some((k) => p.includes(k))) return "sleeve";
  return "tuck";
}

export function quote(boxType: string, finish: string, qty: number): number {
  const base = BOX_TYPES.find((b) => b.id === boxType)?.base ?? 45;
  const mult = FINISHES.find((f) => f.id === finish)?.mult ?? 1;
  const disc = qty >= 5000 ? 0.62 : qty >= 1000 ? 0.74 : qty >= 500 ? 0.85 : qty >= 250 ? 0.93 : 1;
  return Math.max(14, Math.round(base * mult * disc));
}

export function buildSpec(input: {
  product: string;
  brand: string;
  tagline?: string;
  boxType: string;
  style: string;
  finish: string;
  paper: string;
  quantity: number;
  colors: string[];
}): DesignSpec {
  const style = STYLES.find((s) => s.id === input.style) ?? STYLES[0];
  return {
    dims: sizeFor(input.product),
    colors: input.colors.slice(0, 3),
    style: input.style,
    boxType: input.boxType,
    finish: input.finish,
    paper: input.paper,
    brand: input.brand || "Your Brand",
    product: input.product || "Product",
    tagline: input.tagline || "",
    pattern: style.pattern,
    unitPrice: quote(input.boxType, input.finish, input.quantity),
  };
}

export function boxTypeName(id: string): string {
  return BOX_TYPES.find((b) => b.id === id)?.name ?? "Straight Tuck End";
}

export function finishName(id: string): string {
  return FINISHES.find((f) => f.id === id)?.name ?? "Matte";
}

export function styleName(id: string): string {
  return STYLES.find((s) => s.id === id)?.name ?? "Minimal";
}

export function pkr(n: number): string {
  return "Rs " + n.toLocaleString("en-PK");
}
