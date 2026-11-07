"use client";

import { useState } from "react";
import Link from "next/link";
import { Box, ArrowLeft, Download, Plus, Minus, RotateCcw, Palette, Ruler, Layers, Eye, ShoppingBag } from "lucide-react";
import { Box3DViewer, type ViewAngle } from "@/components/minal/box-3d-viewer";
import { OrderFormDialog } from "@/components/minal/order-form-dialog";
import { useMinal } from "@/lib/store";
import type { DesignSpec } from "@/lib/types";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MATERIALS = ["Kraft", "SBS Board", "Corrugated E-Flute", "Art Board", "Leatherette", "Tinplate"];
const FINISHES = ["matte", "gloss", "soft-touch", "spot-uv", "foil"];
const PRESETS = [
  { name: "Candy Box", w: 6, l: 4, h: 2, colors: ["#ec4899", "#fef3c7"] },
  { name: "Pizza Box", w: 12, l: 12, h: 2, colors: ["#dc2626", "#fef3c7"] },
  { name: "Shoe Box", w: 14, l: 8, h: 5, colors: ["#1c1c1e", "#f5f3ed"] },
  { name: "Tea Box", w: 4, l: 6, h: 2, colors: ["#65a30d", "#fafaf7"] },
];

export default function StudioPage() {
  const [spec, setSpec] = useState<DesignSpec>({
    kind: "Folding Carton",
    title: "Custom Design",
    width: 6,
    length: 4,
    height: 2,
    material: "SBS Board",
    finish: "matte",
    colors: ["#a3e635", "#1c1c1e"],
  });
  const [angle, setAngle] = useState<ViewAngle>("iso");

  const update = (patch: Partial<DesignSpec>) => setSpec((s) => ({ ...s, ...patch }));

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="h-14 flex items-center gap-3 px-4 border-b border-border glass safe-top">
        <Link href="/home" className="flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="w-px h-6 bg-border" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#a3e635] to-[#65a30d] grid place-items-center">
            <Box className="w-4 h-4 text-black" strokeWidth={2.4} />
          </div>
          <span className="font-bold text-[14px]">Studio</span>
        </div>
        <Input
          value={spec.title}
          onChange={(e) => update({ title: e.target.value })}
          className="h-8 max-w-[200px] text-[12px] bg-transparent border-0 hover:bg-accent focus-visible:bg-accent"
        />
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            {spec.width}" × {spec.length}" × {spec.height}"
          </span>
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(spec, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${spec.title.replace(/\s+/g, "-").toLowerCase()}.json`;
              a.click();
            }}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-border hover:bg-accent text-[11px] font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={() => {
              useMinal.getState().openViewer(spec);
              useMinal.getState().openOrder(true);
            }}
            className="flex items-center gap-1.5 px-3.5 h-8 rounded-lg bg-[#a3e635] hover:brightness-110 text-black text-[11px] font-bold shadow-md shadow-[#a3e635]/20 transition active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Order Prototype
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left toolbar */}
        <aside className="w-14 border-r border-border flex flex-col items-center py-3 gap-1 bg-card flex-shrink-0">
          {[
            { icon: Ruler, label: "Dimensions", active: true },
            { icon: Palette, label: "Colors" },
            { icon: Layers, label: "Material" },
            { icon: Eye, label: "View" },
          ].map((t, i) => (
            <button
              key={i}
              className={cn(
                "w-10 h-10 rounded-xl grid place-items-center transition",
                t.active ? "bg-[#a3e635]/15 text-[#65a30d]" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              title={t.label}
            >
              <t.icon className="w-4 h-4" strokeWidth={2.2} />
            </button>
          ))}
        </aside>

        {/* Canvas */}
        <main className="flex-1 relative bg-[radial-gradient(rgba(10,10,11,0.04)_1px,transparent_1.2px)] [background-size:20px_20px] [background-color:#fafaf7]">
          <Box3DViewer spec={spec} className="w-full h-full" angle={angle} rotate={angle === "iso"} />
          {/* Angle tabs */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-0.5 p-0.5 rounded-xl glass border border-border">
            {(["iso", "front", "back", "side", "top"] as ViewAngle[]).map((a) => (
              <button
                key={a}
                onClick={() => setAngle(a)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition",
                  angle === a ? "bg-[#a3e635] text-black" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </main>

        {/* Right panel — properties */}
        <aside className="w-[280px] border-l border-border bg-card overflow-y-auto minal-scroll flex-shrink-0">
          <div className="p-4 space-y-5">
            {/* Presets */}
            <Section title="Presets">
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => setSpec((s) => ({ ...s, title: p.name, width: p.w, length: p.l, height: p.h, colors: p.colors }))}
                    className="px-2 py-2 rounded-lg border border-border hover:border-[#a3e635]/40 hover:bg-accent/30 transition text-[10.5px] font-medium text-left"
                  >
                    {p.name}
                    <div className="flex gap-0.5 mt-1">
                      {p.colors.map((c) => (
                        <div key={c} className="w-3 h-3 rounded-sm border border-border" style={{ background: c }} />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </Section>

            {/* Dimensions */}
            <Section title="Dimensions (inches)">
              <DimSlider label="Width" value={spec.width} onChange={(v) => update({ width: v })} />
              <DimSlider label="Length" value={spec.length} onChange={(v) => update({ length: v })} />
              <DimSlider label="Height" value={spec.height} onChange={(v) => update({ height: v })} />
            </Section>

            {/* Colors */}
            <Section title="Palette">
              <div className="space-y-2">
                {spec.colors.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={c}
                      onChange={(e) => {
                        const colors = [...spec.colors];
                        colors[i] = e.target.value;
                        update({ colors });
                      }}
                      className="w-10 h-8 rounded border border-border cursor-pointer"
                    />
                    <input
                      value={c}
                      onChange={(e) => {
                        const colors = [...spec.colors];
                        colors[i] = e.target.value;
                        update({ colors });
                      }}
                      className="flex-1 h-8 px-2 rounded border border-border bg-background text-[11px] font-mono"
                    />
                    <button
                      onClick={() => update({ colors: spec.colors.filter((_, idx) => idx !== i) })}
                      className="w-7 h-7 rounded grid place-items-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => update({ colors: [...spec.colors, "#ffffff"] })}
                  className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg border border-dashed border-border text-[10.5px] text-muted-foreground hover:border-[#a3e635]/40 hover:text-foreground"
                >
                  <Plus className="w-3 h-3" /> Add color
                </button>
              </div>
            </Section>

            {/* Material */}
            <Section title="Material">
              <select
                value={spec.material}
                onChange={(e) => update({ material: e.target.value })}
                className="w-full h-9 px-2 rounded-lg border border-border bg-background text-[12px]"
              >
                {MATERIALS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </Section>

            {/* Finish */}
            <Section title="Finish">
              <div className="grid grid-cols-3 gap-1">
                {FINISHES.map((f) => (
                  <button
                    key={f}
                    onClick={() => update({ finish: f })}
                    className={cn(
                      "px-2 py-1.5 rounded-lg text-[9.5px] font-semibold uppercase tracking-wider transition",
                      spec.finish === f ? "bg-[#a3e635] text-black" : "border border-border hover:bg-accent"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </Section>

            {/* Reset */}
            <button
              onClick={() => setSpec({ kind: "Folding Carton", title: "Custom Design", width: 6, length: 4, height: 2, material: "SBS Board", finish: "matte", colors: ["#a3e635", "#1c1c1e"] })}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border text-[11px] text-muted-foreground hover:bg-accent transition"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        </aside>
      </div>
      <OrderFormDialog />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[9.5px] uppercase tracking-[0.18em] font-bold text-muted-foreground mb-2 block">
        {title}
      </Label>
      {children}
    </div>
  );
}

function DimSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="text-[11px] font-mono font-bold">{value}"</span>
      </div>
      <div className="flex items-center gap-2">
        <Slider value={[value]} min={1} max={24} step={0.5} onValueChange={(v) => onChange(v[0])} className="flex-1" />
      </div>
    </div>
  );
}
