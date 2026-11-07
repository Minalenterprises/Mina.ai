"use client";

import React, { useState, useMemo } from "react";
import type { DesignSpec } from "@/lib/types";
import { useMinal } from "@/lib/store";
import { sfx } from "@/lib/sound";
import {
  Box,
  Layers,
  Sliders,
  Check,
  Download,
  ShoppingBag,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Sun,
  ShieldCheck,
  Cpu,
  Printer,
  RotateCcw,
  Palette,
  Ruler,
  FileText,
  Flame,
  CheckCircle2,
  Volume2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Box3DViewer, type ViewAngle } from "./box-3d-viewer";

interface PackagingInspectorProps {
  spec: DesignSpec;
  className?: string;
  onUpdateSpec?: (updated: DesignSpec) => void;
}

const FINISH_PRESETS = [
  { id: "matte", label: "Soft-Touch Matte", foil: "24K Gold Stamping" },
  { id: "gloss", label: "High-Gloss UV", foil: "Silver Metallic" },
  { id: "kraft", label: "Natural Uncoated", foil: "Blind Deboss" },
  { id: "velvet", label: "Velvet Rigid", foil: "Rose Gold Foil" },
];

const COLOR_SWATCHES = [
  { name: "Obsidian Noir", primary: "#121316", accent: "#ff6b00" },
  { name: "Minal Amber", primary: "#ea580c", accent: "#ffffff" },
  { name: "Tuscan Gold", primary: "#b45309", accent: "#faf6ee" },
  { name: "Forest Emerald", primary: "#064e3b", accent: "#d1fae5" },
  { name: "Artisan Kraft", primary: "#854d0e", accent: "#fef3c7" },
  { name: "Crisp Pearl", primary: "#f8fafc", accent: "#0f172a" },
];

const BOX_STYLES = [
  "Rigid Lift-Off Box",
  "Magnetic Book Flap",
  "Corrugated Mailer",
  "Straight Tuck Carton",
  "Ribbon Slide Drawer",
];

