"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  ArrowRight,
  ExternalLink,
  Bot,
  Play,
  Share2,
  Database,
  Layers,
  FileText,
  Workflow
} from "lucide-react";
import { sfx } from "@/lib/sound";
import { useRouter, Link } from "@/lib/router";

export function SkyHome() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Product");

  const handleLaunchChat = () => {
    sfx.whoosh();
    router.push("/chat");
  };

  const handleSignUp = () => {
    sfx.click();
    router.push("/login");
  };

  return (
    <div className="min-h-screen w-full bg-[#1b6cd3] flex flex-col justify-between p-2 sm:p-4 lg:p-6 select-none font-sans relative overflow-x-hidden">
      
      {/* OUTER WHITE BORDER FRAME (Exact match to media_1790076609126.png) */}
      <div className="relative w-full rounded-[28px] sm:rounded-[36px] lg:rounded-[44px] border-2 border-white/85 shadow-2xl overflow-hidden flex flex-col justify-between min-h-[96vh] bg-gradient-to-b from-[#1868d4] via-[#3384e8] to-[#9ec8f8]">
        
        {/* ================= BACKGROUND SCENERY ================= */}

        {/* 1. Alpine Mountain Silhouettes (Left Horizon) */}
        <div className="absolute bottom-40 left-0 w-[55%] h-[420px] pointer-events-none z-0">
          <svg viewBox="0 0 700 400" fill="none" preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id="mountGrad1" x1="0" y1="0" x2="0" y2="400" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4f7cb5" stopOpacity="0.85" />
                <stop offset="45%" stopColor="#6f98c8" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#c5daf2" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="mountGrad2" x1="0" y1="0" x2="0" y2="400" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#3d689e" stopOpacity="0.95" />
                <stop offset="60%" stopColor="#6289ba" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#dbe8f7" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Back Mountain Ridge */}
            <path
              d="M0 400 L0 260 L80 180 L140 220 L230 140 L310 210 L420 120 L500 220 L620 280 L700 400 Z"
              fill="url(#mountGrad1)"
            />

            {/* Front Crisp Jagged Mountain Peak */}
            <path
              d="M-20 400 L40 280 L130 200 L180 250 L270 170 L340 240 L450 310 L560 400 Z"
              fill="url(#mountGrad2)"
            />
          </svg>
        </div>

        {/* 2. Radiant Morning Sun (Right Horizon) */}
        <div className="absolute bottom-52 right-24 sm:right-40 w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-white/95 shadow-[0_0_120px_40px_rgba(255,255,255,0.85)] pointer-events-none z-0 blur-[1px]" />

        {/* 3. Soft Drifting Volumetric Cumulus Clouds */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Top Left Cloud Bank */}
          <div className="absolute top-20 -left-10 w-72 h-44 bg-white/35 rounded-full blur-2xl transform -rotate-12" />
          <div className="absolute top-36 left-20 w-80 h-40 bg-white/40 rounded-full blur-xl" />

          {/* Right Horizon Cloud Layer */}
          <div className="absolute bottom-44 -right-10 w-[550px] h-60 bg-white/60 rounded-full blur-3xl" />
          <div className="absolute bottom-28 right-20 w-96 h-48 bg-white/70 rounded-full blur-2xl" />

          {/* Center Valley Mist */}
          <div className="absolute bottom-28 inset-x-0 h-44 bg-gradient-to-t from-white via-white/80 to-transparent" />
        </div>

        {/* ================= TOP NAVIGATION BAR ================= */}
        <header className="relative z-20 w-full px-6 sm:px-12 py-6 flex items-center justify-between">
          
          {/* Left Brand Logo */}
          <div
            onClick={() => router.push("/")}
            onMouseEnter={sfx.hover}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            {/* Hexagonal Cube Symbol matching Image */}
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md border border-white/40 grid place-items-center text-white shadow-sm group-hover:scale-105 transition">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="w-4 h-4">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-bold text-[17px] text-white tracking-tight">
              CustomGPT<span className="text-white/90">.ai</span>
            </span>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-[13.5px] font-medium text-white/85">
            {["Product", "Solutions", "Pricing", "Customers"].map((item) => (
              <button
                key={item}
                onClick={() => {
                  sfx.click();
                  setActiveTab(item);
                  if (item === "Pricing") router.push("/about");
                  if (item === "Product") router.push("/chat");
                }}
                onMouseEnter={sfx.hover}
                className="hover:text-white transition hover:underline underline-offset-8"
              >
                {item}
              </button>
            ))}
          </nav>

          {/* Right Action Button */}
          <button
            onClick={handleSignUp}
            onMouseEnter={sfx.hover}
            className="px-5 py-2 rounded-full bg-white hover:bg-white/95 text-[#1a6ddb] font-semibold text-[13px] shadow-md shadow-black/10 transition hover:scale-105"
          >
            Try for free
          </button>
        </header>

        {/* ================= HERO CONTENT ================= */}
        <main className="relative z-10 flex-1 flex flex-col items-center text-center px-4 pt-6 sm:pt-10 max-w-5xl mx-auto w-full">
          
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-[11px] font-mono tracking-widest text-white uppercase mb-5">
            #1 AI AGENT FOR BUSINESSES
          </div>

          {/* Massive Crisp Headline (Exact wording & layout) */}
          <h1 className="text-4xl sm:text-6xl lg:text-[62px] font-bold text-white tracking-tight leading-[1.08] max-w-4xl">
            Create CustomGPTs from your <br className="hidden sm:inline" />
            business information
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-sm sm:text-base lg:text-[17px] text-white/90 font-normal max-w-2xl leading-relaxed">
            Launch in minutes with 100+ data sources and deployment options
          </p>

          {/* Proof Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-[12px] font-medium shadow-sm">
              <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              <span>Industry-leading accuracy</span>
            </div>
            <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-[12px] font-medium shadow-sm">
              <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              <span>Zero data sharing & training</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mt-8">
            <button
              onClick={handleSignUp}
              onMouseEnter={sfx.hover}
              className="px-7 py-3 rounded-full bg-[#1b5ec2] hover:bg-[#164ea5] text-white font-semibold text-[13.5px] shadow-lg shadow-[#103a7a]/30 transition hover:scale-105 active:scale-95"
            >
              Sign up free
            </button>
            <button
              onClick={handleLaunchChat}
              onMouseEnter={sfx.hover}
              className="px-7 py-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 text-white font-semibold text-[13.5px] shadow-md transition hover:scale-105 active:scale-95"
            >
              Chat with the AI
            </button>
          </div>

          {/* ================= CENTER WHITE PEDESTAL & 3D CHROMATIC SPHERE ================= */}
          <div className="w-full max-w-3xl mt-12 sm:mt-16 relative">
            
            {/* White Arched Pedestal Card */}
            <div className="w-full rounded-t-[44px] sm:rounded-t-[60px] bg-white shadow-2xl p-8 sm:p-14 pb-16 flex flex-col items-center relative overflow-hidden">
              
              {/* Subtle blue curved wings hugging the sides (Exact match to image) */}
              <div className="absolute top-0 -left-12 w-32 h-64 bg-gradient-to-r from-[#d9ebfc] to-transparent rounded-r-full pointer-events-none opacity-60" />
              <div className="absolute top-0 -right-12 w-32 h-64 bg-gradient-to-l from-[#d9ebfc] to-transparent rounded-l-full pointer-events-none opacity-60" />

              {/* Central Chromatic Sphere & Integration Orbit */}
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center my-4">
                
                {/* Orbital Connector Ring with Subtle Dashed Line */}
                <div className="absolute inset-0 rounded-full border border-zinc-200/80 pointer-events-none" />
                <div className="absolute inset-6 rounded-full border border-zinc-100 pointer-events-none" />

                {/* --- Surrounding Integration Logos --- */}

                {/* 1. Google Drive (Top Center) */}
                <div
                  onClick={handleLaunchChat}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-md border border-zinc-100 grid place-items-center hover:scale-110 transition cursor-pointer"
                  title="Google Drive Sync"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path fill="#4285F4" d="M12 2L4 16h6l8-14z" />
                    <path fill="#FBBC05" d="M14 16l6-10H8l-6 10h12z" />
                    <path fill="#34A853" d="M14 16H2l4 6h16l-8-6z" />
                  </svg>
                </div>

                {/* 2. HubSpot (Top Right) */}
                <div
                  onClick={handleLaunchChat}
                  className="absolute top-8 right-8 w-9 h-9 rounded-full bg-white shadow-md border border-zinc-100 grid place-items-center hover:scale-110 transition cursor-pointer"
                  title="HubSpot"
                >
                  <div className="w-4 h-4 rounded-full bg-[#ff7a59] grid place-items-center text-white text-[9px] font-bold">
                    H
                  </div>
                </div>

                {/* 3. Notion (Right) */}
                <div
                  onClick={handleLaunchChat}
                  className="absolute top-1/2 right-0 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md border border-zinc-100 grid place-items-center hover:scale-110 transition cursor-pointer"
                  title="Notion"
                >
                  <div className="w-6 h-6 rounded bg-black text-white font-serif font-bold text-xs grid place-items-center">
                    N
                  </div>
                </div>

                {/* 4. Microsoft Excel (Bottom Right) */}
                <div
                  onClick={handleLaunchChat}
                  className="absolute bottom-8 right-8 w-9 h-9 rounded-full bg-white shadow-md border border-zinc-100 grid place-items-center hover:scale-110 transition cursor-pointer"
                  title="Spreadsheets"
                >
                  <div className="w-5 h-5 rounded bg-[#107c41] text-white font-bold text-[9.5px] grid place-items-center">
                    X
                  </div>
                </div>

                {/* 5. Shopify / S (Bottom Center-Right) */}
                <div
                  onClick={handleLaunchChat}
                  className="absolute -bottom-2 right-20 w-8 h-8 rounded-full bg-white shadow-md border border-zinc-100 grid place-items-center hover:scale-110 transition cursor-pointer"
                  title="Shopify"
                >
                  <div className="w-5 h-5 rounded-full bg-[#008060] text-white font-bold text-[9px] grid place-items-center">
                    S
                  </div>
                </div>

                {/* 6. Squarespace / Link (Bottom Center) */}
                <div
                  onClick={handleLaunchChat}
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-black text-white shadow-md grid place-items-center hover:scale-110 transition cursor-pointer"
                  title="Squarespace"
                >
                  <div className="w-5 h-5 border-2 border-white rounded-full grid place-items-center text-[10px] font-mono">
                    S
                  </div>
                </div>

                {/* 7. Dribbble / Pink Icon (Bottom Left) */}
                <div
                  onClick={handleLaunchChat}
                  className="absolute bottom-8 left-8 w-9 h-9 rounded-full bg-white shadow-md border border-zinc-100 grid place-items-center hover:scale-110 transition cursor-pointer"
                  title="Design Resources"
                >
                  <div className="w-5 h-5 rounded-full bg-[#ea4c89] text-white text-[9px] font-bold grid place-items-center">
                    D
                  </div>
                </div>

                {/* 8. WordPress (Left) */}
                <div
                  onClick={handleLaunchChat}
                  className="absolute top-1/2 left-0 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md border border-zinc-100 grid place-items-center hover:scale-110 transition cursor-pointer"
                  title="WordPress"
                >
                  <div className="w-6 h-6 rounded-full bg-[#21759b] text-white font-serif font-bold text-xs grid place-items-center">
                    W
                  </div>
                </div>

                {/* 9. Confluence / Blue Box (Top Left) */}
                <div
                  onClick={handleLaunchChat}
                  className="absolute top-8 left-8 w-9 h-9 rounded-full bg-white shadow-md border border-zinc-100 grid place-items-center hover:scale-110 transition cursor-pointer"
                  title="Atlassian"
                >
                  <div className="w-4 h-4 rounded bg-[#0052cc] text-white text-[8px] font-bold grid place-items-center">
                    A
                  </div>
                </div>

                {/* --- CENTRAL CHROMATIC 3D SPHERE (Exact match) --- */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  onClick={handleLaunchChat}
                  className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full shadow-[0_15px_45px_rgba(37,99,235,0.35)] cursor-pointer group flex items-center justify-center p-2"
                >
                  {/* Chromatic Liquid Oil-Slick Gradient Sphere */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#1e1b4b] via-[#e11d48] via-[#eab308] via-[#06b6d4] to-[#3b82f6] shadow-2xl animate-spin [animation-duration:35s]" />
                  
                  {/* Specular White Gloss Glaze & Outer Glass Ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/60 via-transparent to-black/30 backdrop-blur-[0.5px]" />
                  <div className="absolute top-2 left-4 w-16 h-8 rounded-full bg-white/70 blur-[3px] transform -rotate-25" />
                  <div className="absolute inset-[-4px] rounded-full border-2 border-white/80 shadow-md pointer-events-none" />

                  {/* Center Pure White Pause Bars (▌▌) */}
                  <div className="relative z-10 flex items-center gap-2">
                    <div className="w-2.5 h-9 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
                    <div className="w-2.5 h-9 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
                  </div>
                </motion.div>
              </div>

            </div>
          </div>
        </main>

        {/* ================= BOTTOM "TRUSTED BY" BANNER (Exact match) ================= */}
        <footer className="relative z-20 w-full bg-white py-8 px-6 sm:px-12 border-t border-zinc-100 flex flex-col items-center">
          
          <div className="text-[11px] font-mono tracking-widest uppercase font-bold text-zinc-500 mb-6 text-center">
            TRUSTED BY 10,000+ ORGANIZATIONS WORLDWIDE
          </div>

          {/* Monochromatic Partner Logos */}
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-zinc-400 font-bold text-sm sm:text-base tracking-wider">
            <span className="hover:text-zinc-700 transition">exign</span>
            <span className="flex items-center gap-1.5 hover:text-zinc-700 transition">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />
              <span>Signum.</span>
            </span>
            <span className="hover:text-zinc-700 transition">Visually</span>
            <span className="flex items-center gap-1 hover:text-zinc-700 transition">
              <div className="w-3 h-3 rounded-sm border border-current" />
              <span>ICONIZE</span>
            </span>
            <span className="hover:text-zinc-700 transition">WAYLINE</span>
            <span className="hover:text-zinc-700 transition">Imprintify</span>
            <span className="flex items-center gap-1 hover:text-zinc-700 transition">
              <div className="w-3.5 h-3.5 rounded-full border border-current" />
              <span>Signet</span>
            </span>
          </div>
        </footer>

      </div>
    </div>
  );
}
