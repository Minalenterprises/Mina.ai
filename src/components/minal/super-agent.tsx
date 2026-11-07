"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Volume2, Square, Phone } from "lucide-react";
import { useMinal } from "@/lib/store";
import { useChat } from "@/lib/use-chat";
import { cn } from "@/lib/utils";

// Minimal type decls for Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

type VoiceState = "idle" | "listening" | "thinking" | "speaking";

interface SuperAgentProps {
  showFloatingButton?: boolean;
}

function AudioReactiveVisualizer({ state }: { state: VoiceState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (state === "listening") {
      navigator.mediaDevices?.getUserMedia({ audio: true }).then((stream) => {
        streamRef.current = stream;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyserRef.current = analyser;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
      }).catch(() => {});
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;
    let animId: number;

    const render = () => {
      time += 0.035;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      let volume = 0;
      if (state === "listening" && analyserRef.current) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        volume = sum / data.length / 255;
      } else if (state === "speaking") {
        volume = 0.4 + Math.sin(time * 6) * 0.25;
      } else if (state === "thinking") {
        volume = 0.25 + Math.sin(time * 9) * 0.12;
      } else {
        volume = 0.08 + Math.sin(time * 1.8) * 0.04;
      }

      const baseR = 64 + volume * 46;

      // Outer luminous glow aura
      const glowGrad = ctx.createRadialGradient(cx, cy, baseR * 0.3, cx, cy, baseR * 2.4);
      if (state === "thinking") {
        glowGrad.addColorStop(0, "rgba(168, 85, 247, 0.5)");
        glowGrad.addColorStop(0.5, "rgba(163, 230, 53, 0.25)");
        glowGrad.addColorStop(1, "rgba(10, 10, 11, 0)");
      } else {
        glowGrad.addColorStop(0, "rgba(163, 230, 53, 0.55)");
        glowGrad.addColorStop(0.45, "rgba(34, 197, 94, 0.3)");
        glowGrad.addColorStop(1, "rgba(10, 10, 11, 0)");
      }
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR * 2.4, 0, Math.PI * 2);
      ctx.fill();

      // Fluid orbital ripple rings
      for (let r = 1; r <= 4; r++) {
        const ringR = baseR + r * 20 + Math.sin(time * 2.2 + r) * 7 * (volume + 0.3);
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(163, 230, 53, ${Math.max(0.06, 0.45 - r * 0.1)})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }

      // Center High-Gloss 3D Sphere (Luxury Ice / Pearl)
      const sphereGrad = ctx.createRadialGradient(cx - 20, cy - 20, 6, cx, cy, baseR);
      sphereGrad.addColorStop(0, "#ffffff");
      sphereGrad.addColorStop(0.2, "#e0f2fe");
      sphereGrad.addColorStop(0.65, "#38bdf8");
      sphereGrad.addColorStop(1, "#0369a1");

      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
      ctx.fill();

      // Inner glass highlight
      ctx.beginPath();
      ctx.arc(cx - baseR * 0.35, cy - baseR * 0.35, baseR * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.fill();

      // Orbiting particles
      const numDots = 20;
      for (let i = 0; i < numDots; i++) {
        const angle = (i / numDots) * Math.PI * 2 + time * (state === "thinking" ? 2.4 : 1.1);
        const dist = baseR + 14 + Math.sin(angle * 3 + time * 3) * (10 + volume * 24);
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;
        ctx.beginPath();
        ctx.arc(x, y, 2.5 + volume * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#38bdf8";
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [state]);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={320}
      className="max-w-full h-auto select-none pointer-events-none"
    />
  );
}

export function SuperAgent({ showFloatingButton = false }: SuperAgentProps) {
  const [open, setOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  const recognitionRef = useRef<any>(null);
  const synthUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const handleSendRef = useRef<(prompt: string) => void>(() => {});

  const settings = useMinal((s) => s.settings);
  const activeConnector = settings.connectors[settings.activeConnector];
  const { isStreaming } = useChat();

  // Listen to open-voice-studio event triggered from InputBar or elsewhere
  useEffect(() => {
    const handleCustomOpen = () => setOpen(true);
    window.addEventListener("open-voice-studio", handleCustomOpen);
    return () => window.removeEventListener("open-voice-studio", handleCustomOpen);
  }, []);

  const speakText = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*_#`[\]()]/g, "").slice(0, 300);
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = 1.05;
    u.pitch = 1.0;
    u.onstart = () => setVoiceState("speaking");
    u.onend = () => setVoiceState("idle");
    u.onerror = () => setVoiceState("idle");
    synthUtteranceRef.current = u;
    window.speechSynthesis.speak(u);
  }, []);

  const handleSend = useCallback(
    async (textToSend: string) => {
      if (!textToSend.trim()) return;
      setVoiceState("thinking");

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content:
                  "You are Minal AI's Voice Packaging Engineer from Faisalabad, Pakistan. Answer questions concisely in 1-3 crisp spoken sentences focusing on box dimensions, materials (SBS, Duplex, Kraft), finishes (gold foil, spot UV, matte lamination), and manufacturing turnaround.",
              },
              { role: "user", content: textToSend },
            ],
            mode: "ai",
            temperature: 0.7,
            connector: "openrouter",
            model: activeConnector?.selectedModel ?? "nvidia/nemotron-3-ultra-550b-a55b:free",
            apiKey: activeConnector?.apiKey,
          }),
        });

        if (!res.ok || !res.body) {
          throw new Error("Chat request failed");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const evt = JSON.parse(line.slice(6));
              if (evt.type === "chunk") full += evt.chunk;
            } catch {}
          }
        }

        setAiResponse(full);
        speakText(full);
      } catch (err: any) {
        const fallback =
          "We manufacture rigid setup boxes, corrugated mailers, and luxury wedding cards at our press in Jalvi Market, Faisalabad. How many units do you need?";
        setAiResponse(fallback);
        speakText(fallback);
      }
    },
    [activeConnector, speakText]
  );

  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  const initRecognition = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onstart = () => {
      setVoiceState("listening");
      setTranscript("");
    };

    rec.onresult = (event: any) => {
      let current = "";
      for (let i = 0; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
    };

    rec.onend = () => {
      setTranscript((final) => {
        if (final.trim().length > 0) {
          handleSendRef.current(final.trim());
        } else {
          setVoiceState("idle");
        }
        return final;
      });
    };

    rec.onerror = () => {
      setVoiceState("idle");
    };

    return rec;
  }, []);

  const startListening = useCallback(() => {
    const rec = initRecognition();
    if (!rec) {
      alert("Voice speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    recognitionRef.current = rec;
    setTranscript("");
    setAiResponse("");
    try {
      rec.start();
    } catch {}
  }, [initRecognition]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setVoiceState("idle");
  }, []);

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceState("idle");
  }, []);

  return (
    <>
      {/* Optional Floating Button only if explicitly requested */}
      {showFloatingButton && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-white text-black shadow-2xl shadow-white/30 grid place-items-center hover:scale-110 transition-transform"
          aria-label="Voice Studio"
        >
          <Mic className="w-6 h-6 text-black" strokeWidth={2.4} />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full border-2 border-black minal-pulse-ring" />
        </button>
      )}

      {/* Voice Studio Dialog */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] grid place-items-center p-3 sm:p-6"
            style={{ background: "rgba(10, 10, 11, 0.94)", backdropFilter: "blur(24px)" }}
            onClick={() => {
              stopListening();
              stopSpeaking();
              setOpen(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="relative w-full max-w-2xl rounded-[32px] p-6 sm:p-8 bg-[#121214]/90 border border-white/15 shadow-2xl flex flex-col items-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top ambient luxury glow */}
              <div className="absolute -top-28 inset-x-0 h-56 bg-white/10 blur-3xl rounded-full pointer-events-none" />

              {/* Header */}
              <div className="w-full flex items-center justify-between relative z-10 mb-2 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 grid place-items-center">
                    <Volume2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-white flex items-center gap-2">
                      MINAL VOICE STUDIO
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/15 text-white border border-white/25">
                        Nemotron 3 Ultra
                      </span>
                    </h3>
                    <p className="text-[11px] text-white/50">
                      Real-time Conversational Packaging Engineer · Faisalabad Floor
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    stopListening();
                    stopSpeaking();
                    setOpen(false);
                  }}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white grid place-items-center transition"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Glowing Luminous Visualizer Orb */}
              <div className="relative my-2">
                <AudioReactiveVisualizer state={voiceState} />
              </div>

              {/* Status Badge (Mockup 1 & 4 style) */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/90 text-[12px] font-medium my-2 shadow-inner">
                <span
                  className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    voiceState === "listening"
                      ? "bg-white animate-ping"
                      : voiceState === "thinking"
                      ? "bg-purple-400 animate-pulse"
                      : voiceState === "speaking"
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-white/30"
                  )}
                />
                {voiceState === "idle" && "Tap microphone below to speak"}
                {voiceState === "listening" && "Listening to packaging requirements..."}
                {voiceState === "thinking" && "Nemotron computing structural tolerances..."}
                {voiceState === "speaking" && "Speaking..."}
              </div>

              {/* Quick Spoken Prompts */}
              <div className="w-full mt-2 mb-2 flex flex-wrap gap-1.5 justify-center">
                {[
                  "Quote 500 rigid boxes with gold foil",
                  "What board stock is best for 100ml perfume?",
                  "Explain SBS board vs Kraft",
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleSend(chip)}
                    className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-[11px] text-white/70 hover:text-white transition"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Transcript Bubbles */}
              {(transcript || aiResponse) && (
                <div className="w-full max-h-36 overflow-y-auto space-y-2 my-3 p-3.5 rounded-2xl bg-black/50 border border-white/10 text-[12px] minal-scroll">
                  {transcript && (
                    <div className="flex gap-2">
                      <span className="text-white font-bold shrink-0">You:</span>
                      <span className="text-white/85">{transcript}</span>
                    </div>
                  )}
                  {aiResponse && (
                    <div className="flex gap-2 pt-1 border-t border-white/10">
                      <span className="text-white font-bold shrink-0">Minal:</span>
                      <span className="text-white/95 leading-relaxed">{aiResponse}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Controls Bar (Mockup 1 style) */}
              <div className="flex items-center gap-4 mt-4">
                {voiceState === "listening" ? (
                  <button
                    onClick={stopListening}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 grid place-items-center hover:scale-105 active:scale-95 transition shadow-xl shadow-red-500/40"
                    title="Stop Listening"
                  >
                    <MicOff className="w-6 h-6 text-white" />
                  </button>
                ) : voiceState === "speaking" ? (
                  <button
                    onClick={stopSpeaking}
                    className="w-16 h-16 rounded-full bg-white hover:bg-white/90 text-black grid place-items-center hover:scale-105 active:scale-95 transition shadow-xl shadow-white/30"
                    title="Mute Speech"
                  >
                    <Volume2 className="w-6 h-6 text-black animate-pulse" />
                  </button>
                ) : (
                  <button
                    onClick={startListening}
                    disabled={isStreaming}
                    className="w-16 h-16 rounded-full bg-white hover:bg-white/90 text-black grid place-items-center hover:scale-105 active:scale-95 transition shadow-2xl shadow-white/30 disabled:opacity-50"
                    title="Start Voice Session"
                  >
                    <Mic className="w-7 h-7 text-black stroke-[2.4]" />
                  </button>
                )}
              </div>

              <p className="text-white/30 text-[10px] mt-4 uppercase tracking-widest font-mono">
                MINAL ENTERPRISES · JALVI MARKET, FAISALABAD · STUDIO AUDIO
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
