"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUp, Bot, ShieldCheck, User } from "lucide-react";

type SMsg = {
  id: string;
  sender: "user" | "bot" | "admin";
  senderName: string;
  content: string;
  createdAt: string;
};

const TEAM = [
  { name: "Minal Bot", role: "Instant answers — 24/7", bot: true, online: true },
  { name: "Ayesha", role: "Print manager", online: true },
  { name: "Bilal", role: "Production lead", online: false },
];

export default function SupportChat() {
  const [messages, setMessages] = useState<SMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (silent = false) => {
    try {
      const res = await fetch("/api/support");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        if (!silent) setLoaded(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(true), 5000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const content = input.trim();
    if (!content || busy) return;
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((m) => [...m, ...data.messages]);
      }
    } finally {
      setBusy(false);
    }
  };

  const time = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <div className="h-[100svh] flex flex-col bg-paper">
      <header className="border-b hairline bg-paper/85 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-3 px-4 md:px-6 h-16">
          <Link href="/dashboard" className="w-9 h-9 grid place-items-center rounded-full border hairline hover:bg-ink hover:text-paper transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex-1">
            <p className="font-bold leading-tight">Support desk</p>
            <p className="font-mono-label text-ink/45 mt-0.5">print team + minal bot</p>
          </div>
          <ShieldCheck size={18} className="text-ink/40" />
        </div>
      </header>

      <div className="flex-1 min-h-0 max-w-5xl mx-auto w-full grid md:grid-cols-[240px_1fr] md:border-x hairline">
        {/* roster */}
        <aside className="hidden md:flex flex-col border-r hairline">
          <p className="font-mono-label text-ink/45 px-4 pt-5 pb-2">The team</p>
          {TEAM.map((t) => (
            <div key={t.name} className="flex items-center gap-3 px-4 py-3 hover:bg-ink/[0.04] transition-colors cursor-default">
              <div className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${t.bot ? "bg-lime text-ink" : "bg-ink text-paper"}`}>
                {t.bot ? <Bot size={15} /> : <User size={15} />}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm truncate flex items-center gap-1.5">
                  {t.name}
                  <span className={`w-1.5 h-1.5 rounded-full ${t.online ? "bg-lime" : "bg-ink/25"}`} />
                </p>
                <p className="text-[11px] text-ink/45 truncate">{t.role}</p>
              </div>
            </div>
          ))}
          <p className="font-mono text-[10px] text-ink/35 px-4 mt-auto pb-5 leading-relaxed">
            One shared thread — bot replies instantly, humans join during working hours (PKT 10–19).
          </p>
        </aside>

        {/* chat */}
        <div className="flex flex-col min-h-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4 bg-[radial-gradient(circle_at_80%_10%,rgba(198,242,78,0.08),transparent_50%)]">
            {!loaded && <p className="font-mono-label text-ink/40 animate-pulse">loading conversation…</p>}
            {loaded && messages.length === 0 && (
              <div className="text-center py-10">
                <p className="font-bold text-lg">Ask us anything</p>
                <p className="text-ink/50 text-sm mt-1">Try: "where is my order?" or "how much for 1000 mailers?"</p>
              </div>
            )}
            {messages.map((m) => {
              const mine = m.sender === "user";
              const bot = m.sender === "bot";
              return (
                <div key={m.id} className={`msg-in flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  {!mine && (
                    <span className={`font-mono-label mb-1 ml-1 flex items-center gap-1 ${bot ? "text-ink/70" : "text-ink/50"}`}>
                      {bot && <Bot size={10} />} {m.senderName}
                    </span>
                  )}
                  <div
                    className={
                      mine
                        ? "bg-ink text-paper rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[78%] text-[15px] leading-snug"
                        : bot
                        ? "bg-lime/40 border border-lime rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[78%] text-[15px] leading-snug"
                        : "bg-paper border hairline rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[78%] text-[15px] leading-snug"
                    }
                  >
                    {m.content}
                  </div>
                  <span className="font-mono text-[9px] text-ink/35 mt-1 mx-1">{time(m.createdAt)}</span>
                </div>
              );
            })}
          </div>

          <div className="border-t hairline px-4 md:px-6 py-3.5 flex items-end gap-2 bg-paper">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              placeholder="Message the team…"
              className="flex-1 resize-none bg-transparent outline-none py-2.5 placeholder:text-ink/35 text-[15px]"
            />
            <button onClick={() => void send()} disabled={busy || !input.trim()}
              className="w-10 h-10 grid place-items-center rounded-full bg-ink text-paper hover:bg-lime hover:text-ink transition-colors disabled:opacity-30">
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
