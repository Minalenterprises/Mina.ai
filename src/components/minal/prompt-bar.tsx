"use client";

import { useRef, useState, useEffect } from "react";
import {
  Cpu,
  Paperclip,
  ArrowUp,
  Square,
  Mic,
  ChevronDown,
  Globe,
  Sliders,
  Check,
  X
} from "lucide-react";
import "./PromptBar.css";

interface PromptBarProps {
  placeholder?: string;
  busy?: boolean;
  onSend: (text: string, opts?: { model?: string }) => void;
  onStop?: () => void;
  onAttach?: () => void;
  onDictate?: () => void;
  className?: string;
}

const MODELS = [
  { key: "nvidia/nemotron-3-ultra-550b-a55b:free", name: "Nemotron 3 Ultra", tag: "Fast / Free" },
  { key: "nvidia/nemotron-3.5-lightning:free", name: "Nemotron 3.5 Light", tag: "Free" },
  { key: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", tag: "Design Pro" },
  { key: "openai/gpt-4o", name: "GPT-4o", tag: "Omni" }
];

export function PromptBar({
  placeholder = "Describe your custom packaging (dimensions, material, colors)...",
  busy = false,
  onSend,
  onStop,
  onAttach,
  onDictate,
  className = ""
}: PromptBarProps) {
  const [draft, setDraft] = useState("");
  const [modelKey, setModelKey] = useState(MODELS[0].key);
  const [modelOpen, setModelOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const selectedModel = MODELS.find((m) => m.key === modelKey) ?? MODELS[0];
  const canSend = draft.trim().length > 0;

  const handleSubmit = () => {
    if (!canSend || busy) return;
    onSend(draft.trim(), { model: modelKey });
    setDraft("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`prompt-bar mx-auto ${className}`}>
      {/* Model Selector Dropdown Menu */}
      {modelOpen && (
        <div className="prompt-bar__menu" data-kind="model">
          <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
            Select Active Model
          </div>
          {MODELS.map((m) => (
            <button
              key={m.key}
              type="button"
              className="prompt-bar__row"
              onClick={() => {
                setModelKey(m.key);
                setModelOpen(false);
              }}
            >
              <span className="prompt-bar__row-name">{m.name}</span>
              <span className="prompt-bar__row-tag">{m.tag}</span>
              <span
                className="prompt-bar__row-check"
                data-on={m.key === modelKey ? "" : undefined}
              >
                <Check className="w-3.5 h-3.5" />
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="prompt-bar__field">
        <textarea
          ref={inputRef}
          className="prompt-bar__input"
          rows={1}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <div className="prompt-bar__bar">
          {onAttach && (
            <button
              type="button"
              onClick={onAttach}
              className="prompt-bar__tool"
              title="Attach product photo or logo"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            className="prompt-bar__pick"
            onClick={() => setModelOpen((v) => !v)}
          >
            <Cpu className="w-3.5 h-3.5 text-primary" />
            <span>{selectedModel.name}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          <span className="prompt-bar__spacer" />

          {onDictate && (
            <button
              type="button"
              onClick={onDictate}
              className="prompt-bar__tool text-muted-foreground hover:text-primary"
              title="Voice input"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            className="prompt-bar__send"
            disabled={!canSend && !busy}
            onClick={() => {
              if (busy) onStop?.();
              else handleSubmit();
            }}
          >
            {busy ? <Square className="w-3.5 h-3.5 fill-current" /> : <ArrowUp className="w-4 h-4 stroke-[2.5]" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PromptBar;
