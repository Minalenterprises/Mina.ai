"use client";

import React, { useState } from "react";
import { useMinal } from "@/lib/store";
import { Box3DViewer, type ViewAngle } from "./box-3d-viewer";
import type { DesignSpec } from "@/lib/types";
import { RotateCcw, X, Download, ShoppingBag, Eye, Maximize2 } from "lucide-react";
import { sfx } from "@/lib/sound";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ViewerModal() {
  const open = useMinal((s) => s.viewerOpen);
  const spec = useMinal((s) => s.viewerSpec);
  const setOpen = useMinal((s) => s.openViewer);
  const openOrder = useMinal((s) => s.openOrder);

  const [angle, setAngle] = useState<ViewAngle>("iso");
  const [autoRotate, setAutoRotate] = useState(true);

  if (!open || !spec) return null;

  const rawW = Number(spec.width) || 140;
  const rawL = Number(spec.length) || 220;
  const rawH = Number(spec.height) || 60;
  const isMetric = rawW > 20 || rawL > 20 || rawH > 20;
  const unit = isMetric ? "mm" : '"';

  const handleClose = () => {
    sfx.pop();
    setOpen(null);
  };

  const handleOrder = () => {
    sfx.success();
    handleClose();
    openOrder(true);
    toast.success("Loaded spec into Factory Order queue");
  };

  const handleDownloadDieline = () => {
    sfx.pop();
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <rect width="100%" height="100%" fill="#0d0e12"/>
  <text x="40" y="50" fill="#ff6b00" font-family="monospace" font-size="16" font-weight="bold">MINAL ENTERPRISES · PARAMETRIC DIELINE CAD</text>
  <text x="40" y="80" fill="#ffffff" font-family="sans-serif" font-size="14">${spec.title || spec.kind} — ${rawW} x ${rawL} x ${rawH} ${unit}</text>
  <rect x="100" y="140" width="600" height="380" fill="none" stroke="#ff6b00" stroke-width="2"/>
  <line x1="100" y1="230" x2="700" y2="230" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4,4"/>
  <line x1="100" y1="430" x2="700" y2="430" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4,4"/>
  <line x1="250" y1="140" x2="250" y2="520" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4,4"/>
  <line x1="550" y1="140" x2="550" y2="520" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4,4"/>
  <text x="120" y="170" fill="#94a3b8" font-family="monospace" font-size="11">TOP LID</text>
  <text x="120" y="330" fill="#94a3b8" font-family="monospace" font-size="11">MAIN BODY</text>
  <text x="120" y="470" fill="#94a3b8" font-family="monospace" font-size="11">BOTTOM BASE</text>
</svg>`;
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dieline-${(spec.title || "spec").toLowerCase().replace(/\s+/g, "-")}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Dieline CAD for "${spec.title || spec.kind}" downloaded!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-[1180px] h-[90vh] rounded-[32px] overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.9)] flex flex-col md:flex-row bg-[#0c0e14] border border-white/15 text-white">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center transition"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Side: 3D Turntable Stage */}
        <div className="flex-1 relative flex flex-col h-[55%] md:h-full bg-gradient-to-b from-[#13151f] via-[#0d0f15] to-[#08090c] overflow-hidden">
          {/* Ambient Lighting Glow */}
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#ff6b00]/[0.06] rounded-full blur-[120px] pointer-events-none" />
          
          {/* Top Bar Controls */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase font-bold text-[#ff6b00] px-2.5 py-1 rounded-full bg-[#ff6b00]/15 border border-[#ff6b00]/30 shadow-sm">
              3D CAD Turntable
            </span>
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-mono transition border",
                autoRotate
                  ? "bg-white/15 text-white border-white/20"
                  : "bg-white/5 text-white/50 border-white/10"
              )}
            >
              Rotate: {autoRotate ? "ON" : "OFF"}
            </button>
          </div>

          {/* 3D Canvas */}
          <div className="w-full h-full relative">
            <Box3DViewer
              spec={spec as DesignSpec}
              className="w-full h-full"
              angle={angle}
              rotate={autoRotate}
            />
          </div>

          {/* Bottom Controls Bar */}
          <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-between pointer-events-none">
            {/* View angle buttons */}
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 pointer-events-auto">
              {(["iso", "front", "side", "top"] as ViewAngle[]).map((a) => (
                <button
                  key={a}
                  onClick={() => {
                    sfx.click();
                    setAngle(a);
                  }}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-mono uppercase transition",
                    angle === a
                      ? "bg-white text-black font-bold shadow-sm"
                      : "text-white/60 hover:text-white"
                  )}
                >
                  {a}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-[10.5px] text-white/50 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <RotateCcw className="w-3 h-3 text-[#ff6b00]" />
              <span>Drag to rotate • Scroll to zoom</span>
            </div>
          </div>
        </div>

        {/* Right Side: Engineering Specs Sidebar */}
        <aside className="w-full md:w-[350px] shrink-0 border-t md:border-t-0 md:border-l border-white/10 bg-[#0f1118] p-6 sm:p-7 flex flex-col justify-between overflow-y-auto minal-scroll h-[45%] md:h-full">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-mono font-bold text-[#ff6b00]">
              Manufacturing Spec
            </div>
            <h2 className="text-[20px] sm:text-[22px] font-extrabold tracking-tight mt-1 text-white leading-tight">
              {(spec as DesignSpec).title || (spec as DesignSpec).kind}
            </h2>

            <div className="mt-5 space-y-3">
              <SpecRow k="Structure" v={(spec as DesignSpec).kind || "Custom Rigid Carton"} />
              <SpecRow k="Dimensions" v={`${rawW} x ${rawL} x ${rawH} ${unit}`} highlight />
              <SpecRow k="Width (W)" v={`${rawW} ${unit}`} />
              <SpecRow k="Length (L)" v={`${rawL} ${unit}`} />
              <SpecRow k="Height (H)" v={`${rawH} ${unit}`} />
              <SpecRow k="Substrate" v={(spec as DesignSpec).material || "1200 GSM Greyboard"} />
              <SpecRow k="Finish" v={(spec as DesignSpec).finish || "Soft-Touch Matte + Gold Foil"} />
            </div>

            {/* Color Palette */}
            {(spec as DesignSpec).colors?.length > 0 && (
              <div className="mt-5 pt-4 border-t border-white/10">
                <div className="text-[10px] uppercase font-mono tracking-wider text-white/40 mb-2">
                  Color Formula
                </div>
                <div className="flex flex-wrap gap-2">
                  {(spec as DesignSpec).colors.map((c: string) => (
                    <div key={c} className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white/5 border border-white/10">
                      <div
                        className="w-5 h-5 rounded-lg border border-white/20 shadow-sm"
                        style={{ backgroundColor: c }}
                      />
                      <span className="text-[11px] font-mono text-white/80 pr-1">
                        {c}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-5 border-t border-white/10 space-y-2.5">
            <button
              onClick={handleOrder}
              className="w-full h-11 rounded-2xl bg-white hover:bg-zinc-100 text-black text-[13px] font-bold flex items-center justify-center gap-2 shadow-lg transition hover:scale-[1.01] active:scale-[0.99]"
            >
              <ShoppingBag className="w-4 h-4 text-black" />
              <span>Order Factory Production Run</span>
            </button>
            <button
              onClick={handleDownloadDieline}
              className="w-full h-10 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-[12.5px] font-medium flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-white/80" />
              <span>Download Dieline SVG CAD</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SpecRow({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline justify-between border-b border-white/[0.06] pb-2 text-xs">
      <span className="font-mono text-white/40 uppercase text-[10.5px]">
        {k}
      </span>
      <span className={cn("font-medium text-right truncate max-w-[200px]", highlight ? "text-[#ff6b00] font-mono font-bold" : "text-white/90")}>
        {v}
      </span>
    </div>
  );
}
