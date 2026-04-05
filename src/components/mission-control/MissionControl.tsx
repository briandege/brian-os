"use client";
import { useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Layers } from "lucide-react";
import { useWindowStore } from "@/lib/windowStore";
import { APP_META, hexRgb } from "@/lib/appMeta";
import type { AppId } from "@/types";

function getGrid(count: number) {
  if (count === 0) return { cols: 1, cardW: 340, cardH: 220 };
  if (count === 1) return { cols: 1, cardW: 420, cardH: 273 };
  if (count === 2) return { cols: 2, cardW: 340, cardH: 221 };
  if (count <= 4)  return { cols: 2, cardW: 300, cardH: 195 };
  if (count <= 6)  return { cols: 3, cardW: 280, cardH: 182 };
  return                  { cols: 4, cardW: 240, cardH: 156 };
}

interface CardProps {
  win: ReturnType<typeof useWindowStore.getState>["windows"][0];
  cardW: number;
  cardH: number;
  index: number;
  onFocus: () => void;
  onClose: () => void;
}

function WindowCard({ win, cardW, cardH, index, onFocus, onClose }: CardProps) {
  const m = APP_META[win.appId as AppId];
  if (!m) return null;
  const CHROME_H = 28;
  const contentH = cardH - CHROME_H;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: 16 }}
      transition={{ type: "spring", stiffness: 340, damping: 26, delay: index * 0.035 }}
      className="relative flex flex-col cursor-pointer group"
      style={{ width: cardW, flexShrink: 0 }}
      onClick={onFocus}
    >
      {/* Window chrome */}
      <div
        className="flex items-center gap-1.5 px-3 shrink-0 rounded-t-xl"
        style={{
          height: CHROME_H,
          background: "rgba(20,20,26,0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Traffic lights */}
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-2.5 h-2.5 rounded-full transition-opacity"
            style={{ background: "#FF5F57" }}
            title="Close"
          />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#FEBC2E", opacity: 0.5 }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#28C840", opacity: 0.5 }} />
        </div>
        <span
          className="flex-1 text-center text-[10px] font-mono truncate"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          {win.title}
        </span>
      </div>

      {/* Content */}
      <motion.div
        className="flex items-center justify-center rounded-b-xl relative overflow-hidden"
        style={{ height: contentH, background: m.bg }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
      >
        {/* Ambient glow */}
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse 70% 60% at 50% 40%, rgba(${hexRgb(m.color)},0.22) 0%, transparent 70%)` }}
        />
        {/* App icon */}
        <div
          className="relative z-10 flex flex-col items-center gap-2"
        >
          <div
            className="rounded-2xl flex items-center justify-center"
            style={{
              width: cardW > 280 ? 56 : 44,
              height: cardW > 280 ? 56 : 44,
              background: m.bg,
              border: `1px solid ${m.color}30`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${m.color}18`,
              color: m.color,
            }}
          >
            {m.iconLg}
          </div>
          <span
            className="text-[10px] font-mono"
            style={{ color: `rgba(${hexRgb(m.color)},0.6)` }}
          >
            {win.appId}
          </span>
        </div>

        {/* Hover overlay */}
        <div
          className="absolute inset-0 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: `rgba(${hexRgb(m.color)},0.08)`, border: `1px solid ${m.color}40` }}
        />
      </motion.div>

      {/* Label */}
      <div className="text-center mt-2">
        <span className="text-[11px] font-medium" style={{ color: "rgba(240,237,230,0.55)" }}>
          {win.title}
        </span>
      </div>
    </motion.div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function MissionControl({ open, onClose }: Props) {
  const { windows, focus, close } = useWindowStore();
  const visible = windows.filter((w) => !w.isMinimized);
  const { cols, cardW, cardH } = getGrid(visible.length);

  const handleFocus = useCallback((instanceId: string) => {
    focus(instanceId);
    onClose();
  }, [focus, onClose]);

  const handleClose = useCallback((instanceId: string) => {
    close(instanceId);
  }, [close]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[160] cursor-pointer"
            style={{
              background: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(12px) saturate(60%)",
            }}
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[161] flex flex-col items-center justify-center pointer-events-none"
            style={{ paddingTop: 56, paddingBottom: 100 }}
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="flex items-center gap-2 mb-8 pointer-events-auto"
            >
              <Layers size={14} style={{ color: "rgba(200,169,126,0.5)" }} />
              <span className="text-[11px] font-mono tracking-[0.25em] uppercase" style={{ color: "rgba(200,169,126,0.4)" }}>
                Mission Control
              </span>
            </motion.div>

            {/* Window grid */}
            {visible.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center gap-3 pointer-events-auto"
              >
                <Layers size={32} style={{ color: "rgba(255,255,255,0.06)" }} />
                <span className="text-[12px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
                  no open windows
                </span>
              </motion.div>
            ) : (
              <div
                className="pointer-events-auto"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${cols}, ${cardW}px)`,
                  gap: 24,
                  justifyContent: "center",
                }}
              >
                {visible.map((win, i) => (
                  <WindowCard
                    key={win.instanceId}
                    win={win}
                    cardW={cardW}
                    cardH={cardH}
                    index={i}
                    onFocus={() => handleFocus(win.instanceId)}
                    onClose={() => handleClose(win.instanceId)}
                  />
                ))}
              </div>
            )}

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mt-10 flex items-center gap-4 text-[9.5px] font-mono pointer-events-none"
              style={{ color: "rgba(255,255,255,0.18)" }}
            >
              <span>F3 · mission control</span>
              <span>click · focus window</span>
              <span>● · close window</span>
              <span>esc · dismiss</span>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
