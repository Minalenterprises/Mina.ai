"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Box,
  Sparkles,
  ArrowRight,
  Zap,
  Brain,
  Layers,
  Mic,
  Palette,
  Search,
  Check,
  Star,
  MessageSquare,
  LogIn,
  ExternalLink,
  ShieldCheck,
  Phone,
} from "lucide-react";
import { MinalLogo } from "@/components/minal/minal-logo";
import { LoginModal } from "@/components/minal/login-modal";
import { PromptBar } from "@/components/minal/prompt-bar";
import { Box3DViewer, type ViewAngle } from "@/components/minal/box-3d-viewer";
import { PixelCard } from "@/components/ui/pixel-card";
import { SuperAgent } from "@/components/minal/super-agent";
import { useMinal } from "@/lib/store";
import type { DesignSpec } from "@/lib/types";

interface SiteData {
  title: string;
  description: string;
  snippet: string;
  emails: string[];
  phones: string[];
  socials: string[];
}

export default function HomePage() {
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);
  const [siteData, setSiteData] = useState<SiteData | null>(null);

  const [previewAngle, setPreviewAngle] = useState<ViewAngle>("iso");
  const [previewSpec, setPreviewSpec] = useState<DesignSpec>({
    kind: "Rigid Box",
    title: "Minal Noir Gold Edition",
    width: 7,
    length: 5,
    height: 3,
    material: "SBS Board",
    finish: "foil",
    colors: ["#a3e635", "#121214"],
    brand: {
      companyName: "MINAL LUXE",
      tagline: "High Precision Packaging Studio",
      description: "Rigid SBS setup box with gold foil stamping and soft-touch finish.",
      ingredients: "350gsm SBS Paperboard · 24k Gold Foil · Anti-Scratch Film",
      weight: "180g",
      barcode: "8964000192837",
      website: "minalenterprises.org",
      email: "info@minalenterprises.org",
      phone: "+92 300 660 1081",
      social: ["@minal.packaging", "minalenterprises.org"],
      address: "Shop 182-190 Jalvi Market, Dhuddi Wala, Faisalabad",
      regulatory: "ISO 9001:2015 · FSC Certified Board",
    },
  });

  const newConversation = useMinal((s) => s.newConversation);

  const handlePromptSend = (text: string) => {
    newConversation();
    useMinal.getState().addMessage({
      role: "user",
      content: text,
    });
    router.push("/chat");
  };

  useEffect(() => {
    fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "minalenterprises.org" }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setSiteData({
            title: d.title || "Minal Enterprises",
            description: d.description || "",
            snippet: d.snippet || "",
            emails: d.emails || [],
            phones: d.phones || [],
            socials: d.socials || [],
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white selection:bg-[#a3e635] selection:text-black">
      {/* Global Floating Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 h-16 flex items-center justify-between px-4 sm:px-8 bg-[#0a0a0b]/85 backdrop-blur-xl border-b border-white/10 safe-top">
        <Link href="/" className="flex items-center gap-3">
          <MinalLogo size={34} />
          <span className="font-extrabold text-[17px] tracking-tight text-white flex items-center gap-1.5">
            Minal<span className="text-[#a3e635]">.ai</span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#a3e635]/15 text-[#bef264] border border-[#a3e635]/30 hidden sm:inline-block font-medium">
              EST. 2009
            </span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <NavLink href="/chat">AI Designer</NavLink>
          <NavLink href="/studio">3D Studio</NavLink>
          <NavLink href="/about">About Factory</NavLink>
          <NavLink href="/download">Download</NavLink>
          <NavLink href="/admin">Orders & Admin</NavLink>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-[12px] font-medium transition"
          >
            <LogIn className="w-3.5 h-3.5 text-[#a3e635]" />
            Sign In
          </Link>

          <Link
            href="/chat"
            className="flex items-center gap-1.5 px-4 h-9 rounded-xl bg-gradient-to-r from-[#a3e635] to-[#84cc16] hover:brightness-110 text-black text-[12px] font-bold shadow-lg shadow-[#a3e635]/25 transition active:scale-95"
          >
            Start Designing
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 sm:pt-40 pb-16 px-4 sm:px-6 overflow-hidden">
        {/* Subtle Ambient Brand Glows */}
        <div
          className="absolute -top-40 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #a3e635 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-60 -left-20 w-[450px] h-[450px] rounded-full pointer-events-none opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #10b981 0%, transparent 70%)" }}
        />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Overline Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-[#a3e635] animate-pulse" />
            <span className="text-[11px] uppercase tracking-[0.25em] font-mono font-bold text-white/70">
              MINAL ENTERPRISES · AI PACKAGING ENGINE
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[40px] sm:text-[66px] md:text-[80px] font-extrabold tracking-tight leading-[1.02] text-white"
          >
            THE LUXURY STANDARD IN
            <br />
            <span className="bg-gradient-to-r from-[#a3e635] via-[#bef264] to-[#10b981] bg-clip-text text-transparent">
              INTELLIGENT PACKAGING
            </span>
            <span className="block font-serif italic font-normal text-[32px] sm:text-[54px] text-[#e25822] mt-1">
              Crafted by Minal Enterprises
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[15px] sm:text-[17px] text-white/60 mt-6 max-w-2xl mx-auto leading-relaxed"
          >
            Generate parametric 3D setup boxes, high-precision vector die-lines, and real production
            manufacturing specs with instant WhatsApp quotes.
          </motion.p>

          {/* Direct Prompt Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 max-w-2xl mx-auto"
          >
            <PromptBar
              placeholder="Describe your box (e.g. 7x5x3 rigid perfume box in deep ink with gold foil)..."
              onSend={handlePromptSend}
              onDictate={() => {
                // Dispatches voice shortcut
                window.dispatchEvent(new KeyboardEvent("keydown", { ctrlKey: true, shiftKey: true, key: "A" }));
              }}
            />

            {/* Quick Suggestion Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px]">
              <span className="text-white/40 font-mono text-[10px] uppercase mr-1">Quick Presets:</span>
              {[
                "SBS Rigid Perfume Box with Gold Foil",
                "Mailer Carton 350gsm with Spot-UV",
                "Woven Grosgrain Ribbon Spec",
                "Botanical Artisan Debossed Box",
              ].map((p) => (
                <button
                  key={p}
                  onClick={() => handlePromptSend(p)}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#a3e635]/40 text-white/80 hover:text-[#bef264] transition"
                >
                  {p}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Interactive 3D Packaging Studio Preview */}
      <section className="py-12 px-4 sm:px-8 max-w-6xl mx-auto">
        <div className="rounded-3xl border border-white/10 bg-[#121214]/60 backdrop-blur-xl p-6 sm:p-10 relative overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#a3e635] font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] animate-ping" /> Real-time 3D Studio Engine
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                Studio-Grade Packaging CAD Renderer
              </h2>
              <p className="text-[13px] text-white/50">
                Interactive physical materials, metallic foil sheen, contact shadows, and parametric die-lines.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/studio"
                className="flex items-center gap-2 px-4 h-9 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-[12px] font-semibold transition"
              >
                <Palette className="w-3.5 h-3.5 text-[#a3e635]" />
                Launch Full Studio
              </Link>
              <Link
                href="/chat"
                className="flex items-center gap-1.5 px-4 h-9 rounded-xl bg-[#a3e635] hover:brightness-110 text-black text-[12px] font-bold transition shadow-lg shadow-[#a3e635]/20"
              >
                Order Spec
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 3D Canvas Viewport */}
          <div className="relative h-[380px] sm:h-[460px] w-full my-6 rounded-2xl bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,rgba(10,10,11,0.8)_80%)] border border-white/5 overflow-hidden">
            <Box3DViewer spec={previewSpec} angle={previewAngle} rotate={true} className="w-full h-full" />

            {/* Finish Selector Floating Overlay */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-1.5 p-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
              {(["foil", "gloss", "soft-touch", "spot-uv"] as const).map((finish) => (
                <button
                  key={finish}
                  onClick={() => setPreviewSpec((s) => ({ ...s, finish }))}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider transition ${
                    previewSpec.finish === finish
                      ? "bg-[#a3e635] text-black font-bold shadow"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {finish}
                </button>
              ))}
            </div>

            {/* Angle Selector Floating Overlay */}
            <div className="absolute bottom-4 right-4 flex gap-1 p-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
              {(["iso", "front", "side", "top"] as ViewAngle[]).map((ang) => (
                <button
                  key={ang}
                  onClick={() => setPreviewAngle(ang)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider transition ${
                    previewAngle === ang
                      ? "bg-white text-black font-bold"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {ang}
                </button>
              ))}
            </div>

            {/* Dimensions Pill */}
            <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-mono text-white/80">
              {previewSpec.width}" × {previewSpec.length}" × {previewSpec.height}" · 350gsm SBS Paperboard
            </div>
          </div>
        </div>
      </section>

      {/* Luxury Packaging Showcase with PixelCard */}
      <section className="py-16 px-4 sm:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#a3e635] font-bold">
            ARCHITECTURAL SHOWCASE
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-white mt-1.5">
            Bespoke Form & Precision Materials
          </h2>
          <p className="text-[14px] text-white/50 mt-2 max-w-xl mx-auto">
            Hover each packaging collection to experience our digital pixel inspection matrix.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: SBS Rigid Box */}
          <div className="relative group rounded-3xl overflow-hidden border border-white/10 bg-[#121214] shadow-xl">
            <PixelCard
              className="relative aspect-[4/5] w-full overflow-hidden"
              colors="#a3e635,#bef264,#10b981,#18181b"
              gap={10}
              speed={35}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url('/images/box.jpg')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/40 to-transparent" />
              <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#bef264] font-bold">
                  RIGID SETUP BOX
                </span>
                <h3 className="text-lg font-bold text-white mt-1">Noir 24k Gold Edition</h3>
                <p className="text-[12px] text-white/70 mt-1 leading-snug">
                  High-density greyboard wrapped in soft-touch stock with deep copper hot-stamping.
                </p>
                <Link
                  href="/studio"
                  className="mt-4 inline-flex items-center gap-2 text-[12px] font-bold text-[#a3e635] hover:underline"
                >
                  Configure in 3D Studio <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </PixelCard>
          </div>

          {/* Card 2: Custom Ribbons */}
          <div className="relative group rounded-3xl overflow-hidden border border-white/10 bg-[#121214] shadow-xl">
            <PixelCard
              className="relative aspect-[4/5] w-full overflow-hidden"
              colors="#e25822,#f97316,#a3e635,#18181b"
              gap={10}
              speed={35}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url('/images/ribbon.jpg')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/40 to-transparent" />
              <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#f97316] font-bold">
                  BRANDED RIBBONS
                </span>
                <h3 className="text-lg font-bold text-white mt-1">Woven Grosgrain & Silk</h3>
                <p className="text-[12px] text-white/70 mt-1 leading-snug">
                  Precision Pantone yarn-dyed ribbons with raised thermal foil script and heat-sealed edges.
                </p>
                <Link
                  href="/chat"
                  className="mt-4 inline-flex items-center gap-2 text-[12px] font-bold text-[#f97316] hover:underline"
                >
                  Request Ribbon Spec <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </PixelCard>
          </div>

          {/* Card 3: Artisan Botanical */}
          <div className="relative group rounded-3xl overflow-hidden border border-white/10 bg-[#121214] shadow-xl">
            <PixelCard
              className="relative aspect-[4/5] w-full overflow-hidden"
              colors="#10b981,#a3e635,#bef264,#18181b"
              gap={10}
              speed={35}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url('/images/artisan.jpg')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/40 to-transparent" />
              <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#10b981] font-bold">
                  ARTISAN BOTANICAL
                </span>
                <h3 className="text-lg font-bold text-white mt-1">Blind Embossed Paperboard</h3>
                <p className="text-[12px] text-white/70 mt-1 leading-snug">
                  Unbleached organic fibers with multi-level sculpted relief dies and soy vegetable inks.
                </p>
                <Link
                  href="/chat"
                  className="mt-4 inline-flex items-center gap-2 text-[12px] font-bold text-[#10b981] hover:underline"
                >
                  Generate Artisan Spec <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </PixelCard>
          </div>
        </div>
      </section>

      {/* Official Manufacturing Facility Credentials */}
      <section className="py-14 px-4 sm:px-8 max-w-6xl mx-auto border-t border-white/10">
        <div className="rounded-3xl bg-gradient-to-r from-white/[0.04] to-white/[0.01] border border-white/10 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#a3e635]/15 border border-[#a3e635]/30 text-[#bef264] text-[11px] font-mono font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> Official Manufacturing Facility
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Minal Enterprises · Faisalabad
            </h2>
            <p className="text-[13px] text-white/60 max-w-xl leading-relaxed">
              Industrial offset printing, precision die-cutting, luxury foil stamping, and folding carton manufacture.
              Operating since 1993 at Bhubbi Wala, Faisalabad.
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-[12px] text-white/80 font-mono">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#a3e635]" /> Heidelberg Speedmaster Presses</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#a3e635]" /> Laser Die Tooling</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#a3e635]" /> Pan-Pakistan & Export Logistics</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 w-full sm:w-auto">
            <a
              href={`https://wa.me/923000000000?text=${encodeURIComponent(
                "Hello Minal Enterprises, I would like to consult with your manufacturing team regarding custom luxury packaging."
              )}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 px-6 h-12 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold text-[13px] shadow-xl shadow-[#25D366]/20 transition"
            >
              <MessageSquare className="w-4 h-4" />
              Chat on WhatsApp Directly
            </a>
            <a
              href="https://minalenterprises.org"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 px-6 h-12 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium text-[13px] transition"
            >
              Visit minalenterprises.org <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* Floating Minimal Luxury Bottom Navigation Dock */}
      <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-[#121214]/90 border border-white/15 backdrop-blur-2xl shadow-2xl shadow-black/80 text-white"
        >
          <Link
            href="/"
            className="px-3 py-1.5 rounded-full bg-white/10 text-white text-[11px] font-bold flex items-center gap-1.5 transition"
          >
            <Box className="w-3.5 h-3.5 text-[#a3e635]" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <Link
            href="/studio"
            className="px-3 py-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition"
          >
            <Palette className="w-3.5 h-3.5 text-white/70" />
            <span className="hidden sm:inline">Studio 3D</span>
          </Link>
          <Link
            href="/chat"
            className="px-3 py-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition"
          >
            <Brain className="w-3.5 h-3.5 text-white/70" />
            <span className="hidden sm:inline">AI Chat</span>
          </Link>
          <button
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent("keydown", { ctrlKey: true, shiftKey: true, key: "A" }));
            }}
            className="px-3 py-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition"
          >
            <Mic className="w-3.5 h-3.5 text-[#a3e635]" />
            <span className="hidden sm:inline">Voice Agent</span>
          </button>
          <a
            href="https://wa.me/923000000000"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-full hover:bg-[#25D366]/20 text-[#25D366] text-[11px] font-medium flex items-center gap-1.5 transition"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
          <button
            onClick={() => setLoginOpen(true)}
            className="px-3 py-1.5 rounded-full bg-[#a3e635] text-black font-bold text-[11px] flex items-center gap-1.5 hover:brightness-110 transition shadow-md shadow-[#a3e635]/25"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login</span>
          </button>
        </motion.div>
      </div>

      {/* Modals & Agents */}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <SuperAgent />
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition">
      {children}
    </Link>
  );
}
