"use client";
import * as THREE from "three";
import type { DesignSpec } from "@/db/schema";

export type PanelKind = "front" | "back" | "left" | "right" | "top" | "bottom";

const INK = "#141412";
const PAPER = "#FBFAF6";
const KRAFT = "#C89E71";

function lum(hex: string): number {
  const c = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function inkFor(bg: string): string {
  return lum(bg) > 0.55 ? INK : PAPER;
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, maxW: number, start: number, min = 12): number {
  let size = start;
  while (size > min) {
    ctx.font = `700 ${size}px "Space Grotesk", sans-serif`;
    if (ctx.measureText(text).width <= maxW) break;
    size -= 4;
  }
  return size;
}

function micro(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, size = 15, align: CanvasTextAlign = "center") {
  ctx.save();
  ctx.font = `500 ${size}px "IBM Plex Mono", monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${Math.round(size * 0.28)}px`;
  ctx.fillText(text.toUpperCase(), x, y);
  ctx.restore();
}

function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, n = 700) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 0.08;
    ctx.fillStyle = `rgba(20,18,10,${a.toFixed(3)})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.4, 1.4);
  }
  ctx.restore();
}

function hatch(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, gap = 26) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.16;
  ctx.lineWidth = 1.5;
  for (let x = -h; x < w + h; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + h, h);
    ctx.stroke();
  }
  ctx.restore();
}

function dots(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, gap = 44, r = 5) {
  ctx.save();
  ctx.fillStyle = color;
  for (let y = gap / 2; y < h; y += gap) {
    for (let x = gap / 2; x < w; x += gap) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function barcode(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  let i = 0;
  for (let px = x; px < x + w; ) {
    const bw = [2, 3, 1, 4, 2, 1][i % 6];
    if (i % 3 !== 2) ctx.fillRect(px, y, bw, h);
    px += bw + 2;
    i++;
  }
  ctx.restore();
}

function baseBg(spec: DesignSpec): string {
  return spec.paper === "kraft" ? KRAFT : PAPER;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function drawLogo(ctx: CanvasRenderingContext2D, logo: string, cx: number, cy: number, maxW: number, maxH: number) {
  const img = await loadImage(logo);
  if (!img) return;
  const ratio = Math.min(maxW / img.width, maxH / img.height);
  const w = img.width * ratio;
  const h = img.height * ratio;
  ctx.save();
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  ctx.restore();
}

/** Paints one panel of the box artwork. */
export async function paintPanel(
  kind: PanelKind,
  spec: DesignSpec,
  logo: string | null,
  withLogo: (logo: string | null) => void
): Promise<HTMLCanvasElement> {
  void withLogo;
  const { w, h, d } = spec.dims;
  const dimsMm: Record<PanelKind, [number, number]> = {
    front: [w, h], back: [w, h], left: [d, h], right: [d, h], top: [w, d], bottom: [w, d],
  };
  const [pw, ph] = dimsMm[kind];
  const S = 560 / Math.max(pw, ph);
  const W = Math.max(64, Math.round(pw * S));
  const H = Math.max(64, Math.round(ph * S));
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;

  const [c1, c2] = [spec.colors[0] ?? INK, spec.colors[1] ?? spec.colors[0] ?? "#C6F24E"];
  const paper = baseBg(spec);
  const brand = spec.brand || "Your Brand";
  const product = spec.product || "Product";
  const cx = W / 2, cy = H / 2;
  const m = Math.round(Math.min(W, H) * 0.09); // margin

  // ————— background per style —————
  if (spec.style === "luxury") { ctx.fillStyle = c1; }
  else if (spec.style === "playful") { ctx.fillStyle = spec.paper === "kraft" ? KRAFT : c2; }
  else if (spec.style === "bold") { ctx.fillStyle = c1; }
  else { ctx.fillStyle = paper; }
  ctx.fillRect(0, 0, W, H);
  if (spec.paper === "kraft") speckle(ctx, W, H);

  // ————— per-panel artwork —————
  const isSide = kind === "left" || kind === "right";
  const narrow = isSide && W < H * 0.8;

  if (spec.style === "eco") hatch(ctx, W, H, inkFor(c1) === INK ? c1 : PAPER);

  if (kind === "top" || kind === "front") {
    const heroIsTop = kind === "top";
    if (spec.style === "minimal") {
      if (logo) await drawLogo(ctx, logo, cx, cy - H * 0.17, W * 0.4, H * 0.26);
      const y = logo ? cy + H * 0.1 : cy - H * 0.02;
      const size = fitFont(ctx, brand, W - m * 2, Math.min(W, H) * 0.3);
      ctx.fillStyle = INK; ctx.textAlign = "center";
      ctx.font = `700 ${size}px "Space Grotesk", sans-serif`;
      ctx.fillText(brand, cx, y + size * 0.35);
      ctx.fillStyle = c2 === c1 ? INK : c2;
      ctx.fillRect(cx - Math.min(W * 0.24, 130), y + size * 0.52, Math.min(W * 0.24, 130) * 2, 4);
      micro(ctx, product, cx, H - m * 0.9, INK);
    } else if (spec.style === "luxury") {
      const gold = c2;
      ctx.strokeStyle = gold; ctx.lineWidth = 2;
      ctx.strokeRect(m * 0.7, m * 0.7, W - m * 1.4, H - m * 1.4);
      if (logo) await drawLogo(ctx, logo, cx, cy - H * 0.16, W * 0.34, H * 0.24);
      const y = logo ? cy + H * 0.14 : cy;
      const size = fitFont(ctx, brand, W - m * 3, Math.min(W, H) * 0.22);
      ctx.fillStyle = lum(c1) > 0.5 ? INK : PAPER; ctx.textAlign = "center";
      ctx.font = `500 ${size}px "Space Grotesk", sans-serif`;
      (ctx as unknown as { letterSpacing: string }).letterSpacing = `${size * 0.16}px`;
      ctx.fillText(brand.toUpperCase(), cx, y + size * 0.3);
      ctx.fillStyle = gold;
      ctx.fillRect(cx - 40, y + size * 0.55, 80, 2);
      micro(ctx, product, cx, y + size * 0.88, gold);
    } else if (spec.style === "playful") {
      dots(ctx, W, H, inkFor(c2) === INK ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.25)", 46, 6);
      ctx.fillStyle = c1;
      ctx.beginPath(); ctx.arc(cx, cy, Math.min(W, H) * 0.34, 0, Math.PI * 2); ctx.fill();
      if (logo) await drawLogo(ctx, logo, cx, cy - H * 0.14, W * 0.3, H * 0.2);
      const y = logo ? cy + H * 0.06 : cy;
      const size = fitFont(ctx, brand, W * 0.56, Math.min(W, H) * 0.26);
      ctx.fillStyle = inkFor(c1); ctx.textAlign = "center";
      ctx.font = `700 ${size}px "Space Grotesk", sans-serif`;
      ctx.fillText(brand, cx, y + size * 0.34);
      // product pill
      ctx.font = `500 15px "IBM Plex Mono", monospace`;
      const ptext = product.toUpperCase();
      const pw2 = ctx.measureText(ptext).width + 34;
      ctx.fillStyle = inkFor(c2);
      roundRect(ctx, cx - pw2 / 2, Math.min(H - m - 22, y + size * 0.55), pw2, 26, 13); ctx.fill();
      ctx.fillStyle = inkFor(inkFor(c2) === INK ? PAPER : INK);
      micro(ctx, product, cx, Math.min(H - m - 4, y + size * 0.55 + 18), inkFor(c2) === INK ? PAPER : INK, 12);
    } else if (spec.style === "bold") {
      const size = fitFont(ctx, brand, W * 2.2, Math.min(W, H) * 0.9);
      ctx.fillStyle = c2; ctx.textAlign = "center";
      ctx.font = `700 ${size}px "Space Grotesk", sans-serif`;
      ctx.save();
      ctx.translate(cx, cy + size * 0.18);
      ctx.fillText(brand, 0, 0);
      ctx.restore();
      ctx.fillStyle = inkFor(c1);
      micro(ctx, `${product} — by ${brand}`, cx, H - m * 0.9, inkFor(c1));
      if (logo) await drawLogo(ctx, logo, m + W * 0.06, m + H * 0.06, W * 0.16, H * 0.14);
    } else { // eco
      const inkc = c1 === KRAFT ? "#3A2A1A" : c1;
      ctx.strokeStyle = inkc; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, Math.min(W, H) * 0.32, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, Math.min(W, H) * 0.28, 0, Math.PI * 2); ctx.stroke();
      if (logo) await drawLogo(ctx, logo, cx, cy - H * 0.13, W * 0.3, H * 0.2);
      const y = logo ? cy + H * 0.08 : cy;
      const size = fitFont(ctx, brand, Math.min(W, H) * 0.5, Math.min(W, H) * 0.2);
      ctx.fillStyle = inkc; ctx.textAlign = "center";
      ctx.font = `700 ${size}px "Space Grotesk", sans-serif`;
      ctx.fillText(brand, cx, y + size * 0.3);
      micro(ctx, "100% recycled board", cx, H - m * 0.8, inkc, 12);
    }
    void heroIsTop;
  } else if (isSide) {
    const bgCol = spec.style === "luxury" || spec.style === "bold" ? c1 : spec.style === "playful" ? c2 : paper;
    const inkc = spec.style === "playful" ? inkFor(c2) : spec.style === "eco" ? (c1 === KRAFT ? "#3A2A1A" : c1) : inkFor(bgCol);
    if (narrow) {
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(-Math.PI / 2);
      const size = fitFont(ctx, brand, H * 0.72, W * 0.5, 10);
      ctx.fillStyle = inkc; ctx.textAlign = "center";
      ctx.font = `700 ${size}px "Space Grotesk", sans-serif`;
      ctx.fillText(brand, 0, size * 0.34);
      ctx.restore();
      if (spec.style === "playful") dots(ctx, W, H, "rgba(255,255,255,0.3)", 30, 4);
    } else {
      // accent block
      ctx.fillStyle = spec.style === "playful" ? c1 : c2 === bgCol ? inkFor(bgCol) : c2;
      ctx.fillRect(0, H * 0.62, W, H * 0.38);
      const size = fitFont(ctx, brand, W - m, Math.min(W, H) * 0.22, 10);
      ctx.fillStyle = inkc; ctx.textAlign = "center";
      ctx.font = `700 ${size}px "Space Grotesk", sans-serif`;
      ctx.fillText(brand, cx, H * 0.4);
      micro(ctx, product, cx, H * 0.82, inkFor(spec.style === "playful" ? c1 : c2 === bgCol ? bgCol : c2), 12);
    }
  } else if (kind === "back") {
    const bgCol = spec.style === "luxury" || spec.style === "bold" ? c1 : spec.style === "playful" ? c2 : paper;
    const inkc = spec.style === "eco" ? (c1 === KRAFT ? "#3A2A1A" : c1) : inkFor(bgCol);
    micro(ctx, brand, cx, m + 20, inkc);
    ctx.font = `500 ${Math.max(14, Math.min(22, W * 0.045))}px "Space Grotesk", sans-serif`;
    ctx.fillStyle = inkc; ctx.textAlign = "center";
    const lines = spec.tagline
      ? wrapText(ctx, spec.tagline, W - m * 2.4)
      : [`Thoughtfully packed by ${brand}.`, `Recyclable. Reusable. Remarkable.`];
    lines.slice(0, 4).forEach((line, i) => ctx.fillText(line, cx, cy - (lines.length - 1) * 16 + i * 32));
    micro(ctx, `${spec.dims.w}×${spec.dims.h}×${spec.dims.d} mm · ${kind.toUpperCase()}`, cx, H - m - 30, inkc, 11);
    barcode(ctx, cx - 50, H - m - 18, 100, 22, inkc);
  } else {
    // bottom
    const bgCol = spec.style === "luxury" || spec.style === "bold" ? c1 : spec.style === "playful" ? c2 : paper;
    const inkc = spec.style === "eco" ? (c1 === KRAFT ? "#3A2A1A" : c1) : inkFor(bgCol);
    micro(ctx, `${brand} — ${product}`, cx, cy - 16, inkc, 13);
    barcode(ctx, cx - 60, cy - 8, 120, 26, inkc);
    micro(ctx, "designed with minal.ai", cx, cy + 40, inkc, 10);
  }

  return c;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

export async function makeTextures(
  spec: DesignSpec,
  logo: string | null
): Promise<Record<PanelKind, THREE.CanvasTexture>> {
  const kinds: PanelKind[] = ["front", "back", "left", "right", "top", "bottom"];
  const entries = await Promise.all(
    kinds.map(async (k) => {
      const canvas = await paintPanel(k, spec, logo, () => {});
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      return [k, tex] as const;
    })
  );
  return Object.fromEntries(entries) as Record<PanelKind, THREE.CanvasTexture>;
}
