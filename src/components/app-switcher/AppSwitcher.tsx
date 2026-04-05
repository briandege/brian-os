"use client";
import { AnimatePresence, motion } from "framer-motion";
import { APP_META, hexRgb } from "@/lib/appMeta";
import type { AppId } from "@/types";
import type { WindowState } from "@/types";

interface Props {
  open: boolean;
  windows: WindowState[];
  selectedIdx: number;
  onHover: (idx: number) => void;
  onSelect: (idx: number) => void;
}

export default function AppSwitcher({ open, windows, selectedIdx, onHover, onSelect }: Props) {
  const apps = windows.filter((w) => !w.isMinimized);

  return (
    <AnimatePresence>
      {open && apps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 8 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
          className="fixed z-[300] flex flex-col items-center gap-3"
          style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        >
          {/* Icon bar */}
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-[20px]"
            style={{
              background: "rgba(10,10,15,0.96)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.85), 0 0 0 0.5px rgba(255,255,255,0.04) inset",
              backdropFilter: "blur(40px)",
            }}
          >
            {apps.map((win, idx) => {
              const m = APP_META[win.appId as AppId];
              if (!m) return null;
              const active = idx === selectedIdx;
              return (
                <motion.button
                  key={win.instanceId}
                  onClick={() => onSelect(idx)}
                  onHoverStart={() => onHover(idx)}
                  animate={{ scale: active ? 1.12 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 26 }}
                  className="relative flex items-center justify-center rounded-[14px]"
                  style={{
                    width: 56, height: 56,
                    background: m.bg,
                    border: active ? `1px solid ${m.color}60` : "1px solid rgba(255,255,255,0.06)",
                    boxShadow: active
                      ? `0 0 0 3px ${m.color}30, 0 8px 24px rgba(0,0,0,0.5)`
                      : "0 4px 12px rgba(0,0,0,0.4)",
                    color: active ? m.color : "rgba(255,255,255,0.28)",
                  }}
                >
                  {active && (
                    <div
                      className="absolute inset-0 rounded-[14px]"
                      style={{ background: `radial-gradient(circle at 50% 30%, rgba(${hexRgb(m.color)},0.25), transparent 70%)` }}
                    />
                  )}
                  <span className="relative z-10">{m.iconLg}</span>
                </motion.button>
              );
            })}
          </div>

          {/* App name label */}
          <AnimatePresence mode="wait">
            {apps[selectedIdx] && (
              <motion.div
                key={apps[selectedIdx].instanceId}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="text-center"
              >
                <span
                  className="text-[13px] font-semibold"
                  style={{ color: "#F0EDE6" }}
                >
                  {apps[selectedIdx].title}
                </span>
                <div className="text-[10px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {APP_META[apps[selectedIdx].appId as AppId]?.desc}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hint */}
          <div className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.15)" }}>
            ⌘ Tab · cycle  ·  release to open  ·  esc cancel
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
