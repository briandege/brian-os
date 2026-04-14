import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppId } from "@/types";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { audit } from "@/lib/auditStore";

export type AccentColor = "tan" | "blue" | "purple" | "green" | "red";
export type WallpaperStyle = "grid" | "dots" | "noise" | "none";
export type TerminalTheme = "void" | "matrix" | "amber" | "ice";
export type TerminalCursor = "block" | "bar" | "underline";
export type AnimationSpeed = "fast" | "normal" | "slow";
export type ClassificationLevel = "none" | "confidential" | "secret" | "top-secret";

export const CLASSIFICATION_CONFIG: Record<Exclude<ClassificationLevel, "none">, {
  label: string;
  bg: string;
  shadowColor: string;
  encryption: string;
  markings: string;
  channel: string;
  eyesOnly: string;
}> = {
  confidential: {
    label:       "CONFIDENTIAL",
    bg:          "linear-gradient(180deg, #1A3F8C 0%, #0D2666 100%)",
    shadowColor: "rgba(13,38,102,0.7)",
    encryption:  "AES-256-GCM · X25519+ML-KEM-768",
    markings:    "//CONF//NOFORN",
    channel:     "HANDLE VIA CONF CHANNELS ONLY",
    eyesOnly:    "AUTHORIZED PERSONNEL ONLY",
  },
  secret: {
    label:       "SECRET",
    bg:          "linear-gradient(180deg, #B80000 0%, #7A0000 100%)",
    shadowColor: "rgba(122,0,0,0.7)",
    encryption:  "AES-256-GCM · ML-KEM-768 · FIPS 203",
    markings:    "//SECRET//NOFORN",
    channel:     "HANDLE VIA SECRET CHANNELS ONLY",
    eyesOnly:    "NEED-TO-KNOW REQUIRED",
  },
  "top-secret": {
    label:       "TOP SECRET",
    bg:          "linear-gradient(180deg, #C00000 0%, #8B0000 100%)",
    shadowColor: "rgba(139,0,0,0.7)",
    encryption:  "ML-KEM-1024 · SLH-DSA · FIPS 203/205",
    markings:    "//TS//SCI//NOFORN",
    channel:     "HANDLE VIA STRONTIUM CHANNELS ONLY",
    eyesOnly:    "CLASSIFICATION: BRIAN NDEGE EYES ONLY",
  },
};

export const ACCENT_PALETTE: Record<AccentColor, { primary: string; dim: string; bright: string; label: string }> = {
  tan:    { primary: "#C8A97E", dim: "#7A6348", bright: "#DFC49A", label: "Gold"   },
  blue:   { primary: "#5AC8FA", dim: "#2A6A8A", bright: "#7CD8FF", label: "Cyan"   },
  purple: { primary: "#B48EAD", dim: "#6A4A68", bright: "#D0A8CC", label: "Purple" },
  green:  { primary: "#28C840", dim: "#145A1E", bright: "#4AE060", label: "Green"  },
  red:    { primary: "#FF5F57", dim: "#8A2820", bright: "#FF8A84", label: "Red"    },
};

export const TERMINAL_THEMES: Record<TerminalTheme, {
  label: string; preview: string;
  bg: string; fg: string; cursor: string; selection: string;
  green: string; red: string; yellow: string; blue: string; magenta: string;
}> = {
  void:   { label: "Void",   preview: "#C8A97E", bg: "#060607", fg: "#C8C6C0", cursor: "#C8A97E", selection: "rgba(200,169,126,0.2)",  green: "#28C840", red: "#FF5F57", yellow: "#FEBC2E", blue: "#5AC8FA", magenta: "#B48EAD" },
  matrix: { label: "Matrix", preview: "#00FF41", bg: "#020A02", fg: "#00CC33", cursor: "#00FF41", selection: "rgba(0,255,65,0.15)",     green: "#00FF41", red: "#FF4444", yellow: "#AAFF00", blue: "#00CCFF", magenta: "#88FF88" },
  amber:  { label: "Amber",  preview: "#FFBF00", bg: "#0A0800", fg: "#D4A017", cursor: "#FFCC00", selection: "rgba(255,191,0,0.18)",    green: "#88CC00", red: "#FF4422", yellow: "#FFCC00", blue: "#88AAFF", magenta: "#CC88CC" },
  ice:    { label: "Ice",    preview: "#5AC8FA", bg: "#040810", fg: "#A8D4FF", cursor: "#5AC8FA", selection: "rgba(90,200,250,0.15)",   green: "#4AE0B0", red: "#FF6688", yellow: "#FFD080", blue: "#5AC8FA", magenta: "#C090FF" },
};

export const DEFAULT_STARTUP_APPS: AppId[] = ["terminal", "axira"];

