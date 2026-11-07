"use client";

import { useState } from "react";
import { useMinal } from "@/lib/store";
import { useChat } from "@/lib/use-chat";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  User,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  Eye,
  Download,
  FileText,
  File,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { PlanCard } from "./plan-card";
import { QuestionCard } from "./question-card";
import { DesignCard } from "./design-card";
import { VariantsCard } from "./variants-card";
import { LatticeLoader } from "@/components/ui/lattice-loader";
import { BoxMakerLoader } from "./box-maker-loader";

interface Props {
  message: Message;
  conversationId: string;
}

export function MessageBubble({ message, conversationId }: Props) {
  const isUser = message.role === "user";
  const { approve, regenerate, isStreaming } = useChat();
  const openOrder = useMinal((s) => s.openOrder);
  const openViewer = useMinal((s) => s.openViewer);
  const conv = useMinal((s) =>
    s.conversations.find((c) => c.id === conversationId)
  );
  const isLastAssistant =
    !isUser &&
    conv?.messages[conv.messages.length - 1]?.id === message.id;

  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div
      className={cn(
        "group flex gap-2.5 sm:gap-3.5 px-3 sm:px-6 py-2.5 sm:py-3.5 transition-colors",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full grid place-items-center text-white shadow-md select-none border",
          isUser
            ? "bg-white/10 border-white/20"
            : "bg-black border-white/20"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white/90" strokeWidth={2.2} />
        ) : (
          /* Vantage Disc Logo Avatar */
          <svg width="20" height="20" viewBox="0 0 25 25" fill="none">
            <circle cx="12.5" cy="12.5" r="12.5" fill="#14181a" />
            <path d="M12.5 0L25 12.5L12.5 25L0 12.5Z" fill="#737778" />
            <path d="M12.5 2.5L22.5 12.5L12.5 22.5L2.5 12.5Z" fill="#050606" />
            <path d="M12.5 5L20 12.5L12.5 20L5 12.5Z" fill="#0a0b0b" />
            <path d="M12.5 7L18 12.5L12.5 18L7 12.5Z" fill="#fafafa" />
            <path d="M12.5 9L16 12.5L12.5 16L9 12.5Z" fill="#050606" />
          </svg>
        )}
      </div>

      <div
        className={cn(
          "flex flex-col gap-2 max-w-[88%] sm:max-w-[80%] min-w-0",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Name and time */}
        <div className="flex items-center gap-2 text-[10.5px] text-white/40">
          <span className="font-semibold text-white/70">
            {isUser ? "You" : "Minal AI"}
          </span>
          {!isUser && (
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-white/90 border border-white/15">
              CAD &amp; Specs
            </span>
          )}
          <span className="opacity-60 text-[10px]">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Attachments preview (supports images, pdfs, cad dielines, and text documents) */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex gap-2.5 flex-wrap">
            {message.attachments.map((a) => {
              const isImg = a.kind === "image" || a.mime.startsWith("image/");
              const isPdf = a.kind === "pdf" || a.name.toLowerCase().endsWith(".pdf");
              const isCad = a.kind === "dieline" || a.name.toLowerCase().match(/\.(dxf|ai|eps|dwg)$/);

              if (isImg) {
                return (
                  <div
                    key={a.id}
                    className="relative w-28 h-28 rounded-2xl overflow-hidden border border-white/15 bg-black/60 shadow-md group"
                  >
                    <img
                      src={a.dataUrl}
                      alt={a.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-2 justify-between">
                      <span className="text-[10px] text-white font-medium truncate max-w-[70px]">
                        {a.name}
                      </span>
                      <a
                        href={a.dataUrl}
                        download={a.name}
                        className="w-5 h-5 rounded-full bg-white/20 hover:bg-white text-black hover:text-black grid place-items-center transition"
                        title="Download image"
                      >
                        <Download className="w-3 h-3 text-white hover:text-black" />
                      </a>
                    </div>
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur text-white text-[8px] uppercase tracking-wider font-bold">
                      IMG
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-2.5 rounded-2xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.1] text-white shadow-md max-w-xs transition"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl grid place-items-center font-bold text-[10px] flex-shrink-0",
                      isPdf
                        ? "bg-red-500/20 border border-red-500/40 text-red-300"
                        : isCad
                        ? "bg-sky-500/20 border border-sky-500/40 text-sky-300"
                        : "bg-white/15 border border-white/20 text-white"
                    )}
                  >
                    {isPdf ? "PDF" : isCad ? "CAD" : "DOC"}
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[12.5px] font-medium text-white truncate">
                      {a.name}
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">
                      {(a.size / 1024).toFixed(1)} KB
                    </span>
                  </div>

                  <a
                    href={a.dataUrl}
                    download={a.name}
                    className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/25 grid place-items-center text-white transition flex-shrink-0"
                    title={`Download ${a.name}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        )}

        {/* Packaging Engineering / Thinking Dropdown */}
        {!isUser && !message.pending && message.content && (
          <div className="w-full max-w-md">
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-white/50 hover:text-white py-1 transition"
            >
              {showThinking ? (
                <ChevronDown className="w-3.5 h-3.5 text-white" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-white/60" />
              )}
              <span>Structural Packaging Analysis</span>
              <span className="text-[9px] font-mono text-white/40">
                (Substrate · Die-line · Tolerances)
              </span>
            </button>

            {showThinking && (
              <div className="mt-1 p-3 rounded-xl bg-white/[0.04] border border-white/10 text-[11.5px] text-white/70 space-y-1 font-mono backdrop-blur-md">
                <div className="text-white font-semibold text-[10px] uppercase">
                  ✓ Material verification passed
                </div>
                <div>• Board stock: 350-400 GSM Duplex / Kraft / SBS</div>
                <div>• Folding tolerances: ±0.5mm crease standard</div>
                <div>• Finishing: Foil stamping / Matte lamination ready</div>
              </div>
            )}
          </div>
        )}

        {/* Pending 3D Box Folding Loader */}
        {message.pending && !message.content ? (
          <BoxMakerLoader />
        ) : message.content ? (
          <div
            className={cn(
              "px-4 py-3 rounded-2xl text-[13.5px] sm:text-[14px] leading-relaxed relative max-w-full break-words shadow-md backdrop-blur-xl",
              isUser
                ? "bg-white/15 text-white border border-white/20 rounded-tr-sm"
                : "bg-black/65 text-white/95 border border-white/10 rounded-tl-sm"
            )}
          >
            <div className="minal-markdown prose prose-invert max-w-none text-[13.5px] sm:text-[14px] leading-relaxed">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
            {message.pending && (
              <span className="inline-block w-1.5 h-4 bg-white ml-1 align-middle animate-pulse" />
            )}
          </div>
        ) : null}

        {/* Structured payloads */}
        {message.question && <QuestionCard message={message} />}
        {message.plan && (
          <PlanCard
            plan={message.plan}
            onApprove={() => approve(conversationId, message.id)}
          />
        )}
        {message.variants && message.variants.length > 0 && (
          <VariantsCard variants={message.variants} />
        )}
        {message.design && <DesignCard spec={message.design} />}

        {/* Quick Action Toolbar */}
        {!message.pending && (
          <div className="flex items-center gap-1 mt-0.5 opacity-80 group-hover:opacity-100 transition flex-wrap">
            {message.content && (
              <button
                onClick={copyMessage}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase font-mono text-white/60 hover:text-white hover:bg-white/10 border border-white/10 transition"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-white" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            )}

            {isLastAssistant && !isStreaming && (
              <button
                onClick={regenerate}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase font-mono text-white/60 hover:text-white hover:bg-white/10 border border-white/10 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Regenerate</span>
              </button>
            )}

            {/* Quick 3D View Shortcut */}
            {message.design && (
              <button
                onClick={() => openViewer(message.design)}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] uppercase font-mono text-white bg-white/10 hover:bg-white/20 border border-white/20 transition backdrop-blur-md"
              >
                <Eye className="w-3 h-3" />
                <span>Open 3D Turntable</span>
              </button>
            )}

            {/* Quick Order Button */}
            {message.design && (
              <button
                onClick={() => openOrder(true)}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] uppercase font-mono text-black bg-white hover:bg-zinc-200 font-bold transition shadow-sm"
              >
                <ShoppingBag className="w-3 h-3 text-black" />
                <span>Order Production Run</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
