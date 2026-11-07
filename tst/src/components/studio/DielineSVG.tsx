"use client";
import type { DesignSpec } from "@/db/schema";
import { inkFor } from "@/components/three/artwork";
import { useId } from "react";

type Panel = { x: number; y: number; w: number; h: number; kind: string; rotate?: boolean };

export default function DielineSVG({ spec, logo }: { spec: DesignSpec; logo: string | null }) {
  const { w, h, d } = spec.dims;
  const flap = Math.round(h * 0.42);
  const [c1, c2] = [spec.colors[0] ?? "#141412", spec.colors[1] ?? "#C6F24E"];
  const paper = spec.paper === "kraft" ? "#C89E71" : "#FBFAF6";
  const id = useId().replace(/[:]/g, "");

  const bgFor = (kind: string) => {
    if (spec.style === "luxury" || spec.style === "bold") return c1;
    if (spec.style === "playful") return c2;
    return paper;
  };

  const panels: Panel[] = [
    { x: d, y: flap + d, w, h, kind: "back" },
    { x: d, y: flap + d + h, w, h: d, kind: "bottom" },
    { x: d, y: flap + d + h + d, w, h, kind: "front" },
    { x: 0, y: flap + d + h, w: d, h: d, kind: "left", rotate: true },
    { x: d + w, y: flap + d + h, w: d, h: d, kind: "right", rotate: true },
    { x: d, y: flap, w, h: d, kind: "toplid" },
    { x: d + w * 0.15, y: 0, w: w * 0.7, h: flap, kind: "flap" },
  ];

  const W = w + d * 2;
  const H = h * 2 + d * 2 + flap;

  const foldLines: [number, number, number, number][] = [
    [d, flap + d, d + w, flap + d], // back-lid
    [d, flap + d + h, d + w, flap + d + h], // back-bottom
    [d, flap + d + h + d, d + w, flap + d + h + d], // bottom-front
    [d, flap + d + h, d, flap + d + h + d], // left-bottom
    [d + w, flap + d + h, d + w, flap + d + h + d], // right-bottom
    [d, flap, d + w, flap], // lid-flap
  ];

  const fontFor = (text: string, pw: number, ph: number) =>
    Math.max(6, Math.min(pw / Math.max(1, text.length) * 1.55, ph * 0.3));

  return (
    <svg viewBox={`-8 -8 ${W + 16} ${H + 16}`} className="w-full h-full" role="img" aria-label="2D dieline">
      <defs>
        <pattern id={`dots-${id}`} width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="6" cy="6" r="1.6" fill="rgba(255,255,255,0.35)" />
        </pattern>
        <pattern id={`hatch-${id}`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="9" stroke="rgba(20,20,18,0.14)" strokeWidth="1" />
        </pattern>
      </defs>

      {panels.map((p) => {
        const bg = bgFor(p.kind);
        const ink = spec.style === "eco" ? (spec.paper === "kraft" ? "#3A2A1A" : inkFor(bg)) : inkFor(bg);
        const brand = spec.brand || "Your Brand";
        const cx = p.x + p.w / 2;
        const cy = p.y + p.h / 2;
        const name = p.kind === "toplid" ? "top" : p.kind;
        return (
          <g key={p.kind}>
            <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={bg} />
            {spec.style === "playful" && <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={`url(#dots-${id})`} />}
            {spec.style === "eco" && <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={`url(#hatch-${id})`} />}

            {(p.kind === "toplid" || p.kind === "front") && (
              <g>
                {logo && (
                  <image href={logo} x={cx - p.w * 0.14} y={p.y + p.h * 0.1} width={p.w * 0.28} height={p.h * 0.3} preserveAspectRatio="xMidYMid meet" />
                )}
                {spec.style === "playful" && <circle cx={cx} cy={cy + p.h * 0.08} r={Math.min(p.w, p.h) * 0.3} fill={c1} />}
                {spec.style === "bold" && <rect x={p.x} y={cy - p.h * 0.05} width={p.w} height={p.h * 0.16} fill={c2} />}
                <text
                  x={cx}
                  y={cy + (logo ? p.h * 0.22 : p.h * 0.06)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={fontFor(brand, p.w * (spec.style === "bold" ? 1.5 : 0.86), p.h)}
                  fontWeight={700}
                  fill={spec.style === "playful" ? inkFor(c1) : spec.style === "bold" ? inkFor(c1) : ink}
                  fontFamily="Space Grotesk, sans-serif"
                >
                  {brand}
                </text>
                {spec.style !== "bold" && (
                  <text x={cx} y={p.y + p.h * 0.88} textAnchor="middle" fontSize={fontFor("PRODUCT", p.w * 0.5, p.h) * 0.5} letterSpacing="2" fill={ink} fontFamily="IBM Plex Mono, monospace">
                    {(spec.product || "PRODUCT").toUpperCase().slice(0, 22)}
                  </text>
                )}
              </g>
            )}

            {(p.kind === "left" || p.kind === "right") && (
              <text
                transform={`translate(${cx} ${cy}) rotate(-90)`}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontFor(brand, p.h * 0.7, p.w)}
                fontWeight={700}
                fill={ink}
                fontFamily="Space Grotesk, sans-serif"
              >
                {brand}
              </text>
            )}

            {p.kind === "back" && (
              <g>
                <text x={cx} y={cy - p.h * 0.1} textAnchor="middle" fontSize={fontFor(brand, p.w * 0.7, p.h) * 0.7} fontWeight={700} fill={ink} fontFamily="Space Grotesk, sans-serif">{brand}</text>
                <text x={cx} y={cy + p.h * 0.16} textAnchor="middle" fontSize={Math.max(5, p.h * 0.08)} letterSpacing="1.6" fill={ink} fontFamily="IBM Plex Mono, monospace">DESIGNED WITH MINAL.AI</text>
              </g>
            )}
            {p.kind === "bottom" && (
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={Math.max(5, p.h * 0.14)} letterSpacing="1.6" fill={ink} fontFamily="IBM Plex Mono, monospace">
                {w}×{h}×{d} MM
              </text>
            )}
            {p.kind === "flap" && (
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={Math.max(4, p.h * 0.3)} letterSpacing="1.4" fill={inkFor(bg)} fontFamily="IBM Plex Mono, monospace">TUCK</text>
            )}

            <text x={p.x + 2.5} y={p.y + 5.5} fontSize={Math.max(4.5, Math.min(p.w, p.h) * 0.12)} fill={ink} opacity="0.55" fontFamily="IBM Plex Mono, monospace">
              {name.toUpperCase()}
            </text>
          </g>
        );
      })}

      {/* cut line */}
      {panels.map((p) => (
        <rect key={`cut-${p.kind}`} x={p.x} y={p.y} width={p.w} height={p.h} fill="none" stroke="#141412" strokeWidth="1.1" />
      ))}
      {/* crease lines */}
      {foldLines.map((l, i) => (
        <line key={i} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} stroke="#FF3B30" strokeWidth="0.8" strokeDasharray="4 3" />
      ))}

      {/* legend */}
      <g transform={`translate(-4 ${H + 2})`} fontFamily="IBM Plex Mono, monospace" fontSize="5">
        <line x1="0" y1="2.4" x2="10" y2="2.4" stroke="#141412" strokeWidth="1" />
        <text x="13" y="4">CUT</text>
        <line x1="34" y1="2.4" x2="44" y2="2.4" stroke="#FF3B30" strokeWidth="0.8" strokeDasharray="3 2" />
        <text x="47" y="4">CREASE · FOLD</text>
        <text x={W} y="4" textAnchor="end">NET — {spec.boxType.toUpperCase()}</text>
      </g>
    </svg>
  );
}
