"use client";

import Link from "next/link";
import {
  Box,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Printer,
  Layers,
  Award,
  Cpu
} from "lucide-react";

export default function AboutPage() {
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
              By Minal Enterprises
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4 text-[12px]">
          <Link
            href="/chat"
            className="text-white/70 hover:text-white transition"
          >
            Chat Studio
          </Link>
          <Link
            href="/studio"
            className="text-white/70 hover:text-white transition hidden sm:inline"
          >
            3D Turntable
          </Link>
          <Link
            href="/download"
            className="text-white/70 hover:text-white transition hidden sm:inline"
          >
            Download App
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
      <section className="relative px-4 sm:px-8 pt-12 sm:pt-20 pb-16 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-[#bef264] uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5 text-[#a3e635]" />
          16+ Years In-House Printing & Packaging Mastery
        </div>

        <h1 className="text-[36px] sm:text-[56px] font-black tracking-tight leading-[1.08] text-white">
          Where Generative AI Meets{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a3e635] via-[#bef264] to-white">
            Artisanal Printing Presses
          </span>
        </h1>

        <p className="text-[15px] sm:text-[18px] text-white/70 max-w-2xl mx-auto mt-6 leading-relaxed">
          Founded in 2009 by brothers Shabbir Ahmad and M. Dastgeer, Minal Enterprises is Faisalabad&apos;s premier offset printing press and custom packaging house. Now powered by Minal AI to bring instant CAD and 3D dielines to brands worldwide.
        </p>

        {/* Action CTAs */}
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/chat"
            className="px-6 py-3 rounded-full bg-gradient-to-r from-[#a3e635] to-[#84cc16] hover:from-[#bef264] hover:to-[#a3e635] text-black font-bold text-[13.5px] shadow-xl shadow-[#a3e635]/25 flex items-center gap-2 transition hover:scale-105"
          >
            <span>Start Designing with AI</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://wa.me/923006601081?text=Hello%20Minal%20Enterprises,%20I%20am%20interested%20in%20custom%20packaging%20and%20printing%20services."
            target="_blank"
            rel="noreferrer"
            className="px-5 py-3 rounded-full bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] font-semibold text-[13.5px] flex items-center gap-2 transition"
          >
            <Phone className="w-4 h-4" />
            <span>WhatsApp: +92 300 660 1081</span>
          </a>
        </div>
      </section>

      {/* Verified Stats Row */}
      <section className="border-y border-white/10 bg-[#121214]/60 py-10 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-[32px] sm:text-[44px] font-black text-[#a3e635] font-mono">
              16+
            </div>
            <div className="text-[12px] uppercase tracking-wider text-white/50 font-semibold mt-1">
              Years at the Press
            </div>
          </div>
          <div>
            <div className="text-[32px] sm:text-[44px] font-black text-white font-mono">
              12M+
            </div>
            <div className="text-[12px] uppercase tracking-wider text-white/50 font-semibold mt-1">
              Sheets Through Machines
            </div>
          </div>
          <div>
            <div className="text-[32px] sm:text-[44px] font-black text-[#bef264] font-mono">
              180+
            </div>
            <div className="text-[12px] uppercase tracking-wider text-white/50 font-semibold mt-1">
              Brands Packaged
            </div>
          </div>
          <div>
            <div className="text-[32px] sm:text-[44px] font-black text-white font-mono">
              48h
            </div>
            <div className="text-[12px] uppercase tracking-wider text-white/50 font-semibold mt-1">
              Average Turnaround
            </div>
          </div>
        </div>
      </section>

      {/* In-House Production Capabilities */}
      <section className="px-4 sm:px-8 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-white/60 uppercase tracking-wider mb-2">
            Factory Floor Capabilities
          </div>
          <h2 className="text-[28px] sm:text-[38px] font-black tracking-tight text-white">
            Manufactured Entirely Under One Roof
          </h2>
          <p className="text-[14px] text-white/60 max-w-xl mx-auto mt-2">
            Every job runs through our own facility in Jalvi Market, Dhuddi Wala — plates, print, foil, die-cut, and finish — ensuring factory-direct pricing with zero third-party delay.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-3xl bg-[#121214] border border-white/10 hover:border-[#a3e635]/40 transition group">
            <div className="w-10 h-10 rounded-2xl bg-[#a3e635]/15 grid place-items-center text-[#a3e635] mb-4">
              <Box className="w-5 h-5" />
            </div>
            <h3 className="text-[16px] font-bold text-white mb-2 group-hover:text-[#bef264] transition">
              Rigid & Luxury Setup Boxes
            </h3>
            <p className="text-[12.5px] text-white/60 leading-relaxed">
              Handcrafted rigid board boxes for luxury perfumes, apparel, confectionery, and jewelry. Features magnetic closures, velvet trays, and hot foil debossing.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#121214] border border-white/10 hover:border-purple-500/40 transition group">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 grid place-items-center text-purple-400 mb-4">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="text-[16px] font-bold text-white mb-2 group-hover:text-purple-300 transition">
              High-Fidelity Offset Printing
            </h3>
            <p className="text-[12.5px] text-white/60 leading-relaxed">
              Industrial sheet-fed offset commercial printing for catalogues, corporate packaging, flyers, and brochures with exact CMYK + Pantone color matching.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#121214] border border-white/10 hover:border-emerald-500/40 transition group">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 grid place-items-center text-emerald-400 mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-[16px] font-bold text-white mb-2 group-hover:text-emerald-300 transition">
              Foil Stamping & Die-Cutting
            </h3>
            <p className="text-[12.5px] text-white/60 leading-relaxed">
              Metallic gold, rose gold, silver, and holographic hot foil stamping with precision automatic die-cutting lines for sharp, clean creases and corners.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#121214] border border-white/10 hover:border-amber-500/40 transition group">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 grid place-items-center text-amber-400 mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-[16px] font-bold text-white mb-2 group-hover:text-amber-300 transition">
              Royal Wedding Invitation Suites
            </h3>
            <p className="text-[12.5px] text-white/60 leading-relaxed">
              Letterpress and hot-foil stamped luxury wedding cards on imported cotton cardstocks with matching envelopes, acrylic inserts, and bespoke seals.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#121214] border border-white/10 hover:border-blue-500/40 transition group">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/15 grid place-items-center text-blue-400 mb-4">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-[16px] font-bold text-white mb-2 group-hover:text-blue-300 transition">
              Labels, Ribbons & Hang Tags
            </h3>
            <p className="text-[12.5px] text-white/60 leading-relaxed">
              Custom clothing hang tags, satin ribbons with metallic foil printing, and kiss-cut barcode stickers engineered for Pakistan&apos;s textile and retail giants.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#121214] border border-white/10 hover:border-rose-500/40 transition group">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 grid place-items-center text-rose-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-[16px] font-bold text-white mb-2 group-hover:text-rose-300 transition">
              Minal AI Generative Engine
            </h3>
            <p className="text-[12.5px] text-white/60 leading-relaxed">
              Our custom AI software converts prompts into live 3D box turntables, calculates manufacturing tolerances, and produces instant factory-grade dielines.
            </p>
          </div>
        </div>
      </section>

      {/* Official Contact & Studio Details */}
      <section className="px-4 sm:px-8 py-16 border-t border-white/10 bg-[#0d0d0f]">
        <div className="max-w-4xl mx-auto rounded-[32px] p-8 sm:p-12 bg-[#121214] border border-white/15 relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#a3e635]/15 blur-3xl rounded-full pointer-events-none" />

          <div className="flex items-center gap-2 text-[#a3e635] text-[11px] font-mono uppercase tracking-widest mb-3">
            <MapPin className="w-4 h-4" />
            Official Press & Factory Location
          </div>

          <h3 className="text-[26px] sm:text-[36px] font-black text-white tracking-tight">
            Minal Enterprises (Pvt.) Ltd.
          </h3>
          <p className="text-[14px] text-white/70 mt-2 max-w-xl">
            Visit our printing press floor in Faisalabad or contact our master artisans directly for custom samples, paper swatch books, and quotes.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/10 text-[13px]">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#a3e635] shrink-0 mt-0.5" />
                <span className="text-white/80">
                  Shop 182-190, Jalvi Market, Dhuddi Wala, Faisalabad 38000, Punjab, Pakistan
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#a3e635] shrink-0" />
                <a
                  href="tel:+923006601081"
                  className="text-white/90 hover:text-[#a3e635] font-mono transition"
                >
                  +92 300 660 1081
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#a3e635] shrink-0" />
                <a
                  href="mailto:info@minalenterprises.org"
                  className="text-white/90 hover:text-[#a3e635] font-mono transition"
                >
                  info@minalenterprises.org
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-[#a3e635] shrink-0" />
                <span className="text-white/80">
                  Monday – Saturday: 9:00 AM — 6:00 PM PKT
                </span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-[#a3e635] shrink-0" />
                <span className="text-white/80">
                  Official Website: minalenterprises.org
                </span>
              </div>
              <div className="pt-2">
                <a
                  href="https://minalenterprises.org"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#a3e635] hover:underline"
                >
                  Visit Corporate Web Portal →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-6 px-6 text-center text-[11px] text-white/40 border-t border-white/5">
        © 2009–2026 Minal Enterprises (Pvt.) Ltd. · Faisalabad, Pakistan. Powered by Minal AI Studio.
      </footer>
    </div>
  );
}
