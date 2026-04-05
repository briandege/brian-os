"use client";
import { useState, useCallback, useEffect, useRef } from "react";
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
import SettingsApp from "@/components/apps/SettingsApp";
import QuantumApp from "@/components/apps/QuantumApp";
import AIAssistant from "@/components/apps/AIAssistant";
import NewsroomApp from "@/components/apps/NewsroomApp";
import CalculatorApp from "@/components/apps/CalculatorApp";
import NotesApp from "@/components/apps/NotesApp";
import FilesApp from "@/components/apps/FilesApp";
import CalendarApp from "@/components/apps/CalendarApp";
import MediaPlayerApp from "@/components/apps/MediaPlayerApp";
import ClipboardApp from "@/components/apps/ClipboardApp";
import Spotlight from "@/components/spotlight/Spotlight";
import NotificationToast from "@/components/notifications/NotificationToast";
import MissionControl from "@/components/mission-control/MissionControl";
import AppSwitcher from "@/components/app-switcher/AppSwitcher";
import NewsTicker from "@/components/desktop/NewsTicker";
import { useSettingsStore, applyAccent, applyColorScheme } from "@/lib/settingsStore";
import { useHealthStore } from "@/lib/healthStore";
import { useUpdateStore } from "@/lib/updateStore";
import { notify } from "@/lib/notificationStore";
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
    case "settings":      return <SettingsApp />;
    case "quantum":       return <QuantumApp />;
    case "ai":            return <AIAssistant />;
    case "newsroom":      return <NewsroomApp />;
    case "calculator":    return <CalculatorApp />;
    case "notes":         return <NotesApp />;
    case "files":         return <FilesApp />;
    case "calendar":      return <CalendarApp />;
    case "mediaplayer":   return <MediaPlayerApp />;
    case "clipboard":     return <ClipboardApp />;
  }
}

interface ContextItem { label: string; action: () => void; separator?: boolean }

