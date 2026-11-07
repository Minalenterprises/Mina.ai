"use client";

import React, { useState, useRef, useEffect } from "react";
import { useMinal, activeConversation } from "@/lib/store";
import { useChat } from "@/lib/use-chat";
import { useRouter } from "@/lib/router";
import { sfx } from "@/lib/sound";
import {
  Search,
  Bell,
  Settings,
  ChevronDown,
  Plus,
  Mic,
  ArrowUp,
  Box,
  Layers,
  ShoppingBag,
  Sliders,
  FolderOpen,
  Shuffle,
  Send,
  Square,
  CheckCircle2,
  ExternalLink,
  Cpu,
  Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatPanel } from "./chat-panel";
import { toast } from "sonner";
import { fileToAttachment } from "@/lib/store";
import type { Attachment } from "@/lib/types";
import { AttachmentPreviewStrip } from "./attachment-preview-strip";

const QUICK_CARDS = [
  {
    id: "rigid",
    title: "Luxury Rigid Boxes",
    description: "Your expert AI assistant for rigid boxes & magnetic closures",
    icon: Box,
    prompt: "Design a luxury rigid lift-off lid perfume box for 100ml bottle with 1200 GSM greyboard and gold foil stamping.",
  },
  {
    id: "mailer",
    title: "E-Commerce Mailers",
    description: "Your expert AI assistant for corrugated roll-end mailers",
    icon: ShoppingBag,
    prompt: "Create an e-commerce corrugated shipping mailer box, E-flute kraft with custom branded interior print.",
  },
  {
    id: "folding",
    title: "Folding Cartons",
    description: "Your expert AI assistant for cosmetic & retail mono-cartons",
    icon: Layers,
    prompt: "Design a 300 GSM virgin SBS straight-tuck mono carton with soft-touch matte lamination and embossing.",
  },
  {
    id: "cad",
    title: "3D Parametric CAD",
    description: "Your expert AI assistant for dielines & Heidelberg print",
    icon: Sliders,
    prompt: "Generate an industrial dieline with cut & crease tolerance ±0.05mm for 200x120x60mm retail box.",
  },
];

const RANDOM_PROMPTS = [
  "Custom luxury chocolate box with magnetic book-style flap and gold foil lettering.",
  "Eco-friendly apparel shipping box made from 100% recycled biodegradable kraft board.",
  "Minimalist matte black cosmetic serum box with spot UV gloss varnish logo.",
  "Wedding invitation rigid box with satin ribbon pull drawer and letterpress texture.",
];

