"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useMinal } from "@/lib/store";
import {
  Box,
  ArrowLeft,
  ShoppingBag,
  MessageSquare,
  TrendingUp,
  Package,
  Users,
  Send,
  CheckCheck,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Trash2,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "overview" | "orders" | "chat";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const orders = useMinal((s) => s.orders);
  const adminChat = useMinal((s) => s.adminChat);
  const updateOrderStatus = useMinal((s) => s.updateOrderStatus);
  const deleteOrder = useMinal((s) => s.deleteOrder);
  const sendAdminMessage = useMinal((s) => s.sendAdminMessage);
  const markAdminChatRead = useMinal((s) => s.markAdminChatRead);
  const conversations = useMinal((s) => s.conversations);

  const [msgInput, setMsgInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [adminChat, tab]);

  // mark as read when opening chat tab
  useEffect(() => {
    if (tab === "chat") markAdminChatRead("user");
  }, [tab, markAdminChatRead]);

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    revenue: orders.reduce((sum, o) => sum + (o.total ?? o.info.quantity * 50), 0),
  };

  const sendMsg = () => {
    if (!msgInput.trim()) return;
    sendAdminMessage(msgInput.trim(), "admin");
    setMsgInput("");
    // Simulate user reply after 2s
    setTimeout(() => {
      const replies = [
        "Thanks for the update!",
        "Got it, appreciate it.",
        "Perfect, when will it ship?",
        "Can I get a tracking number?",
        "Sounds good!",
      ];
      sendAdminMessage(replies[Math.floor(Math.random() * replies.length)], "user");
    }, 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="h-14 flex items-center gap-3 px-4 border-b border-border glass safe-top">
        <Link href="/home" className="flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="w-px h-6 bg-border" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#a3e635] to-[#65a30d] grid place-items-center">
            <Box className="w-4 h-4 text-black" strokeWidth={2.4} />
          </div>
          <span className="font-bold text-[14px]">Admin Panel</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <TabBtn active={tab === "overview"} onClick={() => setTab("overview")} icon={TrendingUp} label="Overview" />
          <TabBtn active={tab === "orders"} onClick={() => setTab("orders")} icon={ShoppingBag} label="Orders" badge={stats.pending} />
          <TabBtn active={tab === "chat"} onClick={() => setTab("chat")} icon={MessageSquare} label="Chat" />
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {tab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="h-full overflow-y-auto minal-scroll p-6"
            >
              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                <StatCard icon={Package} label="Total Orders" value={stats.total} color="#a3e635" />
                <StatCard icon={Clock} label="Pending" value={stats.pending} color="#f59e0b" />
                <StatCard icon={CheckCheck} label="Confirmed" value={stats.confirmed} color="#3b82f6" />
                <StatCard icon={Truck} label="Shipped" value={stats.shipped} color="#8b5cf6" />
                <StatCard icon={CheckCircle} label="Delivered" value={stats.delivered} color="#10b981" />
                <StatCard icon={TrendingUp} label="Revenue" value={`$${stats.revenue}`} color="#ec4899" />
              </div>

              {/* Two columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Recent orders */}
                <div className="minal-card rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[14px] font-bold">Recent Orders</h3>
                    <button onClick={() => setTab("orders")} className="text-[10px] text-[#65a30d] hover:underline">
                      View all →
                    </button>
                  </div>
                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-muted-foreground">
                      No orders yet. Orders placed from the chat will appear here.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {orders.slice(0, 5).map((o) => (
                        <div key={o.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/40 transition">
                          <div className="w-9 h-9 rounded-lg bg-[#a3e635]/15 grid place-items-center flex-shrink-0">
                            <Package className="w-4 h-4 text-[#65a30d]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-semibold truncate">{o.spec.title}</div>
                            <div className="text-[10px] text-muted-foreground">{o.info.fullName} · {o.info.quantity} qty</div>
                          </div>
                          <StatusBadge status={o.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* System stats */}
                <div className="minal-card rounded-2xl p-5">
                  <h3 className="text-[14px] font-bold mb-3">System</h3>
                  <div className="space-y-2">
                    <Row label="Active sessions" value={conversations.length} />
                    <Row label="Total messages" value={conversations.reduce((s, c) => s + c.messages.length, 0)} />
                    <Row label="Total designs" value={conversations.reduce((s, c) => s + (c.designHistory?.length ?? 0), 0)} />
                    <Row label="Admin chat messages" value={adminChat.length} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {tab === "orders" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="h-full overflow-y-auto minal-scroll p-6"
            >
              <h2 className="text-[20px] font-bold mb-4">All Orders ({orders.length})</h2>
              {orders.length === 0 ? (
                <div className="text-center py-20 minal-card rounded-2xl">
                  <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-[12px] text-muted-foreground">No orders yet.</p>
                  <Link href="/chat" className="inline-block mt-3 text-[11px] text-[#65a30d] hover:underline">
                    Go to chat to create orders →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => (
                    <div key={o.id} className="minal-card rounded-2xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#a3e635]/15 grid place-items-center flex-shrink-0">
                          <Package className="w-5 h-5 text-[#65a30d]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[14px] font-bold">{o.spec.title}</span>
                            <StatusBadge status={o.status} />
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(o.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-1">
                            {o.spec.kind} · {o.spec.width}"×{o.spec.length}"×{o.spec.height}" · {o.spec.material}
                          </div>
                          {/* Customer info */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-3 text-[11px]">
                            <div className="flex items-center gap-1.5"><Users className="w-3 h-3 text-muted-foreground" /> {o.info.fullName}</div>
                            <div className="flex items-center gap-1.5"><Package className="w-3 h-3 text-muted-foreground" /> Qty: {o.info.quantity}</div>
                            {o.info.companyName && <div className="flex items-center gap-1.5"><Box className="w-3 h-3 text-muted-foreground" /> {o.info.companyName}</div>}
                            {o.info.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-muted-foreground" /> {o.info.phone}</div>}
                            {o.info.email && <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-muted-foreground" /> {o.info.email}</div>}
                            {o.info.address && <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-muted-foreground" /> {o.info.address}</div>}
                          </div>
                        </div>
                        <button
                          onClick={() => { if (confirm("Delete this order?")) deleteOrder(o.id); }}
                          className="p-1.5 rounded hover:bg-red-500/15 hover:text-red-500 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {/* Status actions */}
                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground mr-2">Update status:</span>
                        {(["pending", "confirmed", "shipped", "delivered", "cancelled"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => updateOrderStatus(o.id, s)}
                            className={cn(
                              "px-2 py-1 rounded text-[9px] font-semibold uppercase tracking-wider transition",
                              o.status === s ? "bg-[#a3e635] text-black" : "border border-border hover:bg-accent"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="h-full flex flex-col"
            >
              {/* WhatsApp-style chat */}
              <div className="flex-1 overflow-y-auto minal-scroll px-4 py-6 bg-[radial-gradient(rgba(10,10,11,0.02)_1px,transparent_1.2px)] [background-size:18px_18px]">
                <div className="max-w-2xl mx-auto">
                  {adminChat.length === 0 ? (
                    <div className="text-center py-20">
                      <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-[12px] text-muted-foreground">No messages yet.</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">Send a message to start the conversation.</p>
                    </div>
                  ) : (
                    adminChat.map((m) => (
                      <div
                        key={m.id}
                        className={cn("flex mb-3", m.role === "admin" ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] px-3.5 py-2 rounded-2xl shadow-sm",
                            m.role === "admin"
                              ? "bg-[#a3e635] text-black rounded-br-md"
                              : "bg-white border border-border rounded-bl-md"
                          )}
                        >
                          <div className="text-[13px] leading-relaxed">{m.content}</div>
                          <div className={cn("text-[9px] mt-1 flex items-center gap-1 justify-end", m.role === "admin" ? "text-black/50" : "text-muted-foreground")}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {m.role === "admin" && <CheckCheck className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>
              {/* Input */}
              <div className="border-t border-border p-3 bg-card safe-bottom">
                <div className="max-w-2xl mx-auto flex items-center gap-2">
                  <input
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") sendMsg(); }}
                    placeholder="Type a reply..."
                    className="flex-1 h-10 px-4 rounded-full border border-border bg-background text-[13px] outline-none focus:border-[#a3e635]/40"
                  />
                  <button
                    onClick={sendMsg}
                    disabled={!msgInput.trim()}
                    className="w-10 h-10 rounded-full minal-btn-primary grid place-items-center disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label, badge }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 h-9 rounded-lg text-[11.5px] font-semibold transition relative",
        active ? "bg-[#a3e635]/15 text-[#65a30d]" : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
      {badge ? (
        <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[8px] font-bold">{badge}</span>
      ) : null}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string; value: string | number; color: string }) {
  return (
    <div className="minal-card rounded-2xl p-3 relative overflow-hidden">
      <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full opacity-15" style={{ background: color }} />
      <div className="w-7 h-7 rounded-lg grid place-items-center mb-2" style={{ background: `${color}20` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="text-[20px] font-bold leading-none">{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className="text-[12px] font-semibold font-mono">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-600",
    confirmed: "bg-blue-500/15 text-blue-600",
    shipped: "bg-violet-500/15 text-violet-600",
    delivered: "bg-green-500/15 text-green-600",
    cancelled: "bg-red-500/15 text-red-600",
  };
  return (
    <span className={cn("px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider", colors[status] ?? "bg-muted text-muted-foreground")}>
      {status}
    </span>
  );
}
