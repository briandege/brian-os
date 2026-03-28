"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useDragControls, useMotionValue } from "framer-motion";
import { useWindowStore } from "@/lib/windowStore";
import type { WindowState } from "@/types";

interface Props {
  win: WindowState;
  children: React.ReactNode;
}

type ResizeDir = "e" | "s" | "se" | "w" | "n" | "ne" | "sw" | "nw";

const CURSOR_MAP: Record<ResizeDir, string> = {
  n: "n-resize", s: "s-resize",
  e: "e-resize", w: "w-resize",
  ne: "ne-resize", nw: "nw-resize",
  se: "se-resize", sw: "sw-resize",
};

function ResizeHandle({ dir, win }: { dir: ResizeDir; win: WindowState }) {
  const { resize, move } = useWindowStore();
  const isResizing = useRef(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;

      const startX = e.clientX;
      const startY = e.clientY;
      const startW = win.size.width;
      const startH = win.size.height;
      const startPX = win.position.x;
      const startPY = win.position.y;

      const MIN_W = 320;
      const MIN_H = 200;

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        let newW = startW, newH = startH, newPX = startPX, newPY = startPY;

        if (dir.includes("e")) newW = Math.max(MIN_W, startW + dx);
        if (dir.includes("s")) newH = Math.max(MIN_H, startH + dy);
        if (dir.includes("w")) {
          newW = Math.max(MIN_W, startW - dx);
          newPX = startPX + (startW - newW);
        }
        if (dir.includes("n")) {
          newH = Math.max(MIN_H, startH - dy);
          newPY = startPY + (startH - newH);
        }

        resize(win.instanceId, { width: newW, height: newH });
        if (dir.includes("w") || dir.includes("n")) {
          move(win.instanceId, { x: newPX, y: newPY });
        }
      };

      const onUp = () => {
        isResizing.current = false;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [dir, win, resize, move]
  );

  const posStyle: React.CSSProperties = (() => {
    const edge = 4;
    const corner = 12;
    switch (dir) {
      case "n":  return { top: 0, left: corner, right: corner, height: edge, cursor: CURSOR_MAP[dir] };
      case "s":  return { bottom: 0, left: corner, right: corner, height: edge, cursor: CURSOR_MAP[dir] };
      case "e":  return { right: 0, top: corner, bottom: corner, width: edge, cursor: CURSOR_MAP[dir] };
      case "w":  return { left: 0, top: corner, bottom: corner, width: edge, cursor: CURSOR_MAP[dir] };
      case "ne": return { top: 0, right: 0, width: corner, height: corner, cursor: CURSOR_MAP[dir] };
      case "nw": return { top: 0, left: 0, width: corner, height: corner, cursor: CURSOR_MAP[dir] };
      case "se": return { bottom: 0, right: 0, width: corner, height: corner, cursor: CURSOR_MAP[dir] };
      case "sw": return { bottom: 0, left: 0, width: corner, height: corner, cursor: CURSOR_MAP[dir] };
    }
  })();

  return (
    <div
      className="absolute z-10"
      style={posStyle}
      onPointerDown={onPointerDown}
    />
  );
}

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

  // Drag constraints — keep window inside the workspace
  const MENU_H = 40, DOCK_H = 88;
  const [constraints, setConstraints] = useState({ left: 0, top: MENU_H, right: 1200, bottom: 800 });
  useEffect(() => {
    const update = () => setConstraints({
      left: 0,
      top: MENU_H,
      right: Math.max(200, window.innerWidth - win.size.width),
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
      className={`absolute flex flex-col overflow-hidden rounded-2xl glass-heavy ${
        isFocused ? "window-focused" : "window-blurred"
      }`}
      style={{
        x: isMax ? 0 : mx,
        y: isMax ? 0 : my,
        width:  isMax ? "100vw" : win.size.width,
        top:    isMax ? 40 : undefined,
        height: isMax ? "calc(100vh - 40px - 88px)" : win.size.height,
        zIndex: Math.min(win.zIndex, 44), // always below taskbar (50) and dock (45)
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
      dragConstraints={isMax ? false : constraints}
      onDragEnd={() => {
        move(win.instanceId, {
          x: Math.max(0, Math.min(mx.get(), constraints.right)),
          y: Math.max(MENU_H, Math.min(my.get(), constraints.bottom)),
        });
      }}
      onPointerDown={handleFocus}
    >
      {/* Resize handles (hidden when maximized) */}
      {!isMax && (["n","s","e","w","ne","nw","se","sw"] as ResizeDir[]).map((dir) => (
        <ResizeHandle key={dir} dir={dir} win={win} />
      ))}

      {/* Title Bar */}
      <div
        className="drag-handle flex items-center gap-2.5 px-4 h-11 shrink-0 select-none relative z-10"
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

        <div className="w-[52px] shrink-0" />
      </div>

      {/* Content */}
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

function TrafficLight({ color, hoverIcon, onClick }: { color: string; hoverIcon: string; onClick: () => void }) {
  return (
    <motion.button
      className="w-[13px] h-[13px] rounded-full flex items-center justify-center text-[8px] font-bold group"
      style={{ background: color, color: "rgba(0,0,0,0.55)" }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
    >
      <span className="opacity-0 group-hover:opacity-100 leading-none">{hoverIcon}</span>
    </motion.button>
  );
}
