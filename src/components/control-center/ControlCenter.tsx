"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Wifi, Volume2, Sun, Moon, Bell, BellOff,
  Layers, Maximize2, Palette, Image,
} from "lucide-react";
import { useSettingsStore, ACCENT_PALETTE, applyColorScheme, type AccentColor, type WallpaperStyle } from "@/lib/settingsStore";

// ── Toggle widget ─────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative shrink-0 transition-all"
      style={{
        width: 36, height: 20,
        borderRadius: 10,
        background: on ? "#28C840" : "rgba(255,255,255,0.1)",
        border: `1px solid ${on ? "#28C840" : "rgba(255,255,255,0.12)"}`,
        transition: "background 0.2s, border-color 0.2s",
      }}
    >
      <motion.div
        animate={{ x: on ? 18 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-0.5 rounded-full"
        style={{ width: 15, height: 15, background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
      />
    </button>
  );
}

// ── Slider widget ─────────────────────────────────────────────────────────────
function Slider({ value, onChange, color = "#C8A97E" }: { value: number; onChange: (v: number) => void; color?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const update = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onChange(Math.round(pct * 100));
  };

  useEffect(() => {
    const up  = () => { dragging.current = false; };
    const move = (e: MouseEvent) => { if (dragging.current) update(e.clientX); };
    window.addEventListener("mouseup", up);
    window.addEventListener("mousemove", move);
    return () => { window.removeEventListener("mouseup", up); window.removeEventListener("mousemove", move); };
  });

  return (
    <div
      ref={trackRef}
      className="relative h-1.5 rounded-full cursor-pointer"
      style={{ background: "rgba(255,255,255,0.08)" }}
      onMouseDown={(e) => { dragging.current = true; update(e.clientX); }}
    >
      <div
        className="absolute left-0 top-0 h-full rounded-full"
        style={{ width: `${value}%`, background: color, transition: "width 0.05s" }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
        style={{
          left: `calc(${value}% - 6px)`,
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
        }}
      />
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-3.5 ${className}`}
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {children}
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9px] font-mono font-bold tracking-[0.18em] uppercase mb-2" style={{ color: "rgba(255,255,255,0.22)" }}>
      {children}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
interface Props { open: boolean; onClose: () => void }

const WALLPAPERS: { id: WallpaperStyle; label: string }[] = [
  { id: "grid", label: "Circuit" },
  { id: "dots", label: "Dots" },
  { id: "noise", label: "Noise" },
  { id: "none", label: "Void" },
];

export default function ControlCenter({ open, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const {
    accent, setAccent,
    wallpaper, setWallpaper,
    dockMagnification, setDockMagnification,
    doNotDisturb, setDoNotDisturb,
    colorScheme, setColorScheme,
  } = useSettingsStore();

  // Local decorative state (brightness/volume)
  const [brightness, setBrightness] = useState(80);
  const [volume, setVolume] = useState(65);
  const [wifi, setWifi] = useState(true);

  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className="fixed z-[155] rounded-2xl overflow-hidden"
          style={{
            top: 48,
            right: 16,
            width: 300,
            background: "rgba(10,10,16,0.98)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 32px 100px rgba(0,0,0,0.88), 0 0 0 0.5px rgba(255,255,255,0.04) inset",
            backdropFilter: "blur(40px)",
          }}
        >
          <div className="p-3 flex flex-col gap-2.5">

            {/* Row 1: WiFi + DND */}
            <div className="grid grid-cols-2 gap-2.5">
              <Card>
                <div className="flex items-center justify-between mb-1.5">
                  <Wifi size={14} style={{ color: wifi ? "#5AC8FA" : "rgba(255,255,255,0.2)" }} />
                  <Toggle on={wifi} onChange={setWifi} />
                </div>
                <div className="text-[11px] font-semibold" style={{ color: wifi ? "#F0EDE6" : "rgba(255,255,255,0.3)" }}>Wi-Fi</div>
                <div className="text-[9.5px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
                  {wifi ? "Connected" : "Off"}
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-1.5">
                  {doNotDisturb
                    ? <BellOff size={14} style={{ color: "#FEBC2E" }} />
                    : <Bell size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                  }
                  <Toggle on={doNotDisturb} onChange={setDoNotDisturb} />
                </div>
                <div className="text-[11px] font-semibold" style={{ color: doNotDisturb ? "#FEBC2E" : "rgba(255,255,255,0.3)" }}>
                  Focus
                </div>
                <div className="text-[9.5px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
                  {doNotDisturb ? "Do Not Disturb" : "Off"}
                </div>
              </Card>
            </div>

            {/* Row 2: Dock magnification + Mission Control hint */}
            <div className="grid grid-cols-2 gap-2.5">
              <Card>
                <div className="flex items-center justify-between mb-1.5">
                  <Layers size={14} style={{ color: dockMagnification ? "#A78BFA" : "rgba(255,255,255,0.2)" }} />
                  <Toggle on={dockMagnification} onChange={setDockMagnification} />
                </div>
                <div className="text-[11px] font-semibold" style={{ color: dockMagnification ? "#F0EDE6" : "rgba(255,255,255,0.3)" }}>
                  Magnify
                </div>
                <div className="text-[9.5px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>Dock hover</div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-1.5">
                  <Maximize2 size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    F3
                  </span>
                </div>
                <div className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Mission</div>
                <div className="text-[9.5px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>Control</div>
              </Card>
            </div>

            {/* Brightness */}
            <Card>
              <div className="flex items-center gap-2 mb-2.5">
                <Sun size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
                <Label>Display Brightness</Label>
                <span className="ml-auto text-[9.5px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{brightness}%</span>
              </div>
              <Slider value={brightness} onChange={setBrightness} color="#FEBC2E" />
            </Card>

            {/* Volume */}
            <Card>
              <div className="flex items-center gap-2 mb-2.5">
                <Volume2 size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
                <Label>Sound</Label>
                <span className="ml-auto text-[9.5px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{volume}%</span>
              </div>
              <Slider value={volume} onChange={setVolume} color="#5AC8FA" />
            </Card>

            {/* Accent color */}
            <Card>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Palette size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
                <Label>Accent Colour</Label>
              </div>
              <div className="flex items-center gap-2">
                {(Object.entries(ACCENT_PALETTE) as [AccentColor, typeof ACCENT_PALETTE[AccentColor]][]).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setAccent(key)}
                    className="transition-transform"
                    style={{ transform: accent === key ? "scale(1.25)" : "scale(1)" }}
                    title={val.label}
                  >
                    <div
                      className="w-5 h-5 rounded-full"
                      style={{
                        background: val.primary,
                        boxShadow: accent === key ? `0 0 0 2px rgba(${0},${0},${0},0.8), 0 0 0 3px ${val.primary}` : "none",
                      }}
                    />
                  </button>
                ))}
              </div>
            </Card>

            {/* Wallpaper */}
            <Card>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Image size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
                <Label>Wallpaper</Label>
              </div>
              <div className="flex gap-1.5">
                {WALLPAPERS.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setWallpaper(w.id)}
                    className="flex-1 py-1 rounded-lg text-[10px] font-mono transition-all"
                    style={{
                      background: wallpaper === w.id ? "rgba(200,169,126,0.12)" : "rgba(255,255,255,0.04)",
                      border: wallpaper === w.id ? "1px solid rgba(200,169,126,0.3)" : "1px solid rgba(255,255,255,0.06)",
                      color: wallpaper === w.id ? "#C8A97E" : "rgba(255,255,255,0.25)",
                    }}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </Card>

            {/* Appearance (Light/Dark toggle) */}
            <div className="grid grid-cols-2 gap-2.5">
              <Card>
                <div className="flex items-center justify-between mb-1.5">
                  {colorScheme === "light"
                    ? <Sun size={14} style={{ color: "#FEBC2E" }} />
                    : <Moon size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                  }
                  <Toggle on={colorScheme === "light"} onChange={(v) => { const s = v ? "light" : "dark"; setColorScheme(s); applyColorScheme(s); }} />
                </div>
                <div className="text-[11px] font-semibold" style={{ color: colorScheme === "light" ? "#F0EDE6" : "rgba(255,255,255,0.3)" }}>
                  Appearance
                </div>
                <div className="text-[9.5px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
                  {colorScheme === "light" ? "Light mode" : "Dark mode"}
                </div>
              </Card>
              <div />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
