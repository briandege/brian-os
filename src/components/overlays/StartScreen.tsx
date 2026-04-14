"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Power, Moon, RotateCcw, Lock, LogOut, Fingerprint, User } from "lucide-react";
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

// ── Live clock ────────────────────────────────────────────────────────────────
function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ── Lock screen ───────────────────────────────────────────────────────────────
function LockScreen() {
  const [input, setInput]           = useState("");
  const [error, setError]           = useState("");
  const [bioPending, setBioPending] = useState(false);
  const [canBio, setCanBio]         = useState(false);
  // Two-phase: "idle" shows clock full-screen, "auth" shows the password form
  const [phase, setPhase]           = useState<"idle" | "auth">("idle");
  const inputRef                    = useRef<HTMLInputElement>(null);
  const { unlock } = useOverlayStore();
  const verifyPassword = useSettingsStore((s) => s.verifyClassificationPassword);
  const now = useClock();

  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  const dateStr = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  // Check if Touch ID is available
  useEffect(() => {
    window.electronAPI?.canBiometric().then((r) => setCanBio(r.available)).catch(() => {});
  }, []);

  const wakeUp = useCallback(() => {
    setPhase("auth");
    setTimeout(() => inputRef.current?.focus(), 120);
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
    if (canBio) {
      setPhase("auth");
      tryBiometric();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canBio]);

  // Any keypress on idle phase wakes it up
  useEffect(() => {
    if (phase !== "idle") return;
    const onKey = () => wakeUp();
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [phase, wakeUp]);

  return (
    <motion.div
      className="flex flex-col items-center justify-between w-full h-full select-none"
      style={{ paddingTop: "10vh", paddingBottom: "8vh" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      onClick={() => phase === "idle" && wakeUp()}
    >
      {/* ── Clock + date ─────────────────────────────────────────────────── */}
      <motion.div
        className="flex flex-col items-center gap-1"
        animate={phase === "auth" ? { y: -16, scale: 0.88 } : { y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
      >
        <div
          className="font-thin tabular-nums leading-none"
          style={{
            fontSize: "clamp(72px, 12vw, 128px)",
            color: "#F4F1EA",
            letterSpacing: "-0.03em",
            textShadow: "0 2px 40px rgba(200,169,126,0.18)",
          }}
        >
          {timeStr}
        </div>
        <div
          className="text-base font-light tracking-wide"
          style={{ color: "rgba(244,241,234,0.55)", letterSpacing: "0.06em" }}
        >
          {dateStr}
        </div>
      </motion.div>

      {/* ── Auth panel ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {phase === "auth" && (
          <motion.div
            key="auth-panel"
            className="flex flex-col items-center gap-5"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Avatar */}
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05, type: "spring", stiffness: 320, damping: 26 }}
            >
              <motion.div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(145deg, rgba(200,169,126,0.12), rgba(200,169,126,0.04))",
                  border: "1.5px solid rgba(200,169,126,0.22)",
                  boxShadow: "0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
                animate={bioPending
                  ? { boxShadow: ["0 4px 32px rgba(0,0,0,0.4), 0 0 0px rgba(200,169,126,0)", "0 4px 32px rgba(0,0,0,0.4), 0 0 40px rgba(200,169,126,0.35)", "0 4px 32px rgba(0,0,0,0.4), 0 0 0px rgba(200,169,126,0)"] }
                  : {}}
                transition={{ duration: 1.6, repeat: Infinity }}
              >
                <User size={30} style={{ color: "#C8A97E" }} strokeWidth={1.5} />
              </motion.div>
              <div className="text-sm font-medium" style={{ color: "#D4CFC6", letterSpacing: "0.02em" }}>
                Brian Ndege
              </div>
              {bioPending && (
                <div className="text-xs" style={{ color: "rgba(200,169,126,0.7)" }}>
                  Waiting for Touch ID…
                </div>
              )}
            </motion.div>

            {/* Password field */}
            <div className="flex flex-col gap-2.5" style={{ width: 260 }}>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="password"
                  value={input}
                  onChange={(e) => { setInput(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
                  placeholder="Password"
                  className="w-full px-4 py-3 rounded-2xl text-sm text-center font-mono outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: error
                      ? "1px solid rgba(255,95,87,0.5)"
                      : "1px solid rgba(255,255,255,0.11)",
                    color: "#F4F1EA",
                    backdropFilter: "blur(8px)",
                    letterSpacing: input ? "0.15em" : "normal",
                    transition: "border-color 0.2s",
                  }}
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    key="err"
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-center"
                    style={{ color: "#FF5F57" }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                onClick={tryUnlock}
                className="py-3 rounded-2xl text-sm font-semibold"
                style={{
                  background: "linear-gradient(145deg, rgba(200,169,126,0.18), rgba(200,169,126,0.10))",
                  border: "1px solid rgba(200,169,126,0.28)",
                  color: "#D4AA82",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                }}
                whileHover={{ scale: 1.02, background: "linear-gradient(145deg, rgba(200,169,126,0.26), rgba(200,169,126,0.16))" }}
                whileTap={{ scale: 0.97 }}
              >
                Unlock
              </motion.button>

              {canBio && (
                <motion.button
                  onClick={tryBiometric}
                  disabled={bioPending}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: bioPending ? "#C8A97E" : "rgba(200,192,180,0.5)",
                    opacity: bioPending ? 0.75 : 1,
                  }}
                  whileHover={{ opacity: 1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Fingerprint size={13} />
                  {bioPending ? "Authenticating…" : "Use Touch ID"}
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Idle hint ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {phase === "idle" && (
          <motion.div
            key="idle-hint"
            className="text-xs tracking-widest uppercase"
            style={{ color: "rgba(200,192,180,0.35)", letterSpacing: "0.18em" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            Press any key to unlock
          </motion.div>
        )}
      </AnimatePresence>
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
