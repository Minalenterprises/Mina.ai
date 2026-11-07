"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUp, Paperclip, X, Plus } from "lucide-react";
import PlanCard, { type DesignRow } from "./PlanCard";
import DesignCard from "./DesignCard";

type Msg = {
  id: string;
  role: string;
  kind: string;
  content: string;
  meta: Record<string, unknown> | null;
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-ink typing-dot" style={{ animationDelay: `${i * 160}ms` }} />
      ))}
    </div>
  );
}

export default function ChatUI({
  convoId,
  initialMessages,
  initialDesigns,
  title,
}: {
  convoId: string;
  initialMessages: Msg[];
  initialDesigns: DesignRow[];
  title: string;
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [designs, setDesigns] = useState<Record<string, DesignRow>>(
    Object.fromEntries(initialDesigns.map((d) => [d.id, d]))
  );
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const ensureDesign = useCallback(
    async (id: string) => {
      if (designs[id]) return;
      const res = await fetch(`/api/designs/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDesigns((prev) => ({ ...prev, [id]: data.design }));
      }
    },
    [designs]
  );

  // hydrate designs referenced by plan/design messages
  useEffect(() => {
    for (const m of messages) {
      const did = (m.meta as { designId?: string } | null)?.designId;
      if (did && !designs[did]) void ensureDesign(did);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // scroll to bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const onFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1000;
        const r = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * r);
        c.height = Math.round(img.height * r);
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        setAttachment(c.toDataURL("image/jpeg", 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const send = async (preset?: string) => {
    const content = (preset ?? input).trim();
    if ((!content && !attachment) || sending) return;
    const att = attachment;
    const temp: Msg = {
      id: `tmp-${Date.now()}`,
      role: "user",
      kind: att ? "image" : "text",
      content: content || "Shared an image",
      meta: att ? { image: att } : null,
    };
    setMessages((m) => [...m, temp]);
    setInput("");
    setAttachment(null);
    if (taRef.current) taRef.current.style.height = "auto";
    setSending(true);
    setTyping(true);
    try {
      const res = await fetch(`/api/chat/${convoId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, attachment: att }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      const fresh: Msg[] = data.messages;
      // reveal messages one by one for a chatty feel
      await new Promise((r) => setTimeout(r, 450));
      for (let i = 0; i < fresh.length; i++) {
        await new Promise((r) => setTimeout(r, i === 0 ? 0 : 480));
        const msg = fresh[i];
        setMessages((m) => [...m, msg]);
        const did = (msg.meta as { designId?: string } | null)?.designId;
        if (did) void ensureDesign(did);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { id: `err-${Date.now()}`, role: "assistant", kind: "text", content: "Something glitched — try that again?", meta: null },
      ]);
    } finally {
      setTyping(false);
      setSending(false);
    }
  };

  const lastIdx = messages.length - 1;
  const lastAssistantWithChips = (() => {
    for (let i = lastIdx; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant" && m.kind === "text") {
        const chips = (m.meta as { chips?: string[] } | null)?.chips;
        return { idx: i, chips };
      }
      if (m.role === "assistant" && (m.kind === "plan" || m.kind === "design")) return { idx: -1, chips: undefined };
    }
    return { idx: -1, chips: undefined };
  })();
  const showChips = !typing && lastAssistantWithChips.idx === lastIdx && lastAssistantWithChips.chips?.length;

  return (
    <div className="h-[100svh] flex flex-col bg-paper">
      {/* header */}
      <header className="border-b hairline bg-paper/85 backdrop-blur-sm z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 md:px-6 h-16">
          <Link href="/" className="w-9 h-9 grid place-items-center rounded-full border hairline hover:bg-ink hover:text-paper transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate leading-tight">{title}</p>
            <p className="font-mono-label text-ink/45 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-lime inline-block pulse-dot" />
              minal — AI packaging designer
            </p>
          </div>
          <Link href="/chat" className="font-mono-label flex items-center gap-1.5 text-ink/50 hover:text-ink transition-colors">
            <Plus size={14} /> New
          </Link>
        </div>
      </header>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-5">
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const gap = prev && prev.role === m.role && prev.kind === m.kind;
            if (m.kind === "plan") {
              const did = (m.meta as { designId?: string } | null)?.designId;
              const design = did ? designs[did] : null;
              return (
                <div key={m.id} className="msg-in">
                  <Bubble role="assistant" content={m.content} gap={gap} />
                  <div className="mt-2 ml-9 md:ml-11">
                    {design ? (
                      <PlanCard
                        design={design}
                        onChanged={(d) => setDesigns((p) => ({ ...p, [d.id]: d }))}
                        onApproved={(d) => {
                          setDesigns((p) => ({ ...p, [d.id]: d }));
                          // pull the fresh "design card" message from the server
                          fetch(`/api/chat/${convoId}`)
                            .then((r) => r.json())
                            .then((data) => setMessages(data.messages));
                        }}
                      />
                    ) : (
                      <div className="font-mono-label text-ink/40 animate-pulse">building plan…</div>
                    )}
                  </div>
                </div>
              );
            }
            if (m.kind === "design") {
              const did = (m.meta as { designId?: string } | null)?.designId;
              const design = did ? designs[did] : null;
              return (
                <div key={m.id} className="msg-in">
                  <Bubble role="assistant" content={m.content} gap={gap} />
                  <div className="mt-2 ml-9 md:ml-11">
                    {design ? <DesignCard design={design} /> : <div className="font-mono-label text-ink/40 animate-pulse">loading preview…</div>}
                  </div>
                </div>
              );
            }
            if (m.kind === "image") {
              const src = (m.meta as { image?: string } | null)?.image;
              return (
                <div key={m.id} className={`msg-in flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                  {src && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="upload" className="max-w-[180px] rounded-xl border hairline" />
                  )}
                  <span className="font-mono-label text-ink/40 mt-1.5">{m.content}</span>
                </div>
              );
            }
            return <Bubble key={m.id} role={m.role} content={m.content} gap={gap} />;
          })}

          {typing && (
            <div className="ml-9 md:ml-11">
              <TypingDots />
            </div>
          )}

          {showChips && (
            <div className="flex flex-wrap gap-2 ml-9 md:ml-11 msg-in">
              {lastAssistantWithChips.chips!.map((c) => (
                <button key={c} className="chip" onClick={() => send(c)}>
                  {c}
                </button>
              ))}
            </div>
          )}
          <div className="h-2" />
        </div>
      </div>

      {/* composer */}
      <div className="border-t hairline bg-paper/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-3.5">
          {attachment && (
            <div className="flex items-center gap-2 mb-2.5">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={attachment} alt="attachment" className="w-14 h-14 object-cover rounded-lg border hairline" />
                <button onClick={() => setAttachment(null)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink text-paper grid place-items-center">
                  <X size={11} />
                </button>
              </div>
              <span className="font-mono-label text-ink/45">logo / reference attached</span>
            </div>
          )}
          <div className="flex items-end gap-2">
            <button onClick={() => fileRef.current?.click()}
              className="w-11 h-11 shrink-0 grid place-items-center rounded-full border hairline hover:bg-ink hover:text-paper transition-colors">
              <Paperclip size={16} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(110, e.target.scrollHeight) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Describe your product, brand, colors…"
              rows={1}
              className="flex-1 resize-none bg-transparent outline-none py-3 px-1 placeholder:text-ink/35 text-[15px] leading-snug"
            />
            <button onClick={() => void send()} disabled={sending || (!input.trim() && !attachment)}
              className="w-11 h-11 shrink-0 grid place-items-center rounded-full bg-ink text-paper hover:bg-lime hover:text-ink transition-colors disabled:opacity-30">
              <ArrowUp size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({ role, content, gap }: { role: string; content: string; gap: boolean }) {
  const isUser = role === "user";
  return (
    <div className={`msg-in flex ${isUser ? "justify-end" : "justify-start"} ${gap ? "-mt-2" : ""}`}>
      {!isUser && (
        <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-ink text-lime grid place-items-center font-bold text-[11px] mr-2.5 md:mr-3 mt-0.5 shrink-0">
          m
        </div>
      )}
      <div
        className={
          isUser
            ? "bg-ink text-paper rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%] text-[15px] leading-snug whitespace-pre-line"
            : "text-ink max-w-[85%] text-[15px] leading-relaxed whitespace-pre-line pt-1"
        }
      >
        {content}
      </div>
    </div>
  );
}
