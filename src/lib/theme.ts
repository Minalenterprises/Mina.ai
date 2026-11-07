/* Minal AI Theme Engine — Synchronized with Minal Enterprises */

export type ThemeId = "bone" | "sand" | "mist" | "slate" | "ink";

export const THEMES: {
  id: ThemeId;
  label: string;
  hint: string;
  swatch: { bg: string; fg: string; accent: string };
}[] = [
  { id: "bone", label: "Bone", hint: "Warm light", swatch: { bg: "#f4f1eb", fg: "#16130e", accent: "#ffffff" } },
  { id: "sand", label: "Sand", hint: "Golden cream", swatch: { bg: "#f6edd9", fg: "#2a2013", accent: "#c47b2a" } },
  { id: "mist", label: "Mist", hint: "Cool daylight", swatch: { bg: "#eef1f4", fg: "#10151c", accent: "#3f6fb5" } },
  { id: "slate", label: "Slate", hint: "Soft dusk", swatch: { bg: "#23282e", fg: "#eceff2", accent: "#ffffff" } },
  { id: "ink", label: "Ink", hint: "Deep night", swatch: { bg: "#0a0a0b", fg: "#f2ede4", accent: "#ffffff" } },
];

const KEY = "minal-ai-theme";

export function currentTheme(): ThemeId {
  if (typeof window === "undefined") return "ink";
  return (localStorage.getItem(KEY) as ThemeId) || "ink";
}

export function paintTheme(id: ThemeId) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = id;
  root.style.colorScheme = id === "slate" || id === "ink" ? "dark" : "light";
  if (id === "ink" || id === "slate") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function setTheme(id: ThemeId) {
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, id);
  }
  paintTheme(id);
}
