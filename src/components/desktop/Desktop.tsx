"use client";
import { useState, useCallback } from "react";
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
import TorApp from "@/components/apps/TorApp";
import ClearnetApp from "@/components/apps/ClearnetApp";
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
    case "tor":           return <TorApp />;
    case "clearnet":      return <ClearnetApp />;
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
      style={{ paddingTop: 40, paddingBottom: 88 }}
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

      {/* ① Deep void base */}
      <div className="absolute inset-0" style={{ background: "#050506" }} />

      {/* ② Circuit trace grid — PCB-style amber */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.45 }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="0.8" fill="#C8A97E" opacity="0.9" />
          </pattern>
          <pattern id="circuit" width="160" height="160" patternUnits="userSpaceOnUse">
            <rect width="160" height="160" fill="url(#dots)" />
            <line x1="0"   y1="40"  x2="80"  y2="40"  stroke="#C8A97E" strokeWidth="0.7" opacity="0.8" />
            <line x1="80"  y1="120" x2="160" y2="120" stroke="#C8A97E" strokeWidth="0.7" opacity="0.7" />
            <line x1="40"  y1="0"   x2="40"  y2="80"  stroke="#C8A97E" strokeWidth="0.7" opacity="0.7" />
            <line x1="120" y1="80"  x2="120" y2="160" stroke="#C8A97E" strokeWidth="0.7" opacity="0.6" />
            <circle cx="40"  cy="40"  r="3"   fill="none" stroke="#C8A97E" strokeWidth="0.8" opacity="0.85" />
            <circle cx="120" cy="120" r="3"   fill="none" stroke="#C8A97E" strokeWidth="0.8" opacity="0.7" />
            <circle cx="40"  cy="120" r="2"   fill="#C8A97E" opacity="0.45" />
            <circle cx="120" cy="40"  r="2"   fill="#C8A97E" opacity="0.45" />
          </pattern>
          <radialGradient id="wp-fade" cx="50%" cy="50%" r="60%">
            <stop offset="0%"   stopColor="white" stopOpacity="1"   />
            <stop offset="65%"  stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0.1" />
          </radialGradient>
          <mask id="wp-mask">
            <rect width="100%" height="100%" fill="url(#wp-fade)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit)" mask="url(#wp-mask)" />
      </svg>

      {/* ③ Phosphor amber center glow */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 80% 65% at 50% 48%, rgba(200,169,126,0.18) 0%, transparent 65%)",
            "radial-gradient(ellipse 40% 35% at 50% 50%, rgba(200,169,126,0.10) 0%, transparent 100%)",
          ].join(", "),
        }}
      />

      {/* ④ Scanlines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, transparent 0px, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)",
          zIndex: 2,
        }}
      />

      {/* ⑤ CRT vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)",
          zIndex: 3,
        }}
      />

      {/* ⑥ Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48"
        style={{
          background:
            "linear-gradient(to top, rgba(5,5,6,0.95) 0%, rgba(5,5,6,0.4) 50%, transparent 100%)",
          zIndex: 4,
        }}
      />

      {/* ⑦ Top fade */}
      <div
        className="absolute top-0 left-0 right-0 h-20"
        style={{
          background: "linear-gradient(to bottom, rgba(5,5,6,0.75) 0%, transparent 100%)",
          zIndex: 4,
        }}
      />

      {/* ⑧ Boot-text ghost */}
      <div
        className="absolute font-mono select-none"
        style={{
          bottom: 100,
          left: 48,
          fontSize: 10,
          lineHeight: 1.8,
          color: "rgba(200,169,126,0.12)",
          letterSpacing: "0.04em",
          zIndex: 1,
          whiteSpace: "pre",
        }}
      >
        {`[ OK ] kernel strontium/6.1.0
[ OK ] mounting /dev/nvme0n1p2
[ OK ] starting systemd v252
[ OK ] network interface eth0
[ OK ] postgresql 16 :5432
[ OK ] redis 7.2 :6379
[ OK ] axira ingestion daemon
[ OK ] all systems operational`}
      </div>

      {/* ⑨ Watermark */}
      <div
        className="absolute font-mono select-none"
        style={{
          bottom: 100,
          right: 32,
          fontSize: 9,
          letterSpacing: "0.22em",
          color: "rgba(200,169,126,0.14)",
          zIndex: 5,
        }}
      >
        STRONTIUM.OS / 2026
      </div>
    </div>
  );
}
