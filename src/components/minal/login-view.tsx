"use client";

import React, { useState } from "react";
import { useRouter } from "@/lib/router";
import { sfx } from "@/lib/sound";
import {
  ArrowLeft,
  CheckCircle2,
  Truck,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function LoginView() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signup");
  const [name, setName] = useState("Sadekur Rahman");
  const [email, setEmail] = useState("client@minalenterprises.org");
  const [password, setPassword] = useState("••••••••••••");
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sfx.success();
    setLoading(true);
    toast.success("Welcome to Minal AI Studio!");
    setTimeout(() => {
      router.push("/studio");
    }, 350);
  };

  const handleDemoClient = () => {
    sfx.click();
    setName("Sadekur Rahman");
    setEmail("client@minalenterprises.org");
    setPassword("client123");
    toast.success("Demo Client credentials applied!");
    setTimeout(() => {
      sfx.success();
      router.push("/studio");
    }, 350);
  };

  const handleDemoAdmin = () => {
    sfx.click();
    setName("Factory Admin");
    setEmail("admin@minalenterprises.org");
    setPassword("admin123");
    toast.success("Demo Factory Admin credentials applied!");
    setTimeout(() => {
      sfx.success();
      router.push("/studio");
    }, 350);
  };

  return (
    <div className="min-h-screen w-full bg-white text-zinc-900 font-sans flex flex-col justify-between selection:bg-[#ff6b00] selection:text-white">
      {/* Top Header */}
      <header className="w-full px-6 sm:px-12 py-5 flex items-center justify-between z-20">
        {/* Brand Logo matching user reference image */}
        <div
          onClick={() => {
            sfx.click();
            router.push("/");
          }}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div className="w-7 h-7 rounded-lg bg-zinc-950 text-white grid place-items-center shadow-sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-extrabold text-[15px] tracking-tight text-zinc-950 font-sans">
            MINAL<span className="text-zinc-400 font-normal">.AI</span>
          </span>
        </div>

        <button
          onClick={() => {
            sfx.click();
            router.push("/");
          }}
          className="flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
      </header>

      {/* Main Dual-Column Content */}
      <main className="flex-1 max-w-[1340px] w-full mx-auto px-6 sm:px-10 py-4 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 my-auto">
        
        {/* LEFT COLUMN: Clean Form (Exact match to corals.com reference) */}
        <div className="w-full max-w-[420px] mx-auto lg:mx-0 flex flex-col justify-center py-4">
          <div className="mb-6 text-center lg:text-left">
            <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-zinc-900 leading-tight">
              {tab === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-[13.5px] text-zinc-500 mt-1.5">
              {tab === "signup"
                ? "Let's get started with your 30 days free trial"
                : "Enter your credentials to access your packaging studio"}
            </p>
          </div>

          {/* Login with Google Button */}
          <button
            type="button"
            onClick={() => {
              sfx.click();
              toast.success("Google Sign-In simulated!");
              setTimeout(() => router.push("/studio"), 350);
            }}
            className="w-full h-11 rounded-full border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-[13.5px] font-medium flex items-center justify-center gap-2.5 transition shadow-sm active:scale-[0.99]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Login with Google</span>
          </button>

          {/* Divider "or" */}
          <div className="relative my-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200" />
            </div>
            <span className="relative bg-white px-3 text-[12px] text-zinc-400 font-sans">
              or
            </span>
          </div>

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "signup" && (
              <div>
                <label className="block text-[12.5px] font-medium text-zinc-800 mb-1.5">
                  Name<span className="text-[#ea580c]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full h-11 px-4 rounded-full border border-zinc-200 focus:border-zinc-900 outline-none text-[13.5px] text-zinc-900 placeholder:text-zinc-400 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-[12.5px] font-medium text-zinc-800 mb-1.5">
                Email<span className="text-[#ea580c]">*</span>
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-full border border-zinc-200 focus:border-zinc-900 outline-none text-[13.5px] text-zinc-900 placeholder:text-zinc-400 transition"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-zinc-800 mb-1.5">
                Password<span className="text-[#ea580c]">*</span>
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-full border border-zinc-200 focus:border-zinc-900 outline-none text-[13.5px] text-zinc-900 placeholder:text-zinc-400 transition"
              />
            </div>

            {/* Terms checkbox */}
            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-zinc-600 select-none pt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-0 cursor-pointer accent-zinc-900"
              />
              <span>I agree to all Term, Privacy Policy and Fees</span>
            </label>

            {/* Primary Submit Pill Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-full bg-zinc-950 hover:bg-black text-white text-[13.5px] font-medium transition shadow-md active:scale-[0.99] mt-2 cursor-pointer"
            >
              {loading ? "Signing in..." : tab === "signup" ? "Sign Up" : "Sign In"}
            </button>
          </form>

          {/* Toggle between Signup and Signin */}
          <p className="text-center text-[12.5px] text-zinc-500 mt-5">
            {tab === "signup" ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setTab(tab === "signup" ? "signin" : "signup");
              }}
              className="text-zinc-900 font-semibold hover:underline"
            >
              {tab === "signup" ? "Log in" : "Sign up"}
            </button>
          </p>

          {/* Quick Demo Access Pills */}
          <div className="pt-4 flex items-center justify-center gap-2 text-[11px]">
            <button
              type="button"
              onClick={handleDemoClient}
              className="px-3 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition font-mono"
            >
              Demo Client
            </button>
            <button
              type="button"
              onClick={handleDemoAdmin}
              className="px-3 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition font-mono"
            >
              Factory Admin
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Sculptured Hero Image Card (Exact replica of user reference) */}
        <div className="w-full lg:w-[58%] h-[480px] sm:h-[580px] lg:h-[640px] relative rounded-[36px] sm:rounded-[44px] overflow-hidden shadow-2xl group select-none">
          {/* Background Packaging Hero Image */}
          <img
            src="/images/login_hero.jpg"
            alt="Minal Luxury Packaging Studio"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />

          {/* Dark Cinematic Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

          {/* Bottom Card Content */}
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 text-white z-10 flex flex-col gap-3.5">
            <h2 className="text-[26px] sm:text-[34px] lg:text-[38px] font-bold tracking-tight text-white leading-tight max-w-lg">
              Discovering the Best Packaging for Your Brand
            </h2>

            <p className="text-[13px] sm:text-[14.5px] text-white/75 max-w-md leading-relaxed font-normal">
              Our practice is Designing Complete Packaging Solutions — exceptional rigid boxes, precision dielines, and Heidelberg press quality.
            </p>

            {/* Bottom Glass Pills (Exact match to 100% Guarantee & Free delivery in reference image) */}
            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <div className="px-4 py-2 rounded-full bg-white/[0.12] backdrop-blur-md border border-white/25 text-[12px] font-medium text-white flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#ff6b00]" />
                <span>100% Quality Guarantee</span>
              </div>

              <div className="px-4 py-2 rounded-full bg-white/[0.12] backdrop-blur-md border border-white/25 text-[12px] font-medium text-white flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-white/90" />
                <span>Free sample delivery Pakistan &amp; Worldwide</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 sm:px-12 py-4 text-center text-[11px] text-zinc-400 font-mono">
        © 2026 Minal Enterprises • Industrial Packaging AI Platform
      </footer>
    </div>
  );
}
