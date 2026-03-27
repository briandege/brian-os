"use client";
import { useRef, useCallback } from "react";
import { motion, useDragControls, AnimatePresence } from "framer-motion";
import { X, Minus, Maximize2, Minimize2 } from "lucide-react";
import { useWindowStore } from "@/lib/windowStore";
import type { WindowState } from "@/types";

interface Props {
  win: WindowState;
  children: React.ReactNode;
}

const SPRING = { type: "spring" as const, stiffness: 320, damping: 30, mass: 0.9 };

export default function Window({ win, children }: Props) {
  const { close, focus, minimize, maximize, move } = useWindowStore();
  const dragControls = useDragControls();
  const constraintRef = useRef<HTMLDivElement>(null);
  const isFocused = useWindowStore((s) => s.focusedId === win.instanceId);

  const handleFocus = useCallback(() => {
    if (!isFocused) focus(win.instanceId);
  }, [isFocused, focus, win.instanceId]);

  if (win.isMinimized) return null;

  const style = win.isMaximized
    ? { top: 0, left: 0, width: "100vw", height: "calc(100vh - 48px)" }
    : {
        top: win.position.y,
        left: win.position.x,
        width: win.size.width,
        height: win.size.height,
      };

  return (
    <motion.div
      key={win.instanceId}
      className={`absolute flex flex-col rounded-xl overflow-hidden ${
        isFocused ? "window-focused" : "window-blurred"
      }`}
      style={{
        ...style,
        zIndex: win.zIndex,
        background: "#141414",
        border: `1px solid ${isFocused ? "#2A2A2A" : "#1E1E1E"}`,
      }}
      initial={{ scale: 0.88, opacity: 0, y: 12 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.88, opacity: 0, y: 12 }}
      transition={SPRING}
      drag={!win.isMaximized}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={(_, info) => {
        move(win.instanceId, {
          x: win.position.x + info.offset.x,
          y: Math.max(0, win.position.y + info.offset.y),
        });
      }}
      onPointerDown={handleFocus}
    >
      {/* Title Bar */}
      <div
        className="window-chrome flex items-center gap-2 px-4 h-10 shrink-0 select-none"
        style={{
          background: isFocused ? "#1A1A1A" : "#111111",
          borderBottom: "1px solid #2A2A2A",
        }}
        onPointerDown={(e) => {
          if (!win.isMaximized) dragControls.start(e);
          handleFocus();
        }}
        onDoubleClick={() => maximize(win.instanceId)}
      >
        {/* Traffic lights */}
        <div className="flex items-center gap-[6px]">
          <button
            className="w-3 h-3 rounded-full flex items-center justify-center group"
            style={{ background: "#FF5F57" }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => close(win.instanceId)}
            title="Close"
          >
            <X size={7} strokeWidth={3} className="opacity-0 group-hover:opacity-100 text-black" />
          </button>
          <button
            className="w-3 h-3 rounded-full flex items-center justify-center group"
            style={{ background: "#FEBC2E" }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => minimize(win.instanceId)}
            title="Minimize"
          >
            <Minus size={7} strokeWidth={3} className="opacity-0 group-hover:opacity-100 text-black" />
          </button>
          <button
            className="w-3 h-3 rounded-full flex items-center justify-center group"
            style={{ background: "#28C840" }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => maximize(win.instanceId)}
            title="Maximize"
          >
            {win.isMaximized
              ? <Minimize2 size={7} strokeWidth={3} className="opacity-0 group-hover:opacity-100 text-black" />
              : <Maximize2 size={7} strokeWidth={3} className="opacity-0 group-hover:opacity-100 text-black" />
            }
          </button>
        </div>

        {/* Title */}
        <span
          className="flex-1 text-center text-xs font-medium truncate"
          style={{ color: isFocused ? "#8C7A65" : "#3A3A3A" }}
        >
          {win.title}
        </span>

        {/* Right spacer for visual balance */}
        <div className="w-12" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden" style={{ color: "#F5F5F0" }}>
        {children}
      </div>
    </motion.div>
  );
}