export function PackagingInspector({
  spec,
  className = "",
  onUpdateSpec,
}: PackagingInspectorProps) {
  const openOrder = useMinal((s) => s.openOrder);
  const openViewer = useMinal((s) => s.openViewer);

  // Interactive Live Customization State
  const [selectedColor, setSelectedColor] = useState(
    spec.colors?.[0] || "#121316"
  );
  const [accentColor, setAccentColor] = useState(
    spec.colors?.[1] || "#ff6b00"
  );
  const [finishMode, setFinishMode] = useState<"matte" | "gloss">("matte");
  const [lengthVal, setLengthVal] = useState(spec.length || 240);
  const [widthVal, setWidthVal] = useState(spec.width || 160);
  const [heightVal, setHeightVal] = useState(spec.height || 60);
  const [boxStyleIndex, setBoxStyleIndex] = useState(0);
  const [selectedAngle, setSelectedAngle] = useState<ViewAngle>("iso");
  const [lampIntensity, setLampIntensity] = useState(70);
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [displayMode, setDisplayMode] = useState<"3d" | "photo">("3d");

  // Dynamic active spec reflecting user customizer adjustments
  const liveSpec = useMemo<DesignSpec>(() => {
    return {
      ...spec,
      title: spec.title || BOX_STYLES[boxStyleIndex],
      kind: BOX_STYLES[boxStyleIndex],
      colors: [selectedColor, accentColor],
      finish: finishMode === "matte" ? "Soft-Touch Matte" : "High-Gloss UV",
      length: lengthVal,
      width: widthVal,
      height: heightVal,
    };
  }, [spec, selectedColor, accentColor, finishMode, lengthVal, widthVal, heightVal, boxStyleIndex]);

  const handlePrevStyle = () => {
    sfx.click();
    setBoxStyleIndex((prev) => (prev > 0 ? prev - 1 : BOX_STYLES.length - 1));
  };

  const handleNextStyle = () => {
    sfx.click();
    setBoxStyleIndex((prev) => (prev < BOX_STYLES.length - 1 ? prev + 1 : 0));
  };

  const handleDownloadDieline = () => {
    sfx.pop();
    const content = `MINAL ENTERPRISES - PARAMETRIC PACKAGING SPECIFICATION\n` +
      `=======================================================\n` +
      `Design Title: ${liveSpec.title}\n` +
      `Structural Box Style: ${liveSpec.kind || liveSpec.title}\n` +
      `Dimensions (WxLxH): ${liveSpec.width}mm x ${liveSpec.length}mm x ${liveSpec.height}mm\n` +
      `Substrate Material: ${liveSpec.material || "1200 GSM Heavy Greyboard"}\n` +
      `Finishing Treatment: ${liveSpec.finish}\n` +
      `Primary Colorway: ${liveSpec.colors?.[0] || "#121316"}\n` +
      `Accent Colorway: ${liveSpec.colors?.[1] || "#ff6b00"}\n` +
      `Die Cut & Crease Tolerance: ±0.05 mm\n` +
      `Calibrated Machine: Heidelberg Speedmaster XL 106\n` +
      `Export Engine: Minal CAD AI Vectorizer v5.2\n` +
      `Manufactured at: Dhuddi Wala, Faisalabad Press Floor\n` +
      `=======================================================\n`;

    const blob = new Blob([content], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Minal-CAD-Dieline-${(liveSpec.title || "spec").toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Dieline for ${liveSpec.title} downloaded!`);
  };

  return (
    <div
      className={cn(
        "w-full max-w-4xl mx-auto rounded-[32px] p-3 sm:p-5 text-white font-sans select-none",
        "bg-[#0e1014]/95 backdrop-blur-2xl border border-white/[0.12] shadow-[0_24px_60px_rgba(0,0,0,0.8)]",
        className
      )}
    >
      {/* =========================================================================
          TOP ROW: Large Hero Packaging Render (Matches User Reference Image Top)
          ========================================================================= */}
      <div className="relative w-full h-[320px] sm:h-[400px] rounded-[24px] overflow-hidden bg-gradient-to-b from-[#181a20] via-[#101217] to-[#0a0b0e] border border-white/[0.08] shadow-inner flex flex-col justify-between p-4 sm:p-6 group">
        {/* Floating Top Header Badges */}
        <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
          {/* Brand Logo & Live Status Pill */}
          <div className="flex items-center gap-2.5">
            <div className="px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ff6b00] shadow-[0_0_8px_#ff6b00] animate-pulse" />
              <span className="text-[11.5px] font-bold tracking-tight text-white uppercase">
                {displayMode === "3d" ? "Live 3D Spec" : "Studio Photo Render"}
              </span>
            </div>

            {/* Client / Minal Logo Badge */}
            <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-white/90 flex items-center gap-1.5">
              <span className="font-extrabold text-[#ff6b00]">M</span>
              <span>{spec.brand?.companyName || "MINAL ENTERPRISES"}</span>
            </div>
          </div>

          {/* View Mode Toggle (3D vs Studio Photo) */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15">
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setDisplayMode("3d");
              }}
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-medium transition flex items-center gap-1.5",
                displayMode === "3d"
                  ? "bg-[#ff6b00] text-black font-bold shadow-md shadow-[#ff6b00]/25"
                  : "text-white/60 hover:text-white"
              )}
            >
              <Box className="w-3 h-3" />
              <span>3D Turntable</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setDisplayMode("photo");
              }}
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-medium transition flex items-center gap-1.5",
                displayMode === "photo"
                  ? "bg-white text-black font-bold shadow-md"
                  : "text-white/60 hover:text-white"
              )}
            >
              <Sun className="w-3 h-3" />
              <span>Studio Photo</span>
            </button>
          </div>

          {/* Top Right Spec Pills (Matching the reference specs in user images) */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/10 text-[11px] font-mono text-white/80">
              {liveSpec.length} × {liveSpec.width} × {liveSpec.height} mm
            </div>
            <div className="px-3 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/10 text-[11px] font-mono text-white/80">
              {liveSpec.material || "400 GSM SBS"}
            </div>
            <div className="px-3 py-1.5 rounded-full bg-[#ff6b00]/15 backdrop-blur-md border border-[#ff6b00]/30 text-[11px] font-mono font-bold text-[#ff6b00]">
              ±0.15mm CNC Die
            </div>
          </div>
        </div>

        {/* Hero Visual Layer: 3D Turntable OR Studio Photo Mockup */}
        <div className="absolute inset-0 z-0">
          {displayMode === "3d" ? (
            <Box3DViewer
              spec={liveSpec}
              className="w-full h-full"
              angle={selectedAngle}
              rotate={selectedAngle === "iso"}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-b from-[#15171e] via-[#0c0d12] to-black relative">
              <img
                src="/images/box.jpg"
                alt={liveSpec.title}
                className="max-h-[85%] max-w-[85%] object-contain rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.95)] border border-white/10 hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-5 left-6 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-mono text-white/80 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Photorealistic Studio Mockup • Heidelberg XL 106</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar inside Top Card */}
        <div className="relative z-10 flex items-center justify-between gap-3 pt-2">
          {/* Angle Switcher Pills (Active during 3D mode) */}
          {displayMode === "3d" ? (
            <div className="flex items-center gap-1 p-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
              {(["iso", "front", "top", "side"] as ViewAngle[]).map((ang) => (
                <button
                  key={ang}
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setSelectedAngle(ang);
                  }}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider transition",
                    selectedAngle === ang
                      ? "bg-white text-black font-bold shadow-md"
                      : "text-white/60 hover:text-white"
                  )}
                >
                  {ang === "iso" ? "3D Turn" : ang}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-mono text-white/70">
              <span>Finish: {liveSpec.finish}</span>
            </div>
          )}

          {/* Fullscreen Expand Action */}
          <button
            type="button"
            onClick={() => {
              sfx.click();
              openViewer(liveSpec);
            }}
            className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/15 hover:border-white/40 text-white grid place-items-center transition hover:scale-105"
            title="Expand Fullscreen 3D Stage"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM GRID (Exact Replica of the 3 Cards in User's Reference Image):
          Card 1: Structural Anatomy & Callouts (Bottom Left)
          Card 2: Customizer / Finish / Sliders (Bottom Center - like Smart Lamp)
          Card 3: Factory Production / Action Hub (Bottom Right)
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 mt-3 sm:mt-4">
        
        {/* CARD 1: Structural Anatomy & Feature Callouts (md:col-span-5) */}
        <div className="md:col-span-5 rounded-[26px] bg-[#14161d]/90 border border-white/[0.08] p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <div className="text-[14px] font-bold text-white flex items-center gap-1.5">
                <span>{BOX_STYLES[boxStyleIndex]}</span>
                <ChevronRight className="w-3.5 h-3.5 text-white/40" />
              </div>
              <div className="text-[11px] text-white/50 font-mono">
                Industrial Precision Die &amp; Crease
              </div>
            </div>
            
            {/* Toggle switch */}
            <button
              onClick={() => setIsLiveActive(!isLiveActive)}
              className={cn(
                "w-11 h-6 rounded-full transition-colors relative p-0.5",
                isLiveActive ? "bg-[#ff6b00]" : "bg-white/20"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full bg-white shadow-md transition-transform",
                  isLiveActive ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {/* Anatomy Graphic with Tactical Callout Cards */}
          <div className="relative py-4 my-auto flex flex-col items-center justify-center">
            {/* Callout Card Left */}
            <div className="self-start px-3 py-2 rounded-xl bg-white/[0.07] border border-white/10 backdrop-blur-md shadow-md text-left max-w-[160px] animate-in fade-in">
              <div className="text-[11px] font-bold text-white flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b00]" />
                <span>N45 Magnets</span>
              </div>
              <div className="text-[9.5px] text-white/50 mt-0.5">
                Dual hidden flush snap locks
              </div>
            </div>

            {/* Central Box Render Graphic */}
            <div className="w-32 h-24 my-2 rounded-2xl border border-[#ff6b00]/40 bg-[#12141c] shadow-xl overflow-hidden relative group cursor-pointer">
              <img
                src="/images/box.jpg"
                alt="Box Structural Spec"
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-1.5 inset-x-0 text-center text-[9px] font-mono font-bold text-[#ff6b00] tracking-wider">
                CNC DIE READY
              </div>
            </div>

            {/* Callout Card Right */}
            <div className="self-end px-3 py-2 rounded-xl bg-white/[0.07] border border-white/10 backdrop-blur-md shadow-md text-right max-w-[160px] animate-in fade-in">
              <div className="text-[11px] font-bold text-white flex items-center justify-end gap-1">
                <span>Hot Foil Stamped</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              </div>
              <div className="text-[9.5px] text-white/50 mt-0.5">
                Heidelberg 24K gold foil
              </div>
            </div>
          </div>

          {/* Bottom Metric Pills (Matches Area / Time / Battery in reference) */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.06]">
            <div className="p-2 rounded-xl bg-white/[0.04] text-center border border-white/[0.06]">
              <div className="text-[9px] font-mono uppercase text-white/40">Area</div>
              <div className="text-[12px] font-bold text-white mt-0.5">
                {Math.round((liveSpec.length * liveSpec.width * 2 + liveSpec.length * liveSpec.height * 2 + liveSpec.width * liveSpec.height * 2) / 100)} cm²
              </div>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.04] text-center border border-white/[0.06]">
              <div className="text-[9px] font-mono uppercase text-white/40">Turnaround</div>
              <div className="text-[12px] font-bold text-[#ff6b00] mt-0.5">48 Hours</div>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.04] text-center border border-white/[0.06]">
              <div className="text-[9px] font-mono uppercase text-white/40">Unit Est.</div>
              <div className="text-[12px] font-bold text-white mt-0.5">Rs. 64.00</div>
            </div>
          </div>
        </div>

        {/* CARD 2: Interactive Customizer Controls (Matches Smart Lamp bottom-center widget) (md:col-span-4) */}
        <div className="md:col-span-4 rounded-[26px] bg-[#14161d]/90 border border-white/[0.08] p-4 sm:p-5 flex flex-col justify-between">
          {/* Header + Style Switcher Arrows */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <div className="text-[14px] font-bold text-white">Box Style &amp; Colors</div>
              <div className="text-[11px] text-white/50 font-mono">Customizable Finish</div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevStyle}
                className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white grid place-items-center transition"
                aria-label="Previous Box Style"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNextStyle}
                className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white grid place-items-center transition"
                aria-label="Next Box Style"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Colorway Swatches */}
          <div className="py-3">
            <div className="text-[10px] font-mono uppercase text-white/40 mb-2 flex items-center justify-between">
              <span>Colorway Swatches</span>
              <span className="text-white/80 font-bold">{selectedColor}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_SWATCHES.map((sw) => (
                <button
                  key={sw.name}
                  onClick={() => {
                    sfx.click();
                    setSelectedColor(sw.primary);
                    setAccentColor(sw.accent);
                    toast.info(`Applied ${sw.name}`);
                  }}
                  className={cn(
                    "w-7 h-7 rounded-full border transition-all relative flex items-center justify-center",
                    selectedColor === sw.primary
                      ? "ring-2 ring-[#ff6b00] scale-110 border-white"
                      : "border-white/20 hover:scale-105"
                  )}
                  style={{ backgroundColor: sw.primary }}
                  title={sw.name}
                >
                  {selectedColor === sw.primary && (
                    <Check className={cn("w-3.5 h-3.5", sw.primary === "#f8fafc" ? "text-black" : "text-white")} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Matte / Gloss Toggle */}
          <div className="py-2">
            <div className="grid grid-cols-2 p-1 rounded-xl bg-black/40 border border-white/10 text-[11px] font-semibold">
              <button
                onClick={() => {
                  sfx.click();
                  setFinishMode("matte");
                }}
                className={cn(
                  "py-1.5 rounded-lg transition",
                  finishMode === "matte" ? "bg-white text-black font-bold shadow-md" : "text-white/60 hover:text-white"
                )}
              >
                Soft-Touch Matte
              </button>
              <button
                onClick={() => {
                  sfx.click();
                  setFinishMode("gloss");
                }}
                className={cn(
                  "py-1.5 rounded-lg transition",
                  finishMode === "gloss" ? "bg-white text-black font-bold shadow-md" : "text-white/60 hover:text-white"
                )}
              >
                High-Gloss Spot UV
              </button>
            </div>
          </div>

          {/* Tactile Capsule Dimension / Scale Slider (Matches the Light Brightness slider in user image!) */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] mb-1.5 text-white/70">
              <span className="font-mono text-[10px] uppercase text-white/40">Scale / Dimensions</span>
              <span className="font-mono font-bold text-white">{lengthVal} mm ({lampIntensity}%)</span>
            </div>

            {/* Capsule Slider Track */}
            <div className="h-10 rounded-full bg-white/[0.08] border border-white/15 p-1 flex items-center gap-2 relative overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-white/[0.1] grid place-items-center text-white/80 shrink-0">
                <Ruler className="w-4 h-4 text-[#ff6b00]" />
              </div>
              <input
                type="range"
                min="100"
                max="400"
                value={lengthVal}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setLengthVal(val);
                  setLampIntensity(Math.round((val / 400) * 100));
                }}
                className="w-full accent-[#ff6b00] cursor-pointer"
              />
              <span className="text-[11px] font-mono font-bold text-white pr-2 shrink-0">
                {lampIntensity}%
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: Production Action Hub & Heidelberg Press (Matches Right-hand Speakers Card) (md:col-span-3) */}
        <div className="md:col-span-3 rounded-[26px] bg-[#14161d]/90 border border-white/[0.08] p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <div className="text-[14px] font-bold text-white">Press Status</div>
                <div className="text-[11px] text-white/50 font-mono">Faisalabad Line 1</div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff6b00] shadow-[0_0_8px_#ff6b00] animate-pulse" />
            </div>

            {/* Circular Gauge / Dial Indicator */}
            <div className="py-4 flex flex-col items-center justify-center text-center">
              <div className="relative w-20 h-20 rounded-full border-4 border-white/10 border-t-[#ff6b00] grid place-items-center">
                <div className="text-center">
                  <div className="text-[18px] font-extrabold text-white">99.8%</div>
                  <div className="text-[8px] font-mono text-white/40 uppercase">Precision</div>
                </div>
              </div>
              <div className="text-[11px] text-white/80 font-medium mt-2">
                Heidelberg Speedmaster
              </div>
              <div className="text-[9.5px] text-white/40 font-mono">
                Laser Cut ±0.05mm
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                sfx.success();
                openOrder(true);
              }}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-black font-bold text-[12px] transition flex items-center justify-center gap-2 shadow-lg shadow-white/10 hover:scale-[1.02] active:scale-[0.98]"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-black" />
              <span>Order Production Run</span>
            </button>

            <button
              onClick={handleDownloadDieline}
              className="w-full py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-medium text-[11.5px] transition flex items-center justify-center gap-2 hover:border-[#ff6b00]/40"
            >
              <Download className="w-3.5 h-3.5 text-[#ff6b00]" />
              <span>Download Dieline (PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
