"use client";
import { useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWindowStore } from "@/lib/windowStore";
import Window from "@/components/window/Window";
import Taskbar from "@/components/taskbar/Taskbar";
import Dock from "@/components/dock/Dock";
import TerminalApp from "@/components/apps/Terminal";
import AboutApp from "@/components/apps/AboutApp";
import ProjectsApp from "@/components/apps/ProjectsApp";
import AxiraApp from "@/components/apps/AxiraApp";
import SystemMonitor from "@/components/apps/SystemMonitor";
import SkillsApp from "@/components/apps/SkillsApp";
import ContactApp from "@/components/apps/ContactApp";
import ResumeApp from "@/components/apps/ResumeApp";
import NotebookApp from "@/components/apps/NotebookApp";
import SimulationApp from "@/components/apps/SimulationApp";
import type { AppId } from "@/types";

function AppContent({ appId }: { appId: AppId }) {
  switch (appId) {
    case "terminal":      return <TerminalApp />;
    case "about":         return <AboutApp />;
    case "projects":      return <ProjectsApp />;
    case "axira":         return <AxiraApp />;
    case "systemmonitor": return <SystemMonitor />;
    case "skills":        return <SkillsApp />;
    case "contact":       return <ContactApp />;
    case "resume":        return <ResumeApp />;
    case "notebook":      return <NotebookApp />;
    case "simulation":    return <SimulationApp />;
  }
}

interface ContextItem {
  label: string;
  action: () => void;
  separator?: boolean;
}

export default function Desktop() {
  const { windows, open, closeAll } = useWindowStore();
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);

  const menuItems: ContextItem[] = [
    { label: "Open Terminal",    action: () => open("terminal") },
    { label: "Open AxiraNews",   action: () => open("axira") },
    { label: "About Brian",      action: () => open("about") },
    { label: "View Projects",    action: () => open("projects") },
    { label: "Open Notebook",    action: () => open("notebook") },
    { label: "Run Simulation",   action: () => open("simulation"), separator: true },
    { label: "System Monitor",   action: () => open("systemmonitor") },
    { label: "Close All Windows",action: () => closeAll() },
  ];

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setCtx({ x: e.clientX, y: e.clientY });
  }, []);

  const closeMenu = useCallback(() => setCtx(null), []);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ paddingBottom: 96 }}
      onContextMenu={handleContextMenu}
      onClick={closeMenu}
    >
      {/* ── Wallpaper ─────────────────────────────────────────────────── */}
      <Wallpaper />

      {/* ── Windows ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {windows.map((win) => (
          <Window key={win.instanceId} win={win}>
            <AppContent appId={win.appId} />
          </Window>
        ))}
      </AnimatePresence>

      {/* ── Context Menu ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {ctx && (
          <motion.div
            key="ctx"
            initial={{ opacity: 0, scale: 0.94, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 py-1 rounded-xl overflow-hidden min-w-[180px]"
            style={{
              top: Math.min(ctx.y, window.innerHeight - 260),
              left: Math.min(ctx.x, window.innerWidth - 200),
              background: "rgba(18,18,22,0.96)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 16px 60px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5)",
              backdropFilter: "blur(24px)",
            }}
          >
            {menuItems.map((item, i) => (
              <div key={i}>
                {item.separator && (
                  <div className="my-1 mx-3 h-px" style={{ background: "#252528" }} />
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); item.action(); closeMenu(); }}
                  className="w-full text-left px-4 py-2 text-[12px] transition-colors"
                  style={{ color: "#C8A97E" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(200,169,126,0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {item.label}
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dock + Taskbar ────────────────────────────────────────────── */}
      <Dock />
      <Taskbar />
    </div>
  );
}

// ── Wallpaper ──────────────────────────────────────────────────────────────
function Wallpaper() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Base */}
      <div className="absolute inset-0" style={{ background: "#070708" }} />

      {/* Topographic line grid — SVG */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.18 }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="#C8A97E"
              strokeWidth="0.4"
              opacity="0.5"
            />
          </pattern>
          <pattern id="grid-major" width="300" height="300" patternUnits="userSpaceOnUse">
            <rect width="300" height="300" fill="url(#grid)" />
            <path
              d="M 300 0 L 0 0 0 300"
              fill="none"
              stroke="#C8A97E"
              strokeWidth="0.8"
              opacity="0.6"
            />
          </pattern>
          <radialGradient id="fade" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="grid-mask">
            <rect width="100%" height="100%" fill="url(#fade)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-major)" mask="url(#grid-mask)" />
      </svg>

      {/* Center radial glow */}
      <div
        className="absolute"
        style={{
          width: 900,
          height: 600,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(ellipse at center, rgba(200,169,126,0.04) 0%, rgba(200,169,126,0.01) 40%, transparent 70%)",
        }}
      />

      {/* Bottom vignette for dock readability */}
      <div
        className="absolute bottom-0 left-0 right-0 h-64"
        style={{
          background:
            "linear-gradient(to top, rgba(7,7,8,0.95) 0%, rgba(7,7,8,0.4) 60%, transparent 100%)",
        }}
      />

      {/* Top vignette */}
      <div
        className="absolute top-0 left-0 right-0 h-24"
        style={{
          background:
            "linear-gradient(to bottom, rgba(7,7,8,0.6) 0%, transparent 100%)",
        }}
      />

      {/* Watermark */}
      <div
        className="absolute bottom-16 right-8 font-mono text-[10px] tracking-widest select-none"
        style={{ color: "#1A1A1E", letterSpacing: "0.2em" }}
      >
        STRONTIUM.OS / 2026
      </div>
    </div>
  );
}
