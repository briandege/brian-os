"use client";
/**
 * PanicOverlay — full-screen emergency lockdown sequence.
 *
 * Phase 1 (PANIC, 3 s): dramatic red overlay with countdown showing what will happen.
 * Phase 2 (LOCKDOWN, immediate): executes all 4 actions in parallel:
 *   1. POST security alert to AxiraNews backend
 *   2. Close all open windows
 *   3. Elevate classification to TOP SECRET
 *   4. Trigger lock screen
 */
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, X, Lock, MonitorOff, AlertTriangle, Radio } from "lucide-react";
import { usePanicStore } from "@/lib/panicStore";
import { useWindowStore } from "@/lib/windowStore";
import { useSettingsStore } from "@/lib/settingsStore";
import { useOverlayStore } from "@/lib/overlayStore";
import { notifySecurityAlert } from "@/lib/axiraClient";
import { notify } from "@/lib/notificationStore";
import { audit } from "@/lib/auditStore";

const COUNTDOWN_S = 3;

const LOCKDOWN_STEPS = [
  { icon: <Radio size={13} />,       label: "Notifying security backend…" },
  { icon: <MonitorOff size={13} />,  label: "Closing all windows…"        },
  { icon: <AlertTriangle size={13}/>,label: "Elevating to TOP SECRET…"    },
  { icon: <Lock size={13} />,        label: "Locking screen…"             },
];

