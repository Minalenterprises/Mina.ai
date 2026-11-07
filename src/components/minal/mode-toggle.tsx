"use client";

import { useMinal } from "@/lib/store";
import { cn } from "@/lib/utils";
import { FileText, Wand2, Zap, Mic } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ModeToggle() {
  const mode = useMinal((s) => s.mode);
  const setMode = useMinal((s) => s.setMode);
  const conversation = useMinal((s) =>
    s.conversations.find((c) => c.id === s.activeId)
  );

  const canSwitchToAi = !!conversation?.approvedPlan;

  const modes = [
    { id: "plan" as const, label: "Plan", icon: FileText, always: true },
    { id: "sketch" as const, label: "Sketch", icon: Zap, always: true },
    { id: "agent" as const, label: "Agent", icon: Mic, always: true },
    { id: "ai" as const, label: "AI", icon: Wand2, always: false },
  ];

  const activeIdx = modes.findIndex((m) => m.id === mode);

  return (
    <TooltipProvider delayDuration={250}>
      <div className="mode-seg relative inline-flex">
        <div
          className="mode-seg-pill"
          style={{
            width: `calc((100% - 8px) / 4)`,
            left: `calc(3px + ${activeIdx} * ((100% - 8px) / 4))`,
            opacity: activeIdx >= 0 ? 1 : 0,
          }}
        />
        {modes.map((m) => {
          const Icon = m.icon;
          const disabled = !m.always && m.id === "ai" && !canSwitchToAi && mode !== "ai";
          return (
            <Tooltip key={m.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    if (m.always || canSwitchToAi || m.id === mode) setMode(m.id);
                  }}
                  disabled={disabled}
                  className={cn(
                    "mode-seg-btn",
                    mode === m.id && "active",
                    disabled && "opacity-40 cursor-not-allowed"
                  )}
                >
                  <Icon className="w-3 h-3" strokeWidth={2.2} />
                  <span className="hidden sm:inline">{m.label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">
                {m.id === "plan"
                  ? "AI thinks & proposes a plan you approve"
                  : m.id === "sketch"
                  ? "Fast 3-variant drafts, no plan needed"
                  : m.id === "agent"
                  ? "Voice-first realtime chat (Siri-style)"
                  : canSwitchToAi
                  ? "Execute the approved plan"
                  : "Approve a plan first to unlock AI mode"}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
