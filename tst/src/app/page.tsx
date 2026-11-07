import Link from "next/link";
import { ArrowDown, ArrowUpRight, MessageCircle, PenTool, Package, Truck } from "lucide-react";
import Nav from "@/components/Nav";
import SmoothScroll from "@/components/home/SmoothScroll";
import FlightCanvas from "@/components/home/FlightCanvas";
import { Reveal, FadeUp } from "@/components/home/Reveal";

const STEPS = [
  { n: "01", icon: MessageCircle, title: "Tell the chat", body: "Describe your product like you'd text a friend. Minal asks the right questions — product, brand, colors, vibe, quantity." },
  { n: "02", icon: PenTool, title: "Tweak the plan", body: "Get an editable design plan right in the chat. Change colors, box style, finish — the 3D preview repaints live." },
  { n: "03", icon: Package, title: "Approve & unfold", body: "Spin your box in 3D, open the 2D dieline, fold and unfold it. When it feels right — approve and send it to print." },
];

const STYLE_ROWS = [
  { name: "Minimal", hint: "Air, type, one rule", dot: "#141412" },
  { name: "Luxury", hint: "Dark, letterspaced, gold", dot: "#C9A227" },
  { name: "Playful", hint: "Shapes with energy", dot: "#F2A0C4" },
  { name: "Bold", hint: "Type that bleeds off", dot: "#E23B2E" },
  { name: "Eco Kraft", hint: "Raw board, honest ink", dot: "#C7A87B" },
];

