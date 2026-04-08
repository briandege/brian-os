import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppId } from "@/types";

export type AccentColor = "tan" | "blue" | "purple" | "green" | "red";
export type WallpaperStyle = "grid" | "dots" | "noise" | "none";
export type TerminalTheme = "void" | "matrix" | "amber" | "ice";
export type TerminalCursor = "block" | "bar" | "underline";
export type AnimationSpeed = "fast" | "normal" | "slow";

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
  topSecretBanners: boolean;
  // actions
  setAccent:             (a: AccentColor)      => void;
  setWallpaper:          (w: WallpaperStyle)   => void;
  toggleStartupApp:      (id: AppId)           => void;
  setReduceMotion:       (v: boolean)          => void;
  setTerminalFontSize:   (n: number)           => void;
  setTerminalTheme:      (t: TerminalTheme)    => void;
  setTerminalCursor:     (c: TerminalCursor)   => void;
  setTerminalScrollback: (n: number)           => void;
  setDockMagnification:  (v: boolean)          => void;
  setAnimationSpeed:     (s: AnimationSpeed)   => void;
  setColorScheme:        (s: "dark" | "light")  => void;
  setDoNotDisturb:       (v: boolean)          => void;
  setTopSecretBanners:   (v: boolean)          => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      accent:              "tan",
      wallpaper:           "grid",
      startupApps:         DEFAULT_STARTUP_APPS,
      reduceMotion:        false,
      terminalFontSize:    13,
      terminalTheme:       "void",
      terminalCursor:      "block",
      terminalScrollback:  5000,
      dockMagnification:   true,
      animationSpeed:      "normal",
      colorScheme:         "dark",
      doNotDisturb:        false,
      topSecretBanners:    true,

      setAccent:             (accent)              => set({ accent }),
      setWallpaper:          (wallpaper)           => set({ wallpaper }),
      toggleStartupApp:      (id) =>
        set((s) => ({
          startupApps: s.startupApps.includes(id)
            ? s.startupApps.filter((a) => a !== id)
            : [...s.startupApps, id],
        })),
      setReduceMotion:       (reduceMotion)        => set({ reduceMotion }),
      setTerminalFontSize:   (terminalFontSize)    => set({ terminalFontSize }),
      setTerminalTheme:      (terminalTheme)       => set({ terminalTheme }),
      setTerminalCursor:     (terminalCursor)      => set({ terminalCursor }),
      setTerminalScrollback: (terminalScrollback)  => set({ terminalScrollback }),
      setDockMagnification:  (dockMagnification)   => set({ dockMagnification }),
      setAnimationSpeed:     (animationSpeed)      => set({ animationSpeed }),
      setColorScheme:        (colorScheme)          => set({ colorScheme }),
      setDoNotDisturb:       (doNotDisturb)        => set({ doNotDisturb }),
      setTopSecretBanners:   (topSecretBanners)    => set({ topSecretBanners }),
    }),
    { name: "strontium-settings" }
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

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
