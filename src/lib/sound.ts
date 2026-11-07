/* Minal AI Synthesized Sound Engine — Web Audio API oscillators/noise. Zero audio files, works offline & instantly. */

let ctx: AudioContext | null = null;
let muted = typeof window !== "undefined" ? localStorage.getItem("minal-ai-muted") === "1" : false;

function getCtx() {
  if (!ctx && typeof window !== "undefined") {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (Ctor) ctx = new Ctor();
  }
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(v: boolean) {
  muted = v;
  if (typeof window !== "undefined") {
    localStorage.setItem("minal-ai-muted", v ? "1" : "0");
  }
}

export function toggleMuted(): boolean {
  setMuted(!muted);
  return muted;
}

function tone({
  freq = 440,
  freqEnd,
  duration = 0.08,
  type = "sine",
  volume = 0.05,
  delay = 0,
}: {
  freq?: number;
  freqEnd?: number;
  duration?: number;
  type?: OscillatorType;
  volume?: number;
  delay?: number;
}) {
  if (muted) return;
  try {
    const c = getCtx();
    if (!c) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + duration);
    }
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.03);
  } catch {
    /* Audio unsupported — fail silently */
  }
}

let lastHover = 0;

export const sfx = {
  hover: () => {
    const now = performance.now();
    if (now - lastHover < 65) return;
    lastHover = now;
    tone({ freq: 480, freqEnd: 120, duration: 0.018, type: "sine", volume: 0.025 });
  },
  click: () => {
    tone({ freq: 140, freqEnd: 50, duration: 0.035, type: "sine", volume: 0.07 });
  },
  toggle: () => {
    tone({ freq: 320, freqEnd: 120, duration: 0.045, type: "triangle", volume: 0.05 });
  },
  open: () => {
    tone({ freq: 220, freqEnd: 60, duration: 0.04, type: "sine", volume: 0.05 });
  },
  close: () => {
    tone({ freq: 110, freqEnd: 45, duration: 0.035, type: "sine", volume: 0.05 });
  },
  success: () => {
    tone({ freq: 587.33, freqEnd: 587.33, duration: 0.1, type: "sine", volume: 0.035 });
    tone({ freq: 880, freqEnd: 880, duration: 0.16, type: "sine", volume: 0.035, delay: 0.08 });
  },
  whoosh: () => {
    tone({ freq: 240, freqEnd: 150, duration: 0.18, type: "sine", volume: 0.04 });
  },
  complete: () => {
    tone({ freq: 523.25, duration: 0.16, type: "sine", volume: 0.03 });
    tone({ freq: 783.99, duration: 0.22, type: "sine", volume: 0.025, delay: 0.1 });
    tone({ freq: 200, freqEnd: 90, duration: 0.2, type: "sine", volume: 0.035, delay: 0.02 });
  },
  pop: () => {
    tone({ freq: 650, freqEnd: 300, duration: 0.025, type: "triangle", volume: 0.04 });
  },
  chime: () => {
    tone({ freq: 784, duration: 0.12, type: "sine", volume: 0.03 });
    tone({ freq: 1046.5, duration: 0.2, type: "sine", volume: 0.03, delay: 0.06 });
  },
};
