"use client";
import { useCallback, useEffect, useState } from "react";
import { motion, useDragControls, useMotionValue } from "framer-motion";
import { useWindowStore } from "@/lib/windowStore";
import type { WindowState } from "@/types";

interface Props { win: WindowState; children: React.ReactNode }
type ResizeDir = "e"|"s"|"se"|"w"|"n"|"ne"|"sw"|"nw";

const CURSOR_MAP: Record<ResizeDir, string> = {
  n:"n-resize", s:"s-resize", e:"e-resize", w:"w-resize",
  ne:"ne-resize", nw:"nw-resize", se:"se-resize", sw:"sw-resize",
};

function ResizeHandle({ dir, win }: { dir: ResizeDir; win: WindowState }) {
  const { resize, move } = useWindowStore();

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const sx = e.clientX, sy = e.clientY;
    const sw = win.size.width, sh = win.size.height;
    const spx = win.position.x, spy = win.position.y;
    const MIN = { w: 320, h: 200 };

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      let nw = sw, nh = sh, npx = spx, npy = spy;
      if (dir.includes("e")) nw = Math.max(MIN.w, sw + dx);
      if (dir.includes("s")) nh = Math.max(MIN.h, sh + dy);
      if (dir.includes("w")) { nw = Math.max(MIN.w, sw - dx); npx = spx + (sw - nw); }
      if (dir.includes("n")) { nh = Math.max(MIN.h, sh - dy); npy = spy + (sh - nh); }
      resize(win.instanceId, { width: nw, height: nh });
      if (dir.includes("w") || dir.includes("n")) move(win.instanceId, { x: npx, y: npy });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [dir, win, resize, move]);

  const posStyle: React.CSSProperties = (() => {
    const e = 5, c = 14;
    switch (dir) {
      case "n":  return { top:0, left:c, right:c, height:e, cursor:CURSOR_MAP[dir] };
      case "s":  return { bottom:0, left:c, right:c, height:e, cursor:CURSOR_MAP[dir] };
      case "e":  return { right:0, top:c, bottom:c, width:e, cursor:CURSOR_MAP[dir] };
      case "w":  return { left:0, top:c, bottom:c, width:e, cursor:CURSOR_MAP[dir] };
      case "ne": return { top:0, right:0, width:c, height:c, cursor:CURSOR_MAP[dir] };
      case "nw": return { top:0, left:0, width:c, height:c, cursor:CURSOR_MAP[dir] };
      case "se": return { bottom:0, right:0, width:c, height:c, cursor:CURSOR_MAP[dir] };
      case "sw": return { bottom:0, left:0, width:c, height:c, cursor:CURSOR_MAP[dir] };
    }
  })();

  return <div className="absolute z-10" style={posStyle} onPointerDown={onPointerDown} />;
}

// ── Traffic light button ──────────────────────────────────────────────────────

function TrafficLight({
  color, hoverColor, icon, dimmed, onClick,
}: {
  color: string; hoverColor: string; icon: string; dimmed?: boolean; onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <motion.button
      className="relative w-[13px] h-[13px] rounded-full flex items-center justify-center shrink-0 overflow-hidden"
      style={{
        background: dimmed ? "#2E2E38" : (hov ? hoverColor : color),
        boxShadow: !dimmed && hov ? `0 0 8px ${color}90` : "0 1px 2px rgba(0,0,0,0.45)",
      }}
      whileHover={{ scale: 1.18 }}
      whileTap={{ scale: 0.86 }}
      onHoverStart={() => setHov(true)}
      onHoverEnd={() => setHov(false)}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      transition={{ duration: 0.1 }}
    >
      {/* gloss sheen */}
      <div className="absolute inset-0 rounded-full pointer-events-none" style={{
        background: "linear-gradient(160deg, rgba(255,255,255,0.32) 0%, transparent 55%)",
      }} />
      <motion.span
        className="relative z-10 text-[7px] font-black leading-none select-none"
        style={{ color: "rgba(0,0,0,0.6)" }}
        animate={{ opacity: hov && !dimmed ? 1 : 0 }}
        transition={{ duration: 0.08 }}
      >
        {icon}
      </motion.span>
    </motion.button>
  );
}

// ── Window ────────────────────────────────────────────────────────────────────

