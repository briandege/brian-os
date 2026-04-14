"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Power, Moon, RotateCcw, Lock, LogOut, Fingerprint } from "lucide-react";
import { useOverlayStore, type OverlayState } from "@/lib/overlayStore";
import { useSettingsStore } from "@/lib/settingsStore";
import { audit } from "@/lib/auditStore";

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
  const [input, setInput]           = useState("");
  const [error, setError]           = useState("");
  const [bioPending, setBioPending] = useState(false);
  const [canBio, setCanBio]         = useState(false);
  const { unlock } = useOverlayStore();
  const verifyPassword = useSettingsStore((s) => s.verifyClassificationPassword);

  // Check if Touch ID is available
  useEffect(() => {
    window.electronAPI?.canBiometric().then((r) => setCanBio(r.available)).catch(() => {});
  }, []);

  const tryUnlock = useCallback(async () => {
    const ok = await verifyPassword(input);
    if (ok) {
      audit({ category: "auth", severity: "info", action: "Unlock succeeded (password)", module: "LockScreen" });
      unlock();
    } else {
      audit({ category: "auth", severity: "warning", action: "Unlock failed — incorrect password", module: "LockScreen" });
      setError("Incorrect password");
      setInput("");
    }
  }, [input, verifyPassword, unlock]);

  const tryBiometric = useCallback(async () => {
    if (!window.electronAPI) return;
    setBioPending(true);
    setError("");
    try {
      const result = await window.electronAPI.biometricAuth();
      if (result.ok) {
        audit({ category: "auth", severity: "info", action: "Unlock succeeded (Touch ID / biometric)", module: "LockScreen" });
        unlock();
      } else {
        audit({ category: "auth", severity: "warning", action: `Biometric auth failed: ${result.error}`, module: "LockScreen" });
        setError(result.error ?? "Authentication failed");
      }
    } catch {
      audit({ category: "auth", severity: "warning", action: "Biometric auth exception", module: "LockScreen" });
      setError("Biometric authentication failed");
    } finally {
      setBioPending(false);
    }
  }, [unlock]);

  // Auto-prompt Touch ID on mount if available
  useEffect(() => {
    if (canBio) tryBiometric();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canBio]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-6 w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      {/* Avatar / lock icon */}
      <motion.div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
        animate={bioPending ? { boxShadow: ["0 0 0px rgba(212,170,130,0)", "0 0 32px rgba(212,170,130,0.35)", "0 0 0px rgba(212,170,130,0)"] } : {}}
        transition={{ duration: 1.6, repeat: Infinity }}
      >
        <Lock size={32} style={{ color: "#D4AA82" }} />
      </motion.div>

      <div className="text-center">
        <div className="text-xl font-semibold" style={{ color: "#F4F1EA" }}>strontium.os</div>
        <div className="text-sm mt-1" style={{ color: "#6A6A7E" }}>
          {bioPending ? "Waiting for Touch ID…" : "Enter password to unlock"}
        </div>
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
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="text-xs text-center"
            style={{ color: "#FF5F57" }}
          >
            {error}
          </motion.div>
        )}
        <motion.button
          onClick={tryUnlock}
          className="py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(212,170,130,0.14)", border: "1px solid rgba(212,170,130,0.3)", color: "#D4AA82" }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          Unlock
        </motion.button>

        {/* Touch ID button */}
        {canBio && (
          <motion.button
            onClick={tryBiometric}
            disabled={bioPending}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: bioPending ? "#D4AA82" : "#6A6A7E",
              opacity: bioPending ? 0.7 : 1,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <Fingerprint size={14} />
            {bioPending ? "Authenticating…" : "Use Touch ID"}
          </motion.button>
        )}
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
  const state   = useOverlayStore((s) => s.state);
  const dismiss = useOverlayStore((s) => s.dismiss);
  const lock    = useOverlayStore((s) => s.lock);

  const visible = state !== "idle";
  const isTransition = ["shutting-down", "restarting", "sleeping", "locking"].includes(state);

  // Lock on system wake (sleep resume) sent from main process
  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI?.onSystemLock) return;
    const unsub = window.electronAPI.onSystemLock(() => {
      audit({ category: "auth", severity: "info", action: "Screen locked (system wake / resume)", module: "StartScreen" });
      lock();
    });
    return unsub;
  }, [lock]);

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
