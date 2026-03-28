"use client";
import { useCallback, useEffect } from "react";
import { motion, useDragControls, useMotionValue } from "framer-motion";
import { X, Minus, Square } from "lucide-react";
import { useWindowStore } from "@/lib/windowStore";
import type { WindowState } from "@/types";

interface Props {
  win: WindowState;
  children: React.ReactNode;
}

export default function Window({ win, children }: Props) {
  const { close, focus, minimize, maximize, move } = useWindowStore();
  const dragControls = useDragControls();
  const isFocused = useWindowStore((s) => s.focusedId === win.instanceId);

  const handleFocus = useCallback(() => {
    if (!isFocused) focus(win.instanceId);
  }, [isFocused, focus, win.instanceId]);

  // Motion values drive position — no CSS top/left conflict with drag transform
  const mx = useMotionValue(win.position.x);
  const my = useMotionValue(win.position.y);

  // Sync store → motion values when position is set externally (open, restore, etc.)
  useEffect(() => { mx.set(win.position.x); }, [win.position.x, mx]);
  useEffect(() => { my.set(win.position.y); }, [win.position.y, my]);

  if (win.isMinimized) return null;

  const isMax = win.isMaximized;

  return (
    <motion.div
      key={win.instanceId}
      className={`absolute flex flex-col overflow-hidden rounded-2xl glass-heavy ${
        isFocused ? "window-focused" : "window-blurred"
      }`}
      style={{
        x: isMax ? 0 : mx,
        y: isMax ? 0 : my,
        width:  isMax ? "100vw" : win.size.width,
        height: isMax ? "calc(100vh - 48px)" : win.size.height,
        zIndex: win.zIndex,
        border: `1px solid ${isFocused ? "rgba(200,169,126,0.14)" : "rgba(37,37,40,0.8)"}`,
      }}
      initial={{ scale: 0.84, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.84, opacity: 0, transition: { duration: 0.18 } }}
      transition={{ type: "spring" as const, stiffness: 380, damping: 32, mass: 0.85 }}
      drag={!isMax}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={() => {
        // Read final position directly from motion values — no offset math needed
        move(win.instanceId, {
          x: mx.get(),
          y: Math.max(0, my.get()),
        });
      }}
      onPointerDown={handleFocus}
    >
      {/* ── Title Bar ─────────────────────────────────────────────────────── */}
      <div
        className="drag-handle flex items-center gap-2.5 px-4 h-11 shrink-0 select-none relative"
        style={{
          background: isFocused
            ? "linear-gradient(180deg, #1E1E22 0%, #18181C 100%)"
            : "linear-gradient(180deg, #141416 0%, #111113 100%)",
          borderBottom: `1px solid ${isFocused ? "rgba(200,169,126,0.08)" : "#1A1A1E"}`,
        }}
        onPointerDown={(e) => {
          if (!isMax) dragControls.start(e);
          handleFocus();
        }}
        onDoubleClick={() => maximize(win.instanceId)}
      >
        {/* Traffic lights */}
        <div className="flex items-center gap-[7px] shrink-0">
          <TrafficLight color="#FF5F57" hoverIcon="×" onClick={() => close(win.instanceId)} />
          <TrafficLight color="#FEBC2E" hoverIcon="−" onClick={() => minimize(win.instanceId)} />
          <TrafficLight color={isFocused ? "#28C840" : "#3A3A42"} hoverIcon="⤢" onClick={() => maximize(win.instanceId)} />
        </div>

        {/* Title */}
        <div className="flex-1 flex items-center justify-center">
          <span
            className="text-[11px] font-medium tracking-wide truncate"
            style={{ color: isFocused ? "rgba(200,169,126,0.7)" : "#2E2E33" }}
          >
            {win.title}
          </span>
        </div>

        {/* Balance spacer */}
        <div className="w-[52px] shrink-0" />
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-hidden"
        style={{ color: "#F0EDE6" }}
        onPointerDown={handleFocus}
      >
        {children}
      </div>
    </motion.div>
  );
}

function TrafficLight({
  color, hoverIcon, onClick,
}: {
  color: string;
  hoverIcon: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      className="w-[13px] h-[13px] rounded-full flex items-center justify-center text-[8px] font-bold"
      style={{ background: color, color: "rgba(0,0,0,0.55)" }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
    >
      <span className="opacity-0 hover:opacity-100 leading-none">{hoverIcon}</span>
    </motion.button>
  );
}
