"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWindowStore } from "@/lib/windowStore";

export default function Taskbar() {
  const { windows, focusedId, restore, focus } = useWindowStore();
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
      setDate(now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const openWindows = windows.filter((w) => !w.isMinimized || w.isMinimized);

  return (
    <div
      className="glass fixed bottom-0 left-0 right-0 h-12 flex items-center px-4 gap-2 z-40"
      style={{ borderTop: "1px solid #2A2A2A" }}
    >
      {/* Brian OS logo */}
      <div
        className="text-xs font-bold font-mono mr-3 tracking-widest"
        style={{ color: "#D4B896" }}
      >
        brian.os
      </div>

      <div className="h-4 w-px" style={{ background: "#2A2A2A" }} />

      {/* Open windows */}
      <div className="flex-1 flex items-center gap-1 overflow-hidden">
        <AnimatePresence>
          {openWindows.map((win) => {
            const isActive = focusedId === win.instanceId && !win.isMinimized;
            return (
              <motion.button
                key={win.instanceId}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                onClick={() => {
                  if (win.isMinimized) restore(win.instanceId);
                  else focus(win.instanceId);
                }}
                className="flex items-center gap-2 px-3 py-1 rounded-md text-xs transition-colors max-w-[160px]"
                style={{
                  background: isActive ? "rgba(212,184,150,0.12)" : "transparent",
                  color: isActive ? "#D4B896" : "#6B6B6B",
                  border: `1px solid ${isActive ? "rgba(212,184,150,0.2)" : "transparent"}`,
                }}
              >
                {/* Active indicator dot */}
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: isActive ? "#D4B896" : win.isMinimized ? "#3A3A3A" : "#4A4A4A" }}
                />
                <span className="truncate">{win.title}</span>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Clock */}
      <div className="text-right shrink-0">
        <div className="text-xs font-medium" style={{ color: "#F5F5F0" }}>
          {time}
        </div>
        <div className="text-[10px]" style={{ color: "#6B6B6B" }}>
          {date}
        </div>
      </div>
    </div>
  );
}