interface SettingsState {
  accent: AccentColor;
  wallpaper: WallpaperStyle;
  startupApps: AppId[];
  reduceMotion: boolean;
  // terminal
  terminalFontSize: number;
  terminalTheme: TerminalTheme;
  terminalCursor: TerminalCursor;
  terminalScrollback: number;
  // desktop
  dockMagnification: boolean;
  animationSpeed: AnimationSpeed;
  colorScheme: "dark" | "light";
  doNotDisturb: boolean;
  // classification
  classificationLevel:    ClassificationLevel;
  /** SHA-256 hash of the password (never stores plaintext) */
  classificationPasswordHash: string;
  // actions
  setAccent:                  (a: AccentColor)           => void;
  setWallpaper:               (w: WallpaperStyle)        => void;
  toggleStartupApp:           (id: AppId)                => void;
  setReduceMotion:            (v: boolean)               => void;
  setTerminalFontSize:        (n: number)                => void;
  setTerminalTheme:           (t: TerminalTheme)         => void;
  setTerminalCursor:          (c: TerminalCursor)        => void;
  setTerminalScrollback:      (n: number)                => void;
  setDockMagnification:       (v: boolean)               => void;
  setAnimationSpeed:          (s: AnimationSpeed)        => void;
  setColorScheme:             (s: "dark" | "light")      => void;
  setDoNotDisturb:            (v: boolean)               => void;
  setClassificationLevel:     (l: ClassificationLevel)   => void;
  /** Pass the NEW plaintext password — it will be hashed before storing */
  setClassificationPassword:  (p: string)                => Promise<void>;
  /** Verify a plaintext attempt against the stored hash */
  verifyClassificationPassword: (attempt: string)        => Promise<boolean>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      accent:              "tan" as AccentColor,
      wallpaper:           "grid",
      startupApps:         DEFAULT_STARTUP_APPS,
      reduceMotion:        false,
      terminalFontSize:    13,
      terminalTheme:       "void",
      terminalCursor:      "block",
      terminalScrollback:  5000,
      dockMagnification:      true,
      animationSpeed:         "normal",
      colorScheme:            "dark",
      doNotDisturb:           false,
      classificationLevel: "top-secret",
      // SHA-256("admin") — default password is "admin"
      classificationPasswordHash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",

      setAccent:                  (accent)               => set({ accent }),
      setWallpaper:               (wallpaper)            => set({ wallpaper }),
      toggleStartupApp:           (id) =>
        set((s) => ({
          startupApps: s.startupApps.includes(id)
            ? s.startupApps.filter((a) => a !== id)
            : [...s.startupApps, id],
        })),
      setReduceMotion:            (reduceMotion)         => set({ reduceMotion }),
      setTerminalFontSize:        (terminalFontSize)     => set({ terminalFontSize }),
      setTerminalTheme:           (terminalTheme)        => set({ terminalTheme }),
      setTerminalCursor:          (terminalCursor)       => set({ terminalCursor }),
      setTerminalScrollback:      (terminalScrollback)   => set({ terminalScrollback }),
      setDockMagnification:       (dockMagnification)    => set({ dockMagnification }),
      setAnimationSpeed:          (animationSpeed)       => set({ animationSpeed }),
      setColorScheme:             (colorScheme)          => set({ colorScheme }),
      setDoNotDisturb:            (doNotDisturb)         => set({ doNotDisturb }),
      setClassificationLevel: (classificationLevel) => {
        audit({ category: "security", severity: "warning", action: `Classification level changed to: ${classificationLevel}`, module: "SettingsStore" });
        set({ classificationLevel });
      },
      setClassificationPassword:  async (plaintext) => {
        const classificationPasswordHash = await hashPassword(plaintext);
        audit({ category: "security", severity: "critical", action: "System password changed", module: "SettingsStore" });
        set({ classificationPasswordHash });
      },
      verifyClassificationPassword: async (attempt: string): Promise<boolean> => {
        const hash = get().classificationPasswordHash;
        return verifyPassword(attempt, hash);
      },
    }),
    {
      name: "strontium-settings",
      // Migrate stale hash: if the old incorrect default was stored, reset to the correct one
      onRehydrateStorage: () => (state) => {
        const WRONG_HASH = "bec0e4b5194587d3eb5dbc835fe4468ed15c1b209ac94205c408b07bfc65f98c";
        const CORRECT_HASH = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";
        if (state && state.classificationPasswordHash === WRONG_HASH) {
          state.classificationPasswordHash = CORRECT_HASH;
        }
      },
    }
  )
);

// Apply accent color as CSS variables on :root
export function applyAccent(accent: AccentColor) {
  const p = ACCENT_PALETTE[accent];
  const root = document.documentElement;
  root.style.setProperty("--color-tan",        p.primary);
  root.style.setProperty("--color-tan-dim",    p.dim);
  root.style.setProperty("--color-tan-bright", p.bright);
  root.style.setProperty("--color-tan-ghost",  hexToRgba(p.primary, 0.07));
}

// Apply color scheme on :root
export function applyColorScheme(scheme: "dark" | "light") {
  document.documentElement.setAttribute("data-theme", scheme);
}

// Apply animation speed as CSS variable on :root
export function applyAnimationSpeed(speed: AnimationSpeed) {
  const multipliers: Record<AnimationSpeed, string> = { fast: "0.5", normal: "1", slow: "2" };
  document.documentElement.style.setProperty("--anim-speed", multipliers[speed]);
}

// Apply reduce motion preference on :root
export function applyReduceMotion(reduce: boolean) {
  document.documentElement.setAttribute("data-reduce-motion", reduce ? "true" : "false");
}

/** Apply all CSS-affecting settings at once — call on app init and after rehydration */
export function applyAllSettings(s: {
  accent: AccentColor;
  colorScheme: "dark" | "light";
  animationSpeed: AnimationSpeed;
  reduceMotion: boolean;
}) {
  applyAccent(s.accent);
  applyColorScheme(s.colorScheme);
  applyAnimationSpeed(s.animationSpeed);
  applyReduceMotion(s.reduceMotion);
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
