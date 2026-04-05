"use client";
import { useRef, useState } from "react";
import {
  motion,
  useMotionValue, useSpring, useTransform,
  type MotionValue,
} from "framer-motion";
import {
  Terminal, User, Newspaper, FolderOpen,
  Activity, Database, Mail, FileText, BookOpen, Zap, Globe, Settings, Atom,
  Bot, PenSquare, Calculator, FileEdit, CalendarDays, Music2, Clipboard,
} from "lucide-react";
import { useWindowStore } from "@/lib/windowStore";
import { useSettingsStore } from "@/lib/settingsStore";
import type { AppId } from "@/types";
import { APP_REGISTRY } from "@/lib/apps";

const APP_META: Record<AppId, { color: string; bg: string; icon: React.ReactNode }> = {
  terminal:      { color: "#28C840", bg: "linear-gradient(145deg, #0E1F12, #153320)",  icon: <Terminal size={20} strokeWidth={1.5} /> },
  about:         { color: "#C8A97E", bg: "linear-gradient(145deg, #1E1710, #2A1E12)",  icon: <User size={20} strokeWidth={1.5} /> },
  axira:         { color: "#5AC8FA", bg: "linear-gradient(145deg, #0A1520, #0E2030)",  icon: <Newspaper size={20} strokeWidth={1.5} /> },
  projects:      { color: "#FEBC2E", bg: "linear-gradient(145deg, #1E1800, #2A2206)",  icon: <FolderOpen size={20} strokeWidth={1.5} /> },
  systemmonitor: { color: "#FF5F57", bg: "linear-gradient(145deg, #1F0C0C, #2A1010)",  icon: <Activity size={20} strokeWidth={1.5} /> },
  skills:        { color: "#B48EAD", bg: "linear-gradient(145deg, #18101E, #22162A)",  icon: <Database size={20} strokeWidth={1.5} /> },
  contact:       { color: "#C8A97E", bg: "linear-gradient(145deg, #1A1510, #24190E)",  icon: <Mail size={20} strokeWidth={1.5} /> },
  resume:        { color: "#F0EDE6", bg: "linear-gradient(145deg, #181818, #222222)",  icon: <FileText size={20} strokeWidth={1.5} /> },
  notebook:      { color: "#F97316", bg: "linear-gradient(145deg, #1A1008, #261606)",  icon: <BookOpen size={20} strokeWidth={1.5} /> },
  simulation:    { color: "#A78BFA", bg: "linear-gradient(145deg, #14102A, #1E1640)",  icon: <Zap size={20} strokeWidth={1.5} /> },
  tor:           { color: "#7D4E8A", bg: "linear-gradient(145deg, #120A18, #1A0F22)",  icon: <span style={{ fontSize: 16, lineHeight: 1 }}>🧅</span> },
  clearnet:      { color: "#FEBC2E", bg: "linear-gradient(145deg, #1A1400, #261E00)",  icon: <Globe size={20} strokeWidth={1.5} /> },
  settings:      { color: "#9A9A8A", bg: "linear-gradient(145deg, #141414, #1E1E1E)",  icon: <Settings size={20} strokeWidth={1.5} /> },
  quantum:       { color: "#5AC8FA", bg: "linear-gradient(145deg, #061520, #0A2030)",  icon: <Atom size={20} strokeWidth={1.5} /> },
  ai:            { color: "#C8A97E", bg: "linear-gradient(145deg, #1A1508, #261E0A)",  icon: <Bot size={20} strokeWidth={1.5} /> },
  newsroom:      { color: "#FF5F57", bg: "linear-gradient(145deg, #1F0C0C, #2A1010)",  icon: <PenSquare size={20} strokeWidth={1.5} /> },
  calculator:    { color: "#C8A97E", bg: "linear-gradient(145deg, #1A1508, #261E0A)",  icon: <Calculator size={20} strokeWidth={1.5} /> },
  notes:         { color: "#F97316", bg: "linear-gradient(145deg, #1A1008, #261606)",  icon: <FileEdit size={20} strokeWidth={1.5} /> },
  files:         { color: "#FEBC2E", bg: "linear-gradient(145deg, #1E1800, #2A2206)",  icon: <FolderOpen size={20} strokeWidth={1.5} /> },
  calendar:      { color: "#5AC8FA", bg: "linear-gradient(145deg, #0A1520, #0E2030)",  icon: <CalendarDays size={20} strokeWidth={1.5} /> },
  mediaplayer:   { color: "#B48EAD", bg: "linear-gradient(145deg, #18101E, #22162A)",  icon: <Music2 size={20} strokeWidth={1.5} /> },
  clipboard:     { color: "#9A9A8A", bg: "linear-gradient(145deg, #141414, #1E1E1E)",  icon: <Clipboard size={20} strokeWidth={1.5} /> },
};