export default function Home() {
  return (
    <SmoothScroll>
      <main className="relative">
        <FlightCanvas />
        <Nav />

        {/* ————— HERO ————— */}
        <section className="relative z-[2] min-h-[100svh] flex flex-col justify-between px-5 md:px-10 pt-28 md:pt-32 pb-8 max-w-[1400px] mx-auto">
          <div className="max-w-[900px]">
            <FadeUp>
              <p className="font-mono-label text-ink/60 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-lime inline-block pulse-dot" />
                AI packaging designer — for sellers
              </p>
            </FadeUp>
            <h1 className="text-[13.5vw] md:text-[8.2rem] leading-[0.94] font-bold tracking-[-0.03em]">
              <Reveal text="CHAT IT." delay={100} />
              <Reveal text="FOLD IT." delay={260} />
              <span className="relative inline-block">
                <Reveal text="SHIP IT" delay={420} className="text-stroke-ink" />
                <span className="text-lime">.</span>
              </span>
            </h1>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <FadeUp delay={200} className="max-w-md">
              <p className="text-lg md:text-xl text-ink/70 leading-snug">
                Minal turns one conversation into a production-ready box — artwork, dieline, live 3D preview and doorstep delivery.
              </p>
              <div className="flex gap-3 mt-6">
                <Link href="/chat" className="btn btn-ink">Design my box</Link>
                <a href="#how" className="btn btn-line">How it works</a>
              </div>
            </FadeUp>
            <FadeUp delay={350} className="font-mono-label text-ink/50 flex items-center gap-2">
              Scroll — the box comes with you
              <ArrowDown size={14} className="animate-bounce" />
            </FadeUp>
          </div>
        </section>

        {/* ————— MARQUEE ————— */}
        <div className="relative z-[2] bg-lime border-y hairline border-ink/10 py-3 overflow-hidden">
          <div className="marquee-track font-mono-label !text-[12px] text-ink">
            {[0, 1].map((k) => (
              <div key={k} className="flex items-center gap-8 pr-8">
                {["Chat", "2D dieline", "3D preview", "Fold & unfold", "Print", "Ship", "Reorder"].map((w) => (
                  <span key={w} className="flex items-center gap-8">
                    {w} <span className="text-ink/40">✳</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ————— HOW ————— */}
        <section id="how" className="relative z-[2] px-5 md:px-10 py-28 md:py-40 max-w-[1400px] mx-auto">
          <p className="font-mono-label text-ink/50 mb-10">( How it works )</p>
          <h2 className="text-5xl md:text-7xl font-bold tracking-[-0.03em] leading-[1.02] max-w-3xl mb-20">
            <Reveal text="Three messages" /> <Reveal text="to a real box." delay={150} />
          </h2>
          <div className="border-t hairline">
            {STEPS.map((s, i) => (
              <FadeUp key={s.n} delay={i * 120}>
                <div className="group grid grid-cols-1 md:grid-cols-[110px_1fr_1.2fr_48px] gap-4 md:gap-10 items-baseline py-9 border-b hairline hover:bg-ink hover:text-paper transition-colors duration-500 px-2 md:px-6 -mx-2 md:-mx-6 cursor-default">
                  <span className="font-mono-label text-ink/40 group-hover:text-lime transition-colors">/{s.n}</span>
                  <h3 className="text-3xl md:text-4xl font-bold tracking-tight">{s.title}</h3>
                  <p className="text-ink/60 group-hover:text-paper/70 leading-relaxed max-w-md transition-colors">{s.body}</p>
                  <s.icon size={20} className="hidden md:block text-ink/30 group-hover:text-lime group-hover:-rotate-12 transition-all" />
                </div>
              </FadeUp>
            ))}
          </div>
        </section>

        {/* ————— STYLES ————— */}
        <section className="relative z-[2] px-5 md:px-10 pb-28 md:pb-40 max-w-[1400px] mx-auto">
          <div className="flex items-end justify-between mb-10">
            <p className="font-mono-label text-ink/50">( Pick a vibe )</p>
            <p className="font-mono-label text-ink/50 hidden md:block">or let the AI pick from your logo</p>
          </div>
          <div className="border-t hairline">
            {STYLE_ROWS.map((s, i) => (
              <FadeUp key={s.name} delay={i * 80}>
                <Link href="/chat" className="group flex items-center justify-between py-6 md:py-7 border-b hairline px-2 md:px-6 -mx-2 md:-mx-6 hover:bg-lime transition-colors duration-400">
                  <div className="flex items-center gap-5 md:gap-8">
                    <span className="w-3 h-3 rounded-full border border-ink/30" style={{ background: s.dot }} />
                    <span className="text-3xl md:text-5xl font-bold tracking-[-0.02em]">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-mono-label text-ink/45 hidden sm:block">{s.hint}</span>
                    <ArrowUpRight size={22} className="text-ink/30 group-hover:text-ink group-hover:rotate-45 transition-all duration-400" />
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>
        </section>

        {/* ————— LANDING / CTA ————— */}
        <section className="relative z-[2] bg-ink text-paper min-h-[100svh] flex flex-col items-center justify-between px-5 pt-28 pb-12 text-center">
          <p className="font-mono-label text-lime">( The box lands here )</p>
          <div className="mt-[38vh]">
            <h2 className="text-[13vw] md:text-[7.5rem] font-bold tracking-[-0.03em] leading-[0.95]">
              <span className="text-paper">LET'S </span>
              <span className="text-stroke">BOX</span>
              <span className="text-lime"> IT.</span>
            </h2>
            <p className="text-paper/60 max-w-md mx-auto mt-6 text-lg">
              Free to design. You only pay when you print — boxes delivered anywhere in Pakistan.
            </p>
            <Link href="/chat" className="btn btn-lime mt-8 !px-9 !py-4">
              Open the design chat <ArrowUpRight size={14} />
            </Link>
          </div>
          <footer className="w-full flex flex-col md:flex-row items-center justify-between gap-4 pt-10 border-t border-white/10 font-mono-label text-paper/40 mt-12">
            <span>© 2026 minal.ai</span>
            <span className="flex items-center gap-2"><Truck size={13} /> Karachi · Lahore · Islamabad</span>
            <Link href="/admin" className="hover:text-lime transition-colors">Studio admin</Link>
          </footer>
        </section>
      </main>
    </SmoothScroll>
  );
}