export default function Desktop() {
  const { windows, open, closeAll, focus, minimize } = useWindowStore();
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);
  const [spotlightOpen, setSpotlightOpen]       = useState(false);
  const [missionControlOpen, setMissionControl] = useState(false);
  const [switcherOpen, setSwitcherOpen]         = useState(false);
  const [switcherIdx, setSwitcherIdx]           = useState(0);
  const accent = useSettingsStore((s) => s.accent);
  const colorScheme = useSettingsStore((s) => s.colorScheme);

  const cmdHeld = useRef(false);

  // Apply accent color + color scheme
  useEffect(() => { applyAccent(accent); applyColorScheme(colorScheme); }, [accent, colorScheme]);

  // Health tick — increment uptime every second
  useEffect(() => {
    const id = setInterval(() => useHealthStore.getState().tick(), 1000);
    return () => clearInterval(id);
  }, []);

  // Update check — show notification on first load if update available
  useEffect(() => {
    const { updateAvailable, changelog, acknowledge } = useUpdateStore.getState();
    if (updateAvailable) {
      notify("strontium.os v0.2.0", changelog, "info", "settings");
      acknowledge();
    }
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const openWindows = () => windows.filter((w) => !w.isMinimized);

    const down = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // Track Meta/Ctrl held for app switcher
      if (e.key === "Meta" || e.key === "Control") cmdHeld.current = true;

      // Screenshot: Cmd+Shift+3
      if (mod && e.shiftKey && e.key === "3") {
        e.preventDefault();
        if (window.electronAPI?.captureScreenshot) {
          window.electronAPI.captureScreenshot().then((path) => {
            if (path) notify("Screenshot Saved", path, "success");
            else notify("Screenshot", "Cancelled", "info");
          }).catch(() => notify("Screenshot", "Failed to capture", "error"));
        }
        return;
      }

      // Spotlight: Cmd+K
      if (mod && e.key === "k") { e.preventDefault(); setSpotlightOpen((v) => !v); return; }

      // Mission Control: F3 or Ctrl+ArrowUp
      if (e.key === "F3" || (mod && e.key === "ArrowUp")) {
        e.preventDefault();
        setMissionControl((v) => !v);
        return;
      }

      // App Switcher: Cmd+Tab
      if (mod && e.key === "Tab") {
        e.preventDefault();
        const apps = openWindows();
        if (apps.length === 0) return;
        if (!switcherOpen) {
          setSwitcherOpen(true);
          setSwitcherIdx((i) => (i + 1) % apps.length);
        } else {
          setSwitcherIdx((i) => (e.shiftKey ? (i - 1 + apps.length) % apps.length : (i + 1) % apps.length));
        }
        return;
      }

      // Hide all windows: Cmd+H
      if (mod && e.key === "h") {
        e.preventDefault();
        openWindows().forEach((w) => minimize(w.instanceId));
        return;
      }

      // Close focused window: Cmd+W
      if (mod && e.key === "w") {
        e.preventDefault();
        const focused = windows.find((w) => !w.isMinimized && w.zIndex === Math.max(...windows.map((x) => x.zIndex)));
        if (focused) useWindowStore.getState().close(focused.instanceId);
        return;
      }

      // Escape: close overlays
      if (e.key === "Escape") {
        setSpotlightOpen(false);
        setMissionControl(false);
        setSwitcherOpen(false);
      }
    };

    const up = (e: KeyboardEvent) => {
      if (e.key === "Meta" || e.key === "Control") {
        cmdHeld.current = false;
        // Commit app switcher selection on Meta release
        if (switcherOpen) {
          const apps = windows.filter((w) => !w.isMinimized);
          const win = apps[switcherIdx];
          if (win) focus(win.instanceId);
          setSwitcherOpen(false);
        }
      }
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [windows, switcherOpen, switcherIdx, focus, minimize]);

  // ── Context menu ───────────────────────────────────────────────────────────
  const menuItems: ContextItem[] = [
    { label: "Search  ⌘K",        action: () => setSpotlightOpen(true) },
    { label: "Mission Control  F3",action: () => setMissionControl(true) },
    { label: "Open Terminal",      action: () => open("terminal") },
    { label: "Open AxiraNews",     action: () => open("axira") },
    { label: "About Brian",        action: () => open("about") },
    { label: "View Projects",      action: () => open("projects") },
    { label: "Open Notebook",      action: () => open("notebook") },
    { label: "Run Simulation",     action: () => open("simulation") },
    { label: "Quantum Lab",        action: () => open("quantum"), separator: true },
    { label: "Calculator",         action: () => open("calculator") },
    { label: "Notes",              action: () => open("notes") },
    { label: "Files",              action: () => open("files") },
    { label: "Calendar",           action: () => open("calendar") },
    { label: "Media Player",       action: () => open("mediaplayer"), separator: true },
    { label: "System Monitor",     action: () => open("systemmonitor") },
    { label: "Close All Windows",  action: () => closeAll() },
  ];

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setCtx({ x: e.clientX, y: e.clientY });
  }, []);

  const closeMenu = useCallback(() => setCtx(null), []);

  // ── Hot corners ─────────────────────────────────────────────────────────────
  // Top-left: Mission Control | Top-right: Spotlight | Bottom-left: hide all
  const hotCorner = (action: () => void) => {
    let timer: ReturnType<typeof setTimeout>;
    return {
      onMouseEnter: () => { timer = setTimeout(action, 300); },
      onMouseLeave: () => clearTimeout(timer),
    };
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ paddingTop: 40, paddingBottom: 88 }}
      onContextMenu={handleContextMenu}
      onClick={closeMenu}
    >
      {/* ── Wallpaper ───────────────────────────────────────────────────── */}
      <Wallpaper />

      {/* ── Hot Corners ─────────────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 w-8 h-8 z-[400]" {...hotCorner(() => setMissionControl(true))} />
      <div className="fixed top-0 right-0 w-8 h-8 z-[400]" {...hotCorner(() => setSpotlightOpen(true))} />
      <div className="fixed bottom-0 left-0 w-8 h-8 z-[400]" {...hotCorner(() => windows.filter(w => !w.isMinimized).forEach(w => minimize(w.instanceId)))} />

      {/* ── Windows ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {windows.map((win) => (
          <Window key={win.instanceId} win={win}>
            <AppContent appId={win.appId} />
          </Window>
        ))}
      </AnimatePresence>

      {/* ── Context Menu ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {ctx && (
          <motion.div
            key="ctx"
            initial={{ opacity: 0, scale: 0.94, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 py-1 rounded-xl overflow-hidden min-w-[200px]"
            style={{
              top: Math.min(ctx.y, window.innerHeight - 280),
              left: Math.min(ctx.x, window.innerWidth - 220),
              background: "rgba(12,12,16,0.97)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 16px 60px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5)",
              backdropFilter: "blur(24px)",
            }}
          >
            {menuItems.map((item, i) => (
              <div key={i}>
                {item.separator && <div className="my-1 mx-3 h-px" style={{ background: "#1E1E24" }} />}
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

      {/* ── Dock + Taskbar ──────────────────────────────────────────────── */}
      <Dock />
      <Taskbar />

      {/* ── Overlays ────────────────────────────────────────────────────── */}
      <Spotlight open={spotlightOpen} onClose={() => setSpotlightOpen(false)} />
      <MissionControl open={missionControlOpen} onClose={() => setMissionControl(false)} />
      <AppSwitcher
        open={switcherOpen}
        windows={windows}
        selectedIdx={switcherIdx}
        onHover={(i) => setSwitcherIdx(i)}
        onSelect={(i) => {
          const apps = windows.filter((w) => !w.isMinimized);
          const win = apps[i];
          if (win) focus(win.instanceId);
          setSwitcherOpen(false);
        }}
      />
      <NotificationToast />
      <NewsTicker />
    </div>
  );
}

