"use client";

import { useState, useEffect } from "react";
import { useMinal } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Box, FileText, Zap, Wand2, Upload, Settings, X, ArrowRight } from "lucide-react";

const STEPS = [
  {
    icon: FileText,
    title: "Plan Mode",
    description: "Chat with the AI like a senior designer. It asks about your brand, product, and vibe — then proposes a structured plan you can edit and approve.",
    color: "#ffffff",
    mode: "plan" as const,
  },
  {
    icon: Zap,
    title: "Sketch Mode",
    description: "Need ideas fast? Sketch mode generates 3 distinct design variants instantly — different palettes, materials, and proportions. Pick one to refine.",
    color: "#8b5cf6",
    mode: "sketch" as const,
  },
  {
    icon: Wand2,
    title: "AI Mode",
    description: "After approving a plan, AI mode generates the full design — 3D preview, brand info on the back panel, generated SVG logo, and exportable specs.",
    color: "#10b981",
    mode: "ai" as const,
  },
  {
    icon: Upload,
    title: "Upload & Research",
    description: "Drop product photos or logos — the AI analyzes them and matches your palette. Paste a website URL and it auto-fetches brand info.",
    color: "#f59e0b",
  },
  {
    icon: Settings,
    title: "Connect Your AI",
    description: "Open Settings to pick from 6 cloud connectors (OpenRouter, OpenAI, Anthropic, Gemini, Mistral, Ollama). Add your API keys and choose models.",
    color: "#f43f5e",
  },
];

export function OnboardingGuide() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const conversations = useMinal((s) => s.conversations);
  const setMode = useMinal((s) => s.setMode);
  const openSettings = useMinal((s) => s.openSettings);

  // Show onboarding for first-time users (seen flag not set)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem("minal-onboarding-seen");
    if (!seen) {
      const t = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    setOpen(false);
    localStorage.setItem("minal-onboarding-seen", "1");
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      close();
    }
  };

  const skip = () => close();

  const current = STEPS[step];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] grid place-items-center p-4"
          style={{ background: "rgba(10, 10, 11, 0.6)", backdropFilter: "blur(8px)" }}
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[440px] rounded-3xl overflow-hidden glass-strong border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient header */}
            <div
              className="h-32 relative overflow-hidden flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${current.color}40 0%, ${current.color}15 50%, transparent 100%)`,
              }}
            >
              <div
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl"
                style={{ background: current.color, opacity: 0.4 }}
              />
              <button
                onClick={skip}
                className="absolute top-3 right-3 w-8 h-8 rounded-lg grid place-items-center hover:bg-black/20 transition z-10"
              >
                <X className="w-4 h-4" />
              </button>
              {/* Big icon */}
              <motion.div
                key={step}
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 18, stiffness: 200, delay: 0.1 }}
                className="absolute bottom-0 left-6 translate-y-1/2 w-16 h-16 rounded-2xl grid place-items-center shadow-xl"
                style={{ background: current.color }}
              >
                <current.icon className="w-7 h-7 text-white" strokeWidth={2.2} />
              </motion.div>
            </div>

            {/* Body */}
            <div className="p-6 pt-10">
              {/* Step indicator */}
              <div className="flex items-center gap-1.5 mb-4">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="h-1 rounded-full transition-all duration-300"
                    style={{
                      width: i === step ? 24 : 8,
                      background: i === step ? current.color : "rgba(255,255,255,0.15)",
                    }}
                  />
                ))}
                <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                  {step + 1} / {STEPS.length}
                </span>
              </div>

              <h2 className="text-[20px] font-bold tracking-tight">{current.title}</h2>
              <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
                {current.description}
              </p>

              {/* Actions */}
              <div className="flex items-center justify-between mt-6 gap-2">
                <button
                  onClick={skip}
                  className="px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition"
                >
                  Skip tour
                </button>
                <div className="flex items-center gap-2">
                  {step > 0 && (
                    <button
                      onClick={() => setStep(step - 1)}
                      className="px-3 py-2 rounded-lg border border-border bg-background hover:bg-accent text-[11px] font-semibold transition"
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (current.mode) setMode(current.mode);
                      if (step === 4) openSettings(true);
                      next();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg minal-btn-primary text-[11px] font-bold transition"
                  >
                    {step === STEPS.length - 1 ? (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        Get started
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