export function StudioMain({
  onOpenModelSheet,
  onOpenSettings,
}: {
  onOpenModelSheet: () => void;
  onOpenSettings: () => void;
}) {
  const router = useRouter();
  const conv = useMinal((s) => activeConversation(s));
  const openViewer = useMinal((s) => s.openViewer);
  const { send, isStreaming, stop } = useChat();

  const [inputVal, setInputVal] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeId = useMinal((s) => s.activeId);
  const renameConversation = useMinal((s) => s.renameConversation);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  useEffect(() => {
    if (conv?.title) setEditedTitle(conv.title);
  }, [conv?.title]);

  const handleSaveTitle = () => {
    if (activeId && editedTitle.trim()) {
      sfx.success();
      renameConversation(activeId, editedTitle.trim());
      toast.success("Project renamed to: " + editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  // Time of day greeting
  const [greeting, setGreeting] = useState("Good morning");
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const added: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const att = await fileToAttachment(file);
        added.push(att);
      } catch (err) {
        toast.error(`Could not read ${file.name}`);
      }
    }

    if (added.length > 0) {
      sfx.pop();
      setAttachments((prev) => [...prev, ...added]);
      toast.success(`Attached ${added.length} file(s)`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = (id: string) => {
    sfx.click();
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSendPrompt = (textToSend?: string) => {
    const query = (textToSend || inputVal).trim();
    if (!query && attachments.length === 0) return;

    sfx.whoosh();
    send({
      text: query || (attachments.length ? `Please analyze the attached packaging document(s): ${attachments.map(a => a.name).join(", ")}` : ""),
      attachments: attachments.length ? attachments : undefined,
    });

    setInputVal("");
    setAttachments([]);
  };

  const handleRandomPrompt = () => {
    sfx.click();
    const pick = RANDOM_PROMPTS[Math.floor(Math.random() * RANDOM_PROMPTS.length)];
    setInputVal(pick);
    toast.success("Loaded inspiration prompt!");
  };

  const hasMessages = conv && conv.messages.length > 0;
  const canSend = inputVal.trim().length > 0 || attachments.length > 0;

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full relative studio-canvas overflow-hidden select-none">
      {/* 1. Top Navigation Bar (Image 3 exact replica) */}
      <header className="h-16 px-4 sm:px-8 flex items-center justify-between border-b border-white/[0.08] flex-shrink-0 relative z-20">
        {/* Left: Search Capsule */}
        <div className="flex items-center gap-2 w-full max-w-xs sm:max-w-sm">
          <div className="relative w-full">
            <div className="flex items-center gap-2 h-10 px-3.5 rounded-full bg-white/[0.05] border border-white/[0.08] hover:border-white/[0.16] transition text-[13px] text-white/60 focus-within:border-white/30 focus-within:text-white">
              <Search className="w-3.5 h-3.5 text-white/50" />
              <input
                type="text"
                placeholder="Search specs, dielines, templates..."
                className="w-full bg-transparent outline-none text-white text-[13px] placeholder:text-white/35"
              />
              <Cpu className="w-3.5 h-3.5 text-white/40 ml-auto flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* Center: Inline Editable Project Name (User can name project directly in chat) */}
        <div className="hidden md:flex items-center gap-2">
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#181a22] border border-[#ff6b00]/50 shadow-[0_0_15px_rgba(255,107,0,0.25)] animate-in fade-in">
              <Box className="w-3.5 h-3.5 text-[#ff6b00]" />
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") setIsEditingTitle(false);
                }}
                autoFocus
                placeholder="Name packaging project..."
                className="bg-transparent text-[12.5px] text-white font-medium outline-none w-48 sm:w-60 placeholder:text-white/40"
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#ff6b00] text-black font-bold hover:bg-[#ff7b1a] transition"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setEditedTitle(conv?.title || "New Packaging Project");
                setIsEditingTitle(true);
              }}
              className="flex items-center gap-2 h-10 px-3.5 rounded-full bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] hover:border-[#ff6b00]/40 transition group"
              title="Click to rename project"
            >
              <span className="w-2 h-2 rounded-full bg-[#ff6b00] shadow-[0_0_8px_#ff6b00]" />
              <span className="text-[12.5px] font-semibold text-white/90 group-hover:text-white truncate max-w-[160px] lg:max-w-[240px]">
                {conv?.title || "New Packaging Project"}
              </span>
              <span className="text-[10px] text-white/40 group-hover:text-[#ff6b00] font-mono transition">
                ✎ Rename
              </span>
            </button>
          )}
        </div>

        {/* Right: Notifications, Settings, Profile Pill */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button
            onClick={() => {
              sfx.pop();
              toast.info("Factory floor connected: Heidelberg Speedmaster online");
            }}
            className="w-10 h-10 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] grid place-items-center text-white/70 hover:text-white transition relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-[#ff6b00] animate-pulse shadow-[0_0_6px_#ff6b00]" />
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              sfx.click();
              onOpenSettings();
            }}
            className="w-10 h-10 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] grid place-items-center text-white/70 hover:text-white transition"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              onClick={() => {
                sfx.click();
                setProfileDropdownOpen(!profileDropdownOpen);
              }}
              className="flex items-center gap-2.5 h-10 px-3 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition text-left"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#ff6b00] to-amber-300 text-black font-black text-[10px] grid place-items-center flex-shrink-0 shadow-sm">
                SR
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-[12px] font-semibold text-white">Sadekur Rahman</span>
                <span className="text-[9px] text-white/40 font-mono">client@minal.org</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-white/50" />
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-0 top-12 w-56 rounded-2xl bg-[#14161d] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                  <div className="text-[12px] font-bold text-white">Sadekur Rahman</div>
                  <div className="text-[10px] text-white/40 font-mono">Minal Enterprises Partner</div>
                </div>
                <button
                  onClick={() => {
                    sfx.click();
                    setProfileDropdownOpen(false);
                    router.push("/admin");
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] text-white/75 hover:text-white hover:bg-white/10 transition"
                >
                  <span>Factory Console</span>
                  <ExternalLink className="w-3 h-3 text-white/40" />
                </button>
                <button
                  onClick={() => {
                    sfx.click();
                    setProfileDropdownOpen(false);
                    router.push("/about");
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] text-white/75 hover:text-white hover:bg-white/10 transition"
                >
                  <span>Faisalabad Press Story</span>
                </button>
                <div className="border-t border-white/[0.06] my-1" />
                <button
                  onClick={() => {
                    sfx.pop();
                    setProfileDropdownOpen(false);
                    router.push("/login");
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] text-red-400 hover:bg-red-500/10 transition"
                >
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hidden File Picker (Supports images, PDFs, text files, CAD dielines and all formats) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.txt,.doc,.docx,.json,.csv,.md,.dxf,.ai,.eps,.svg,.cdr,*/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 2. Main Studio Canvas Area */}
      {hasMessages ? (
        /* When chat conversation is active: show Chat Panel + sleek docked bottom bar */
        <div className="flex-1 flex flex-col min-h-0 relative">
          <ChatPanel />

          {/* Minimal Docked Studio Prompt Capsule */}
          <div className="p-4 max-w-4xl w-full mx-auto flex-shrink-0">
            <div className="prompt-capsule p-3 flex flex-col gap-2">
              {/* Attachment Previews if any */}
              <AttachmentPreviewStrip
                attachments={attachments}
                onRemove={handleRemoveAttachment}
                className="px-1"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] grid place-items-center text-white/70 hover:text-white transition flex-shrink-0"
                  title="Attach images, PDFs, text, or CAD dielines"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <textarea
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendPrompt();
                    }
                  }}
                  placeholder="Ask anything about packaging specs, materials, or finishes..."
                  rows={1}
                  className="flex-1 bg-transparent py-1 text-[13.5px] text-white placeholder:text-white/40 outline-none resize-none max-h-24 minal-scroll"
                />
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("open-voice-studio"))}
                  className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] grid place-items-center text-white/70 hover:text-white transition flex-shrink-0"
                  title="Voice studio"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isStreaming) stop();
                    else handleSendPrompt();
                  }}
                  disabled={!canSend && !isStreaming}
                  className={cn(
                    "w-9 h-9 rounded-full grid place-items-center transition flex-shrink-0",
                    isStreaming
                      ? "bg-red-500 text-white"
                      : canSend
                      ? "bg-white text-black hover:bg-zinc-200 cursor-pointer shadow-md shadow-white/20 active:scale-95"
                      : "bg-white/10 text-white/30 cursor-not-allowed"
                  )}
                  title="Send message"
                >
                  {isStreaming ? <Square className="w-3.5 h-3.5 fill-current" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty / New Studio Home View (Exact Replica of Image 3) */
        <div className="flex-1 overflow-y-auto minal-scroll flex flex-col justify-between p-6 sm:p-10 max-w-5xl mx-auto w-full">
          {/* Greeting Stack */}
          <div className="text-center pt-8 sm:pt-14 pb-8 animate-in fade-in duration-300">
            <h1 className="text-[34px] sm:text-[48px] font-bold text-white tracking-tight leading-tight">
              {greeting}, <span className="text-white/90">Sadekur</span>
            </h1>
            <p className="text-[14px] sm:text-[15px] text-white/50 max-w-xl mx-auto mt-2.5 leading-relaxed">
              Design parametric packaging, calculate dielines, and generate production-ready 3D boxes with zero delay.
            </p>
          </div>

          {/* Central Luxury Floating Prompt Capsule (Exact Match of Image 3) */}
          <div className="w-full max-w-3xl mx-auto prompt-capsule p-4 sm:p-5 mb-8 animate-in fade-in duration-400">
            {/* Top Bar inside Capsule */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] text-[11px]">
              <div className="flex items-center gap-1.5 text-white/80 font-medium">
                <Box className="w-3.5 h-3.5 text-[#ff6b00]" />
                <span>Unlock more with Factory Pro</span>
              </div>
              <button
                type="button"
                onClick={onOpenModelSheet}
                className="flex items-center gap-1.5 text-white/50 hover:text-white transition font-mono"
              >
                <span>✦ Powered by Minal AI v5.2</span>
              </button>
            </div>

            {/* Attachment Previews if any */}
            <AttachmentPreviewStrip
              attachments={attachments}
              onRemove={handleRemoveAttachment}
              className="pt-2 pb-1"
            />

            {/* Middle Input Row */}
            <div className="py-4 flex items-start gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] grid place-items-center text-white/70 hover:text-white transition flex-shrink-0 mt-0.5"
                title="Attach images, PDFs, text, or CAD dielines"
              >
                <Plus className="w-4 h-4" />
              </button>

              <textarea
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPrompt();
                  }
                }}
                rows={2}
                placeholder="Example: &quot;Luxury rigid perfume box with gold foil & velvet tray&quot;"
                className="flex-1 bg-transparent text-[14px] sm:text-[15px] text-white placeholder:text-white/35 outline-none resize-none leading-relaxed"
              />

              <Layers className="w-4 h-4 text-white/30 flex-shrink-0 mt-1" />
            </div>

            {/* Bottom Row inside Capsule */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
              {/* Filter / Mode Pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    sfx.click();
                    router.push("/templates");
                  }}
                  className="pill-action"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Prompt Library</span>
                </button>

                <button
                  type="button"
                  onClick={handleRandomPrompt}
                  className="pill-action"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Random</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sfx.click();
                    openViewer();
                  }}
                  className="pill-action"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>Parametric 3D</span>
                </button>
              </div>

              {/* Action Buttons: Mic + Send */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sfx.click();
                    window.dispatchEvent(new CustomEvent("open-voice-studio"));
                  }}
                  className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] grid place-items-center text-white/70 hover:text-white transition"
                  title="Voice Studio"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleSendPrompt()}
                  disabled={!canSend}
                  className={cn(
                    "w-9 h-9 rounded-full grid place-items-center transition active:scale-95",
                    canSend
                      ? "bg-white text-black hover:bg-zinc-200 shadow-md shadow-white/20 cursor-pointer"
                      : "bg-white/10 text-white/30 cursor-not-allowed"
                  )}
                  title="Generate Design"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.8]" />
                </button>
              </div>
            </div>
          </div>

          {/* 4 Bottom Capability Cards (Exact Match of Image 3) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full pt-4 pb-6 animate-in fade-in duration-500">
            {QUICK_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  onClick={() => handleSendPrompt(card.prompt)}
                  className="studio-card-minimal p-5 cursor-pointer flex flex-col justify-between h-36 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/10 grid place-items-center text-white group-hover:bg-white group-hover:text-black transition">
                    <Icon className="w-4 h-4" />
                  </div>

                  <div>
                    <h3 className="text-[13.5px] font-bold text-white tracking-tight group-hover:text-white transition">
                      {card.title}
                    </h3>
                    <p className="text-[11px] text-white/50 mt-1 leading-normal line-clamp-2">
                      {card.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
