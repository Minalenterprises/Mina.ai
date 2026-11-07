"use client";

import React from "react";
import { Link, useRouter } from "@/lib/router";
import { sfx } from "@/lib/sound";
import {
  Box,
  ArrowRight,
  Printer,
  Layers,
  MapPin,
  Phone,
  Clock,
  Award,
  ArrowLeft,
  ExternalLink,
  MessageSquare
} from "lucide-react";

export function AboutView() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full studio-canvas text-white selection:bg-white selection:text-black font-sans relative select-none flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="h-16 px-4 sm:px-8 flex items-center justify-between border-b border-white/[0.08] flex-shrink-0">
        <button
          onClick={() => {
            sfx.click();
            router.push("/");
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[12px] text-white/70 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-white text-black grid place-items-center font-bold text-[11px]">
            M
          </div>
          <span className="font-bold text-[14px] tracking-tight text-white font-sans">
            MINAL<span className="text-white/40">.AI</span>
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              sfx.click();
              router.push("/chat");
            }}
            className="text-[12.5px] text-white/70 hover:text-white transition px-3 py-1.5"
          >
            Studio
          </button>
          <button
            onClick={() => {
              sfx.click();
              router.push("/login");
            }}
            className="px-4 py-1.5 rounded-full bg-white hover:bg-zinc-200 text-black text-[12px] font-semibold transition"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-8 py-10 sm:py-16 space-y-12">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-[11px] font-mono text-white/70 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>EST. 1995 · DHUDDI WALA, FAISALABAD</span>
          </div>

          <h1 className="text-[32px] sm:text-[46px] font-bold tracking-tight text-white leading-tight">
            Thirty Years of Industrial Press Craft Meets Generative CAD
          </h1>

          <p className="text-[14px] sm:text-[15px] text-white/60 mt-3 leading-relaxed">
            Minal Enterprises has manufactured bespoke rigid packaging, offset prints, and luxury boxes for Pakistan's premier brands since 1995. Now, with Minal.ai, we bridge factory-floor precision with instant AI 3D prototyping.
          </p>

          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => {
                sfx.click();
                router.push("/chat");
              }}
              className="px-6 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold text-[13px] transition flex items-center gap-2 shadow-lg shadow-white/10"
            >
              <Box className="w-4 h-4" />
              <span>Launch Studio</span>
            </button>
            <a
              href="https://wa.me/923006601081?text=Hello%20Minal%20Enterprises,%20I%20am%20interested%20in%20custom%20packaging%20consultation."
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white font-medium text-[13px] transition flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Press</span>
            </a>
          </div>
        </div>

        {/* 4 Minimal Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { value: "30+", label: "Years of Craft", sub: "Since 1995" },
            { value: "12M+", label: "Sheets Printed", sub: "Heidelberg Offset" },
            { value: "0.05 mm", label: "Die Tolerance", sub: "Laser-cut steel rules" },
            { value: "500+", label: "Luxury Brands", sub: "Apparel, Perfume, Gifts" },
          ].map((stat) => (
            <div key={stat.label} className="studio-card-minimal p-4 text-center">
              <div className="text-[26px] sm:text-[32px] font-black text-white tracking-tight font-mono">
                {stat.value}
              </div>
              <div className="text-[12px] font-medium text-white/80 mt-0.5">{stat.label}</div>
              <div className="text-[10px] text-white/40 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* 2 Showcase Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="studio-card-minimal p-6">
            <div className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/10 grid place-items-center mb-4">
              <Printer className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-[16px] font-bold text-white mb-2">Industrial Press Capabilities</h3>
            <p className="text-[12.5px] text-white/60 leading-relaxed">
              Operating genuine Heidelberg multi-color offset presses, automated die-cutters, hot-foil stamping units, and thermal lamination machines. We handle greyboard, kraft, virgin SBS board, and imported cotton stocks.
            </p>
          </div>

          <div className="studio-card-minimal p-6">
            <div className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/10 grid place-items-center mb-4">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-[16px] font-bold text-white mb-2">Workshop & Factory Floor</h3>
            <p className="text-[12.5px] text-white/60 leading-relaxed mb-3">
              Shop 182–190, Jalvi Market, Dhuddi Wala, Jaranwala Road, Faisalabad 38000, Punjab, Pakistan.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-white/40 font-mono">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> 9:00 AM – 8:00 PM (PKT)
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> +92 300 660 1081
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-4 px-4 sm:px-8 flex-shrink-0 text-center text-[11px] text-white/40 font-mono">
        <span>MINAL ENTERPRISES · BESPOKE PRINTING & PACKAGING · FAISALABAD, PAKISTAN</span>
      </footer>
    </div>
  );
}
