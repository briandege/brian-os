"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Terminal, User, Newspaper, FolderOpen,
  Activity, Database, Mail, FileText,
} from "lucide-react";
import { useWindowStore } from "@/lib/windowStore";
import type { AppId } from "@/types";
import { APP_REGISTRY } from "@/lib/apps";

const ICON_MAP: Record<AppId, React.ReactNode> = {
  terminal:      <Terminal size={22} />,
  about:         <User size={22} />,
  axira:         <Newspaper size={22} />,
  projects:      <FolderOpen size={22} />,
  systemmonitor: <Activity size={22} />,
  skills:        <Database size={22} />,
  contact:       <Mail size={22} />,
  resume:        <FileText size={22} />,
};

export default function Dock() {
  const { open, windows } = useWindowStore();
  const [hovered, setHovered] = useState<AppId | null>(null);

  const isOpen = (appId: AppId) =>
    windows.some((w) => w.appId === appId);

  return (
    <div
      className="fixed bottom-14 left-1/2 -translate-x-1/2 z-30 flex items-end gap-2 px-4 py-3 rounded-2xl glass"
      style={{ border: "1px solid #2A2A2A" }}
    >
      {APP_REGISTRY.map((app) => {
        const active = isOpen(app.id);
        const isHov = hovered === app.id;

        return (
          <div key={app.id} className="relative flex flex-col items-center">
            {/* Tooltip */}
            {isHov && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-9 whitespace-nowrap text-xs px-2 py-1 rounded-md font-medium"
                style={{ background: "#1A1A1A", color: "#D4B896", border: "1px solid #2A2A2A" }}
              >
                {app.label}
              </motion.div>
            )}

            {/* Icon */}
            <motion.button
              onHoverStart={() => setHovered(app.id)}
              onHoverEnd={() => setHovered(null)}
              onClick={() => open(app.id)}
              animate={{
                scale: isHov ? 1.28 : 1,
                y: isHov ? -6 : 0,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
              style={{
                background: active
                  ? "rgba(212,184,150,0.15)"
                  : isHov
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(255,255,255,0.04)",
                color: active ? "#D4B896" : isHov ? "#F5F5F0" : "#6B6B6B",
                border: `1px solid ${active ? "rgba(212,184,150,0.25)" : "#2A2A2A"}`,
              }}
            >
              {ICON_MAP[app.id]}
            </motion.button>

            {/* Open indicator dot */}
            {active && (
              <div
                className="w-1 h-1 rounded-full mt-1"
                style={{ background: "#D4B896" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
