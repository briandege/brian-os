"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, Shield, Activity } from "lucide-react";
import { useWindowStore } from "@/lib/windowStore";

export default function Taskbar() {
  const { windows, focusedId, restore, focus, minimize } = useWindowStore();
  const [time, setTime] = useState({ h: "", m: "", s: "", date: "" });
  const [networkStrength] = useState(4); // 1-4

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime({
        h: now.toLocaleTimeString("en-US", { hour: "2-digit", hour12: false }),
        m: now.toLocaleTimeString("en-US", { minute: "2-digit" }),
        s: now.getSeconds().toString().padStart(2, "0"),
        date: now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const openWindows = windows;

  return (
    <div
      className="glass fixed bottom-0 left-0 right-0 flex items-center px-4 z-40 select-none"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.045)",
        height: "calc(48px + env(safe-area-inset-bottom))",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* ── Left: Brand ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: "#C8A97E" }} />
          <span
            className="text-[11px] font-bold font-mono tracking-[0.18em] uppercase"
            style={{ color: "#C8A97E" }}
          >
            brian.os
          </span>
        </div>
        <div className="w-px h-3.5" style={{ background: "#252528" }} />
      </div>

      {/* ── Center: Open windows ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center gap-1 overflow-hidden px-2 min-w-0">
        <AnimatePresence initial={false}>
          {openWindows.map((win) => {
            const active = focusedId === win.instanceId && !win.isMinimized;
            return (
              <motion.button
                key={win.instanceId}
                initial={{ opacity: 0, scale: 0.85, width: 0 }}
                animate={{ opacity: 1, scale: 1, width: "auto" }}
                exit={{ opacity: 0, scale: 0.85, width: 0 }}
                transition={{ type: "spring" as const, stiffness: 420, damping: 32 }}
                onClick={() => {
                  if (win.isMinimized) restore(win.instanceId);
                  else if (active) minimize(win.instanceId);
                  else focus(win.instanceId);
                }}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 max-w-[140px] whitespace-nowrap overflow-hidden"
                style={{
                  background: active ? "rgba(200,169,126,0.1)" : "transparent",
                  color: active ? "#C8A97E" : win.isMinimized ? "#2E2E33" : "#4A4A56",
                  border: `1px solid ${active ? "rgba(200,169,126,0.16)" : "transparent"}`,
                }}
              >
                <div
                  className="shrink-0 rounded-full"
                  style={{
                    width: 5,
                    height: 5,
                    background: active ? "#C8A97E" : win.isMinimized ? "#252528" : "#3A3A42",
                  }}
                />
                <span className="truncate">{win.title}</span>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Right: System tray ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-px h-3.5" style={{ background: "#252528" }} />

        {/* System tray icons */}
        <div className="flex items-center gap-2.5">
          {/* Shield/security indicator */}
          <Shield size={12} style={{ color: "#28C840" }} />

          {/* Network */}
          <div className="flex items-end gap-[2px] h-3">
            {[1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                className="w-[3px] rounded-sm"
                style={{
                  height: 3 + bar * 2,
                  background: bar <= networkStrength ? "#4A4A56" : "#1E1E22",
                }}
              />
            ))}
          </div>

          {/* Activity indicator */}
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: "#28C840" }} />
          </div>
        </div>

        <div className="w-px h-3.5" style={{ background: "#252528" }} />

        {/* Clock */}
        <div className="text-right">
          <div className="flex items-baseline gap-[2px]">
            <span className="text-[13px] font-semibold tabular-nums font-mono" style={{ color: "#F0EDE6" }}>
              {time.h}:{time.m}
            </span>
            <span className="text-[10px] font-mono" style={{ color: "#3A3A42" }}>
              :{time.s}
            </span>
          </div>
          <div className="text-[9px] font-mono text-right" style={{ color: "#3A3A42" }}>
            {time.date}
          </div>
        </div>
      </div>
    </div>
  );
}
