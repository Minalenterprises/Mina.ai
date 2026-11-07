"use client";

import Link from "next/link";
import { Box, Check, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Explore the AI designer",
    features: ["50 messages / month", "Plan + Sketch modes", "3D viewer", "PDF export", "1 connector"],
    cta: "Start free",
    href: "/chat",
    accent: "#a3e635",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/ month",
    desc: "For active designers",
    features: ["Unlimited messages", "All 4 modes incl. Voice Agent", "Studio mode", "HTML+3D export", "All 6 connectors", "Web research", "Order management"],
    cta: "Get Pro",
    href: "/chat",
    accent: "#65a30d",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For teams & manufacturers",
    features: ["Everything in Pro", "Custom AI connectors", "Team collaboration", "Admin dashboard", "API access", "Priority support", "White-label option"],
    cta: "Contact us",
    href: "https://minalenterprises.org",
    accent: "#1c1c1e",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="h-16 flex items-center px-4 sm:px-6 glass border-b border-border sticky top-0 z-50 safe-top">
        <Link href="/home" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#a3e635] to-[#65a30d] grid place-items-center">
            <Box className="w-5 h-5 text-black" strokeWidth={2.4} />
          </div>
          <span className="font-bold text-[16px]">Minal<span className="text-[#65a30d]">.ai</span></span>
        </Link>
        <Link href="/chat" className="ml-auto flex items-center gap-1.5 px-4 h-9 rounded-lg minal-btn-primary text-[12px] font-bold">
          Get started <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </nav>

      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-border mb-4"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#65a30d]" />
              <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Pricing</span>
            </motion.div>
            <h1 className="text-[36px] sm:text-[52px] font-bold tracking-tight">Simple, transparent pricing</h1>
            <p className="text-[15px] text-muted-foreground mt-4 max-w-xl mx-auto">
              Start free. Upgrade when you need more. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative minal-card rounded-3xl p-6 ${p.popular ? "ring-2 ring-[#a3e635] ring-offset-2 ring-offset-background" : ""}`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#a3e635] text-black text-[10px] font-bold uppercase tracking-wider">
                    Most popular
                  </div>
                )}
                <div className="text-[14px] font-bold mb-1">{p.name}</div>
                <div className="text-[12px] text-muted-foreground mb-4">{p.desc}</div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-[36px] font-bold">{p.price}</span>
                  <span className="text-[12px] text-muted-foreground">{p.period}</span>
                </div>
                <Link
                  href={p.href}
                  className={`flex items-center justify-center gap-1.5 w-full h-10 rounded-xl text-[12px] font-bold transition mb-6 ${
                    p.popular ? "minal-btn-primary" : "border border-border hover:bg-accent"
                  }`}
                >
                  {p.cta} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <div className="space-y-2.5">
                  {p.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-[12px]">
                      <div className="w-4 h-4 rounded-full grid place-items-center" style={{ background: `${p.accent}20` }}>
                        <Check className="w-2.5 h-2.5" style={{ color: p.accent }} strokeWidth={3} />
                      </div>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
