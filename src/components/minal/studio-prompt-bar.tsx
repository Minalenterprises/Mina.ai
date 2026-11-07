"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  Plus,
  Mic,
  Volume2,
  VolumeX,
  Share2,
  Maximize2,
  Ratio,
  ChevronDown,
  Flame,
  Check,
  Paperclip,
  ArrowUp,
  Square,
  Cpu
} from "lucide-react";
import { sfx, isMuted, toggleMuted } from "@/lib/sound";
import { useMinal, fileToAttachment } from "@/lib/store";
import { useChat } from "@/lib/use-chat";
import type { Attachment } from "@/lib/types";
import { AttachmentPreviewStrip } from "./attachment-preview-strip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StudioPromptBarProps {
  onOpenVoice?: () => void;
  onOpen3DViewer?: () => void;
  className?: string;
  placeholder?: string;
}

const MODELS = [
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", name: "Nemotron 3 Ultra", tag: "Fast / Free", provider: "NVIDIA" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", tag: "CAD Pro", provider: "Anthropic" },
  { id: "openai/gpt-4o", name: "GPT-4o Omni", tag: "Vision", provider: "OpenAI" },
  { id: "google/gemini-pro-1.5", name: "Gemini 1.5 Pro", tag: "Context", provider: "Google" },
];

