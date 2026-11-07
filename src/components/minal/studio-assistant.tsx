"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  ChevronDown,
  Paperclip,
  Mic,
  Moon,
  HelpCircle,
  Clock,
  Settings,
  MessageSquare,
  Play,
  Image as ImageIcon,
  ArrowRight
} from "lucide-react";
import { sfx } from "@/lib/sound";
import { useMinal } from "@/lib/store";
import { useRouter } from "@/lib/router";
import { useChat } from "@/lib/use-chat";

interface StudioAssistantProps {
  onOpenVoice?: () => void;
  onOpen3DViewer?: () => void;
  onOpenSettings?: () => void;
  onOpenHistory?: () => void;
  onOpenHelp?: () => void;
}

export function StudioAssistant({
  onOpenVoice,
  onOpen3DViewer,
  onOpenSettings,
  onOpenHistory,
  onOpenHelp,
}: StudioAssistantProps) {
  const router = useRouter();
  const [inputVal, setInputVal] = useState("");
  const [versionDropdownOpen, setVersionDropdownOpen] = useState(false);
  const [versionMode, setVersionMode] = useState("Assistance v3");
  const newConversation = useMinal((s) => s.newConversation);
  const { send } = useChat();

  const handleLaunchChat = (prompt?: string) => {
    sfx.whoosh();
    newConversation();
    if (prompt) {
      send({ text: prompt });
    }
    router.push("/chat");
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    sfx.click();
    handleLaunchChat(inputVal.trim());
    setInputVal("");
  };

  return (
    <div className="min-h-screen w-full bg-[#ece9f2] text-[#18181b] flex items-center justify-center p-3 sm:p-6 lg:p-10 relative overflow-hidden font-sans select-none">
      
      {/* 1. TOP-RIGHT SATIN RIBBON WAVES (Exact match to media_1790074756815.png) */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] pointer-events-none z-0 overflow-hidden transform translate-x-12 -translate-y-12">
        <svg viewBox="0 0 500 500" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id="coralRibbon1" x1="100" y1="0" x2="500" y2="400" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#be123c" />
              <stop offset="35%" stopColor="#e11d48" />
              <stop offset="70%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#fda4af" />
            </linearGradient>
            <linearGradient id="coralRibbon2" x1="150" y1="0" x2="500" y2="350" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#9f1239" />
              <stop offset="40%" stopColor="#f43f5e" />
              <stop offset="80%" stopColor="#fecdd3" />
            </linearGradient>
            <linearGradient id="coralHighlight" x1="200" y1="50" x2="450" y2="300" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Layered ribbon curves */}
          <path
            d="M500 50 C400 120, 320 220, 220 320 C180 360, 140 400, 100 450"
            stroke="url(#coralRibbon1)"
            strokeWidth="70"
            strokeLinecap="round"
          />
          <path
            d="M520 10 C420 80, 340 180, 260 270 C210 320, 170 380, 130 430"
            stroke="url(#coralRibbon2)"
            strokeWidth="50"
            strokeLinecap="round"
          />
          <path
            d="M490 35 C410 100, 330 200, 240 295"
            stroke="url(#coralHighlight)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M510 80 C430 150, 360 240, 280 330 C250 365, 200 420, 160 460"
            stroke="url(#coralRibbon1)"
            strokeWidth="35"
            strokeLinecap="round"
            opacity="0.85"
          />
        </svg>
      </div>

      {/* 2. BOTTOM-LEFT SATIN RIBBON WAVES (Exact match to media_1790074756815.png) */}
      <div className="absolute bottom-0 left-0 w-[550px] h-[550px] pointer-events-none z-0 overflow-hidden transform -translate-x-12 translate-y-12">
        <svg viewBox="0 0 500 500" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id="purpleRibbon1" x1="0" y1="500" x2="400" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#581c87" />
              <stop offset="35%" stopColor="#7e22ce" />
              <stop offset="70%" stopColor="#c026d3" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
            <linearGradient id="purpleRibbon2" x1="50" y1="500" x2="350" y2="150" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6b21a8" />
              <stop offset="45%" stopColor="#a855f7" />
              <stop offset="90%" stopColor="#e879f9" />
            </linearGradient>
            <linearGradient id="purpleHighlight" x1="50" y1="450" x2="300" y2="200" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Layered ribbon curves */}
          <path
            d="M0 450 C100 380, 180 280, 280 180 C320 140, 360 100, 400 50"
            stroke="url(#purpleRibbon1)"
            strokeWidth="70"
            strokeLinecap="round"
          />
          <path
            d="M-20 490 C80 420, 160 320, 240 230 C290 180, 330 120, 370 70"
            stroke="url(#purpleRibbon2)"
            strokeWidth="50"
            strokeLinecap="round"
          />
          <path
            d="M10 465 C90 400, 170 300, 260 205"
            stroke="url(#purpleHighlight)"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* 3. MAIN FLOATING WHITE CANVAS (Exact match to media_1790074756815.png) */}
      <div className="relative w-full max-w-5xl rounded-[36px] sm:rounded-[44px] bg-white/95 backdrop-blur-2xl shadow-[0_20px_70px_-10px_rgba(80,60,110,0.12)] border border-white/80 p-6 sm:p-10 lg:p-12 flex flex-col justify-between min-h-[720px] z-10">
        
        {/* Top Header Row */}
        <header className="w-full flex items-center justify-between z-20">
          {/* Left: Brand Icon + Assistance v3 Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                sfx.click();
                setVersionDropdownOpen(!versionDropdownOpen);
              }}
              onMouseEnter={sfx.hover}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-zinc-100/70 transition"
            >
              {/* Intersecting Purple Geometric Ring Symbol */}
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#9333ea] to-[#c026d3] grid place-items-center text-white shadow-sm p-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full">
                  <circle cx="12" cy="12" r="7" />
                  <rect x="7" y="7" width="10" height="10" rx="2" />
                </svg>
              </div>
              <span className="font-semibold text-[14.5px] text-[#18181b] tracking-tight flex items-center gap-1.5">
                {versionMode}
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </span>
            </button>

            {versionDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-52 rounded-2xl bg-white border border-zinc-200/80 p-1.5 shadow-xl z-30 animate-in fade-in zoom-in-95">
                {["Assistance v3", "Packaging Studio Pro", "CAD 3D Engineering"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      sfx.click();
                      setVersionMode(opt);
                      setVersionDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-[12.5px] text-zinc-700 hover:text-black hover:bg-zinc-100 transition"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Try Assistance Pro Pill + User Avatar */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sfx.success();
                window.open("https://wa.me/923006601081?text=Hello%20Minal%20Enterprises,%20I%20want%20to%20try%20Assistance%20Pro", "_blank");
              }}
              onMouseEnter={sfx.hover}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200/80 shadow-sm text-[12.5px] font-semibold text-zinc-800 transition hover:shadow"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Try Assistance Pro</span>
            </button>

            {/* Circular Avatar of Smiling Young Man */}
            <div
              onClick={() => router.push("/login")}
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-md cursor-pointer hover:scale-105 transition bg-gradient-to-tr from-purple-200 to-pink-200 grid place-items-center"
              title="Account / Sign In"
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                alt="Mohammad"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <span className="text-[12px] font-bold text-[#9333ea]">M</span>
            </div>
          </div>
        </header>

        {/* Center: Greeting + 3 Elevated Interactive Cards */}
        <main className="flex-1 flex flex-col items-center justify-center my-auto py-8">
          
          {/* Greeting (Exact match to media_1790074756815.png) */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight bg-gradient-to-r from-[#9333ea] via-[#c026d3] to-[#e11d48] bg-clip-text text-transparent">
              Hello, Mohammad
            </h1>
            <p className="text-2xl sm:text-3xl lg:text-[36px] font-medium text-[#18181b] mt-1.5 tracking-tight">
              How can i assist you today?
            </p>
          </div>

          {/* 3 Elevated Cards Row */}
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6 max-w-4xl w-full">
            
            {/* Card 1: Chat with AI */}
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              onClick={() => handleLaunchChat("Hello! Help me design custom packaging for my brand.")}
              onMouseEnter={sfx.hover}
              className="w-60 h-44 rounded-2xl bg-white border border-zinc-100 shadow-[0_4px_25px_rgba(0,0,0,0.04)] p-4 flex flex-col justify-between cursor-pointer hover:shadow-lg transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-zinc-100 grid place-items-center text-zinc-500">
                    <MessageSquare className="w-3 h-3" />
                  </div>
                  <span className="text-[12px] font-medium text-zinc-600 group-hover:text-zinc-900 transition">
                    Chat with AI
                  </span>
                </div>
                <div className="w-4 h-4 rounded-full overflow-hidden bg-zinc-200">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&q=80"
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Chat Bubble Graphic Preview */}
              <div className="space-y-2 my-auto px-1">
                <div className="h-1.5 w-24 rounded-full bg-zinc-200" />
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#9333ea] to-[#c026d3] grid place-items-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <div className="h-1.5 w-32 rounded-full bg-zinc-200" />
                </div>
                <div className="h-1.5 w-16 rounded-full bg-zinc-100 ml-6" />
              </div>

              {/* Bottom 3 Dots */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <div className="w-4 h-4 rounded-full bg-zinc-100" />
                <div className="w-5 h-5 rounded-full bg-[#f3e8ff] text-[#9333ea] grid place-items-center text-[10px]">
                  ✦
                </div>
                <div className="w-4 h-4 rounded-full bg-zinc-100" />
              </div>
            </motion.div>

            {/* Card 2: Center Elevated Active Card — Create AI Video / 3D Box (Exact match with falling sparkle stars) */}
            <div className="relative">
              <motion.div
                whileHover={{ y: -8, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                onClick={() => {
                  sfx.success();
                  onOpen3DViewer ? onOpen3DViewer() : handleLaunchChat("Generate 3D luxury packaging video render");
                }}
                onMouseEnter={sfx.hover}
                className="w-64 h-48 rounded-2xl bg-white border-2 border-[#f472b6] shadow-[0_12px_40px_rgba(236,72,153,0.18)] p-4 flex flex-col justify-between cursor-pointer -translate-y-2 transition group relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-pink-100 grid place-items-center text-pink-600">
                      <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                    </div>
                    <span className="text-[12.5px] font-bold text-zinc-900 group-hover:text-pink-600 transition">
                      Create AI Video
                    </span>
                  </div>
                  <div className="w-4 h-4 rounded-full overflow-hidden bg-zinc-200">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&q=80"
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Landscape Preview with Pink Tower, Rolling Hills & Play Button */}
                <div className="relative h-24 rounded-xl overflow-hidden bg-gradient-to-b from-sky-200 via-pink-100 to-emerald-400 shadow-inner flex items-center justify-center my-auto">
                  {/* Stylized landscape elements */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-200/60 via-transparent to-emerald-600/30" />
                  <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-emerald-600 via-emerald-500 to-transparent opacity-90 rounded-t-full scale-125" />
                  
                  {/* Central Tower */}
                  <div className="absolute bottom-4 w-3.5 h-10 rounded-t-full bg-gradient-to-t from-pink-400 to-pink-200 shadow-sm" />

                  {/* Play Button */}
                  <div className="relative z-10 w-8 h-8 rounded-full bg-white/90 shadow-md backdrop-blur-sm grid place-items-center text-zinc-800 group-hover:scale-110 group-hover:bg-white transition">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Subtle text line */}
                <div className="h-1.5 w-20 rounded-full bg-zinc-100" />
              </motion.div>

              {/* Falling Purple / Pink Sparkle Stars Underneath (Exact match to media_1790074756815.png) */}
              <div className="absolute -bottom-6 inset-x-0 flex items-center justify-center gap-2 pointer-events-none text-[#c026d3] text-sm animate-pulse">
                <span className="text-[11px] opacity-70">✨</span>
                <span className="text-[13px] text-[#e879f9]">✦</span>
                <span className="text-[8px] opacity-60">·</span>
                <span className="text-[15px] text-[#db2777]">✧</span>
                <span className="text-[13px] text-[#9333ea]">✦</span>
                <span className="text-[10px] opacity-70">✨</span>
              </div>
            </div>

            {/* Card 3: Create AI Image */}
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              onClick={() => {
                sfx.pop();
                window.dispatchEvent(new CustomEvent("open-template-library"));
              }}
              onMouseEnter={sfx.hover}
              className="w-60 h-44 rounded-2xl bg-white border border-zinc-100 shadow-[0_4px_25px_rgba(0,0,0,0.04)] p-4 flex flex-col justify-between cursor-pointer hover:shadow-lg transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-zinc-100 grid place-items-center text-zinc-500">
                    <ImageIcon className="w-3 h-3" />
                  </div>
                  <span className="text-[12px] font-medium text-zinc-600 group-hover:text-zinc-900 transition">
                    Create AI Image
                  </span>
                </div>
                <div className="w-4 h-4 rounded-full overflow-hidden bg-zinc-200">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&q=80"
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Two 3D Artwork Tiles Side by Side */}
              <div className="grid grid-cols-2 gap-2 my-auto">
                <div className="h-16 rounded-xl bg-gradient-to-br from-pink-100 via-rose-100 to-purple-200 flex items-center justify-center p-2 shadow-inner">
                  {/* Abstract pink ribbon torus graphic */}
                  <div className="w-8 h-8 rounded-full border-4 border-pink-500/70 border-t-purple-500 transform rotate-45 shadow-sm" />
                </div>
                <div className="h-16 rounded-xl bg-gradient-to-br from-purple-100 via-indigo-50 to-pink-100 flex items-center justify-center p-2 shadow-inner">
                  {/* Abstract curved lavender silk shape */}
                  <div className="w-7 h-7 rounded-2xl bg-gradient-to-tr from-purple-400 to-indigo-300 transform -rotate-12 shadow-sm" />
                </div>
              </div>

              {/* Subtle line */}
              <div className="h-1.5 w-16 rounded-full bg-zinc-100" />
            </motion.div>
          </div>
        </main>

        {/* Bottom Floating Bar + Bottom-Left Dock */}
        <footer className="w-full flex items-end justify-between relative z-20 pt-4">
          
          {/* Bottom-Left Vertical Tool Dock (Exact match to media_1790074756815.png) */}
          <div className="flex flex-col gap-2.5 text-zinc-400">
            <button
              onClick={() => {
                sfx.toggle();
                router.push("/chat");
              }}
              onMouseEnter={sfx.hover}
              className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center hover:text-zinc-800 transition"
              title="Theme / Modes"
            >
              <Moon className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                sfx.click();
                onOpenHelp ? onOpenHelp() : useMinal.getState().openCommand(true);
              }}
              onMouseEnter={sfx.hover}
              className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center hover:text-zinc-800 transition"
              title="Help & Shortcuts"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                sfx.click();
                onOpenHistory ? onOpenHistory() : router.push("/chat");
              }}
              onMouseEnter={sfx.hover}
              className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center hover:text-zinc-800 transition"
              title="Chat History"
            >
              <Clock className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                sfx.click();
                onOpenSettings ? onOpenSettings() : useMinal.getState().openSettings(true);
              }}
              onMouseEnter={sfx.hover}
              className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center hover:text-zinc-800 transition"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Center Floating Prompt Pill Bar (Exact match to media_1790074756815.png) */}
          <form
            onSubmit={handleInputSubmit}
            className="flex-1 max-w-lg mx-auto flex items-center gap-2.5 px-4"
          >
            {/* Separate Attachment Paperclip Circular Pill on the left */}
            <button
              type="button"
              onClick={() => {
                sfx.pop();
                document.getElementById("assistant-file-upload")?.click();
              }}
              onMouseEnter={sfx.hover}
              className="w-11 h-11 rounded-full bg-white shadow-md border border-zinc-200/80 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition shrink-0"
              title="Attach File / Die-line"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              id="assistant-file-upload"
              type="file"
              className="hidden"
              onChange={() => handleLaunchChat()}
            />

            {/* Main Input Rounded Pill */}
            <div className="flex-1 h-12 rounded-full bg-white shadow-md border border-zinc-200/80 px-4 flex items-center gap-2.5 focus-within:border-amber-400 transition">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <input
                type="text"
                placeholder="Ask anything..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[13.5px] text-zinc-800 placeholder:text-zinc-400 font-normal"
              />
              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  onOpenVoice ? onOpenVoice() : window.dispatchEvent(new CustomEvent("open-voice-studio"));
                }}
                onMouseEnter={sfx.hover}
                className="text-zinc-400 hover:text-[#9333ea] transition shrink-0 p-1"
                title="Voice Input"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Right Spacer for balance */}
          <div className="w-8" />
        </footer>
      </div>
    </div>
  );
}