function DockIcon({ app, mouseX }: { app: (typeof APP_REGISTRY)[number]; mouseX: MotionValue<number> }) {
  const ref = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const { open, windows } = useWindowStore();
  const dockMagnification = useSettingsStore((s) => s.dockMagnification);
  const meta = APP_META[app.id];

  const isOpen_ = windows.some((w) => w.appId === app.id && !w.isMinimized);
  const isMin_  = windows.some((w) => w.appId === app.id && w.isMinimized);

  const distance = useTransform(mouseX, (x) => {
    const el = ref.current;
    if (!el) return Infinity;
    const rect = el.getBoundingClientRect();
    return Math.abs(x - (rect.left + rect.width / 2));
  });

  const scaleRaw = useTransform(distance, [0, 70, 130], dockMagnification ? [1.6, 1.2, 1] : [1, 1, 1], { clamp: true });
  const yRaw     = useTransform(distance, [0, 70, 130], dockMagnification ? [-16, -5, 0] : [0, 0, 0],  { clamp: true });

  const scale = useSpring(scaleRaw, { stiffness: 420, damping: 28, mass: 0.6 });
  const y     = useSpring(yRaw,     { stiffness: 420, damping: 28, mass: 0.6 });

  return (
    <div
      ref={ref}
      className="relative flex flex-col items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="absolute bottom-[calc(100%+14px)] whitespace-nowrap text-[11px] px-2.5 py-1 rounded-lg font-medium pointer-events-none z-50"
          style={{
            background: "rgba(22,22,28,0.95)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "#F0EDE6",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
          {app.label}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-1 overflow-hidden" style={{ marginTop: -1 }}>
            <div className="w-2 h-2 rotate-45 origin-top-left" style={{ background: "rgba(22,22,28,0.95)", border: "1px solid rgba(255,255,255,0.07)" }} />
          </div>
        </motion.div>
      )}

      {/* Icon */}
      <motion.button
        style={{ scale, y }}
        onClick={() => open(app.id)}
        whileTap={{ scale: 0.88 }}
        className="w-12 h-12 rounded-[14px] flex items-center justify-center relative overflow-hidden"
      >
        <div
          className="absolute inset-0 rounded-[14px]"
          style={{
            background: meta.bg,
            border: isOpen_ ? `1px solid ${meta.color}28` : "1px solid rgba(255,255,255,0.06)",
            boxShadow: isOpen_
              ? `0 0 0 1px ${meta.color}22, 0 4px 16px rgba(0,0,0,0.5)`
              : "0 4px 16px rgba(0,0,0,0.4)",
          }}
        />
        {isOpen_ && (
          <div
            className="absolute inset-0 rounded-[14px]"
            style={{ background: `radial-gradient(circle at 50% 30%, ${meta.color}18, transparent 70%)` }}
          />
        )}
        <span className="relative z-10" style={{ color: isOpen_ ? meta.color : "#4A4A56" }}>
          {meta.icon}
        </span>
      </motion.button>

      {/* Running dot */}
      <div className="h-[5px] flex items-center justify-center mt-1">
        {(isOpen_ || isMin_) && (
          <motion.div
            layoutId={`dot-${app.id}`}
            className="rounded-full"
            style={{
              width: isOpen_ ? 5 : 3,
              height: isOpen_ ? 5 : 3,
              background: isOpen_ ? meta.color : "#3A3A42",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
          />
        )}
      </div>
    </div>
  );
}

export default function Dock() {
  const mouseX = useMotionValue(Infinity);

  return (
    <div
      className="fixed bottom-4 left-1/2 z-45 -translate-x-1/2 flex items-end"
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
    >
      <div
        className="glass-light flex items-end gap-1.5 px-3 py-2.5 rounded-2xl relative"
        style={{
          border: "1px solid rgba(255,255,255,0.055)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.04) inset",
        }}
      >
        <div
          className="absolute top-0 left-4 right-4 h-px rounded-full"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }}
        />
        {APP_REGISTRY.map((app) => (
          <DockIcon key={app.id} app={app} mouseX={mouseX} />
        ))}
      </div>
    </div>
  );
}
