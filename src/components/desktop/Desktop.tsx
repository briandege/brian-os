"use client";
import { useRef } from "react";
import { AnimatePresence } from "framer-motion";
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
  }
}

export default function Desktop() {
  const { windows, open } = useWindowStore();
  const desktopRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={desktopRef}
      className="fixed inset-0"
      style={{ background: "#080808", paddingBottom: 96 }}
    >
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #1A1A1A 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.3,
        }}
      />

      {/* AXIRA ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 600,
          height: 400,
          background: "radial-gradient(ellipse at center, rgba(212,184,150,0.03) 0%, transparent 70%)",
          top: "20%",
          left: "30%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Desktop icons (quick launch) */}
      <div className="absolute top-6 right-6 flex flex-col gap-4">
        {(["terminal", "about", "axira"] as AppId[]).map((appId) => (
          <button
            key={appId}
            onDoubleClick={() => open(appId)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl group"
            style={{ width: 72 }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xs font-mono font-bold transition-colors"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid #1E1E1E",
                color: "#4A4A4A",
              }}
            >
              {appId.slice(0, 3).toUpperCase()}
            </div>
            <span className="text-[10px] text-center" style={{ color: "#3A3A3A" }}>
              {appId}
            </span>
          </button>
        ))}
      </div>

      {/* Windows layer */}
      <AnimatePresence>
        {windows.map((win) => (
          <Window key={win.instanceId} win={win}>
            <AppContent appId={win.appId} />
          </Window>
        ))}
      </AnimatePresence>

      {/* Dock + Taskbar */}
      <Dock />
      <Taskbar />
    </div>
  );
}
