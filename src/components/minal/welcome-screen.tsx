"use client";

import { useMinal } from "@/lib/store";
import { useChat } from "@/lib/use-chat";
import { sfx } from "@/lib/sound";
import {
  Box,
  Cpu,
  ArrowRight,
  Zap,
  Eye,
  ShieldCheck,
} from "lucide-react";

const EXAMPLES = [
  {
    title: "Luxury Perfume Rigid Box",
    prompt:
      "Design a rigid setup box for a 100ml luxury perfume. Matte black board with gold hot foil stamping, shoulder & neck structure, and custom foam insert.",
    tag: "Rigid Box",
  },
  {
    title: "Gourmet Pizza Flute Carton",
    prompt:
      "Design a 12-inch corrugated pizza box for artisan pizzeria Napoli Fire. Natural kraft flute, grease-resistant coating, and thank-you print on the inner lid.",
    tag: "Corrugated",
  },
  {
    title: "Royal Wedding Invitation Suite",
    prompt:
      "Design a bespoke royal wedding invitation suite. Ivory cotton cardstock with embossed emerald floral borders and rose-gold metallic foil typography.",
    tag: "Invitation",
  },
  {
    title: "Apparel Drawer Box with Ribbon",
    prompt:
      "Make a slide-out drawer box with satin pull-ribbon for a luxury cashmere brand. 350 GSM duplex board with soft-touch velvet lamination.",
    tag: "Apparel",
  },
  {
    title: "Cosmetic Dropper Bottle Carton",
    prompt:
      "Design a reverse-tuck mono-carton for a 30ml facial serum bottle. Embossed holographic logo, barcode space, and ingredient panel.",
    tag: "Cosmetics",
  },
  {
    title: "Specialty Coffee Valve Pouch",
    prompt:
      "Create a 250g coffee bean pouch with one-way degassing valve. Recyclable matte kraft with high-barrier foil lining and resealable zip.",
    tag: "Flexible",
  },
];

export function WelcomeScreen() {
  const { send } = useChat();
  const openViewer = useMinal((s) => s.openViewer);

  const handlePromptClick = (text: string) => {
    sfx.click();
    send({ text });
  };

  return (
    <div className="flex-1 overflow-y-auto minal-scroll relative text-white">
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header Branding */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/10 border border-white/20 shadow-2xl mb-4 relative backdrop-blur-xl">
            <svg width="36" height="36" viewBox="0 0 25 25" fill="none">
              <circle cx="12.5" cy="12.5" r="12.5" fill="#14181a" />
              <path d="M12.5 0L25 12.5L12.5 25L0 12.5Z" fill="#737778" />
              <path d="M12.5 2.5L22.5 12.5L12.5 22.5L2.5 12.5Z" fill="#050606" />
              <path d="M12.5 5L20 12.5L12.5 20L5 12.5Z" fill="#0a0b0b" />
              <path d="M12.5 7L18 12.5L12.5 18L7 12.5Z" fill="#fafafa" />
              <path d="M12.5 9L16 12.5L12.5 16L9 12.5Z" fill="#050606" />
            </svg>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-black" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 mb-3 backdrop-blur-md">
            <Cpu className="w-3.5 h-3.5 text-[#ff6b00]" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-white/90">
              Minal AI · Industrial Packaging Studio v5.2
            </span>
          </div>

          <h1 className="text-[32px] sm:text-[46px] font-normal tracking-tight leading-[1.1] text-white">
            Transform Ideas Into{" "}
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/70">
              Manufacturable Packaging
            </span>
          </h1>

          <p className="text-[13.5px] sm:text-[15px] text-white/60 mt-3 max-w-xl mx-auto leading-relaxed">
            Connected to Faisalabad&apos;s premier offset printing press. Generates instant 3D prototypes, CAD dielines, and factory-ready production specifications.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              onClick={() => {
                sfx.click();
                openViewer();
              }}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center gap-2 shadow-lg shadow-white/10 transition active:scale-95"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Open 3D Turntable Studio</span>
            </button>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-xs text-white/80 backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span>Dhuddi Wala, Faisalabad · Since 1995</span>
            </div>
          </div>
        </div>

        {/* Suggestion Prompt Grid (Vantage Dark Glass) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-8">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => handlePromptClick(ex.prompt)}
              className="group text-left p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-white/25 transition backdrop-blur-xl flex flex-col justify-between min-h-[140px] shadow-sm hover:shadow-lg relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/15">
                    {ex.tag}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition" />
                </div>
                <h3 className="text-[13px] font-semibold text-white mb-1 leading-snug">
                  {ex.title}
                </h3>
                <p className="text-[11.5px] text-white/60 line-clamp-3 leading-relaxed">
                  {ex.prompt}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-white/40 group-hover:text-white transition">
                <Zap className="w-3 h-3" />
                <span>Click to generate specification</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
