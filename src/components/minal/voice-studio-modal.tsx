"use client";

import React, { useState, useEffect, useRef } from "react";
import { sfx } from "@/lib/sound";
import { Cpu, X, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { useMinal } from "@/lib/store";

interface VoiceStudioModalProps {
  open?: boolean;
  onClose?: () => void;
}

export function VoiceStudioModal({ open: controlledOpen, onClose }: VoiceStudioModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");

  const recognitionRef = useRef<any>(null);

  // Listen to global open-voice-studio event
  useEffect(() => {
    const handleOpen = () => {
      sfx.whoosh();
      setInternalOpen(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        sfx.pop();
        setInternalOpen((prev) => !prev);
      }
    };

    window.addEventListener("open-voice-studio", handleOpen);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("open-voice-studio", handleOpen);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleClose = () => {
    sfx.pop();
    if (isListening) stopListening();
    if (onClose) onClose();
    else setInternalOpen(false);
  };

  const startListening = () => {
    sfx.click();
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.info("Web Speech API not supported on this browser. Click a prompt chip below to simulate!");
      setIsListening(true);
      setTimeout(() => {
        handlePromptClick("Quote 500 rigid boxes with gold foil");
      }, 800);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setTranscript("Listening for packaging specifications...");
      };

      rec.onresult = (event: any) => {
        const text = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join("");
        setTranscript(text);
      };

      rec.onerror = (e: any) => {
        console.error("Speech rec error:", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
        if (transcript && transcript !== "Listening for packaging specifications...") {
          processVoiceCommand(transcript);
        }
      };

      rec.start();
      recognitionRef.current = rec;
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handlePromptClick = (promptText: string) => {
    sfx.click();
    setTranscript(promptText);
    processVoiceCommand(promptText);
  };

  const processVoiceCommand = (text: string) => {
    setIsSpeaking(true);
    let reply = "";

    if (text.toLowerCase().includes("quote") || text.toLowerCase().includes("500")) {
      reply =
        "For 500 rigid boxes with gold foil: 2mm greyboard core, matte laminated wrap, metallic gold hot stamping on lid. Unit cost is Rs 45. Production timeline 4-6 days at Minal Enterprises press.";
    } else if (text.toLowerCase().includes("perfume") || text.toLowerCase().includes("100ml")) {
      reply =
        "Standard 100ml cylindrical perfume bottle requires an interior footprint of 65 x 65 x 135 mm with a high-density EVA foam snug insert to absorb transit shock.";
    } else if (text.toLowerCase().includes("sbs") || text.toLowerCase().includes("kraft")) {
      reply =
        "Solid Bleached Sulfate (SBS) provides ultra-smooth, premium white clay surfaces ideal for vibrant CMYK and foil. Kraft board provides higher tear resistance and an earthy eco aesthetic.";
    } else {
      reply = `Packaging specification analyzed for "${text}". Configured 3D parametric CAD and die-line calculations.`;
    }

    setResponse(reply);

    // Synthesize audio
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(reply);
      utterance.pitch = 1.0;
      utterance.rate = 1.05;
      utterance.onend = () => {
        setIsSpeaking(false);
        sfx.chime();
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        setIsSpeaking(false);
        sfx.chime();
      }, 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200 font-sans">
      {/* Modal Container matching media_1789744356578.png */}
      <div className="relative w-full max-w-xl rounded-3xl bg-black/85 border border-white/15 shadow-2xl p-6 sm:p-8 flex flex-col items-center justify-between min-h-[560px] text-white backdrop-blur-2xl">
        
        {/* Top Header */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 text-white grid place-items-center shadow-md">
              <Cpu className="w-4 h-4 text-[#ff6b00]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wider uppercase">VOICE CAD STUDIO</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                  Smart Audio Engine
                </span>
              </div>
              <p className="text-[11px] text-white/50">Real-time Conversational Packaging Engineer</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            onMouseEnter={sfx.hover}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Glowing 3D Orb matching media_1789744356578.png */}
        <div className="relative my-auto flex flex-col items-center justify-center">
          {/* Outer Soundwave Rings */}
          <div className={`absolute w-64 h-64 rounded-full border border-white/10 transition-all duration-1000 ${
            isListening || isSpeaking ? "scale-125 opacity-60 animate-ping" : "scale-100 opacity-20"
          }`} />
          <div className="absolute w-52 h-52 rounded-full border border-dashed border-white/20 animate-spin [animation-duration:20s]" />
          <div className="absolute w-40 h-40 rounded-full border border-white/30" />

          {/* Central Pulsating Luminous 3D Orb */}
          <div className={`relative w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-900 via-blue-600 to-sky-300 shadow-[0_0_50px_rgba(56,189,248,0.4)] grid place-items-center transition-transform duration-500 border border-white/30 ${
            isListening || isSpeaking ? "scale-110 shadow-[0_0_70px_rgba(255,255,255,0.6)]" : "scale-100 animate-pulse"
          }`}>
            <div className="w-20 h-20 rounded-full bg-gradient-to-b from-white/50 to-transparent blur-[2px]" />
          </div>

          {/* Dynamic Status Indicator Pill */}
          <div className="mt-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-white backdrop-blur-md">
              <span className={`w-2 h-2 rounded-full ${isListening ? "bg-red-500 animate-ping" : isSpeaking ? "bg-white animate-ping" : "bg-white/40"}`} />
              <span>
                {isListening ? "Listening... (speak your box specs)" : isSpeaking ? "Artisan Speaking..." : "Tap microphone or press speak"}
              </span>
            </span>
          </div>

          {/* Transcript / Response Display */}
          {(transcript || response) && (
            <div className="mt-4 max-w-md text-center px-4">
              {transcript && (
                <p className="text-xs text-white/90 italic font-medium">&quot;{transcript}&quot;</p>
              )}
              {response && (
                <p className="text-xs text-white mt-2 bg-white/10 p-3 rounded-2xl border border-white/20 leading-relaxed backdrop-blur-md">
                  {response}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Prompt Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mb-6">
          <button
            onClick={() => handlePromptClick("Quote 500 rigid boxes with gold foil")}
            onMouseEnter={sfx.hover}
            className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 text-[11px] text-white/80 transition hover:border-white/40"
          >
            Quote 500 rigid boxes with gold foil
          </button>
          <button
            onClick={() => handlePromptClick("What size for 100ml perfume bottle?")}
            onMouseEnter={sfx.hover}
            className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 text-[11px] text-white/80 transition hover:border-white/40"
          >
            What size for 100ml perfume bottle?
          </button>
          <button
            onClick={() => handlePromptClick("Explain SBS Board vs Kraft")}
            onMouseEnter={sfx.hover}
            className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 text-[11px] text-white/80 transition hover:border-white/40"
          >
            Explain SBS Board vs Kraft
          </button>
        </div>

        {/* Main Microphone Button: Pure White Luxury */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={toggleMic}
            onMouseEnter={sfx.hover}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
              isListening
                ? "bg-red-500 text-white shadow-red-500/50 scale-110 animate-pulse"
                : "bg-white hover:bg-zinc-200 text-black shadow-white/20 hover:scale-105 active:scale-95"
            }`}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6 text-black" />}
          </button>

          <span className="text-[9.5px] font-mono tracking-widest text-white/40 uppercase">
            MINAL.AI · STUDIO AUDIO INTERFACE · CTRL+SHIFT+A
          </span>
        </div>
      </div>
    </div>
  );
}
