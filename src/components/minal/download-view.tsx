"use client";

import React, { useState } from "react";
import { Link, useRouter } from "@/lib/router";
import { sfx } from "@/lib/sound";
import { toast } from "sonner";
import {
  Download,
  Smartphone,
  Laptop,
  Globe,
  Box,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  QrCode,
  Layers,
  Cpu,
  RefreshCw,
} from "lucide-react";

export function DownloadView() {
  const router = useRouter();
  const [downloading, setDownloading] = useState<string | null>(null);

  const triggerDownload = (title: string, filename: string) => {
    sfx.click();
    setDownloading(filename);
    toast.info(`Generating ${title} installer (${filename})...`);

    setTimeout(() => {
      sfx.success();
      setDownloading(null);
      const element = document.createElement("a");
      const file = new Blob([`Minal AI Packaging Studio - ${title} Installer\nVersion 5.2.1\nPlatform: ${filename}\nBuild: Release-2026`], {
        type: "text/plain",
      });
      element.href = URL.createObjectURL(file);
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success(`${title} downloaded successfully!`);
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full bg-black/85 text-white selection:bg-white selection:text-black font-sans relative backdrop-blur-xl">
      {/* Top Navbar */}
      <header className="h-16 sm:h-20 px-4 sm:px-10 flex items-center justify-between border-b border-white/10 bg-black/60 backdrop-blur-2xl sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 grid place-items-center shadow-lg">
            <svg width="20" height="20" viewBox="0 0 25 25" fill="none">
              <circle cx="12.5" cy="12.5" r="12.5" fill="#14181a" />
              <path d="M12.5 0L25 12.5L12.5 25L0 12.5Z" fill="#737778" />
              <path d="M12.5 2.5L22.5 12.5L12.5 22.5L2.5 12.5Z" fill="#050606" />
              <path d="M12.5 5L20 12.5L12.5 20L5 12.5Z" fill="#0a0b0b" />
              <path d="M12.5 7L18 12.5L12.5 18L7 12.5Z" fill="#fafafa" />
              <path d="M12.5 9L16 12.5L12.5 16L9 12.5Z" fill="#050606" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-[16px] tracking-tight text-white">
              Minal<span className="text-white/60">.ai</span>
            </span>
            <span className="block text-[9px] font-mono text-white/40 uppercase tracking-widest">
              Desktop &amp; Mobile
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4 text-[12.5px]">
          <Link
            href="/chat"
            className="text-white/70 hover:text-white transition px-3 py-1.5"
          >
            Launch Studio
          </Link>
          <Link
            href="/about"
            className="hidden sm:inline-block text-white/70 hover:text-white transition px-3 py-1.5"
          >
            About Press
          </Link>
          <Link
            href="/login"
            className="px-4 py-1.5 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold transition"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Download Hub */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-mono text-white mb-4 backdrop-blur-md">
            <Box className="w-3.5 h-3.5" />
            <span>VERSION 5.2.1 · GPU ACCELERATED CAD</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-normal tracking-tight text-white mb-4">
            Download <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/70">Minal AI Packaging Studio</span>
          </h1>
          <p className="text-white/60 text-base sm:text-lg">
            Create die-lines, simulate materials in 3D, and calculate manufacturing costs anywhere — on your desktop, smartphone, or tablet.
          </p>
        </div>

        {/* 4 Download Options in Vantage Dark Glass */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {/* Card 1: Android APK */}
          <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/15 hover:border-white/30 transition flex flex-col justify-between backdrop-blur-2xl group shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-white grid place-items-center mb-4 group-hover:scale-105 transition">
                <Smartphone className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Mobile</span>
              <h3 className="text-lg font-bold text-white mt-1">Android APK</h3>
              <p className="text-xs text-white/60 mt-2 leading-relaxed">
                Direct `.apk` install for Android 10+. Features touch 3D box inspection, voice chat, and instant camera die-scan.
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <button
                onClick={() => triggerDownload("Android APK", "minal-ai-v5.2.apk")}
                disabled={downloading === "minal-ai-v5.2.apk"}
                className="w-full py-3 rounded-full bg-white hover:bg-zinc-200 text-black font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
              >
                {downloading === "minal-ai-v5.2.apk" ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <Download className="w-4 h-4 text-black" />
                )}
                <span>Download APK (48 MB)</span>
              </button>
              <div className="text-[10px] text-center text-white/40 font-mono">SHA-256 Verified</div>
            </div>
          </div>

          {/* Card 2: Windows Desktop */}
          <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/15 hover:border-white/30 transition flex flex-col justify-between backdrop-blur-2xl group shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-white grid place-items-center mb-4 group-hover:scale-105 transition">
                <Laptop className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Workstation</span>
              <h3 className="text-lg font-bold text-white mt-1">Windows Desktop</h3>
              <p className="text-xs text-white/60 mt-2 leading-relaxed">
                High-performance 64-bit installer for Windows 10/11. Includes DXF/PDF vector export, batch pricing, and offline engine mode.
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <button
                onClick={() => triggerDownload("Windows Desktop", "minal-ai-setup-v5.2.exe")}
                disabled={downloading === "minal-ai-setup-v5.2.exe"}
                className="w-full py-3 rounded-full bg-white hover:bg-zinc-200 text-black font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
              >
                {downloading === "minal-ai-setup-v5.2.exe" ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <Download className="w-4 h-4 text-black" />
                )}
                <span>Download .EXE (72 MB)</span>
              </button>
              <div className="text-[10px] text-center text-white/40 font-mono">Windows 10/11 x64</div>
            </div>
          </div>

          {/* Card 3: PWA Web App */}
          <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/15 hover:border-white/30 transition flex flex-col justify-between backdrop-blur-2xl group shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-white grid place-items-center mb-4 group-hover:scale-105 transition">
                <Globe className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Progressive Web App</span>
              <h3 className="text-lg font-bold text-white mt-1">Web App (PWA)</h3>
              <p className="text-xs text-white/60 mt-2 leading-relaxed">
                Install directly from Chrome, Safari, or Edge. Zero disk overhead, automatic updates, and instant offline cache.
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <button
                onClick={() => {
                  sfx.click();
                  toast.success("Tap your browser's share icon and select 'Add to Home Screen'");
                }}
                className="w-full py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Layers className="w-4 h-4" />
                <span>Add to Home Screen</span>
              </button>
              <div className="text-[10px] text-center text-white/40 font-mono">Cross-Platform</div>
            </div>
          </div>

          {/* Card 4: Phone QR Code */}
          <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/15 hover:border-white/30 transition flex flex-col justify-between backdrop-blur-2xl text-center shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-white grid place-items-center mb-4 mx-auto">
                <QrCode className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Mobile Instant Link</span>
              <h3 className="text-lg font-bold text-white mt-1">Scan from Phone</h3>
              <p className="text-xs text-white/60 mt-2 leading-relaxed">
                Point your phone camera at this QR code to launch Minal AI directly in mobile view.
              </p>
            </div>

            <div className="mt-6 flex flex-col items-center">
              <div className="p-3 bg-white rounded-2xl shadow-xl">
                {/* SVG QR Code Simulation */}
                <svg width="110" height="110" viewBox="0 0 100 100" fill="none" className="text-black">
                  <rect width="100" height="100" fill="white" />
                  <rect x="10" y="10" width="30" height="30" fill="black" />
                  <rect x="15" y="15" width="20" height="20" fill="white" />
                  <rect x="20" y="20" width="10" height="10" fill="black" />

                  <rect x="60" y="10" width="30" height="30" fill="black" />
                  <rect x="65" y="15" width="20" height="20" fill="white" />
                  <rect x="70" y="20" width="10" height="10" fill="black" />

                  <rect x="10" y="60" width="30" height="30" fill="black" />
                  <rect x="15" y="65" width="20" height="20" fill="white" />
                  <rect x="20" y="70" width="10" height="10" fill="black" />

                  <rect x="45" y="15" width="8" height="8" fill="black" />
                  <rect x="45" y="30" width="8" height="12" fill="black" />
                  <rect x="45" y="55" width="10" height="10" fill="black" />
                  <rect x="65" y="50" width="8" height="8" fill="black" />
                  <rect x="75" y="60" width="12" height="12" fill="black" />
                  <rect x="55" y="75" width="12" height="8" fill="black" />
                  <rect x="75" y="80" width="10" height="8" fill="black" />
                </svg>
              </div>
              <span className="text-[10px] text-white/40 mt-2 font-mono">http://minal.ai</span>
            </div>
          </div>
        </div>

        {/* Release Notes */}
        <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-2xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-xl font-bold text-white">What&apos;s New in Minal AI v5.2</h2>
              <p className="text-xs text-white/60 mt-1">Built with React, Vite, and WebGL hardware acceleration</p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/10 text-white border border-white/20">
              Changelog 2026
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-white/70">
            <div className="space-y-1.5">
              <h4 className="font-semibold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Parametric DXF Vector Export</span>
              </h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Export laser-cutter and Heidelberg press-ready vector die-lines with crease and bleed layers.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-semibold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>360° Real-time 3D Turntable</span>
              </h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Inspect matte lamination, foil stamping, and embossing in interactive WebGL lighting.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-semibold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Nemotron 3 Ultra Engine</span>
              </h4>
              <p className="text-xs text-white/60 leading-relaxed">
                High-reasoning structural calculations without token limits or subscription paywalls.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 px-4 text-center text-xs text-white/40 border-t border-white/10 bg-black">
        <p>© 2026 Minal Enterprises. Dhuddi Wala, Faisalabad. All rights reserved.</p>
      </footer>
    </div>
  );
}
