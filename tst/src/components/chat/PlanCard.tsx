"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { BOX_TYPES, STYLES, FINISHES, pkr } from "@/lib/design/spec";
import type { DesignSpec } from "@/db/schema";

export type DesignRow = {
  id: string;
  product: string;
  brand: string;
  tagline: string;
  boxType: string;
  style: string;
  finish: string;
  paper: string;
  quantity: number;
  colors: string[];
  logo: string | null;
  spec: DesignSpec | null;
  status: string;
};

export default function PlanCard({
  design: initial,
  onChanged,
  onApproved,
}: {
  design: DesignRow;
  onChanged: (d: DesignRow) => void;
  onApproved: (d: DesignRow) => void;
}) {
  const [d, setD] = useState<DesignRow>(initial);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setD(initial), [initial]);

  const patch = (partial: Partial<DesignRow>) => {
    const next = { ...d, ...partial };
    setD(next);
    onChanged(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSaving(true);
      try {
        const res = await fetch(`/api/designs/${d.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand: next.brand, product: next.product, tagline: next.tagline,
            boxType: next.boxType, style: next.style, finish: next.finish,
            paper: next.paper, quantity: next.quantity, colors: next.colors,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setD(data.design);
          onChanged(data.design);
          setSavedFlash(true);
          setTimeout(() => setSavedFlash(false), 1400);
        }
      } finally {
        setSaving(false);
      }
    }, 650);
  };

  const approve = async () => {
    setApproving(true);
    try {
      const res = await fetch(`/api/designs/${d.id}/approve`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setD(data.design);
        onApproved(data.design);
      }
    } finally {
      setApproving(false);
    }
  };

  const approved = d.status !== "draft";
  const unit = d.spec?.unitPrice ?? 0;

  return (
    <div className="border border-ink/15 rounded-2xl overflow-hidden bg-paper">
      <div className="flex items-center justify-between px-4 py-3 border-b hairline bg-ink text-paper">
        <span className="font-mono-label flex items-center gap-2">
          <Sparkles size={12} className="text-lime" /> Design plan — editable
        </span>
        <span className="font-mono-label text-paper/50">
          {saving ? "saving…" : savedFlash ? "saved ✓" : approved ? "approved" : "live preview"}
        </span>
      </div>

      <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <label className="col-span-1">
          <span className="font-mono-label text-ink/45 block mb-1">Brand</span>
          <input value={d.brand} onChange={(e) => patch({ brand: e.target.value })} disabled={approved}
            className="w-full bg-transparent border-b hairline focus:border-ink outline-none py-1 font-bold" />
        </label>
        <label className="col-span-1">
          <span className="font-mono-label text-ink/45 block mb-1">Product</span>
          <input value={d.product} onChange={(e) => patch({ product: e.target.value })} disabled={approved}
            className="w-full bg-transparent border-b hairline focus:border-ink outline-none py-1" />
        </label>

        <label className="col-span-2">
          <span className="font-mono-label text-ink/45 block mb-1">Tagline (optional)</span>
          <input value={d.tagline} onChange={(e) => patch({ tagline: e.target.value })} disabled={approved}
            placeholder="Printed on the back panel"
            className="w-full bg-transparent border-b hairline focus:border-ink outline-none py-1 placeholder:text-ink/30" />
        </label>

        <label>
          <span className="font-mono-label text-ink/45 block mb-1">Box style</span>
          <select value={d.boxType} onChange={(e) => patch({ boxType: e.target.value })} disabled={approved}
            className="w-full bg-transparent border-b hairline focus:border-ink outline-none py-1">
            {BOX_TYPES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
        <label>
          <span className="font-mono-label text-ink/45 block mb-1">Art vibe</span>
          <select value={d.style} onChange={(e) => patch({ style: e.target.value })} disabled={approved}
            className="w-full bg-transparent border-b hairline focus:border-ink outline-none py-1">
            {STYLES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>

        <label>
          <span className="font-mono-label text-ink/45 block mb-1">Finish</span>
          <select value={d.finish} onChange={(e) => patch({ finish: e.target.value })} disabled={approved}
            className="w-full bg-transparent border-b hairline focus:border-ink outline-none py-1">
            {FINISHES.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </label>
        <label>
          <span className="font-mono-label text-ink/45 block mb-1">Paper</span>
          <select value={d.paper} onChange={(e) => patch({ paper: e.target.value })} disabled={approved}
            className="w-full bg-transparent border-b hairline focus:border-ink outline-none py-1">
            <option value="white">White board</option>
            <option value="kraft">Kraft board</option>
          </select>
        </label>

        <div>
          <span className="font-mono-label text-ink/45 block mb-1">Colors</span>
          <div className="flex items-center gap-2">
            {[0, 1].map((i) => (
              <label key={i} className="flex items-center gap-1.5 border hairline rounded-full px-1.5 py-1">
                <input type="color" value={d.colors[i] ?? "#141412"} disabled={approved}
                  onChange={(e) => {
                    const colors = [...d.colors];
                    colors[i] = e.target.value.toUpperCase();
                    patch({ colors });
                  }}
                  className="w-5 h-5 rounded-full cursor-pointer border-0 bg-transparent p-0" />
                <span className="font-mono text-[10px] text-ink/60">{(d.colors[i] ?? "").slice(0, 7)}</span>
              </label>
            ))}
          </div>
        </div>
        <label>
          <span className="font-mono-label text-ink/45 block mb-1">Quantity</span>
          <input type="number" min={50} max={100000} step={50} value={d.quantity} disabled={approved}
            onChange={(e) => patch({ quantity: Number(e.target.value) || 50 })}
            className="w-full bg-transparent border-b hairline focus:border-ink outline-none py-1" />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t hairline bg-lime/20">
        <div className="font-mono-label text-ink/60">
          {d.spec && <span>{d.spec.dims.w}×{d.spec.dims.h}×{d.spec.dims.d}mm · </span>}
          <span className="text-ink">{pkr(unit)}</span>/box · total {" "}
          <span className="text-ink font-medium">{pkr(unit * d.quantity)}</span>
        </div>
        <button onClick={approve} disabled={approved || approving} className="btn btn-ink !py-2.5">
          {approved ? <><Check size={13} /> Approved</> : approving ? <Loader2 size={13} className="animate-spin" /> : "Approve design"}
        </button>
      </div>
    </div>
  );
}
