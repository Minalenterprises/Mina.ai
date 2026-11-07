"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Box,
  Sparkles,
  ArrowRight,
  Download,
  Apple,
  Laptop,
  Smartphone,
  Globe,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  FileCode2,
  Layers
} from "lucide-react";
import { toast } from "sonner";

export default function DownloadPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = (platform: string, filename: string) => {
    setDownloading(platform);
    toast.info(`Preparing Minal AI Packaging Studio ${platform} installer (${filename})...`);
    setTimeout(() => {
      setDownloading(null);
      toast.success(`Download started for ${filename}!`);
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0b] text-white selection:bg-[#a3e635] selection:text-black">
      {/* Top Navbar */}
      <header className="h-16 sm:h-20 px-4 sm:px-8 flex items-center justify-between border-b border-white/10 bg-[#0a0a0b]/80 backdrop-blur-xl sticky top-0 z-30">
        <Link href="/home" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#a3e635] to-[#65a30d] grid place-items-center text-black font-black text-[14px] shadow-lg shadow-[#a3e635]/20">
            M
          </div>
          <div>
            <span className="font-bold text-[16px] tracking-tight text-white">
              Minal<span className="text-[#a3e635]">.ai</span>
            </span>
            <span className="block text-[9px] font-mono text-white/40 uppercase tracking-widest">
              Desktop & Mobile
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4 text-[12px]">
          <Link
            href="/chat"
            className="text-white/70 hover:text-white transition"
          >
            Launch Web Studio
          </Link>
          <Link
            href="/about"
            className="text-white/70 hover:text-white transition hidden sm:inline"
          >
            About Factory
          </Link>
          <Link
            href="/login"
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white font-medium transition"
          >
            Client Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-8 pt-12 sm:pt-20 pb-12 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-[#bef264] uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5 text-[#a3e635]" />
          Minal Packaging Studio v5.2 (Latest Release)
        </div>

        <h1 className="text-[36px] sm:text-[56px] font-black tracking-tight leading-[1.08] text-white">
          Packaging Engineering on{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a3e635] via-[#bef264] to-white">
            Every Device
          </span>
        </h1>

        <p className="text-[15px] sm:text-[18px] text-white/70 max-w-2xl mx-auto mt-5 leading-relaxed">
          High-performance 3D packaging design, real-time procedural die-line calculation, and direct factory floor ordering right from your desktop and mobile workstation.
        </p>
      </section>

      {/* Download Platforms Grid */}
      <section className="px-4 sm:px-8 pb-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* macOS */}
          <div className="p-6 rounded-[28px] bg-[#121214] border border-white/10 hover:border-[#a3e635]/40 transition shadow-xl flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-[#a3e635]/15 grid place-items-center text-white group-hover:text-[#a3e635] transition mb-4">
                <Apple className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[18px] font-bold text-white">macOS</h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#a3e635]/15 text-[#bef264] border border-[#a3e635]/30">
                  Apple Silicon & Intel
                </span>
              </div>
              <p className="text-[12.5px] text-white/60 mt-2 leading-relaxed">
                Native Metal GPU-accelerated 3D viewport, offline CAD export to Adobe Illustrator (.ai) and AutoCAD (.dxf).
              </p>
              <div className="mt-4 space-y-1.5 text-[11.5px] text-white/40 font-mono">
                <div>• macOS 12.0 Monterey or later</div>
                <div>• Universal Binary (.dmg) · 94 MB</div>
              </div>
            </div>

            <button
              onClick={() => handleDownload("macOS", "Minal-Studio-v5.2-macOS.dmg")}
              disabled={downloading === "macOS"}
              className="mt-6 w-full py-3 rounded-xl bg-[#a3e635] hover:bg-[#bef264] text-black font-bold text-[13px] flex items-center justify-center gap-2 transition shadow-lg shadow-[#a3e635]/20"
            >
              <Download className="w-4 h-4" />
              <span>{downloading === "macOS" ? "Downloading..." : "Download for Mac"}</span>
            </button>
          </div>

          {/* Windows */}
          <div className="p-6 rounded-[28px] bg-[#121214] border border-white/10 hover:border-[#a3e635]/40 transition shadow-xl flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-blue-500/15 grid place-items-center text-white group-hover:text-blue-400 transition mb-4">
                <Laptop className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[18px] font-bold text-white">Windows</h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  Windows 10 / 11
                </span>
              </div>
              <p className="text-[12.5px] text-white/60 mt-2 leading-relaxed">
                DirectX 12 powered box turntable, batch PDF generation for thermal die-cut plates, and offline client review mode.
              </p>
              <div className="mt-4 space-y-1.5 text-[11.5px] text-white/40 font-mono">
                <div>• Windows 10/11 64-bit</div>
                <div>• Installer (.exe) · 108 MB</div>
              </div>
            </div>

            <button
              onClick={() => handleDownload("Windows", "Minal-Studio-v5.2-Setup.exe")}
              disabled={downloading === "Windows"}
              className="mt-6 w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[13px] border border-white/15 flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-[#a3e635]" />
              <span>{downloading === "Windows" ? "Downloading..." : "Download for Windows"}</span>
            </button>
          </div>

          {/* Mobile & Web App */}
          <div className="p-6 rounded-[28px] bg-[#121214] border border-white/10 hover:border-[#a3e635]/40 transition shadow-xl flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-purple-500/15 grid place-items-center text-white group-hover:text-purple-400 transition mb-4">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[18px] font-bold text-white">Mobile & PWA</h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  iOS · Android
                </span>
              </div>
              <p className="text-[12.5px] text-white/60 mt-2 leading-relaxed">
                Voice studio audio interface, photo upload for instant structural analysis, and live push notifications for factory order tracking.
              </p>
              <div className="mt-4 space-y-1.5 text-[11.5px] text-white/40 font-mono">
                <div>• iOS Safari / Chrome PWA install</div>
                <div>• Android WebAPK Available</div>
              </div>
            </div>

            <Link
              href="/chat"
              className="mt-6 w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[13px] border border-white/15 flex items-center justify-center gap-2 transition"
            >
              <Globe className="w-4 h-4 text-[#a3e635]" />
              <span>Launch in Browser</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Release Notes v5.2 */}
      <section className="px-4 sm:px-8 py-12 max-w-4xl mx-auto border-t border-white/10">
        <div className="flex items-center gap-2 text-[#a3e635] text-[11px] font-mono uppercase tracking-widest mb-3">
          <FileCode2 className="w-4 h-4" />
          Version 5.2 Release Notes
        </div>
        <h2 className="text-[24px] sm:text-[30px] font-black text-white tracking-tight mb-6">
          What&apos;s New in Minal Studio 5.2
        </h2>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-2 text-[14px] font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-[#a3e635]" />
              Nemotron 3 Ultra 550B Packaging Model Integration
            </div>
            <p className="text-[12.5px] text-white/60 mt-1 pl-6">
              Lightning-fast packaging reasoning and CAD dieline generation via OpenRouter API with zero latency.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-2 text-[14px] font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-[#a3e635]" />
              Direct Factory Floor Live Support Chat
            </div>
            <p className="text-[12.5px] text-white/60 mt-1 pl-6">
              Instant messaging channel connecting customers directly to Minal Enterprises&apos; production team in Faisalabad with live order tracking.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-2 text-[14px] font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-[#a3e635]" />
              Studio-Grade 3D Box Turntable with Contact Shadows & HDRI
            </div>
            <p className="text-[12.5px] text-white/60 mt-1 pl-6">
              Realistic physical rendering of metallic foils, matte coatings, and paper fiber textures using Three.js and Drei.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 px-6 text-center text-[11px] text-white/40 border-t border-white/5">
        © 2009–2026 Minal Enterprises (Pvt.) Ltd. · Shop 182-190 Jalvi Market, Faisalabad, Pakistan
      </footer>
    </div>
  );
}
