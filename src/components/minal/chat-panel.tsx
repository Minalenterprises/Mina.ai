"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMinal, activeConversation } from "@/lib/store";
import { MessageBubble } from "./message-bubble";
import { WelcomeScreen } from "./welcome-screen";

export function ChatPanel() {
  const conv = useMinal((s) => activeConversation(s));
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [conv?.messages.length, conv?.messages, conv?.updatedAt]);

  if (!conv || conv.messages.length === 0) {
    return <WelcomeScreen />;
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto minal-scroll">
      <div className="max-w-3xl mx-auto py-4">
        <AnimatePresence initial={false}>
          {conv.messages.map((m) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <MessageBubble message={m} conversationId={conv.id} />
            </motion.div>
          ))}
        </AnimatePresence>
        <div className="h-4" />
      </div>
    </div>
  );
}
