"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Wifi } from "lucide-react";
import { useWindowStore } from "@/lib/windowStore";

export default function Taskbar() {
  const { windows, focusedId } = useWindowStore();
  const [time, setTime] = useState({ hm: "", s: "", date: "" });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime({
        hm: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
        s: now.getSeconds().toString().padStart(2, "0"),
        date: now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const focused = windows.find((w) => w.instanceId === focusedId && !w.isMinimized);

  return (
    <div
      className="glass fixed top-0 left-0 right-0 flex items-center px-4 z-50 select-none"
      style={{
        height: 40,
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      {/* ── Left: Brand ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0 w-[160px]">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#C8A97E" }} />
        <span
          className="text-[11px] font-bold font-mono tracking-[0.18em] uppercase"
          style={{ color: "#C8A97E" }}
        >
          strontium.os
        </span>
      </div>

      {/* ── Center: Active window title ──────────────────────── */}
      <div className="flex-1 flex items-center justify-center min-w-0">
        <AnimatePresence mode="wait">
          {focused && (
            <motion.span
              key={focused.instanceId}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="text-[11px] font-medium font-mono truncate max-w-[260px]"
              style={{ color: "#3A3A42" }}
            >
              {focused.title}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Right: System tray + Clock ───────────────────────── */}
      <div className="flex items-center gap-3 shrink-0 w-[160px] justify-end">
        {/* Tray */}
        <div className="flex items-center gap-2">
          <Shield size={11} style={{ color: "#28C840", opacity: 0.8 }} />
          <Wifi size={11} style={{ color: "#4A4A56" }} />
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-1 rounded-full"
            style={{ background: "#28C840" }}
          />
        </div>

        <div className="w-px h-3" style={{ background: "#1E1E22" }} />

        {/* Clock */}
        <div className="flex items-baseline gap-[2px]">
          <span className="text-[12px] font-semibold tabular-nums font-mono" style={{ color: "#8A8A7A" }}>
            {time.hm}
          </span>
          <span className="text-[9px] font-mono" style={{ color: "#2E2E33" }}>
            :{time.s}
          </span>
        </div>
      </div>
    </div>
  );
}
