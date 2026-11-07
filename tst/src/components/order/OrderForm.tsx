"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MapPin, Package } from "lucide-react";
import { boxTypeName, finishName, styleName, pkr, quote } from "@/lib/design/spec";
import type { DesignRow } from "@/components/chat/PlanCard";

function formatCnic(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

export default function OrderForm({ design }: { design: DesignRow }) {
  const router = useRouter();
  const [qty, setQty] = useState(design.quantity);
  const [form, setForm] = useState({ customerName: "", phone: "", cnic: "", address: "", city: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const spec = design.spec!;
  const unit = quote(design.boxType, design.finish, qty);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: k === "cnic" ? formatCnic(e.target.value) : e.target.value }));

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId: design.id, quantity: qty, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.push("/dashboard?ordered=1");
    } catch {
      setError("Network issue — try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100svh] bg-paper">
      <header className="border-b hairline">
        <div className="max-w-5xl mx-auto flex items-center gap-3 px-4 md:px-8 h-16">
          <Link href={`/studio/${design.id}`} className="w-9 h-9 grid place-items-center rounded-full border hairline hover:bg-ink hover:text-paper transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <p className="font-bold">Checkout</p>
          <span className="font-mono-label text-ink/40 ml-auto">cash on delivery · nationwide</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-10 grid md:grid-cols-[1fr_360px] gap-10">
        {/* form */}
        <div>
          <p className="font-mono-label text-ink/45 mb-6">( Where do we deliver? )</p>
          <div className="space-y-6">
            <Field label="Full name">
              <input value={form.customerName} onChange={set("customerName")} placeholder="Ali Raza" className="field" />
            </Field>
            <div className="grid sm:grid-cols-2 gap-6">
              <Field label="Phone / WhatsApp">
                <input value={form.phone} onChange={set("phone")} placeholder="0301 2345678" inputMode="tel" className="field" />
              </Field>
              <Field label="CNIC">
                <input value={form.cnic} onChange={set("cnic")} placeholder="35202-1234567-1" inputMode="numeric" className="field" />
              </Field>
            </div>
            <Field label="Street address">
              <textarea value={form.address} onChange={set("address")} rows={2} placeholder="House 12, Street 4, DHA Phase 5" className="field resize-none" />
            </Field>
            <div className="grid sm:grid-cols-2 gap-6">
              <Field label="City">
                <input value={form.city} onChange={set("city")} placeholder="Lahore" className="field" />
              </Field>
              <Field label="Quantity" hint="min 50 — more = cheaper per box">
                <input type="number" min={50} step={50} value={qty}
                  onChange={(e) => setQty(Math.max(50, Number(e.target.value) || 50))} className="field" />
              </Field>
            </div>
            <Field label="Notes for production (optional)">
              <textarea value={form.notes} onChange={set("notes")} rows={2} placeholder="e.g. matte both sides, no glue smell, call before dispatch" className="field resize-none" />
            </Field>
          </div>
          {error && <p className="mt-5 text-sm text-[#E23B2E] font-medium">{error}</p>}
        </div>

        {/* summary */}
        <aside className="border hairline rounded-2xl overflow-hidden self-start sticky top-6">
          <div className="bg-ink text-paper px-5 py-4">
            <p className="font-mono-label text-paper/50 mb-1">Your design</p>
            <p className="font-bold text-lg leading-tight">{design.brand || "Untitled"} — {design.product || "box"}</p>
          </div>
          <div className="p-5 space-y-2.5 text-sm">
            {[
              ["Model", boxTypeName(design.boxType)],
              ["Size", `${spec.dims.w}×${spec.dims.h}×${spec.dims.d} mm`],
              ["Vibe", styleName(design.style)],
              ["Finish", finishName(design.finish)],
              ["Quantity", qty.toLocaleString()],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b hairline pb-2">
                <span className="text-ink/50">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
            <div className="flex gap-1.5 pt-1">
              {design.colors.map((c) => (
                <span key={c} className="w-6 h-6 rounded-full border hairline" style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="px-5 pb-5">
            <div className="flex items-end justify-between mb-1">
              <span className="font-mono-label text-ink/45">Total</span>
              <span className="text-3xl font-bold tracking-tight">{pkr(unit * qty)}</span>
            </div>
            <p className="font-mono-label text-ink/40 mb-4">{pkr(unit)} / box · pay on delivery</p>
            <button onClick={submit} disabled={busy} className="btn btn-lime w-full justify-center !py-4">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <><Package size={14} /> Place order</>}
            </button>
            <p className="font-mono-label text-ink/40 mt-3 flex items-center gap-1.5">
              <MapPin size={11} /> courier verifies CNIC on delivery
            </p>
          </div>
        </aside>
      </main>

      <style jsx>{`
        .field {
          width: 100%;
          background: transparent;
          border-bottom: 1px solid var(--color-line);
          padding: 8px 0;
          outline: none;
          font-size: 16px;
          transition: border-color 0.3s;
        }
        .field:focus { border-color: var(--color-ink); }
        .field::placeholder { color: rgba(20, 20, 18, 0.3); }
      `}</style>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono-label text-ink/45 block mb-1.5">{label}</span>
      {children}
      {hint && <span className="font-mono text-[10px] text-ink/40 mt-1 block">{hint}</span>}
    </label>
  );
}
