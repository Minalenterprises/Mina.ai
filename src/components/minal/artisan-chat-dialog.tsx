"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  MessageSquare,
  Package,
  Clock,
  CheckCircle2,
  ExternalLink,
  Phone,
  Paperclip,
  Check
} from "lucide-react";
import { useMinal } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { OrderRecord } from "@/lib/types";

interface ArtisanChatDialogProps {
  open: boolean;
  onClose: () => void;
  orderId?: string;
}

export function ArtisanChatDialog({ open, onClose, orderId }: ArtisanChatDialogProps) {
  const [draft, setDraft] = useState("");
  const orders = useMinal((s) => s.orders);
  const adminChat = useMinal((s) => s.adminChat);
  const sendAdminMessage = useMinal((s) => s.sendAdminMessage);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedOrder: OrderRecord | undefined = orderId
    ? orders.find((o) => o.id === orderId)
    : orders[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [adminChat.length, open]);

  const handleSend = () => {
    if (!draft.trim()) return;
    const userText = draft.trim();
    sendAdminMessage(userText, "user");
    setDraft("");

    // Automated intelligent artisan response simulation
    setTimeout(() => {
      let reply =
        "Thank you for contacting Minal Enterprises factory floor! Our production manager in Jalvi Market, Faisalabad has received your inquiry. We are reviewing your specs and substrate availability.";
      if (selectedOrder) {
        reply = `Hello ${selectedOrder.info.fullName || "valued client"}! Your order #MINAL-${selectedOrder.id.slice(0, 8).toUpperCase()} for ${selectedOrder.info.quantity}x ${selectedOrder.spec.title || selectedOrder.spec.kind} (${selectedOrder.spec.width}"x${selectedOrder.spec.length}"x${selectedOrder.spec.height}") is logged. Current status: ${selectedOrder.status.toUpperCase()}. Our master printers are preparing the offset plates.`;
      }
      sendAdminMessage(reply, "admin");
    }, 1200);
  };

  const handleWhatsApp = () => {
    let text = "Hello Minal Enterprises, I am contacting you regarding custom packaging and printing inquiry.";
    if (selectedOrder) {
      text = `Hello Minal Enterprises, I have placed Order #MINAL-${selectedOrder.id.slice(0, 8).toUpperCase()} for ${selectedOrder.info.quantity}x ${selectedOrder.spec.title || selectedOrder.spec.kind} (${selectedOrder.spec.width}"x${selectedOrder.spec.length}"x${selectedOrder.spec.height}"). Client: ${selectedOrder.info.fullName}. I would like to confirm production timelines!`;
    }
    window.open(`https://wa.me/923006601081?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-3 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Dialog Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl h-[82vh] max-h-[700px] rounded-[24px] bg-[#121214] border border-white/10 text-white shadow-2xl flex flex-col overflow-hidden z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 grid place-items-center text-white font-bold shadow-md">
                    ME
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-white border-2 border-[#121214]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-bold text-white">
                      Minal Production Floor
                    </h3>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/20">
                      Live Support
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50">
                    Faisalabad Workshop · +92 300 660 1081
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleWhatsApp}
                  className="px-2.5 py-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 text-[11px] font-semibold flex items-center gap-1.5 transition"
                  title="Open WhatsApp"
                >
                  <Phone className="w-3 h-3" />
                  WhatsApp
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white grid place-items-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Order Status Banner if order exists */}
            {selectedOrder && (
              <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/5 flex items-center justify-between text-[11.5px]">
                <div className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-white" />
                  <span className="font-semibold text-white/90">
                    Order #MINAL-{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="text-white/40">
                    ({selectedOrder.spec.title || selectedOrder.spec.kind})
                  </span>
                </div>
                <div className="flex items-center gap-1 text-white font-mono text-[10px] uppercase bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
                  <Clock className="w-2.5 h-2.5" />
                  {selectedOrder.status}
                </div>
              </div>
            )}

            {/* Chat message thread */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 minal-scroll"
            >
              {adminChat.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/50">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 grid place-items-center mb-3">
                    <MessageSquare className="w-6 h-6 text-white/40" />
                  </div>
                  <h4 className="text-[13px] font-semibold text-white mb-1">
                    Direct Artisan Channel
                  </h4>
                  <p className="text-[11px] max-w-xs text-white/40 leading-relaxed">
                    Ask anything about production lead times, paper stock samples, foil tooling, or delivery in Pakistan & abroad.
                  </p>
                </div>
              ) : (
                adminChat.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-2.5 max-w-[85%]",
                        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                      )}
                    >
                      <div
                        className={cn(
                          "w-7 h-7 rounded-xl grid place-items-center text-[10px] font-bold shrink-0",
                          isUser
                            ? "bg-white/10 text-white"
                            : "bg-white text-black"
                        )}
                      >
                        {isUser ? "You" : "ME"}
                      </div>
                      <div
                        className={cn(
                          "p-3 rounded-2xl text-[12.5px] leading-relaxed",
                          isUser
                            ? "bg-white text-black font-semibold rounded-tr-sm"
                            : "bg-white/10 text-white rounded-tl-sm border border-white/5"
                        )}
                      >
                        <p>{msg.content}</p>
                        <span
                          className={cn(
                            "block text-[9px] mt-1 opacity-60",
                            isUser ? "text-right" : "text-left"
                          )}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick response prompts */}
            <div className="px-4 py-2 border-t border-white/5 bg-black/20 flex gap-1.5 overflow-x-auto minal-scroll-hidden">
              {[
                "Can I see a physical proof?",
                "What is the dispatch date?",
                "Can we change the foil color?",
                "Need 1,000 more units",
              ].map((pill) => (
                <button
                  key={pill}
                  onClick={() => {
                    setDraft(pill);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10.5px] text-white/70 hover:text-white shrink-0 transition"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 border-t border-white/10 bg-black/40 flex items-center gap-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your message to the production team..."
                className="flex-1 bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-[12.5px] text-white placeholder:text-white/30 outline-none transition"
              />
              <button
                onClick={handleSend}
                type="submit"
                disabled={!draft.trim()}
                className="w-10 h-10 rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:hover:bg-white text-black grid place-items-center transition shadow-lg shadow-white/10 shrink-0"
              >
                <Send className="w-4 h-4 text-black" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