export default function PanicOverlay() {
  const { isPanicking, clear } = usePanicStore();
  const [phase, setPhase]           = useState<"panic" | "executing" | "done">("panic");
  const [countdown, setCountdown]   = useState(COUNTDOWN_S);
  const [stepsDone, setStepsDone]   = useState<number[]>([]);
  const executedRef                 = useRef(false);

  // Reset internal state when overlay opens
  useEffect(() => {
    if (!isPanicking) return;
    setPhase("panic");
    setCountdown(COUNTDOWN_S);
    setStepsDone([]);
    executedRef.current = false;
  }, [isPanicking]);

  // Countdown tick
  useEffect(() => {
    if (!isPanicking || phase !== "panic") return;
    if (countdown <= 0) {
      setPhase("executing");
      return;
    }
    const id = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [isPanicking, phase, countdown]);

  // Execute lockdown when phase transitions to "executing"
  useEffect(() => {
    if (phase !== "executing" || executedRef.current) return;
    executedRef.current = true;

    async function executeLockdown() {
      // Step 0: notify security backend
      notifySecurityAlert({
        event:    "PANIC_LOCKDOWN_INITIATED",
        severity: "critical",
        source:   "strontium.os",
      }).catch(() => {/* fire-and-forget */});
      setStepsDone(p => [...p, 0]);

      await delay(300);

      // Step 1: close all windows
      useWindowStore.getState().closeAll();
      setStepsDone(p => [...p, 1]);

      await delay(300);

      // Step 2: max classification
      useSettingsStore.getState().setClassificationLevel("top-secret");
      setStepsDone(p => [...p, 2]);

      await delay(400);

      // Step 3: lock screen
      useOverlayStore.getState().lock();
      setStepsDone(p => [...p, 3]);

      audit({
        category: "auth",
        severity: "critical",
        action:   "Panic lockdown executed — all windows closed, TOP SECRET set, screen locked",
        module:   "PanicOverlay",
      });

      notify("LOCKDOWN", "System locked — security backend notified", "error", "settings");

      await delay(1200);
      setPhase("done");
      clear();
    }

    executeLockdown();
  }, [phase, clear]);

  if (!isPanicking) return null;

  return (
    <AnimatePresence>
      {isPanicking && (
        <motion.div
          key="panic-overlay"
          className="fixed inset-0 flex flex-col items-center justify-center z-[99998] select-none"
          style={{
            background: phase === "panic"
              ? "rgba(6,0,0,0.97)"
              : "rgba(4,0,0,0.98)",
            backdropFilter: "blur(24px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Pulsing red border */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
            style={{
              boxShadow: "inset 0 0 0 3px rgba(255,40,40,0.7), inset 0 0 80px rgba(255,0,0,0.12)",
            }}
          />

          {/* Scanline overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,0,0.02) 2px, rgba(255,0,0,0.02) 4px)",
            }}
          />

          {/* PANIC phase */}
          {phase === "panic" && (
            <motion.div
              className="flex flex-col items-center gap-6 text-center px-8"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              {/* Icon */}
              <motion.div
                animate={{ scale: [1, 1.08, 1], opacity: [1, 0.8, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <ShieldAlert size={56} style={{ color: "#FF2020" }} strokeWidth={1.5} />
              </motion.div>

              {/* Title */}
              <div>
                <motion.h1
                  className="font-black text-5xl tracking-widest uppercase"
                  style={{
                    color: "#FF2020",
                    fontFamily: "'Arial Black', sans-serif",
                    textShadow: "0 0 40px rgba(255,32,32,0.6), 0 0 80px rgba(255,0,0,0.3)",
                  }}
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 0.4, repeat: Infinity }}
                >
                  ⚠ PANIC ⚠
                </motion.h1>
                <p className="text-sm font-mono mt-2" style={{ color: "rgba(255,100,100,0.7)", letterSpacing: "0.2em" }}>
                  EMERGENCY LOCKDOWN INITIATED
                </p>
              </div>

              {/* Countdown ring */}
              <div className="relative flex items-center justify-center w-20 h-20">
                <svg className="absolute" width={80} height={80} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={40} cy={40} r={34} fill="none" stroke="rgba(255,40,40,0.15)" strokeWidth={4} />
                  <motion.circle
                    cx={40} cy={40} r={34} fill="none"
                    stroke="#FF2020" strokeWidth={4}
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 34}
                    animate={{ strokeDashoffset: [0, 2 * Math.PI * 34] }}
                    transition={{ duration: COUNTDOWN_S, ease: "linear" }}
                  />
                </svg>
                <span
                  className="text-3xl font-black tabular-nums"
                  style={{ color: "#FF2020", textShadow: "0 0 20px rgba(255,32,32,0.8)" }}
                >
                  {countdown}
                </span>
              </div>

              {/* Steps preview */}
              <div className="space-y-2 text-left">
                {LOCKDOWN_STEPS.map((s, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm font-mono" style={{ color: "rgba(255,80,80,0.6)" }}>
                    <span style={{ color: "rgba(255,40,40,0.5)" }}>{s.icon}</span>
                    {s.label}
                  </div>
                ))}
              </div>

              {/* Abort button */}
              <motion.button
                onClick={() => { setPhase("panic"); clear(); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium mt-2"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.35)",
                }}
                whileHover={{ color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.07)" }}
                whileTap={{ scale: 0.97 }}
              >
                <X size={13} /> ABORT
              </motion.button>
            </motion.div>
          )}

          {/* EXECUTING phase */}
          {(phase === "executing" || phase === "done") && (
            <motion.div
              className="flex flex-col items-center gap-6 text-center px-8"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
            >
              <Lock size={48} style={{ color: "#FF2020" }} strokeWidth={1.5} />
              <h2
                className="text-3xl font-black tracking-widest uppercase"
                style={{
                  color: "#FF2020",
                  textShadow: "0 0 30px rgba(255,32,32,0.5)",
                }}
              >
                LOCKDOWN
              </h2>

              <div className="space-y-3 w-64">
                {LOCKDOWN_STEPS.map((s, i) => {
                  const done = stepsDone.includes(i);
                  const active = !done && stepsDone.length === i;
                  return (
                    <motion.div
                      key={i}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                      style={{
                        background: done
                          ? "rgba(255,40,40,0.12)"
                          : active
                            ? "rgba(255,40,40,0.06)"
                            : "rgba(255,255,255,0.02)",
                        border: done
                          ? "1px solid rgba(255,40,40,0.3)"
                          : "1px solid rgba(255,255,255,0.04)",
                      }}
                      animate={active ? { opacity: [1, 0.6, 1] } : {}}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      <span style={{ color: done ? "#FF4040" : "rgba(255,40,40,0.3)" }}>
                        {s.icon}
                      </span>
                      <span
                        className="text-xs font-mono"
                        style={{ color: done ? "rgba(255,100,100,0.8)" : "rgba(255,255,255,0.2)" }}
                      >
                        {s.label}
                      </span>
                      {done && (
                        <motion.span
                          className="ml-auto text-[10px] font-bold font-mono"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          style={{ color: "#FF4040" }}
                        >
                          DONE
                        </motion.span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function delay(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms));
}
