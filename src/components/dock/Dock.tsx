"use client";
import { useRef, useState } from "react";
import {
  motion, AnimatePresence,
  useMotionValue, useSpring, useTransform,
  type MotionValue,
} from "framer-motion";
import {
  Terminal, User, Newspaper, FolderOpen,
  Activity, Database, Mail, FileText, BookOpen, Zap, Globe, Settings, Atom,
  Bot, PenSquare, Calculator, FileEdit, CalendarDays, Music2, Clipboard, Shield, Star, Command,
} from "lucide-react";
import { useWindowStore } from "@/lib/windowStore";
import { useSettingsStore } from "@/lib/settingsStore";
import type { AppId } from "@/types";
import { APP_REGISTRY } from "@/lib/apps";

const APP_META: Record<AppId, { color: string; bg: string; icon: React.ReactNode }> = {
  terminal:      { color: "#34D058", bg: "linear-gradient(145deg, #1A3A22, #224830)",  icon: <Terminal size={20} strokeWidth={1.5} /> },
  about:         { color: "#DDB87A", bg: "linear-gradient(145deg, #2E2218, #3A2C1C)",  icon: <User size={20} strokeWidth={1.5} /> },
  axira:         { color: "#60D0FF", bg: "linear-gradient(145deg, #162236, #1C3048)",  icon: <Newspaper size={20} strokeWidth={1.5} /> },
  projects:      { color: "#FFC940", bg: "linear-gradient(145deg, #2E2608, #3C320C)",  icon: <FolderOpen size={20} strokeWidth={1.5} /> },
  systemmonitor: { color: "#FF6B6B", bg: "linear-gradient(145deg, #301414, #401A1A)",  icon: <Activity size={20} strokeWidth={1.5} /> },
  skills:        { color: "#C49EC8", bg: "linear-gradient(145deg, #261830, #32203E)",  icon: <Database size={20} strokeWidth={1.5} /> },
  contact:       { color: "#DDB87A", bg: "linear-gradient(145deg, #2A2018, #362818)",  icon: <Mail size={20} strokeWidth={1.5} /> },
  resume:        { color: "#E8E5DE", bg: "linear-gradient(145deg, #282828, #323232)",  icon: <FileText size={20} strokeWidth={1.5} /> },
  notebook:      { color: "#FF8C42", bg: "linear-gradient(145deg, #2A1A0C, #381F0A)",  icon: <BookOpen size={20} strokeWidth={1.5} /> },
  simulation:    { color: "#B8A0FF", bg: "linear-gradient(145deg, #201840, #2A2058)",  icon: <Zap size={20} strokeWidth={1.5} /> },
  tor:           { color: "#9B6BAA", bg: "linear-gradient(145deg, #201430, #2A1A40)",  icon: <span style={{ fontSize: 16, lineHeight: 1 }}>🧅</span> },
  clearnet:      { color: "#FFC940", bg: "linear-gradient(145deg, #2A2208, #36300A)",  icon: <Globe size={20} strokeWidth={1.5} /> },
  settings:      { color: "#AAAAAA", bg: "linear-gradient(145deg, #222228, #2C2C34)",  icon: <Settings size={20} strokeWidth={1.5} /> },
  quantum:       { color: "#60D0FF", bg: "linear-gradient(145deg, #102030, #162A40)",  icon: <Atom size={20} strokeWidth={1.5} /> },
  ai:            { color: "#DDB87A", bg: "linear-gradient(145deg, #2A2210, #362C14)",  icon: <Bot size={20} strokeWidth={1.5} /> },
  newsroom:      { color: "#FF6B6B", bg: "linear-gradient(145deg, #301414, #401C1C)",  icon: <PenSquare size={20} strokeWidth={1.5} /> },
  calculator:    { color: "#DDB87A", bg: "linear-gradient(145deg, #2A2210, #362C14)",  icon: <Calculator size={20} strokeWidth={1.5} /> },
  notes:         { color: "#FF8C42", bg: "linear-gradient(145deg, #2A1A0C, #381F0A)",  icon: <FileEdit size={20} strokeWidth={1.5} /> },
  files:         { color: "#FFC940", bg: "linear-gradient(145deg, #2E2608, #3C320C)",  icon: <FolderOpen size={20} strokeWidth={1.5} /> },
  calendar:      { color: "#60D0FF", bg: "linear-gradient(145deg, #162236, #1C3048)",  icon: <CalendarDays size={20} strokeWidth={1.5} /> },
  mediaplayer:   { color: "#C49EC8", bg: "linear-gradient(145deg, #261830, #32203E)",  icon: <Music2 size={20} strokeWidth={1.5} /> },
  clipboard:     { color: "#AAAAAA", bg: "linear-gradient(145deg, #222228, #2C2C34)",  icon: <Clipboard size={20} strokeWidth={1.5} /> },
  compliance:       { color: "#C8A97E", bg: "linear-gradient(145deg, #2A2010, #362A14)",  icon: <Shield size={20} strokeWidth={1.5} /> },
  "axira-showcase": { color: "#D4B896", bg: "linear-gradient(145deg, #261E0C, #362A14)", icon: <Star    size={20} strokeWidth={1.5} /> },
  "axira-hq":       { color: "#D4B896", bg: "linear-gradient(145deg, #0E0C18, #1A1428)", icon: <Command size={20} strokeWidth={1.5} /> },
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

  const scale = useSpring(scaleRaw, { stiffness: 340, damping: 24, mass: 0.55 });
  const y     = useSpring(yRaw,     { stiffness: 340, damping: 24, mass: 0.55 });

  return (
    <div
      ref={ref}
      className="relative flex flex-col items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.92, transition: { duration: 0.1, ease: "easeIn" } }}
            transition={{ type: "spring", stiffness: 400, damping: 28, mass: 0.5 }}
            className="absolute bottom-[calc(100%+14px)] whitespace-nowrap text-xs px-2.5 py-1 rounded-lg font-medium pointer-events-none z-50"
            style={{
              background: "rgba(22,22,28,0.95)",
              border: "1px solid rgba(255,255,255,0.09)",
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
      </AnimatePresence>

      {/* Icon */}
      <motion.button
        style={{ scale, y }}
        onClick={() => open(app.id)}
        whileTap={{ scale: 0.88 }}
        className="w-12 h-12 rounded-[15px] flex items-center justify-center relative overflow-hidden"
      >
        <div
          className="absolute inset-0 rounded-[15px]"
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
            className="absolute inset-0 rounded-[15px]"
            style={{ background: `radial-gradient(circle at 50% 30%, ${meta.color}18, transparent 70%)` }}
          />
        )}
        <span className="relative z-10" style={{ color: isOpen_ ? meta.color : `${meta.color}99` }}>
          {meta.icon}
        </span>
      </motion.button>

      {/* Running dot */}
      <div className="h-[6px] flex items-center justify-center mt-1">
        {(isOpen_ || isMin_) && (
          <motion.div
            layoutId={`dot-${app.id}`}
            className="rounded-full"
            style={{
              width: isOpen_ ? 6 : 3,
              height: isOpen_ ? 6 : 3,
              background: isOpen_ ? meta.color : "#3A3A42",
              boxShadow: isOpen_ ? `0 0 8px ${meta.color}` : "none",
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
  const classificationLevel = useSettingsStore((s) => s.classificationLevel);
  const showBanners = classificationLevel !== "none";

  return (
    <div
      className="fixed left-1/2 z-45 -translate-x-1/2 flex items-end"
      style={{ bottom: showBanners ? 32 : 16 }}
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
    >
      <div
        className="glass-dock flex items-end gap-2 px-3 py-2.5 rounded-[22px] relative"
        style={{
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div
          className="absolute top-0 left-4 right-4 h-px rounded-full"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)" }}
        />
        {APP_REGISTRY.map((app) => (
          <DockIcon key={app.id} app={app} mouseX={mouseX} />
        ))}
      </div>
    </div>
  );
}
