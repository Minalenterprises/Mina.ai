"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, Cuboid, Layers, Package, Pause, Play } from "lucide-react";
import DielineSVG from "./DielineSVG";
import { boxTypeName, finishName, styleName, pkr } from "@/lib/design/spec";
import type { DesignRow } from "@/components/chat/PlanCard";

const BoxScene = dynamic(() => import("@/components/three/BoxScene"), {
  ssr: false,
  loading: () => <div className="w-full h-full grid place-items-center font-mono-label text-ink/40">rendering studio…</div>,
});

export default function StudioClient({ design: initial }: { design: DesignRow }) {
  const [design, setDesign] = useState(initial);
  const [view, setView] = useState<"3d" | "2d">("3d");
  const [fold, setFold] = useState(1);
  const [spin, setSpin] = useState(true);
  const [approving, setApproving] = useState(false);

  const spec = design.spec;
  const unit = spec?.unitPrice ?? 0;

  const approve = async () => {
    setApproving(true);
    try {
      const res = await fetch(`/api/designs/${design.id}/approve`, { method: "POST" });
      if (res.ok) setDesign((await res.json()).design);
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="min-h-[100svh] flex flex-col bg-paper">
      <header className="border-b hairline z-10 bg-paper/85 backdrop-blur">
        <div className="max-w-[1500px] mx-auto flex items-center gap-3 px-4 md:px-8 h-16">
          <Link href="/dashboard" className="w-9 h-9 grid place-items-center rounded-full border hairline hover:bg-ink hover:text-paper transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate leading-tight">
              {design.brand || "Untitled"} — {boxTypeName(design.boxType)}
            </p>
            <p className="font-mono-label text-ink/45 mt-0.5">
              {spec ? `${spec.dims.w}×${spec.dims.h}×${spec.dims.d} mm` : ""} · {design.status}
            </p>
          </div>
          <div className="flex items-center border hairline rounded-full overflow-hidden">
            {(["3d", "2d"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`flex items-center gap-1.5 px-4 py-2 font-mono-label transition-colors ${view === v ? "bg-ink text-paper" : "text-ink/60 hover:text-ink"}`}>
                {v === "3d" ? <Cuboid size={12} /> : <Layers size={12} />}
                {v === "3d" ? "3D view" : "2D dieline"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 grid md:grid-cols-[1fr_340px] max-w-[1500px] mx-auto w-full">
        {/* stage */}
        <div className="relative min-h-[52vh] md:min-h-0 bg-[radial-gradient(circle_at_50%_65%,rgba(198,242,78,0.14),transparent_60%)]">
          {view === "3d" ? (
            <>
              {spec && <BoxScene spec={spec} logo={design.logo} fold={fold} autoRotate={spin} />}
              {/* fold controls */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-5 w-[min(430px,88%)] bg-paper/85 backdrop-blur border hairline rounded-full px-5 py-3.5 flex items-center gap-4">
                <button onClick={() => setSpin((s) => !s)} className="text-ink/50 hover:text-ink transition-colors">
                  {spin ? <Pause size={15} /> : <Play size={15} />}
                </button>
                <span className="font-mono-label text-ink/45 whitespace-nowrap">unfolded</span>
                <input type="range" min={0} max={100} value={Math.round(fold * 100)}
                  onChange={(e) => setFold(Number(e.target.value) / 100)}
                  className="fold-slider flex-1" />
                <span className="font-mono-label text-ink/45 whitespace-nowrap">folded</span>
              </div>
              <div className="absolute top-4 left-5 font-mono-label text-ink/40">drag to orbit · scroll to zoom</div>
            </>
          ) : (
            <div className="absolute inset-0 p-6 md:p-10">
              <div className="w-full h-full border hairline rounded-2xl bg-paper p-4 md:p-8">
                {spec && <DielineSVG spec={spec} logo={design.logo} />}
              </div>
              <div className="absolute top-9 left-9 font-mono-label text-ink/40">print net · scale 1:1 mm</div>
            </div>
          )}
        </div>

        {/* spec rail */}
        <aside className="border-l hairline p-6 md:p-7 flex flex-col gap-6">
          <div>
            <p className="font-mono-label text-ink/45 mb-3">( Construction )</p>
            <dl className="space-y-2.5 text-sm">
              {[
                ["Box type", boxTypeName(design.boxType)],
                ["Art vibe", styleName(design.style)],
                ["Finish", finishName(design.finish)],
                ["Paper", design.paper === "kraft" ? "Kraft board" : "White board"],
                ["Inside dims", spec ? `${spec.dims.w} × ${spec.dims.h} × ${spec.dims.d} mm` : "—"],
                ["Print", "CMYK offset, 350gsm"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b hairline pb-2">
                  <dt className="text-ink/50">{k}</dt>
                  <dd className="font-medium text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <p className="font-mono-label text-ink/45 mb-3">( Palette )</p>
            <div className="flex gap-2">
              {design.colors.map((c) => (
                <div key={c} className="flex-1">
                  <div className="h-14 rounded-xl border hairline" style={{ background: c }} />
                  <p className="font-mono text-[10px] text-ink/50 mt-1.5">{c}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto space-y-4">
            <div className="flex items-end justify-between">
              <span className="font-mono-label text-ink/45">Total · {design.quantity.toLocaleString()} pcs</span>
              <span className="text-2xl font-bold tracking-tight">{pkr(unit * design.quantity)}</span>
            </div>
            <p className="font-mono-label text-ink/40 -mt-2">{pkr(unit)} per box · free delivery</p>
            {design.status === "draft" && (
              <button onClick={approve} disabled={approving} className="btn btn-line w-full justify-center">
                <Check size={13} /> {approving ? "Approving…" : "Approve design"}
              </button>
            )}
            <Link href={`/order/${design.id}`} className="btn btn-lime w-full justify-center !py-4">
              <Package size={14} /> Order this box
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
