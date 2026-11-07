"use client";

import { useState, useRef, useEffect } from "react";
import { useMinal, fileToAttachment } from "@/lib/store";
import { useChat } from "@/lib/use-chat";
import type { Attachment } from "@/lib/types";
import { AttachmentPreviewStrip } from "./attachment-preview-strip";
import {
  ArrowUp,
  Square,
  Plus,
  Mic,
  Box,
  Layers,
  X,
  Cpu,
  Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FileUpload } from "./file-upload";

const QUICK_SUGGESTIONS = [
  "Rigid perfume box with gold foil logo",
  "12-inch corrugated pizza box with kraft finish",
  "Luxury apparel drawer box with satin ribbon",
  "Minimalist cosmetic dropper bottle carton",
];

const AUTO_ADAPT_SUGGESTIONS = [
  "Make it 2 inches taller",
  "Add magnetic lid closure",
  "Change substrate to 400gsm SBS board",
  "Apply matte lamination + spot UV",
  "Generate 3 design variants",
];

interface InputBarProps {
  onOpenModelSheet?: () => void;
}

export function InputBar({ onOpenModelSheet }: InputBarProps) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { send, isStreaming, stop, generateVariants } = useChat();
  const mode = useMinal((s) => s.mode);
  const setMode = useMinal((s) => s.setMode);
  const conv = useMinal((s) =>
    s.conversations.find((c) => c.id === s.activeId)
  );
  const settings = useMinal((s) => s.settings);
  const activeConnector = settings.connectors[settings.activeConnector];
  const selectedModel = activeConnector?.selectedModel ?? "Nemotron 3 Ultra";
  const hasDesign = !!conv?.currentDesign;

  // Auto-resize textarea smoothly
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() && !attachments.length) return;
    if (isStreaming) return;
    send({ text: text.trim(), attachments });
    setText("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleOpenVoice = () => {
    window.dispatchEvent(new CustomEvent("open-voice-studio"));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      const parsedAttachments = await Promise.all(
        files.map((file) => fileToAttachment(file))
      );
      setAttachments((prev) => [...prev, ...parsedAttachments]);
    } catch (err) {
      console.error("Failed to parse attachments", err);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const canSend = text.trim().length > 0 || attachments.length > 0;
  const suggestions = hasDesign ? AUTO_ADAPT_SUGGESTIONS : QUICK_SUGGESTIONS;

  const modelDisplayName = selectedModel.includes("nemotron-3-ultra")
    ? "Nemotron 3 Ultra"
    : selectedModel.includes("claude")
    ? "Claude 3.5 Sonnet"
    : selectedModel.includes("gpt-4o")
    ? "GPT-4o"
    : "Nemotron Fast";

  return (
    <div className="w-full px-3 sm:px-6 pb-3 sm:pb-5 pt-1 safe-bottom">
      <div className="max-w-3xl mx-auto flex flex-col gap-2">
        {/* Suggestion Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto minal-scroll-hidden py-1">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                if (s.includes("variant")) {
                  generateVariants(s);
                } else {
                  setText(s);
                  textareaRef.current?.focus();
                }
              }}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium bg-[#1a1a1e]/80 hover:bg-[#25252a] text-white/70 hover:text-white border border-white/10 hover:border-white/20 transition backdrop-blur-md flex items-center gap-1.5"
            >
              {s.includes("variant") && (
                <Layers className="w-3 h-3 text-white" />
              )}
              <span>{s}</span>
            </button>
          ))}
        </div>

        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <AttachmentPreviewStrip
            attachments={attachments}
            onRemove={(id) =>
              setAttachments((prev) => prev.filter((a) => a.id !== id))
            }
          />
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.txt,.doc,.docx,.json,.csv,.md,.dxf,.ai,.eps,.svg,.cdr,*/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Modern Floating Capsule Prompt Bar */}
        <form
          onSubmit={handleSubmit}
          className={cn(
            "relative w-full rounded-[26px] p-1.5 sm:p-2 transition-all flex items-end gap-1.5 sm:gap-2",
            "bg-[#121214]/95 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/50",
            "focus-within:border-white/40 focus-within:shadow-[0_0_25px_rgba(255,255,255,0.08)]"
          )}
        >
          {/* Attachment (+) Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white grid place-items-center transition shrink-0 self-center"
            title="Attach reference photo, artwork, or logo"
            aria-label="Add attachment"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          </button>

          {/* Model indicator / Selector pill (clickable on mobile & desktop) */}
          <button
            type="button"
            onClick={onOpenModelSheet}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-white/80 shrink-0 self-center transition"
            title="Switch AI Model"
          >
            <Cpu className="w-3 h-3 text-[#ff6b00]" />
            <span className="truncate max-w-[110px]">{modelDisplayName}</span>
          </button>

          {/* Input Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            rows={1}
            placeholder={
              mode === "plan"
                ? "Describe your product, packaging idea, or dimensions..."
                : mode === "sketch"
                ? "What should I sketch? (e.g. 'perfume box with magnetic flap')"
                : "Ask anything about packaging specs, materials, or finishes..."
            }
            className="flex-1 bg-transparent py-2 sm:py-2.5 px-2 text-[13.5px] sm:text-[14px] leading-relaxed text-white placeholder:text-white/40 resize-none outline-none max-h-[140px] minal-scroll self-center"
          />

          {/* Right Action Icons: Mic + Send */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 self-center pr-1">
            {/* Integrated Voice Dictate Button */}
            <button
              type="button"
              onClick={handleOpenVoice}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white grid place-items-center transition"
              title="Voice Consultation Studio"
              aria-label="Voice Studio"
            >
              <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* Send or Stop Button */}
            <button
              type={isStreaming ? "button" : "submit"}
              disabled={!canSend && !isStreaming}
              onClick={() => {
                if (isStreaming) stop();
              }}
              className={cn(
                "w-9 h-9 sm:w-10 sm:h-10 rounded-full grid place-items-center transition-all shrink-0",
                isStreaming
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
                  : canSend
                  ? "bg-white hover:bg-white/90 text-black shadow-lg shadow-white/20 hover:scale-105 active:scale-95 cursor-pointer"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
              )}
              title={isStreaming ? "Stop generation" : "Send message"}
              aria-label={isStreaming ? "Stop generation" : "Send message"}
            >
              {isStreaming ? (
                <Square className="w-3.5 h-3.5 fill-current" />
              ) : (
                <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.8]" />
              )}
            </button>
          </div>
        </form>

        {/* Subtle helper line */}
        <div className="flex items-center justify-between px-3 text-[10.5px] text-white/40">
          <span className="hidden sm:inline">
            Press <kbd className="font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10">Enter</kbd> to send, <kbd className="font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10">Shift+Enter</kbd> for newline
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
            <span>Minal Enterprises · Factory Floor Online</span>
          </span>
        </div>
      </div>
    </div>
  );
}
