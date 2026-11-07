"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Cpu, Check } from "lucide-react";
import { useMinal } from "@/lib/store";
import { cn } from "@/lib/utils";
import { sfx } from "@/lib/sound";

interface ModelSheetProps {
  open: boolean;
  onClose: () => void;
}

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  tag: "FREE" | "PRO";
  desc: string;
  connectorId: "openrouter" | "openai" | "anthropic" | "gemini";
}

const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "openai/gpt-5-preview",
    name: "GPT-5",
    provider: "OpenAI",
    tag: "PRO",
    desc: "Next-generation multi-step packaging structural engineering.",
    connectorId: "openrouter",
  },
  {
    id: "openai/o3-mini",
    name: "O3 Reasoning",
    provider: "OpenAI",
    tag: "PRO",
    desc: "Complex mathematical tolerance calculations and substrate tests.",
    connectorId: "openrouter",
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    tag: "PRO",
    desc: "Nuanced packaging structural design and luxury brand copy.",
    connectorId: "openrouter",
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    tag: "PRO",
    desc: "Multimodal artwork QA and high-resolution logo analysis.",
    connectorId: "openrouter",
  },
  {
    id: "google/gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    tag: "FREE",
    desc: "Sub-second streaming for quick packaging questions.",
    connectorId: "openrouter",
  },
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b:free",
    name: "Nemotron 3 Ultra",
    provider: "NVIDIA",
    tag: "FREE",
    desc: "Default engine. Extreme reasoning for packaging specs & die-lines.",
    connectorId: "openrouter",
  },
];

export function ModelSheet({ open, onClose }: ModelSheetProps) {
  const settings = useMinal((s) => s.settings);
  const activeConnector = settings.connectors[settings.activeConnector];
  const selectedModelId =
    activeConnector?.selectedModel ?? "nvidia/nemotron-3-ultra-550b-a55b:free";
  const setConnectorModel = useMinal((s) => s.setConnectorModel);
  const setActiveConnector = useMinal((s) => s.setActiveConnector);

  const [smartMode, setSmartMode] = useState(true);

  const handleSelect = (model: ModelOption) => {
    sfx.click();
    setActiveConnector(model.connectorId);
    setConnectorModel(model.connectorId, model.id);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              sfx.pop();
              onClose();
            }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
          />

          {/* Bottom Sheet Drawer matching mockup */}
          <motion.div
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-hidden rounded-t-[32px] border-t border-white/15 bg-black/90 text-white shadow-2xl flex flex-col max-w-xl mx-auto backdrop-blur-2xl"
          >
            {/* Drag handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h3 className="text-[17px] font-semibold tracking-tight text-white">
                  Chat Model
                </h3>
                <p className="text-[12px] text-white/50">
                  Pick a model to chat with
                </p>
              </div>
              <button
                onClick={() => {
                  sfx.pop();
                  onClose();
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white grid place-items-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 minal-scroll">
              {/* Smart Mode Highlight Card (Exact replica of media_1789744356578.png) */}
              <div
                onClick={() => {
                  sfx.toggle();
                  setSmartMode(!smartMode);
                }}
                className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-blue-600/30 via-indigo-600/20 to-purple-600/20 border border-white/20 shadow-xl cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 grid place-items-center text-white shadow-md">
                      <Cpu className="w-5 h-5 text-[#ff6b00]" />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-white flex items-center gap-2">
                        Smart Mode
                      </div>
                      <p className="text-[11px] text-white/70">
                        Dynamically selects the optimal model for speed and quality
                      </p>
                    </div>
                  </div>

                  {/* iOS Style Toggle */}
                  <div
                    className={cn(
                      "w-11 h-6 rounded-full p-0.5 flex items-center transition-colors",
                      smartMode ? "bg-white justify-end" : "bg-white/20 justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full shadow-md transition-colors",
                        smartMode ? "bg-black" : "bg-white"
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Models List */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-mono uppercase tracking-wider text-white/40 px-1">
                  Available Engines
                </div>

                {AVAILABLE_MODELS.map((m) => {
                  const isSelected = selectedModelId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelect(m)}
                      className={cn(
                        "w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 group",
                        isSelected
                          ? "bg-white/15 border-white/30 shadow-lg"
                          : "bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:border-white/20"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl grid place-items-center transition-colors flex-shrink-0",
                            isSelected
                              ? "bg-white text-black"
                              : "bg-white/10 text-white group-hover:bg-white/20"
                          )}
                        >
                          <Cpu className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13.5px] font-semibold text-white truncate">
                              {m.name}
                            </span>
                            <span className="text-[10px] font-mono text-white/40">
                              {m.provider}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/50 truncate">
                            {m.desc}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={cn(
                            "text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full border",
                            m.tag === "FREE"
                              ? "bg-white/10 text-white/90 border-white/20"
                              : "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border-white/25"
                          )}
                        >
                          {m.tag}
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-white text-black grid place-items-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-black/50 flex items-center justify-between text-[11px] text-white/50">
              <span>Universal Model Harness</span>
              <span className="text-white/80">Direct Factory Floor Integration</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
