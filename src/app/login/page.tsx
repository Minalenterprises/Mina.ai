"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Box,
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(
        tab === "signin"
          ? "Welcome back to Minal Packaging Studio!"
          : "Account registered successfully!"
      );
      router.push("/chat");
    }, 800);
  };

  const handleDemoLogin = () => {
    setEmail("client@minalenterprises.org");
    setPassword("minal-studio-2026");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Signed in with Demo Client Account!");
      router.push("/chat");
    }, 600);
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0b] text-white flex flex-col justify-between relative overflow-hidden selection:bg-[#a3e635] selection:text-black">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#a3e635]/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 blur-[160px] rounded-full pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full h-16 sm:h-20 px-4 sm:px-8 flex items-center justify-between z-10">
        <Link
          href="/home"
          className="flex items-center gap-2.5 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#a3e635] to-[#65a30d] grid place-items-center text-black font-black text-[14px] shadow-lg shadow-[#a3e635]/20 group-hover:scale-105 transition-transform">
            M
          </div>
          <div>
            <span className="font-bold text-[16px] tracking-tight text-white">
              Minal<span className="text-[#a3e635]">.ai</span>
            </span>
            <span className="block text-[9px] font-mono text-white/40 uppercase tracking-widest">
              Packaging Studio
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3 text-[12px]">
          <Link
            href="/chat"
            className="text-white/60 hover:text-white transition"
          >
            Launch Studio
          </Link>
          <Link
            href="/about"
            className="hidden sm:inline-block text-white/60 hover:text-white transition"
          >
            About Press
          </Link>
          <Link
            href="/home"
            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition"
          >
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[460px] rounded-[32px] bg-[#121214]/90 border border-white/15 p-6 sm:p-9 shadow-2xl backdrop-blur-2xl relative overflow-hidden"
        >
          {/* Subtle top glow */}
          <div className="absolute -top-24 inset-x-0 h-40 bg-[#a3e635]/15 blur-2xl rounded-full pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-6 relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-[#bef264] uppercase tracking-wider mb-3">
              <Sparkles className="w-3 h-3 text-[#a3e635]" />
              Client & Artisan Portal
            </div>
            <h2 className="text-[24px] sm:text-[28px] font-black tracking-tight text-white">
              {tab === "signin" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-[12.5px] text-white/50 mt-1">
              {tab === "signin"
                ? "Sign in to manage your 3D CAD packaging designs and print runs"
                : "Join Minal Enterprises to engineer and order custom packaging"}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-white/5 border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => setTab("signin")}
              className={cn(
                "py-2 rounded-xl text-[12px] font-semibold transition-all",
                tab === "signin"
                  ? "bg-[#a3e635] text-black shadow-md"
                  : "text-white/60 hover:text-white"
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setTab("signup")}
              className={cn(
                "py-2 rounded-xl text-[12px] font-semibold transition-all",
                tab === "signup"
                  ? "bg-[#a3e635] text-black shadow-md"
                  : "text-white/60 hover:text-white"
              )}
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === "signup" && (
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-white/60 mb-1.5">
                  Full Name / Company
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ali Khan (Perfume Co)"
                    className="w-full bg-white/5 border border-white/10 focus:border-[#a3e635]/50 rounded-xl px-3.5 py-2.5 text-[13px] text-white placeholder:text-white/30 outline-none transition"
                  />
                  <User className="absolute right-3.5 top-3 w-4 h-4 text-white/30" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-white/60 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-white/5 border border-white/10 focus:border-[#a3e635]/50 rounded-xl px-3.5 py-2.5 text-[13px] text-white placeholder:text-white/30 outline-none transition"
                />
                <Mail className="absolute right-3.5 top-3 w-4 h-4 text-white/30" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-white/60">
                  Password
                </label>
                {tab === "signin" && (
                  <button
                    type="button"
                    onClick={() =>
                      toast.info("Password reset link sent to your registered email.")
                    }
                    className="text-[11px] text-[#a3e635] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white/5 border border-white/10 focus:border-[#a3e635]/50 rounded-xl px-3.5 py-2.5 text-[13px] text-white placeholder:text-white/30 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-white/40 hover:text-white transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-white/20 bg-white/5 accent-[#a3e635] cursor-pointer"
              />
              <label
                htmlFor="remember"
                className="text-[11.5px] text-white/60 cursor-pointer select-none"
              >
                Keep me signed in on this workstation
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#a3e635] to-[#84cc16] hover:from-[#bef264] hover:to-[#a3e635] text-black font-bold text-[13px] shadow-lg shadow-[#a3e635]/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{tab === "signin" ? "Enter Studio" : "Create Account"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10.5px] uppercase font-mono text-white/40">
              Or Fast Access
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Fast Demo Client Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#a3e635]/40 text-white font-semibold text-[12px] transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#a3e635]" />
            <span>Instant Demo Client Access</span>
          </button>

          {/* Footer Security Badge */}
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[10.5px] text-white/40">
            <ShieldCheck className="w-3.5 h-3.5 text-[#a3e635]" />
            <span>256-Bit Encrypted · Minal Industrial Cloud</span>
          </div>
        </motion.div>
      </main>

      {/* Page Footer */}
      <footer className="w-full py-4 px-6 text-center text-[11px] text-white/40 z-10">
        © 2009–2026 Minal Enterprises (Pvt.) Ltd. · Shop 182-190 Jalvi Market, Faisalabad, Pakistan
      </footer>
    </div>
  );
}
