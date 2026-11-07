"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, RefreshCw, Send } from "lucide-react";
import { boxTypeName, pkr } from "@/lib/design/spec";

const STATUSES = ["pending", "preparing", "shipping", "delivered", "cancelled"] as const;

type OrderRow = {
  order: {
    id: string; customerName: string; phone: string; cnic: string; address: string; city: string;
    notes: string; quantity: number; unitPrice: number; totalPrice: number; status: string; createdAt: string;
  };
  design: { id: string; brand: string; product: string; boxType: string; style: string; colors: string[] };
};

type Thread = { userId: string; userName: string | null; last: string; lastAt: string; count: number };
type SMsg = { id: string; sender: string; senderName: string; content: string; createdAt: string };
type DesignRow = {
  design: { id: string; brand: string; product: string; boxType: string; status: string; quantity: number; colors: string[]; createdAt: string };
  user: { name: string | null };
};

export default function AdminClient() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [badKey, setBadKey] = useState(false);
  const [tab, setTab] = useState<"orders" | "support" | "designs">("orders");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [designs, setDesigns] = useState<DesignRow[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [threadMsgs, setThreadMsgs] = useState<SMsg[]>([]);
  const [reply, setReply] = useState("");
  const [senderName, setSenderName] = useState("Ayesha (Print Manager)");
  const [loading, setLoading] = useState(false);

  const headers = useCallback(() => ({ "Content-Type": "application/json", "x-admin-key": key }), [key]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [o, d, t] = await Promise.all([
      fetch("/api/admin/orders", { headers: headers() }),
      fetch("/api/admin/designs", { headers: headers() }),
      fetch("/api/admin/support", { headers: headers() }),
    ]);
    if (o.status === 401) {
      setAuthed(false);
      setBadKey(true);
      sessionStorage.removeItem("minal_admin_key");
    } else {
      setOrders((await o.json()).orders);
      setDesigns((await d.json()).designs);
      setThreads((await t.json()).threads);
      setAuthed(true);
    }
    setLoading(false);
  }, [headers]);

  useEffect(() => {
    const saved = sessionStorage.getItem("minal_admin_key");
    if (saved) {
      setKey(saved);
    }
  }, []);

  useEffect(() => {
    if (key && !authed) void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const openThread = async (userId: string) => {
    setActiveThread(userId);
    const res = await fetch(`/api/admin/support?userId=${userId}`, { headers: headers() });
    if (res.ok) setThreadMsgs((await res.json()).messages);
  };

  const sendReply = async () => {
    if (!reply.trim() || !activeThread) return;
    await fetch("/api/admin/support", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ userId: activeThread, content: reply, senderName }),
    });
    setReply("");
    void openThread(activeThread);
    void loadAll();
  };

  const setStatus = async (id: string, status: string) => {
    setOrders((os) => os.map((r) => (r.order.id === id ? { ...r, order: { ...r.order, status } } : r)));
    await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: headers(), body: JSON.stringify({ status }) });
  };

  if (!authed) {
    return (
      <div className="min-h-[100svh] grid place-items-center bg-ink text-paper px-5">
        <div className="w-full max-w-sm">
          <p className="text-3xl font-bold tracking-tight mb-1.5">minal<span className="text-lime">.</span> admin</p>
          <p className="font-mono-label text-paper/45 mb-8">studio staff only</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sessionStorage.setItem("minal_admin_key", key);
              void loadAll();
            }}
          >
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Access key"
              className="w-full bg-transparent border-b border-white/25 focus:border-lime outline-none py-3 text-lg placeholder:text-paper/30 transition-colors"
            />
            {badKey && <p className="text-[#FF6B5B] text-sm mt-2">Wrong key.</p>}
            <button className="btn btn-lime w-full justify-center mt-8">{loading ? <Loader2 size={14} className="animate-spin" /> : "Enter studio"}</button>
          </form>
          <div className="flex justify-between mt-10">
            <p className="font-mono text-[10px] text-paper/30">demo key: minal-admin</p>
            <Link href="/" className="font-mono text-[10px] text-paper/40 hover:text-lime">← back to site</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-paper">
      <header className="border-b hairline bg-ink text-paper sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center gap-3 px-4 md:px-6 h-16">
          <Link href="/" className="w-9 h-9 grid place-items-center rounded-full border border-white/20 hover:bg-lime hover:text-ink hover:border-lime transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <p className="font-bold">Admin studio</p>
          <div className="flex-1" />
          <div className="flex items-center border border-white/20 rounded-full overflow-hidden">
            {(["orders", "support", "designs"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 font-mono-label transition-colors ${tab === t ? "bg-lime text-ink" : "text-paper/60 hover:text-paper"}`}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={() => void loadAll()} className="w-9 h-9 grid place-items-center rounded-full border border-white/20 hover:bg-lime hover:text-ink transition-colors">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {tab === "orders" && (
          <div>
            <p className="font-mono-label text-ink/45 mb-5">{orders.length} orders total</p>
            {orders.length === 0 && <p className="text-ink/50 py-10 border-t hairline">No orders yet.</p>}
            <div className="border-t hairline">
              {orders.map(({ order, design }) => (
                <div key={order.id} className="border-b hairline py-5 grid md:grid-cols-[1.2fr_1.4fr_auto] gap-4 items-start">
                  <div>
                    <p className="font-bold">{design.brand || "Untitled"} — {design.product || "box"}</p>
                    <p className="font-mono-label text-ink/45 mt-1">
                      #{order.id.slice(0, 8).toUpperCase()} · {boxTypeName(design.boxType)} · ×{order.quantity.toLocaleString()} · {pkr(order.totalPrice)}
                    </p>
                    <div className="flex gap-1.5 mt-2">
                      {design.colors.map((c) => <span key={c} className="w-4 h-4 rounded-full border hairline" style={{ background: c }} />)}
                    </div>
                  </div>
                  <div className="text-sm text-ink/70 leading-relaxed">
                    <p className="font-medium text-ink">{order.customerName} · {order.phone}</p>
                    <p>{order.address}, {order.city}</p>
                    <p className="font-mono text-[11px] text-ink/50 mt-1">CNIC {order.cnic}{order.notes ? ` · "${order.notes}"` : ""}</p>
                  </div>
                  <select value={order.status} onChange={(e) => void setStatus(order.id, e.target.value)}
                    className="border hairline rounded-full px-3 py-2 bg-transparent font-mono-label outline-none cursor-pointer">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "support" && (
          <div className="grid md:grid-cols-[300px_1fr] gap-6">
            <div className="border hairline rounded-2xl overflow-hidden self-start">
              <p className="font-mono-label text-ink/45 px-4 py-3 border-b hairline bg-ink/[0.03]">Inbox</p>
              {threads.length === 0 && <p className="text-ink/50 text-sm p-4">No conversations yet.</p>}
              {threads.map((t) => (
                <button key={t.userId} onClick={() => void openThread(t.userId)}
                  className={`w-full text-left px-4 py-3 border-b hairline hover:bg-ink/[0.04] transition-colors ${activeThread === t.userId ? "bg-lime/25" : ""}`}>
                  <p className="font-bold text-sm">{t.userName || "Guest seller"}</p>
                  <p className="text-[12px] text-ink/55 truncate mt-0.5">{t.last}</p>
                  <p className="font-mono text-[9px] text-ink/35 mt-1">{t.count} msgs</p>
                </button>
              ))}
            </div>
            <div className="border hairline rounded-2xl flex flex-col min-h-[420px]">
              {!activeThread ? (
                <p className="font-mono-label text-ink/40 m-auto">pick a conversation</p>
              ) : (
                <>
                  <div className="px-4 py-3 border-b hairline flex items-center gap-3">
                    <input value={senderName} onChange={(e) => setSenderName(e.target.value)}
                      className="font-mono-label bg-transparent outline-none border-b hairline focus:border-ink py-0.5" />
                    <span className="font-mono-label text-ink/35 ml-auto">replying as</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[50vh]">
                    {threadMsgs.map((m) => (
                      <div key={m.id} className={`flex flex-col ${m.sender === "user" ? "items-start" : "items-end"}`}>
                        <span className="font-mono text-[9px] text-ink/40 mb-0.5">{m.senderName}</span>
                        <div className={`px-3.5 py-2 rounded-2xl text-sm max-w-[75%] ${m.sender === "user" ? "bg-ink/[0.06]" : m.sender === "bot" ? "bg-lime/35 border border-lime" : "bg-ink text-paper"}`}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t hairline p-3 flex gap-2">
                    <input value={reply} onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && void sendReply()}
                      placeholder="Reply to customer…"
                      className="flex-1 bg-transparent outline-none py-2 text-sm placeholder:text-ink/35" />
                    <button onClick={() => void sendReply()} className="w-9 h-9 grid place-items-center rounded-full bg-ink text-paper hover:bg-lime hover:text-ink transition-colors">
                      <Send size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {tab === "designs" && (
          <div>
            <p className="font-mono-label text-ink/45 mb-5">{designs.length} designs generated</p>
            <div className="border-t hairline">
              {designs.map(({ design, user }) => (
                <div key={design.id} className="border-b hairline py-4 flex items-center gap-4">
                  <div className="flex -space-x-1.5">
                    {design.colors.map((c) => <span key={c} className="w-5 h-5 rounded-full border-2 border-paper" style={{ background: c }} />)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{design.brand || "Untitled"} — {design.product || "box"}</p>
                    <p className="font-mono-label text-ink/40 mt-0.5">
                      {user.name ?? "guest"} · {boxTypeName(design.boxType)} · ×{design.quantity.toLocaleString()} · {new Date(design.createdAt).toLocaleDateString("en-PK")}
                    </p>
                  </div>
                  <span className={`font-mono-label px-3 py-1.5 rounded-full border ${design.status === "ordered" ? "bg-lime border-lime" : design.status === "approved" ? "bg-ink text-paper border-ink" : "border-ink/20 text-ink/60"}`}>
                    {design.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
