"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Power, Moon, RotateCcw, Lock, LogOut } from "lucide-react";
import { useOverlayStore, type OverlayState } from "@/lib/overlayStore";
import { useSettingsStore } from "@/lib/settingsStore";

// ── Focus trap ────────────────────────────────────────────────────────────────
function FocusTrap({ children }: { children: React.ReactNode }) {
  const trapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    trapRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const focusable = trapRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) { e.preventDefault(); return; }
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      prev?.focus();
    };
  }, []);

  return (
    <div ref={trapRef} tabIndex={-1} className="outline-none w-full h-full">
      {children}
    </div>
  );
}

// ── Lock screen ───────────────────────────────────────────────────────────────
function LockScreen() {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const { unlock } = useOverlayStore();
  const password = useSettingsStore((s) => s.classificationPassword);

  const tryUnlock = () => {
    if (input === password) {
      unlock();
    } else {
      setError("Incorrect password");
      setInput("");
    }
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-6 w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
    >
      <div className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
        <Lock size={32} style={{ color: "#C8A97E" }} />
      </div>
      <div className="text-center">
        <div className="text-xl font-semibold" style={{ color: "#F2EFE8" }}>strontium.os</div>
        <div className="text-sm mt-1" style={{ color: "#6A6A7E" }}>Enter password to unlock</div>
      </div>
      <div className="flex flex-col gap-2 w-64">
        <input
          autoFocus
          type="password"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
          placeholder="Password"
          className="os-input px-4 py-2.5 rounded-xl text-sm text-center font-mono"
          style={{ userSelect: "text" }}
        />
        {error && <div className="text-xs text-center" style={{ color: "#FF5F57" }}>{error}</div>}
        <motion.button
          onClick={tryUnlock}
          className="py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(200,169,126,0.14)", border: "1px solid rgba(200,169,126,0.3)", color: "#C8A97E" }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          Unlock
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Transition screens ────────────────────────────────────────────────────────
const STATE_LABELS: Partial<Record<OverlayState, string>> = {
  "shutting-down": "Shutting down…",
  "restarting":    "Restarting…",
  "sleeping":      "Going to sleep…",
  "locking":       "Locking…",
};

function TransitionScreen({ state }: { state: OverlayState }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-4 w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.4, repeat: Infinity }}
        className="text-lg font-medium"
        style={{ color: "#C8A97E" }}
      >
        {STATE_LABELS[state] ?? "Please wait…"}
      </motion.div>
    </motion.div>
  );
}

// ── Power menu ────────────────────────────────────────────────────────────────
const ACTIONS = [
  { id: "lock"     as const, label: "Lock",     icon: <Lock     size={18} />, key: "L" },
  { id: "sleep"    as const, label: "Sleep",    icon: <Moon     size={18} />, key: "S" },
  { id: "restart"  as const, label: "Restart",  icon: <RotateCcw size={18} />, key: "R" },
  { id: "shutdown" as const, label: "Shut Down", icon: <Power   size={18} />, key: "⌘Q" },
  { id: "logout"   as const, label: "Log Out",  icon: <LogOut   size={18} />, key: "⌥⌘Q" },
];

function PowerMenu() {
  const { dismiss, executePowerAction } = useOverlayStore();

  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-6 w-full h-full"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
    >
      <div className="text-2xl font-semibold" style={{ color: "#F2EFE8" }}>strontium.os</div>
      <div className="flex flex-col gap-2 w-56">
        {ACTIONS.map((a) => (
          <motion.button
            key={a.id}
            onClick={() => executePowerAction(a.id)}
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#C8C6C0" }}
            whileHover={{ scale: 1.02, background: "rgba(200,169,126,0.1)" }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="flex items-center gap-3">
              <span style={{ color: "#C8A97E" }}>{a.icon}</span>
              <span className="text-sm font-medium">{a.label}</span>
            </div>
            <span className="text-[10px] font-mono" style={{ color: "#3A3A50" }}>{a.key}</span>
          </motion.button>
        ))}
      </div>
      <button
        onClick={dismiss}
        className="text-xs mt-2"
        style={{ color: "#3A3A50" }}
      >
        Press Esc to cancel
      </button>
    </motion.div>
  );
}

// ── Root overlay ──────────────────────────────────────────────────────────────
export default function StartScreen() {
  const state = useOverlayStore((s) => s.state);
  const dismiss = useOverlayStore((s) => s.dismiss);

  const visible = state !== "idle";
  const isTransition = ["shutting-down", "restarting", "sleeping", "locking"].includes(state);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state === "start-screen") dismiss();
    };
    if (visible) window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [visible, state, dismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="overlay"
          className="fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 99999,
            background: "rgba(8,8,16,0.92)",
            backdropFilter: "blur(32px) saturate(180%)",
            WebkitBackdropFilter: "blur(32px) saturate(180%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          // Consume ALL pointer events — nothing below can be clicked
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <FocusTrap>
            {isTransition && <TransitionScreen state={state} />}
            {state === "locked"       && <LockScreen />}
            {state === "start-screen" && <PowerMenu />}
          </FocusTrap>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