export default function Window({ win, children }: Props) {
  const { close, focus, minimize, maximize, move } = useWindowStore();
  const dragControls = useDragControls();
  const isFocused = useWindowStore((s) => s.focusedId === win.instanceId);

  const handleFocus = useCallback(() => {
    if (!isFocused) focus(win.instanceId);
  }, [isFocused, focus, win.instanceId]);

  const mx = useMotionValue(win.position.x);
  const my = useMotionValue(win.position.y);

  useEffect(() => { mx.set(win.position.x); }, [win.position.x, mx]);
  useEffect(() => { my.set(win.position.y); }, [win.position.y, my]);

  const MENU_H = 40, DOCK_H = 88;
  const [constraints, setConstraints] = useState({ left:0, top:MENU_H, right:1200, bottom:800 });

  useEffect(() => {
    const update = () => setConstraints({
      left: 0, top: MENU_H,
      right:  Math.max(200, window.innerWidth  - win.size.width),
      bottom: Math.max(200, window.innerHeight - DOCK_H),
    });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [win.size.width, win.size.height]);

  if (win.isMinimized) return null;
  const isMax = win.isMaximized;

  return (
    <motion.div
      key={win.instanceId}
      className={`absolute flex flex-col overflow-hidden glass-heavy ${
        isFocused ? "window-focused" : "window-blurred"
      }`}
      style={{
        x: isMax ? 0 : mx,
        y: isMax ? 0 : my,
        width:  isMax ? "100vw" : win.size.width,
        top:    isMax ? 40 : undefined,
        height: isMax ? "calc(100vh - 40px - 88px)" : win.size.height,
        borderRadius: isMax ? 0 : 14,
        zIndex: Math.min(win.zIndex, 44),
        border: isFocused
          ? "1px solid rgba(200,169,126,0.18)"
          : "1px solid rgba(255,255,255,0.05)",
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }}
      transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.75 }}
      drag={!isMax}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={isMax ? false : constraints}
      onDragEnd={() => move(win.instanceId, {
        x: Math.max(0, Math.min(mx.get(), constraints.right)),
        y: Math.max(MENU_H, Math.min(my.get(), constraints.bottom)),
      })}
      onPointerDown={handleFocus}
    >
      {/* Resize handles */}
      {!isMax && (["n","s","e","w","ne","nw","se","sw"] as ResizeDir[]).map((d) => (
        <ResizeHandle key={d} dir={d} win={win} />
      ))}

      {/* ── Title Bar ─────────────────────────────────────────────────────── */}
      <div
        className="drag-handle relative flex items-center px-4 shrink-0 select-none overflow-hidden"
        style={{
          height: 44,
          background: isFocused
            ? "linear-gradient(180deg, #1E1E24 0%, #17171C 100%)"
            : "linear-gradient(180deg, #111115 0%, #0D0D11 100%)",
          borderBottom: isFocused
            ? "1px solid rgba(200,169,126,0.10)"
            : "1px solid rgba(255,255,255,0.04)",
        }}
        onPointerDown={(e) => { if (!isMax) dragControls.start(e); handleFocus(); }}
        onDoubleClick={() => maximize(win.instanceId)}
      >
        {/* Top edge highlight */}
        <div className="absolute top-0 inset-x-0 h-px pointer-events-none" style={{
          background: isFocused
            ? "linear-gradient(90deg, transparent 4%, rgba(255,255,255,0.14) 25%, rgba(255,255,255,0.14) 75%, transparent 96%)"
            : "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
        }} />

        {/* Bottom separator glow when focused */}
        {isFocused && (
          <div className="absolute bottom-0 inset-x-0 h-px pointer-events-none" style={{
            background: "linear-gradient(90deg, transparent 10%, rgba(200,169,126,0.12) 40%, rgba(200,169,126,0.12) 60%, transparent 90%)",
          }} />
        )}

        {/* Traffic lights */}
        <div className="flex items-center gap-[7px] shrink-0 z-10">
          <TrafficLight color="#FF5F57" hoverColor="#E04040" icon="✕" dimmed={!isFocused} onClick={() => close(win.instanceId)} />
          <TrafficLight color="#FEBC2E" hoverColor="#E8A800" icon="−" dimmed={!isFocused} onClick={() => minimize(win.instanceId)} />
          <TrafficLight color={isFocused ? "#28C840" : "#3A3A46"} hoverColor="#1DB830" icon="⤢" dimmed={false} onClick={() => maximize(win.instanceId)} />
        </div>

        {/* Title — centered between traffic lights and right edge */}
        <div className="absolute inset-x-0 inset-y-0 flex items-center justify-center pointer-events-none px-16">
          <span
            className="text-[12px] font-semibold tracking-wide truncate"
            style={{
              color: isFocused ? "rgba(200,169,126,0.72)" : "rgba(255,255,255,0.16)",
            }}
          >
            {win.title}
          </span>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden" style={{ color: "#F0EDE6" }} onPointerDown={handleFocus}>
        {children}
      </div>
    </motion.div>
  );
}
