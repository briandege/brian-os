import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppId } from "@/types";

export type AccentColor = "tan" | "blue" | "purple" | "green" | "red";
export type WallpaperStyle = "grid" | "dots" | "noise" | "none";

export const ACCENT_PALETTE: Record<AccentColor, { primary: string; dim: string; bright: string; label: string }> = {
  tan:    { primary: "#C8A97E", dim: "#7A6348", bright: "#DFC49A", label: "Gold"   },
  blue:   { primary: "#5AC8FA", dim: "#2A6A8A", bright: "#7CD8FF", label: "Cyan"   },
  purple: { primary: "#B48EAD", dim: "#6A4A68", bright: "#D0A8CC", label: "Purple" },
  green:  { primary: "#28C840", dim: "#145A1E", bright: "#4AE060", label: "Green"  },
  red:    { primary: "#FF5F57", dim: "#8A2820", bright: "#FF8A84", label: "Red"    },
};

export const DEFAULT_STARTUP_APPS: AppId[] = ["terminal", "axira"];

interface SettingsState {
  accent: AccentColor;
  wallpaper: WallpaperStyle;
  startupApps: AppId[];
  reduceMotion: boolean;
  // actions
  setAccent:         (a: AccentColor)    => void;
  setWallpaper:      (w: WallpaperStyle) => void;
  toggleStartupApp:  (id: AppId)         => void;
  setReduceMotion:   (v: boolean)        => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      accent:       "tan",
      wallpaper:    "grid",
      startupApps:  DEFAULT_STARTUP_APPS,
      reduceMotion: false,

      setAccent: (accent) => set({ accent }),
      setWallpaper: (wallpaper) => set({ wallpaper }),
      toggleStartupApp: (id) =>
        set((s) => ({
          startupApps: s.startupApps.includes(id)
            ? s.startupApps.filter((a) => a !== id)
            : [...s.startupApps, id],
        })),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
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

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
