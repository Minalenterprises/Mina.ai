"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const LOADING_STEPS = [
  "Analyzing packaging substrate & board caliper...",
  "Calculating CNC dieline creases & fold sequence...",
  "Assembling 3D parametric structural box...",
  "Calibrating Heidelberg 6-color offset registration...",
  "Applying hot foil stamp & soft-touch finish...",
];

export function BoxMakerLoader({ className }: { className?: string }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-6 sm:p-8 rounded-[28px] bg-[#0c0e14]/90 border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl text-white select-none max-w-sm sm:max-w-md mx-auto my-2",
        className
      )}
    >
      {/* 3D Isometric Folding Box Animation */}
      <div className="relative w-28 h-28 flex items-center justify-center mb-4 perspective-[800px]">
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-[#ff6b00]/15 rounded-full blur-2xl animate-pulse" />

        {/* 3D Box Assembly Container */}
        <div className="box-folding-stage relative w-16 h-16 transform-style-3d">
          {/* Base of box */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#1a1c24] to-[#12131a] border border-[#ff6b00]/60 shadow-[0_0_15px_rgba(255,107,0,0.25)] flex items-center justify-center transform rotate-x-[60deg] rotate-z-[45deg]">
            <span className="text-[9px] font-mono font-bold text-[#ff6b00]">MINAL</span>
          </div>

          {/* Left Flap Folding */}
          <div className="absolute -left-6 top-1 w-6 h-14 rounded-l-sm bg-gradient-to-r from-[#ff6b00]/20 to-[#222533] border-l border-y border-[#ff6b00]/70 origin-right animate-box-flap-left" />

          {/* Right Flap Folding */}
          <div className="absolute -right-6 top-1 w-6 h-14 rounded-r-sm bg-gradient-to-l from-[#ff6b00]/20 to-[#222533] border-r border-y border-[#ff6b00]/70 origin-left animate-box-flap-right" />

          {/* Top Flap Folding */}
          <div className="absolute -top-6 left-1 w-14 h-6 rounded-t-sm bg-gradient-to-b from-[#ff6b00]/20 to-[#222533] border-t border-x border-[#ff6b00]/70 origin-bottom animate-box-flap-top" />

          {/* Bottom Flap Folding */}
          <div className="absolute -bottom-6 left-1 w-14 h-6 rounded-b-sm bg-gradient-to-t from-[#ff6b00]/20 to-[#222533] border-b border-x border-[#ff6b00]/70 origin-top animate-box-flap-bottom" />
        </div>
      </div>

      {/* Progress & Status Ticker */}
      <div className="text-center space-y-2 max-w-[280px]">
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono font-bold text-[#ff6b00] tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b00] animate-ping" />
          <span>Making Structural Box</span>
        </div>

        <div className="h-6 flex items-center justify-center">
          <p className="text-[12.5px] text-white/80 font-medium tracking-tight animate-in fade-in slide-in-from-bottom-1 duration-300">
            {LOADING_STEPS[stepIndex]}
          </p>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-36 h-1 rounded-full bg-white/10 mx-auto overflow-hidden mt-1">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((stepIndex + 1) / LOADING_STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
