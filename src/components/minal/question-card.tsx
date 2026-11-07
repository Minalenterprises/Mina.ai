"use client";

import { useState } from "react";
import type { Message } from "@/lib/types";
import { useMinal } from "@/lib/store";
import { useChat } from "@/lib/use-chat";
import { cn } from "@/lib/utils";
import { Check, Edit, Send, X } from "lucide-react";

interface Props {
  message: Message;
}

export function QuestionCard({ message }: Props) {
  const { send, isStreaming } = useChat();
  const [selected, setSelected] = useState<string[]>([]);
  const [customText, setCustomText] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const settings = useMinal((s) => s.settings);

  if (!message.question) return null;
  const { prompt, options, multi } = message.question;

  const toggle = (id: string) => {
    if (multi) {
      setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    } else {
      setSelected([id]);
    }
  };

  const submit = () => {
    let answer = "";
    if (showCustom && customText.trim()) {
      answer = customText.trim();
    } else {
      const picks = options.filter((o) => selected.includes(o.id));
      answer = picks.map((p) => p.label).join(", ");
    }
    if (!answer) return;
    send({ text: answer });
  };

  return (
    <div className="w-full max-w-[560px] rounded-xl glass-strong border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-primary/5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary minal-glow" />
          <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-primary">
            Quick Reply
          </span>
        </div>
        <p className="mt-1.5 text-[13px] font-medium leading-snug">{prompt}</p>
      </div>

      <div className="p-2.5 space-y-1.5">
        {options.map((o) => {
          const checked = selected.includes(o.id);
          const isCustom = o.custom;
          return (
            <button
              key={o.id}
              onClick={() => {
                if (isCustom) {
                  setShowCustom(true);
                  setSelected([o.id]);
                } else {
                  setShowCustom(false);
                  toggle(o.id);
                }
              }}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg border transition group flex items-start gap-2.5",
                checked
                  ? "border-primary bg-primary/8"
                  : "border-border hover:border-primary/40 hover:bg-accent"
              )}
            >
              <div
                className={cn(
                  "flex-shrink-0 w-4 h-4 rounded-md border mt-0.5 grid place-items-center transition",
                  checked
                    ? "bg-primary border-primary text-white"
                    : "border-border group-hover:border-primary/50"
                )}
              >
                {checked && <Check className="w-2.5 h-2.5" strokeWidth={3.5} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-medium leading-snug">
                  {isCustom ? (
                    <span className="text-muted-foreground italic">Type your own answer</span>
                  ) : (
                    o.label
                  )}
                </div>
                {o.description && (
                  <div className="text-[10.5px] text-muted-foreground mt-0.5 leading-snug">
                    {o.description}
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {showCustom && (
          <div className="px-1 pt-1.5">
            <textarea
              autoFocus
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Type your answer..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background/60 text-[12.5px] outline-none focus:border-primary/50 resize-none minal-scroll"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-1.5 px-1">
          <span className="text-[9.5px] uppercase tracking-wider text-muted-foreground">
            {settings.activeConnector}
          </span>
          <button
            onClick={submit}
            disabled={isStreaming || (!showCustom && selected.length === 0) || (showCustom && !customText.trim())}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-3 h-3" strokeWidth={2.4} />
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}
