"use client";

import { useState } from "react";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, CheckCheck, Pencil, X, Plus, Trash2, Box } from "lucide-react";

interface PlanItemT {
  id: string;
  title: string;
  detail: string;
  status: "pending" | "in_progress" | "done";
}

interface Props {
  plan: NonNullable<Message["plan"]>;
  onApprove: () => void;
}

export function PlanCard({ plan, onApprove }: Props) {
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<PlanItemT[]>(
    plan.items.map((it, i) => ({ ...it, id: it.id || `item-${i}` }))
  );
  const [title, setTitle] = useState(plan.title);
  const [summary, setSummary] = useState(plan.summary);

  const updateItem = (id: string, patch: Partial<PlanItemT>) =>
    setItems((arr) => arr.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const removeItem = (id: string) =>
    setItems((arr) => arr.filter((it) => it.id !== id));

  const addItem = () =>
    setItems((arr) => [
      ...arr,
      { id: `item-${Date.now()}`, title: "New step", detail: "", status: "pending" },
    ]);

  return (
    <div className="w-full max-w-[640px] rounded-2xl bg-black/75 border border-white/15 backdrop-blur-2xl overflow-hidden shadow-2xl text-white my-2">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 bg-white/[0.03] relative overflow-hidden">
        <div className="flex items-center justify-between gap-2 relative">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white/10 border border-white/20 grid place-items-center">
              <Box className="w-3 h-3 text-[#ff6b00]" strokeWidth={2.4} />
            </div>
            <span className="text-[10px] uppercase tracking-[0.22em] font-mono text-white/70">
              Proposed Specification Plan
            </span>
          </div>
          <button
            onClick={() => setEditing((e) => !e)}
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition border",
              editing
                ? "bg-white text-black border-white"
                : "text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border-white/10"
            )}
          >
            {editing ? <X className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
            {editing ? "Done" : "Edit"}
          </button>
        </div>

        {!editing ? (
          <>
            <h3 className="mt-2.5 text-[16px] font-semibold tracking-tight text-white">{title}</h3>
            <p className="mt-1 text-[12px] text-white/60 leading-snug">{summary}</p>
          </>
        ) : (
          <div className="mt-2.5 space-y-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-[13px] font-semibold text-white outline-none focus:border-white/40"
            />
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              className="w-full px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-[11.5px] text-white/80 outline-none focus:border-white/40 resize-none minal-scroll"
            />
          </div>
        )}
      </div>

      {/* Steps (01-04 Sequence) */}
      <ol className="relative p-5 space-y-3.5">
        {items.map((it, idx) => (
          <li key={it.id} className="relative flex gap-3.5 group">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-7 h-7 rounded-full grid place-items-center text-[10.5px] font-mono font-bold border transition",
                  it.status === "done"
                    ? "bg-white border-white text-black"
                    : it.status === "in_progress"
                    ? "border-white text-white bg-white/20"
                    : "border-white/30 text-white/60 bg-white/5"
                )}
              >
                {it.status === "done" ? (
                  <Check className="w-3 h-3 text-black" strokeWidth={3} />
                ) : (
                  String(idx + 1).padStart(2, "0")
                )}
              </div>
              {idx < items.length - 1 && (
                <div className="w-px flex-1 mt-1 bg-white/15 min-h-[18px]" />
              )}
            </div>
            <div className="flex-1 pb-1 min-w-0">
              {!editing ? (
                <>
                  <div className="text-[13px] font-semibold leading-snug text-white">{it.title}</div>
                  {it.detail && (
                    <div className="text-[11.5px] text-white/60 mt-0.5 leading-snug">
                      {it.detail}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-1.5">
                  <input
                    value={it.title}
                    onChange={(e) => updateItem(it.id, { title: e.target.value })}
                    className="w-full px-2.5 py-1 rounded-md border border-white/15 bg-white/5 text-[12px] font-semibold text-white outline-none focus:border-white/40"
                  />
                  <input
                    value={it.detail}
                    onChange={(e) => updateItem(it.id, { detail: e.target.value })}
                    placeholder="Detail..."
                    className="w-full px-2.5 py-1 rounded-md border border-white/15 bg-white/5 text-[11px] text-white/80 outline-none focus:border-white/40"
                  />
                  <button
                    onClick={() => removeItem(it.id)}
                    className="flex items-center gap-1 text-[10px] text-red-400 hover:underline"
                  >
                    <Trash2 className="w-3 h-3" /> Remove step
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
        {editing && (
          <button
            onClick={addItem}
            className="flex items-center gap-1.5 ml-10 px-3 py-1.5 rounded-full border border-dashed border-white/20 text-[11px] text-white/60 hover:border-white/50 hover:text-white transition"
          >
            <Plus className="w-3 h-3" /> Add step
          </button>
        )}
      </ol>

      {/* Spec preview table */}
      {plan.spec && (
        <div className="px-5 py-4 border-t border-white/10 bg-white/[0.02]">
          <div className="text-[9px] uppercase tracking-[0.22em] font-mono text-white/50 mb-2.5">
            SPEC PREVIEW
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11.5px]">
            <SpecRow k="TYPE" v={plan.spec.kind} />
            <SpecRow k="MATERIAL" v={plan.spec.material} />
            <SpecRow k="DIMENSIONS" v={`${plan.spec.width}" × ${plan.spec.length}" × ${plan.spec.height}"`} />
            <SpecRow k="FINISH" v={plan.spec.finish} />
          </div>
          {plan.spec.colors && plan.spec.colors.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-wider font-mono text-white/50">PALETTE:</span>
              <div className="flex items-center gap-1.5">
                {plan.spec.colors.map((c) => (
                  <span
                    key={c}
                    className="w-4 h-4 rounded-full border border-white/30 shadow-sm"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions: Pure white luxury Approve & Generate button */}
      <div className="px-5 py-3.5 border-t border-white/10 flex items-center justify-between gap-2 bg-white/[0.04]">
        <span className="text-[10px] text-white/50">
          Review · Edit · Approve to start generation
        </span>
        <button
          onClick={onApprove}
          className="flex items-center gap-2 px-5 h-10 rounded-full bg-white hover:bg-zinc-200 text-black text-[12.5px] font-bold shadow-lg shadow-white/10 transition active:scale-95"
        >
          <CheckCheck className="w-4 h-4 text-black" strokeWidth={2.6} />
          <span>Approve &amp; Generate</span>
        </button>
      </div>
    </div>
  );
}

function SpecRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[9.5px] uppercase tracking-wider font-mono text-white/50">{k}:</span>
      <span className="font-medium text-white">{v}</span>
    </div>
  );
}
