"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Box,
  ArrowRight,
  TrendingDown,
  Layers,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Zap,
  ChevronRight,
  Cpu,
  Printer
} from "lucide-react";
import { sfx } from "@/lib/sound";

interface HeroShowcaseProps {
  onStartDesign?: () => void;
  onOpen3DViewer?: () => void;
  onOpenLogin?: () => void;
}

export function HeroShowcase({
  onStartDesign,
  onOpen3DViewer,
  onOpenLogin,
}: HeroShowcaseProps) {
  const [toggleOn, setToggleOn] = useState(true);
  const [selectedFinish, setSelectedFinish] = useState("Gold Foil");

  return (
    <section className="w-full py-12 sm:py-20 px-4 sm:px-8 max-w-6xl mx-auto flex flex-col items-center select-none">
      {/* Overline Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-white/80 uppercase tracking-wider mb-6"
      >
        <Box className="w-3.5 h-3.5 text-white" />
        Generative AI Packaging Engine · Faisalabad Press
      </motion.div>

      {/* Main Headline (Image 3 replica: "Connect. Learn. Earn") */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="text-[40px] sm:text-[68px] font-black tracking-tight text-center leading-[1.05] text-white"
      >
        Design. Prototype.{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/60">
          Manufacture.
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-[15px] sm:text-[18px] text-white/60 text-center max-w-2xl mt-5 leading-relaxed"
      >
        Transform custom packaging briefs into interactive 3D box models, structural dielines, and factory-direct print runs with zero delay.
      </motion.p>

      {/* 3 Floating Showcase Cards (Image 3 exact replica) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12 sm:mt-16">
        {/* Card 1: Production Metrics & Pricing with Sparkline Graph */}
        <motion.div
          whileHover={{ y: -6 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          onMouseEnter={sfx.hover}
          className="rounded-[30px] p-6 sm:p-7 bg-[#131418] border border-white/10 hover:border-white/30 transition-all shadow-2xl flex flex-col justify-between h-80 relative overflow-hidden"
        >
          <div>
            <span className="text-[11.5px] font-mono uppercase tracking-wider text-white/50">
              Estimated Unit Cost
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-[36px] sm:text-[44px] font-black text-white font-mono tracking-tight">
                Rs 45.00
              </span>
              <span className="text-[13px] text-white/40">/ box</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11.5px] text-white/90 font-medium mt-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Volume discount at 1,000+ units</span>
            </div>
          </div>

          {/* Smooth Vector Sparkline SVG Graph */}
          <div className="my-auto h-24 w-full flex items-end">
            <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 85 Q 50 80, 80 55 T 160 40 T 230 25 T 300 15"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <path
                d="M 0 85 Q 50 80, 80 55 T 160 40 T 230 25 T 300 15 L 300 100 L 0 100 Z"
                fill="url(#metricGrad)"
              />
              {/* Data points */}
              <circle cx="80" cy="55" r="4" fill="#ffffff" />
              <circle cx="230" cy="25" r="4" fill="#cbd5e1" />
              <circle cx="300" cy="15" r="5" fill="#ffffff" />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-white/40 pt-3 border-t border-white/5 font-mono">
            <span>Turnaround: 48h</span>
            <span>12M+ Sheets Printed</span>
          </div>
        </motion.div>

        {/* Card 2: Center Prototyper Card with Toggle & Finishes */}
        <motion.div
          whileHover={{ y: -8 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          onMouseEnter={sfx.hover}
          className="rounded-[32px] p-6 sm:p-7 bg-gradient-to-b from-[#181a20] to-[#121316] border border-white/15 hover:border-white/40 transition-all shadow-2xl flex flex-col justify-between h-80 relative overflow-hidden ring-2 ring-white/5"
        >
          {/* Header with Switch Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold text-white">
              Connect Finishes
            </span>

            {/* Interactive Toggle Switch (Image 3 replica) */}
            <button
              onClick={() => {
                sfx.toggle();
                setToggleOn(!toggleOn);
              }}
              className={`w-12 h-6.5 rounded-full p-0.5 flex items-center transition-colors ${
                toggleOn ? "bg-white justify-end" : "bg-white/20 justify-start"
              }`}
            >
              <motion.div
                layout
                className="w-5 h-5 rounded-full bg-black shadow-md"
              />
            </button>
          </div>

          {/* Floating Finish Badges (Gold Foil, Kraft, SBS Board, Matte UV) */}
          <div className="flex items-center justify-center gap-3 py-4 flex-wrap">
            {[
              { name: "Gold Foil", color: "#f59e0b" },
              { name: "Kraft Board", color: "#b45309" },
              { name: "Spot UV", color: "#8b5cf6" },
              { name: "Velvet Tray", color: "#10b981" },
            ].map((f) => (
              <button
                key={f.name}
                onClick={() => {
                  sfx.click();
                  setSelectedFinish(f.name);
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition flex items-center gap-1.5 ${
                  selectedFinish === f.name
                    ? "bg-white/15 border-white text-white shadow-md scale-105"
                    : "bg-white/5 border-white/5 text-white/60 hover:text-white"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: f.color }}
                />
                <span>{f.name}</span>
              </button>
            ))}
          </div>

          {/* Action Button */}
          <button
            onClick={() => {
              sfx.success();
              onOpen3DViewer?.();
            }}
            className="w-full py-3 rounded-2xl bg-white hover:bg-white/90 text-black font-bold text-[13px] flex items-center justify-center gap-2 transition shadow-xl"
          >
            <Box className="w-4 h-4" />
            <span>Launch 3D Turntable Studio</span>
          </button>
        </motion.div>

        {/* Card 3: Packaging Spec Advisory with Chat Bubbles */}
        <motion.div
          whileHover={{ y: -6 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          onMouseEnter={sfx.hover}
          className="rounded-[30px] p-6 sm:p-7 bg-[#131418] border border-white/10 hover:border-purple-500/40 transition-all shadow-2xl flex flex-col justify-between h-80 relative overflow-hidden"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-500/15 grid place-items-center text-purple-400">
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <span className="text-[13px] font-bold text-white">
                Packaging Spec Advisor
              </span>
            </div>

            {/* Interactive Speech Bubbles (Image 3 replica) */}
            <div className="space-y-2.5 my-2">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-[11.5px] text-white/80 rounded-tl-sm">
                "What board stock holds a 100ml perfume bottle?"
              </div>
              <div className="p-3 rounded-2xl bg-white/10 border border-white/15 text-[11.5px] text-white rounded-tr-sm ml-auto max-w-[90%]">
                "350 GSM SBS board with matte lamination & rigid shoulder insert."
              </div>
            </div>
          </div>

          {/* Bottom Link with Arrow */}
          <button
            onClick={() => {
              sfx.click();
              onStartDesign?.();
            }}
            className="flex items-center justify-between text-[11.5px] font-semibold text-white/80 hover:text-white pt-3 border-t border-white/5 group transition"
          >
            <span>Ask questions and make better decisions</span>
            <div className="w-7 h-7 rounded-full bg-white/10 group-hover:bg-white group-hover:text-black grid place-items-center transition">
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