export function StudioPromptBar({
  onOpenVoice,
  onOpen3DViewer,
  className = "",
  placeholder = "Ask Vantage about packaging specs, 3D die-lines, cost estimation...",
}: StudioPromptBarProps) {
  const [draft, setDraft] = useState("");
  const [modelOpen, setModelOpen] = useState(false);
  const [chatTypeOpen, setChatTypeOpen] = useState(false);
  const [chatType, setChatType] = useState<"New AI chat" | "Box CAD Session" | "Thermal Label Spec">("New AI chat");
  const [isTempChat, setIsTempChat] = useState(false);
  const [soundActive, setSoundActive] = useState(!isMuted());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { send, isStreaming, stop } = useChat();
  const settings = useMinal((s) => s.settings);
  const activeConnector = settings.connectors[settings.activeConnector];
  const setConnectorModel = useMinal((s) => s.setConnectorModel);

  const currentModelId =
    activeConnector?.selectedModel ?? "nvidia/nemotron-3-ultra-550b-a55b:free";
  const selectedModel =
    MODELS.find((m) => m.id === currentModelId) ?? MODELS[0];

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [draft]);

  const handleSubmit = () => {
    if (!draft.trim() || isStreaming) return;
    sfx.whoosh();
    send({ text: draft.trim() });
    setDraft("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleSoundToggle = () => {
    const muted = toggleMuted();
    setSoundActive(!muted);
    if (!muted) sfx.chime();
    toast.info(muted ? "Audio muted" : "Audio enabled");
  };

  const handleShare = () => {
    sfx.click();
    navigator.clipboard?.writeText(window.location.href);
    toast.success("Studio link copied to clipboard");
  };

  return (
    <div className={cn("w-full max-w-2xl mx-auto flex flex-col items-center gap-2.5", className)}>
      {/* Outer Vantage Dark Glass Container */}
      <div className="w-full rounded-[24px] bg-gradient-to-br from-[#181a1d]/90 to-[#0c0e10]/95 backdrop-blur-2xl border border-white/15 p-3 sm:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all focus-within:border-white/30">
        
        {/* Row 1: Header Inside Box */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 relative z-20">
          <div className="flex items-center gap-2">
            {/* New AI Chat Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  setChatTypeOpen((v) => !v);
                }}
                className="flex items-center gap-1.5 text-[12.5px] font-medium text-white/90 hover:text-white transition"
              >
                <span>{chatType}</span>
                <ChevronDown className="w-3.5 h-3.5 text-white/50" />
              </button>

              {chatTypeOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-48 rounded-xl bg-[#14181a] border border-white/15 p-1 shadow-2xl z-30">
                  {(["New AI chat", "Box CAD Session", "Thermal Label Spec"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        sfx.click();
                        setChatType(t);
                        setChatTypeOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] text-white/80 hover:text-white hover:bg-white/10 transition flex items-center justify-between"
                    >
                      <span>{t}</span>
                      {chatType === t && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Temporary Chat Pill Toggle */}
            <button
              type="button"
              onClick={() => {
                sfx.toggle();
                setIsTempChat((v) => !v);
              }}
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition flex items-center gap-1.5",
                isTempChat
                  ? "bg-white text-black border-white shadow-sm font-semibold"
                  : "bg-white/5 text-white/70 border-white/10 hover:text-white hover:bg-white/10"
              )}
            >
              <span>👻 Temporary chat</span>
            </button>
          </div>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            onMouseEnter={sfx.hover}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-white/70 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition flex items-center gap-1.5"
          >
            <Share2 className="w-3 h-3" />
            <span>Share</span>
          </button>
        </div>

        {/* Row 2: Clean Textarea */}
        <div className="py-2.5">
          <textarea
            ref={textareaRef}
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={placeholder}
            className="w-full bg-transparent text-[14px] sm:text-[14.5px] leading-relaxed text-white placeholder:text-white/40 outline-none resize-none max-h-[140px]"
          />
        </div>

        {/* Row 3: Bottom Tool Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 relative z-10">
          {/* Left Controls: (+), Canvas mode, Expand */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => {
                sfx.click();
                fileInputRef.current?.click();
              }}
              onMouseEnter={sfx.hover}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white grid place-items-center transition"
              title="Attach photo, CAD dieline, or logo"
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                sfx.click();
                onOpen3DViewer?.();
              }}
              onMouseEnter={sfx.hover}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white grid place-items-center transition"
              title="Packaging 3D Aspect & Canvas"
            >
              <Ratio className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                sfx.click();
                onOpen3DViewer?.();
              }}
              onMouseEnter={sfx.hover}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white grid place-items-center transition"
              title="Fullscreen 3D Box Preview"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Model Selector Pill */}
            <div className="relative ml-1">
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  setModelOpen((v) => !v);
                }}
                onMouseEnter={sfx.hover}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-[12px] font-medium text-white transition"
              >
                <Box className="w-3.5 h-3.5 text-[#ff6b00]" />
                <span className="truncate max-w-[130px]">{selectedModel.name}</span>
                <ChevronDown className="w-3 h-3 text-white/50" />
              </button>

              {modelOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-64 rounded-2xl bg-[#14181a] border border-white/15 p-2 shadow-2xl z-30">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-white/40">
                    Engine Selection
                  </div>
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        sfx.success();
                        setConnectorModel("openrouter", m.id);
                        setModelOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-[12px] text-white/80 hover:text-white hover:bg-white/10 transition flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white">{m.name}</div>
                        <div className="text-[10px] text-white/40">{m.provider}</div>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white border border-white/15">
                        {m.tag}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Controls: Mic + Sound Wave / Voice Studio + Send Button */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                sfx.click();
                onOpenVoice?.();
              }}
              onMouseEnter={sfx.hover}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white grid place-items-center transition"
              title="Voice Speech Dictation"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleSoundToggle}
              onMouseEnter={sfx.hover}
              className={cn(
                "w-8 h-8 rounded-lg border transition grid place-items-center",
                soundActive
                  ? "bg-white/15 border-white/30 text-white"
                  : "bg-white/5 border-white/10 text-white/40"
              )}
              title={soundActive ? "Sound Effects Enabled" : "Sound Effects Muted"}
            >
              {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Send / Stop Action in Pure White Pill */}
            <button
              type="button"
              onClick={() => {
                if (isStreaming) stop();
                else handleSubmit();
              }}
              disabled={!draft.trim() && !isStreaming}
              className={cn(
                "w-8 h-8 rounded-full grid place-items-center transition shadow-md shrink-0 ml-1",
                isStreaming
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/30"
                  : draft.trim()
                  ? "bg-white hover:bg-zinc-100 text-black shadow-white/20 hover:scale-105 active:scale-95"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
              )}
              title={isStreaming ? "Stop generation" : "Send message"}
            >
              {isStreaming ? (
                <Square className="w-3 h-3 fill-current" />
              ) : (
                <ArrowUp className="w-3.5 h-3.5 stroke-[2.8]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.dxf,.svg"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            sfx.pop();
            toast.success(`Attached ${e.target.files[0].name}`);
          }
        }}
      />

      {/* Floating Helper Badge */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[11.5px] text-white/80 shadow-md backdrop-blur-md select-none"
      >
        <Flame className="w-3.5 h-3.5 text-white/90" />
        <span>Keep Related Packaging Projects Together</span>
        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/10 text-white uppercase">
          Beta
        </span>
      </motion.div>
    </div>
  );
}
