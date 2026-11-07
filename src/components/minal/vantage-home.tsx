"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "@/lib/router";
import { sfx } from "@/lib/sound";

export function VantageHome() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const demoCardRef = useRef<HTMLElement>(null);
  const theaterVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Add motion-pending on mount if not reduced motion
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.classList.add("motion-pending");
      const fallback = setTimeout(() => {
        document.documentElement.classList.remove("motion-pending");
      }, 3500);

      const card = demoCardRef.current;
      const handleAnimEnd = (e: AnimationEvent) => {
        if (e.target === card) {
          document.documentElement.classList.remove("motion-pending");
          clearTimeout(fallback);
        }
      };

      if (card) {
        card.addEventListener("animationend", handleAnimEnd);
      }

      return () => {
        clearTimeout(fallback);
        if (card) {
          card.removeEventListener("animationend", handleAnimEnd);
        }
        document.documentElement.classList.remove("motion-pending");
      };
    }
  }, []);

  const handleOpenVideo = () => {
    sfx.click();
    setVideoModalOpen(true);
    if (theaterVideoRef.current) {
      theaterVideoRef.current.currentTime = 0;
      theaterVideoRef.current.play();
    }
  };

  const handleCloseVideo = () => {
    sfx.pop();
    setVideoModalOpen(false);
    if (theaterVideoRef.current) {
      theaterVideoRef.current.pause();
    }
  };

  return (
    <main className="viewport">
      <section className="screen" id="screen">
        {/* Exact Mandatory CloudFront Background Video */}
        <video
          className="background"
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          aria-hidden="true"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_064556_051587f1-74a1-4336-8c05-4dde3594ed05.mp4"
            type="video/mp4"
          />
        </video>

        {/* ================= HEADER ================= */}
        <header className={`header ${menuOpen ? "menu-open" : ""}`}>
          {/* 1. Brand Logo: 25x25 SVG Disc */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              sfx.click();
              router.push("/");
            }}
            className="brand"
            aria-label="Vantage home"
          >
            <svg width="25" height="25" viewBox="0 0 25 25" fill="none">
              <clipPath id="react-brand-disc">
                <circle cx="12.5" cy="12.5" r="12.5" />
              </clipPath>
              <g clipPath="url(#react-brand-disc)">
                <rect width="25" height="25" fill="#ededed" />
                <path d="M12.5 0L25 12.5L12.5 25L0 12.5Z" fill="#737778" />
                <path d="M12.5 2.5L22.5 12.5L12.5 22.5L2.5 12.5Z" fill="#050606" />
                <path d="M12.5 5L20 12.5L12.5 20L5 12.5Z" fill="#0a0b0b" />
                <path d="M12.5 7L18 12.5L12.5 18L7 12.5Z" fill="#fafafa" />
                <path d="M12.5 9L16 12.5L12.5 16L9 12.5Z" fill="#050606" />
              </g>
            </svg>
          </a>

          {/* 2. Header Actions (Nav, Time, Sign Up) */}
          <div className="header-actions" id="tablet-navigation">
            <nav className="nav" aria-label="Primary navigation">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  sfx.click();
                  router.push("/");
                }}
                className="active"
              >
                Home
              </a>
              <a
                href="/chat"
                onClick={(e) => {
                  e.preventDefault();
                  sfx.click();
                  router.push("/chat");
                }}
              >
                Studio
              </a>
              <a
                href="/about"
                onClick={(e) => {
                  e.preventDefault();
                  sfx.click();
                  router.push("/about");
                }}
              >
                About
              </a>
              <a
                href="/templates"
                onClick={(e) => {
                  e.preventDefault();
                  sfx.click();
                  router.push("/templates");
                }}
              >
                Services
              </a>
              <a
                href="/templates"
                onClick={(e) => {
                  e.preventDefault();
                  sfx.click();
                  router.push("/templates");
                }}
              >
                Dielines
              </a>
            </nav>

            {/* 3. Time Panel */}
            <div className="time-panel">
              <div className="time-label">Timezone</div>
              <div className="time-value">9:47 PM&nbsp; • &nbsp;14 July 2026</div>
            </div>

            {/* 4. Sign Up Pill Button */}
            <button
              className="sign-up"
              type="button"
              onClick={() => {
                sfx.click();
                router.push("/login");
              }}
              onMouseEnter={sfx.hover}
            >
              Sign Up
            </button>
          </div>

          {/* 5. Menu Toggle (Visible on mobile/tablet) */}
          <button
            className="menu-toggle"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            onClick={() => {
              sfx.toggle();
              setMenuOpen(!menuOpen);
            }}
          >
            <svg
              className="hamburger-icon"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <line className="line-top" x1="3" y1="6" x2="17" y2="6" />
              <line className="line-bottom" x1="3" y1="14" x2="17" y2="14" />
            </svg>
          </button>
        </header>

        {/* Mobile Frosted Glass Drawer Menu */}
        {menuOpen && (
          <div className="fixed inset-0 z-40 bg-black/90 backdrop-blur-2xl p-6 flex flex-col justify-between md:hidden animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="font-bold text-lg text-white">Vantage Navigation</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 text-white grid place-items-center"
              >
                ✕
              </button>
            </div>

            <nav className="flex flex-col gap-4 py-8 text-lg font-medium text-white/80">
              <button
                onClick={() => {
                  sfx.click();
                  setMenuOpen(false);
                  router.push("/");
                }}
                className="text-left py-2 hover:text-white"
              >
                Home
              </button>
              <button
                onClick={() => {
                  sfx.click();
                  setMenuOpen(false);
                  router.push("/chat");
                }}
                className="text-left py-2 hover:text-white"
              >
                Chat Studio
              </button>
              <button
                onClick={() => {
                  sfx.click();
                  setMenuOpen(false);
                  router.push("/about");
                }}
                className="text-left py-2 hover:text-white"
              >
                About Factory &amp; Press
              </button>
              <button
                onClick={() => {
                  sfx.click();
                  setMenuOpen(false);
                  router.push("/templates");
                }}
                className="text-left py-2 hover:text-white"
              >
                CAD Dielines Library
              </button>
              <button
                onClick={() => {
                  sfx.click();
                  setMenuOpen(false);
                  router.push("/studio");
                }}
                className="text-left py-2 hover:text-white"
              >
                Packaging 3D Studio
              </button>
              <button
                onClick={() => {
                  sfx.click();
                  setMenuOpen(false);
                  router.push("/download");
                }}
                className="text-left py-2 hover:text-white"
              >
                Download Mobile &amp; Desktop App
              </button>
            </nav>

            <div className="space-y-3 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  sfx.click();
                  setMenuOpen(false);
                  router.push("/login");
                }}
                className="w-full py-3.5 rounded-full bg-white text-black font-bold text-sm"
              >
                Sign In / Client Portal
              </button>
            </div>
          </div>
        )}

        {/* ================= HERO SECTION ================= */}
        <section className="hero">
          {/* Hero Content (Bottom-Left) */}
          <div className="hero-content">
            {/* Headline (Two lines with optical transforms) */}
            <h1 className="hero-title">
              <span className="line line-one">
                <span className="line-reveal">Stop Digging</span>
              </span>
              <span className="line line-two">
                <span className="line-reveal">Through Dashboards.</span>
              </span>
            </h1>

            {/* Body Copy (Exact wording & line breaks) */}
            <p className="hero-copy">
              Your metrics are scattered across a dozen dashboards.
              <br />
              Vantage bring them into one clear signal, so every
              <br />
              decision is backed by data you actually trust.
            </p>

            {/* Primary CTA (White button with dark arrow box) */}
            <button
              className="primary-cta"
              type="button"
              onClick={() => {
                sfx.whoosh();
                router.push("/chat");
              }}
              onMouseEnter={sfx.hover}
            >
              <span className="label">Get Started</span>
              <span className="arrow-box">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 7h8M8 3.5l3.5 3.5-3.5 3.5" />
                </svg>
              </span>
            </button>
          </div>

          {/* Demo Card (Bottom-Right Glass Card) */}
          <article className="demo-card" ref={demoCardRef}>
            <div className="demo-visual">
              <img
                src="assets/watch-demo-thumbnail.png"
                alt="Abstract red and blue smoke"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "assets/watch-demo-thumbnail.svg";
                }}
              />
              <button
                className="play"
                type="button"
                aria-label="Play demo"
                onClick={handleOpenVideo}
                onMouseEnter={sfx.hover}
              >
                <svg width="14" height="16" viewBox="0 0 14 16" fill="#ffffff">
                  <path d="M1 1.5L13 8L1 14.5Z" />
                </svg>
              </button>
            </div>
            <button
              className="watch-button"
              type="button"
              onClick={handleOpenVideo}
              onMouseEnter={sfx.hover}
            >
              Watch Demo
            </button>
          </article>
        </section>
      </section>

      {/* Video Demo Theater Modal */}
      {videoModalOpen && (
        <div
          className="vantage-modal open"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseVideo();
          }}
        >
          <div className="vantage-modal-card" style={{ maxWidth: 840 }}>
            <div className="modal-head">
              <div className="modal-title">
                <span>Vantage — Unified Signal Demo</span>
              </div>
              <button
                className="modal-close"
                onClick={handleCloseVideo}
                aria-label="Close video"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="video-theater">
              <video ref={theaterVideoRef} controls playsInline autoPlay>
                <source
                  src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_064556_051587f1-74a1-4336-8c05-4dde3594ed05.mp4"
                  type="video/mp4"
                />
              </video>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
