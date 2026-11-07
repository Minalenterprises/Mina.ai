"use client";

import { useState } from "react";
import type { DesignSpec } from "@/lib/types";
import { useMinal } from "@/lib/store";
import { Box3DViewer } from "./box-3d-viewer";
import { Check, Layers, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { sfx } from "@/lib/sound";

interface Props {
  variants: DesignSpec[];
}

export function VariantsCard({ variants }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const updateMessage = useMinal((s) => s.updateMessage);
  const openViewer = useMinal((s) => s.openViewer);

  const promoteToDesign = (idx: number) => {
    sfx.click();
    const spec = variants[idx];
    if (!spec) return;
    const convId = useMinal.getState().activeId;
    if (!convId) return;
    const conv = useMinal.getState().conversations.find((c) => c.id === convId);
    if (!conv) return;
    const msg = conv.messages.find((m) => m.variants === variants);
    if (!msg) return;
    updateMessage(msg.id, { design: spec });
    useMinal.setState((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === convId
          ? {
              ...c,
              currentDesign: spec,
              designHistory: [...(c.designHistory ?? []), spec].slice(-20),
            }
          : c
      ),
    }));
    toast.success(`Selected "${spec.title}" as the active design`);
  };

  return (
    <div className="w-full max-w-[720px] rounded-2xl bg-black/75 border border-white/15 backdrop-blur-2xl overflow-hidden shadow-2xl text-white my-2">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 bg-white/[0.03]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white/10 border border-white/20 grid place-items-center">
            <Layers className="w-3.5 h-3.5 text-[#ff6b00]" strokeWidth={2.4} />
          </div>
          <span className="text-[10px] uppercase tracking-[0.22em] font-mono font-bold text-white/70">
            CAD Variants
          </span>
          <span className="text-[10px] text-white/40 ml-auto">
            {variants.length} options · pick one to refine
          </span>
        </div>
      </div>

      {/* Variants grid */}
      <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {variants.map((v, i) => (
          <div
            key={i}
            className={cn(
              "variant-card rounded-xl border overflow-hidden bg-white/[0.03] transition-all cursor-pointer",
              selected === i ? "border-white bg-white/[0.08] shadow-lg" : "border-white/10 hover:border-white/25"
            )}
            onClick={() => {
              sfx.click();
              setSelected(i);
            }}
          >
            {/* Mini 3D preview */}
            <div className="h-[140px] bg-black/60 relative border-b border-white/10">
              <Box3DViewer spec={v} className="w-full h-full" rotate={false} />
              <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-white text-black text-[9px] font-bold uppercase tracking-wider font-mono shadow">
                {String.fromCharCode(65 + i)}
              </div>
              {selected === i && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white text-black grid place-items-center shadow">
                  <Check className="w-3 h-3 text-black" strokeWidth={3} />
                </div>
              )}
            </div>
            {/* Spec */}
            <div className="p-2.5">
              <div className="text-[11.5px] font-semibold text-white truncate">{v.title}</div>
              <div className="text-[9px] text-white/50 mt-0.5 font-mono">
                {v.kind} · {v.width}&quot;×{v.length}&quot;×{v.height}&quot;
              </div>
              <div className="text-[9px] text-white/50">
                {v.material} · {v.finish}
              </div>
              {/* Palette */}
              <div className="flex gap-1 mt-1.5">
                {v.colors?.slice(0, 4).map((c) => (
                  <div
                    key={c}
                    className="w-3 h-3 rounded-full border border-white/20"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between bg-white/[0.02]">
        <span className="text-[10px] text-white/40">
          {selected !== null
            ? `Option ${String.fromCharCode(65 + selected)} selected`
            : "Click a variant to choose"}
        </span>
        <div className="flex gap-2">
          {selected !== null && (
            <button
              onClick={() => openViewer(variants[selected])}
              className="px-3 h-8 rounded-full border border-white/15 hover:bg-white/10 text-white text-[11px] font-semibold transition"
            >
              Inspect 3D
            </button>
          )}
          <button
            onClick={() => selected !== null && promoteToDesign(selected)}
            disabled={selected === null}
            className="flex items-center gap-1.5 px-4 h-8 rounded-full bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:hover:bg-white text-black text-[11px] font-bold transition shadow-sm"
          >
            <span>Confirm Choice</span>
            <ArrowRight className="w-3 h-3 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
}
