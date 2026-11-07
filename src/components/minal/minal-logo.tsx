"use client";

import { motion } from "framer-motion";

interface MinalLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function MinalLogo({ size = 36, showText = true, className = "" }: MinalLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Animated Isometric Box Icon */}
      <div
        className="relative grid place-items-center rounded-xl bg-gradient-to-br from-[#18181b] to-[#0a0a0b] border border-white/15 shadow-lg shadow-white/5 overflow-hidden"
        style={{ width: size, height: size }}
      >
        {/* Ambient Silver Glow */}
        <motion.div
          className="absolute inset-0 bg-white/10 rounded-full filter blur-md"
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
          style={{ width: size * 0.7, height: size * 0.7 }}
        >
          {/* Top Face - Pure White */}
          <motion.path
            d="M24 6L40 15L24 24L8 15L24 6Z"
            fill="#ffffff"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />

          {/* Left Face - Steel Silver */}
          <motion.path
            d="M8 15V33L24 42V24L8 15Z"
            fill="#71717a"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          />

          {/* Right Face - Frosted Light Silver */}
          <motion.path
            d="M40 15V33L24 42V24L40 15Z"
            fill="#d4d4d8"
            initial={{ opacity: 0, x: 4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          />

          {/* Center Crease Line */}
          <motion.path
            d="M24 24V42"
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />

          {/* Stylized M lettermark in center */}
          <motion.path
            d="M18 19L24 23L30 19"
            stroke="#050606"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-tight text-[15px] text-white font-sans">
              MINAL
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-white border border-white/20">
              AI
            </span>
          </div>
          <span className="text-[9px] font-mono uppercase text-white/50 tracking-widest mt-0.5">
            Enterprises
          </span>
        </div>
      )}
    </div>
  );
}

export default MinalLogo;
