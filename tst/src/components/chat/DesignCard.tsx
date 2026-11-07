"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Expand, Package, RotateCw } from "lucide-react";
import type { DesignRow } from "./PlanCard";

const BoxScene = dynamic(() => import("@/components/three/BoxScene"), {
  ssr: false,
  loading: () => <div className="w-full h-full grid place-items-center font-mono-label text-ink/40">rendering…</div>,
});

export default function DesignCard({ design }: { design: DesignRow }) {
  return (
    <div className="border border-ink/15 rounded-2xl overflow-hidden bg-paper">
      <div className="relative h-64 md:h-72 bg-[radial-gradient(circle_at_50%_60%,rgba(198,242,78,0.16),transparent_65%)]">
        {design.spec ? (
          <BoxScene spec={design.spec} logo={design.logo} fold={1} autoRotate interactive />
        ) : (
          <div className="w-full h-full grid place-items-center font-mono-label text-ink/40">no spec</div>
        )}
        <div className="absolute top-3 left-3 font-mono-label text-ink/50 flex items-center gap-2">
          <RotateCw size={11} className="animate-[spin_slow_6s_linear_infinite]" /> live 3d — drag to spin
        </div>
        <div className="absolute bottom-3 right-3 font-mono-label text-ink/40">
          {design.spec ? `${design.spec.dims.w}×${design.spec.dims.h}×${design.spec.dims.d}mm` : ""}
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t hairline">
        <div className="min-w-0">
          <p className="font-bold truncate">{design.brand || "Untitled"} — {design.product || "box"}</p>
          <p className="font-mono-label text-ink/45 mt-0.5">
            {design.spec?.style} · {design.spec?.finish} · ×{design.quantity.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 border-t hairline">
        <Link href={`/studio/${design.id}`}
          className="flex items-center justify-center gap-2 py-3.5 font-mono-label hover:bg-ink hover:text-paper transition-colors border-r hairline">
          <Expand size={13} /> Full preview
        </Link>
        <Link href={`/order/${design.id}`}
          className="flex items-center justify-center gap-2 py-3.5 font-mono-label bg-lime hover:bg-ink hover:text-lime transition-colors">
          <Package size={13} /> Order this
        </Link>
      </div>
    </div>
  );
}
