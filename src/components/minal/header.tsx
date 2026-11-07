"use client";

import { Link } from "@/lib/router";
import { sfx } from "@/lib/sound";
import { useMinal } from "@/lib/store";
import {
  Menu,
  MessageSquare,
  ShoppingBag,
  SquarePen,
  User,
  ChevronDown,
} from "lucide-react";

interface HeaderProps {
  onOpenModelSheet?: () => void;
  onOpenArtisanChat?: () => void;
}

export function Header({ onOpenModelSheet, onOpenArtisanChat }: HeaderProps) {
  const setMobileSidebar = useMinal((s) => s.setMobileSidebar);
  const openOrder = useMinal((s) => s.openOrder);
  const newConversation = useMinal((s) => s.newConversation);
  const orders = useMinal((s) => s.orders);
  const settings = useMinal((s) => s.settings);
  const activeConnector = settings.connectors[settings.activeConnector];
  const selectedModel = activeConnector?.selectedModel ?? "Nemotron 3 Ultra";

  const modelDisplayName = selectedModel.includes("nemotron-3-ultra")
    ? "Nemotron 3 Ultra"
    : selectedModel.includes("claude")
    ? "Claude 3.5 Sonnet"
    : selectedModel.includes("gpt-4o")
    ? "GPT-4o"
    : "Smart Mode";

  return (
    <header className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-5 bg-transparent text-white safe-top z-20">
      {/* Left side: Hamburger menu + Brand Logo */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => {
            sfx.click();
            setMobileSidebar(true);
          }}
          className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white grid place-items-center md:hidden transition"
          aria-label="Open sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>

        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-90 transition group"
        >
          <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 grid place-items-center shadow-sm">
            <svg width="18" height="18" viewBox="0 0 25 25" fill="none">
              <circle cx="12.5" cy="12.5" r="12.5" fill="#14181a" />
              <path d="M12.5 0L25 12.5L12.5 25L0 12.5Z" fill="#737778" />
              <path d="M12.5 2.5L22.5 12.5L12.5 22.5L2.5 12.5Z" fill="#050606" />
              <path d="M12.5 5L20 12.5L12.5 20L5 12.5Z" fill="#0a0b0b" />
              <path d="M12.5 7L18 12.5L12.5 18L7 12.5Z" fill="#fafafa" />
              <path d="M12.5 9L16 12.5L12.5 16L9 12.5Z" fill="#050606" />
            </svg>
          </div>
          <span className="font-bold text-[14px] tracking-tight hidden sm:inline-block text-white">
            Minal<span className="text-white/60">.ai</span>
          </span>
        </Link>
      </div>

      {/* Center: Model Switcher Capsule Pill (Matching phone mockup) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            sfx.click();
            onOpenModelSheet?.();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[12px] font-semibold text-white shadow-sm transition hover:border-white/35 backdrop-blur-md"
          title="Change Model Engine"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="truncate max-w-[120px] sm:max-w-[180px]">
            {modelDisplayName}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-white/50" />
        </button>
      </div>

      {/* Right Actions: Artisan Chat, Orders, New Chat, Login */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Chat with Artisan Button */}
        <button
          onClick={() => {
            sfx.click();
            onOpenArtisanChat?.();
          }}
          className="relative px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 text-[11.5px] font-semibold flex items-center gap-1.5 transition backdrop-blur-md"
          title="Chat with Minal Production Team"
        >
          <MessageSquare className="w-3.5 h-3.5 text-white" />
          <span className="hidden sm:inline">Artisan Chat</span>
          <span className="w-1.5 h-1.5 rounded-full bg-white hidden sm:inline-block" />
        </button>

        {/* Order button with count badge */}
        <button
          onClick={() => {
            sfx.click();
            openOrder(true);
          }}
          className="relative w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white grid place-items-center transition"
          title="Order Custom Packaging"
        >
          <ShoppingBag className="w-4 h-4" />
          {orders.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-black text-[9px] font-bold grid place-items-center shadow-sm">
              {orders.length}
            </span>
          )}
        </button>

        {/* New Chat pencil button */}
        <button
          onClick={() => {
            sfx.click();
            newConversation();
          }}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white grid place-items-center transition"
          title="New Packaging Project"
        >
          <SquarePen className="w-4 h-4" />
        </button>

        {/* Login / Client Portal link */}
        <Link
          href="/login"
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white grid place-items-center transition ml-0.5"
          title="Client Sign In / Portal"
        >
          <User className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
}
