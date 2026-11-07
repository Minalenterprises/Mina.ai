"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Check, Mic, Box, ShieldCheck } from "lucide-react";
import { MinalLogo } from "./minal-logo";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            className="relative w-full max-w-4xl bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 z-10"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white grid place-items-center backdrop-blur-sm transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left Column: Minal Brand & Auth Form */}
            <div className="p-8 sm:p-10 flex flex-col justify-between bg-card text-foreground">
              <div>
                <div className="flex items-center justify-between">
                  <MinalLogo size={32} />
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5 font-semibold">
                    <Box className="w-3 h-3" /> #1 AI Packaging Studio
                  </span>
                </div>

                <div className="mt-8 space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans leading-tight">
                    Give your product packaging that closes deals
                  </h2>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    Deploy an AI packaging engineer in seconds. Generate parametric 3D boxes, custom die-lines, and industrial specs.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-7 space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground block mb-1.5">
                      Work Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="founder@brand.com"
                      required
                      className="w-full h-11 px-3.5 rounded-xl border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitted}
                    className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition shadow-lg shadow-primary/25"
                  >
                    {submitted ? (
                      <>
                        <Check className="w-4 h-4" /> Access Granted
                      </>
                    ) : (
                      <>
                        Start Designing Free <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="relative py-2 flex items-center justify-center">
                    <div className="w-full border-t border-border" />
                    <span className="absolute bg-card px-2 text-[10px] uppercase text-muted-foreground tracking-widest font-mono">
                      or
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onClose()}
                    className="w-full h-10 rounded-xl border border-border hover:bg-accent text-foreground text-[12px] font-medium flex items-center justify-center gap-2 transition"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Continue with Google
                  </button>
                </form>
              </div>

              <div className="mt-8 pt-4 border-t border-border">
                <p className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground text-center">
                  Trusted by 500+ Luxury & Retail Brands
                </p>
                <div className="mt-2.5 flex items-center justify-center gap-6 opacity-60 text-[11px] font-semibold tracking-wider text-muted-foreground">
                  <span>MINAL</span>
                  <span>EST. 1993</span>
                  <span>SBS BOARD</span>
                  <span>KRAFT</span>
                </div>
              </div>
            </div>

            {/* Right Column: Luxury Packaging Live Preview Card */}
            <div className="relative hidden md:flex flex-col justify-end p-8 overflow-hidden bg-[#0a0a0b] text-white">
              {/* Background Image with Vignette */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-40 scale-105 transition-transform duration-1000"
                style={{ backgroundImage: `url('/images/ribbon.jpg')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/60 to-transparent" />

              {/* Floating Glassmorphic Live Consultation Card */}
              <div className="relative z-10 p-5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 grid place-items-center">
                      <Box className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-white leading-tight">Minal Studio</div>
                      <div className="text-[9px] text-white/60">Live AI Packaging Spec</div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-[11px] text-white/90 space-y-1.5">
                  <div className="flex justify-between text-[10px] text-white/60 font-mono">
                    <span>Client: SweetBloom Co.</span>
                    <span>Spec: 6" × 4" × 2"</span>
                  </div>
                  <p className="font-sans text-[11.5px] leading-relaxed">
                    "Configuring 350gsm SBS Folding Carton with high-gloss Spot-UV and clear PET window."
                  </p>
                </div>

                {/* Voice / Audio Indicator */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-[10px] text-white/70">
                    <Mic className="w-3 h-3 text-primary animate-pulse" />
                    <span>Real-time Audio Assistant active</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-3 rounded-full bg-primary animate-pulse" />
                    <span className="w-1 h-5 rounded-full bg-primary animate-pulse delay-75" />
                    <span className="w-1 h-2 rounded-full bg-primary animate-pulse delay-150" />
                  </div>
                </div>
              </div>

              {/* Bottom Footer Info */}
              <div className="relative z-10 mt-6 text-center text-[11px] text-white/60">
                <span>Official manufacturing partner: </span>
                <a
                  href="https://minalenterprises.org"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-semibold"
                >
                  minalenterprises.org
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default LoginModal;
