"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal, User, Newspaper, FolderOpen,
  Activity, Database, Mail, FileText, BookOpen, Zap,
} from "lucide-react";
import { useWindowStore } from "@/lib/windowStore";
import type { AppId } from "@/types";
import { APP_REGISTRY } from "@/lib/apps";

// Per-app accent color + icon
const APP_META: Record<AppId, { color: string; bg: string; icon: React.ReactNode }> = {
  terminal:      { color: "#28C840", bg: "linear-gradient(145deg, #0E1F12, #153320)",      icon: <Terminal size={20} strokeWidth={1.5} /> },
  about:         { color: "#C8A97E", bg: "linear-gradient(145deg, #1E1710, #2A1E12)",      icon: <User size={20} strokeWidth={1.5} /> },
  axira:         { color: "#5AC8FA", bg: "linear-gradient(145deg, #0A1520, #0E2030)",      icon: <Newspaper size={20} strokeWidth={1.5} /> },
  projects:      { color: "#FEBC2E", bg: "linear-gradient(145deg, #1E1800, #2A2206)",      icon: <FolderOpen size={20} strokeWidth={1.5} /> },
  systemmonitor: { color: "#FF5F57", bg: "linear-gradient(145deg, #1F0C0C, #2A1010)",      icon: <Activity size={20} strokeWidth={1.5} /> },
  skills:        { color: "#B48EAD", bg: "linear-gradient(145deg, #18101E, #22162A)",      icon: <Database size={20} strokeWidth={1.5} /> },
  contact:       { color: "#C8A97E", bg: "linear-gradient(145deg, #1A1510, #24190E)",      icon: <Mail size={20} strokeWidth={1.5} /> },
  resume:        { color: "#F0EDE6", bg: "linear-gradient(145deg, #181818, #222222)",      icon: <FileText size={20} strokeWidth={1.5} /> },
  notebook:      { color: "#F97316", bg: "linear-gradient(145deg, #1A1008, #261606)",      icon: <BookOpen size={20} strokeWidth={1.5} /> },
  simulation:    { color: "#A78BFA", bg: "linear-gradient(145deg, #14102A, #1E1640)",      icon: <Zap size={20} strokeWidth={1.5} /> },
};

export default function Dock() {
  const { open, windows } = useWindowStore();
  const [hovered, setHovered] = useState<AppId | null>(null);

  const isOpen = (id: AppId) => windows.some((w) => w.appId === id && !w.isMinimized);
  const isMinimized = (id: AppId) => windows.some((w) => w.appId === id && w.isMinimized);

  return (
    <div className="fixed bottom-14 left-1/2 z-30 -translate-x-1/2 flex items-end">
      {/* Dock tray */}
      <div
        className="glass-light flex items-end gap-1.5 px-3 py-2.5 rounded-2xl relative"
        style={{
          border: "1px solid rgba(255,255,255,0.055)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.04) inset",
        }}
      >
        {/* Subtle inner top highlight */}
        <div
          className="absolute top-0 left-4 right-4 h-px rounded-full"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }}
        />

        {APP_REGISTRY.map((app) => {
          const meta = APP_META[app.id];
          const open_ = isOpen(app.id);
          const min_ = isMinimized(app.id);
          const hov_ = hovered === app.id;
          const anyHov = hovered !== null;

          return (
            <div key={app.id} className="relative flex flex-col items-center">
              {/* Tooltip */}
              <AnimatePresence>
                {hov_ && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.92 }}
                    transition={{ duration: 0.12 }}
                    className="absolute bottom-[calc(100%+10px)] whitespace-nowrap text-[11px] px-2.5 py-1 rounded-lg font-medium pointer-events-none"
                    style={{
                      background: "rgba(22,22,28,0.95)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      color: "#F0EDE6",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                    }}
                  >
                    {app.label}
                    {/* Tooltip arrow */}
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-1 overflow-hidden"
                      style={{ marginTop: -1 }}
                    >
                      <div
                        className="w-2 h-2 rotate-45 origin-top-left"
                        style={{ background: "rgba(22,22,28,0.95)", border: "1px solid rgba(255,255,255,0.07)" }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Icon button */}
              <motion.button
                onHoverStart={() => setHovered(app.id)}
                onHoverEnd={() => setHovered(null)}
                onClick={() => open(app.id)}
                animate={{
                  scale: hov_ ? 1.32 : anyHov ? 0.96 : 1,
                  y: hov_ ? -10 : anyHov ? 1 : 0,
                }}
                transition={{ type: "spring" as const, stiffness: 500, damping: 24 }}
                className="w-12 h-12 rounded-[14px] flex items-center justify-center relative overflow-hidden"
                style={{
                  background: meta.bg,
                  border: open_
                    ? `1px solid ${meta.color}28`
                    : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: open_
                    ? `0 0 0 1px ${meta.color}22, 0 4px 16px rgba(0,0,0,0.5)`
                    : "0 4px 16px rgba(0,0,0,0.4)",
                  color: open_ ? meta.color : hov_ ? "#F0EDE6" : "#4A4A56",
                }}
              >
                {/* Icon inner glow when open */}
                {open_ && (
                  <div
                    className="absolute inset-0 rounded-[14px]"
                    style={{
                      background: `radial-gradient(circle at 50% 30%, ${meta.color}18, transparent 70%)`,
                    }}
                  />
                )}
                <span className="relative z-10">{meta.icon}</span>
              </motion.button>

              {/* Running indicator */}
              <div className="h-[5px] flex items-center justify-center mt-1">
                {(open_ || min_) && (
                  <motion.div
                    layoutId={`dot-${app.id}`}
                    className="rounded-full"
                    style={{
                      width: open_ ? 5 : 3,
                      height: open_ ? 5 : 3,
                      background: open_ ? meta.color : "#3A3A42",
                    }}
                    transition={{ type: "spring" as const, stiffness: 400, damping: 24 }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