// ── Wallpaper ──────────────────────────────────────────────────────────────
function Wallpaper() {
  const wallpaper = useSettingsStore((s) => s.wallpaper);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0" style={{ background: "#050506" }} />

      {wallpaper === "grid" && (
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.45 }} preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="wp-dot-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="0.8" fill="#C8A97E" opacity="0.9" />
            </pattern>
            <pattern id="wp-circuit" width="160" height="160" patternUnits="userSpaceOnUse">
              <rect width="160" height="160" fill="url(#wp-dot-grid)" />
              <line x1="0"   y1="40"  x2="80"  y2="40"  stroke="#C8A97E" strokeWidth="0.7" opacity="0.8" />
              <line x1="80"  y1="120" x2="160" y2="120" stroke="#C8A97E" strokeWidth="0.7" opacity="0.7" />
              <line x1="40"  y1="0"   x2="40"  y2="80"  stroke="#C8A97E" strokeWidth="0.7" opacity="0.7" />
              <line x1="120" y1="80"  x2="120" y2="160" stroke="#C8A97E" strokeWidth="0.7" opacity="0.6" />
              <circle cx="40"  cy="40"  r="3" fill="none" stroke="#C8A97E" strokeWidth="0.8" opacity="0.85" />
              <circle cx="120" cy="120" r="3" fill="none" stroke="#C8A97E" strokeWidth="0.8" opacity="0.7" />
              <circle cx="40"  cy="120" r="2" fill="#C8A97E" opacity="0.45" />
              <circle cx="120" cy="40"  r="2" fill="#C8A97E" opacity="0.45" />
            </pattern>
            <radialGradient id="wp-fade-grid" cx="50%" cy="50%" r="60%">
              <stop offset="0%"   stopColor="white" stopOpacity="1"   />
              <stop offset="65%"  stopColor="white" stopOpacity="0.6" />
              <stop offset="100%" stopColor="white" stopOpacity="0.1" />
            </radialGradient>
            <mask id="wp-mask-grid">
              <rect width="100%" height="100%" fill="url(#wp-fade-grid)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#wp-circuit)" mask="url(#wp-mask-grid)" />
        </svg>
      )}
      {wallpaper === "dots" && (
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.5 }} preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="wp-dots" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="14" cy="14" r="1.2" fill="#C8A97E" opacity="0.85" />
            </pattern>
            <radialGradient id="wp-fade-dots" cx="50%" cy="50%" r="60%">
              <stop offset="0%"   stopColor="white" stopOpacity="1"   />
              <stop offset="65%"  stopColor="white" stopOpacity="0.5" />
              <stop offset="100%" stopColor="white" stopOpacity="0.05" />
            </radialGradient>
            <mask id="wp-mask-dots">
              <rect width="100%" height="100%" fill="url(#wp-fade-dots)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#wp-dots)" mask="url(#wp-mask-dots)" />
        </svg>
      )}
      {wallpaper === "noise" && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.15'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
            opacity: 0.35,
          }}
        />
      )}

      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 65% at 50% 48%, rgba(200,169,126,0.18) 0%, transparent 65%), radial-gradient(ellipse 40% 35% at 50% 50%, rgba(200,169,126,0.10) 0%, transparent 100%)" }} />
      <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(180deg, transparent 0px, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)", zIndex: 2 }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)", zIndex: 3 }} />
      <div className="absolute bottom-0 left-0 right-0 h-48" style={{ background: "linear-gradient(to top, rgba(5,5,6,0.95) 0%, rgba(5,5,6,0.4) 50%, transparent 100%)", zIndex: 4 }} />
      <div className="absolute top-0 left-0 right-0 h-20"  style={{ background: "linear-gradient(to bottom, rgba(5,5,6,0.75) 0%, transparent 100%)", zIndex: 4 }} />
      <div className="absolute font-mono select-none" style={{ bottom: 100, left: 48, fontSize: 10, lineHeight: 1.8, color: "rgba(200,169,126,0.12)", letterSpacing: "0.04em", zIndex: 1, whiteSpace: "pre" }}>
        {`[ OK ] kernel strontium/6.1.0\n[ OK ] mounting /dev/nvme0n1p2\n[ OK ] starting systemd v252\n[ OK ] network interface eth0\n[ OK ] postgresql 16 :5432\n[ OK ] redis 7.2 :6379\n[ OK ] axira ingestion daemon\n[ OK ] all systems operational`}
      </div>
      <div className="absolute font-mono select-none" style={{ bottom: 100, right: 32, fontSize: 9, letterSpacing: "0.22em", color: "rgba(200,169,126,0.14)", zIndex: 5 }}>
        STRONTIUM.OS / 2026
      </div>
    </div>
  );
}
