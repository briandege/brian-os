"use client";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BootSequence from "@/components/boot/BootSequence";
import Desktop from "@/components/desktop/Desktop";
import { useWindowStore } from "@/lib/windowStore";

function WelcomeOverlay({ onEnter }: { onEnter: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "F5") onEnter();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onEnter]);

  return (
    <motion.div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8"
      style={{ background: "#080808" }}
      exit={{ opacity: 0, filter: "blur(12px)", scale: 1.04 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 22 }}
        className="text-center"
      >
        <div
          className="text-5xl font-black tracking-[0.15em] font-mono"
          style={{ color: "#D4B896" }}
        >
          brian.os
        </div>
        <div className="text-sm mt-2 font-mono" style={{ color: "#4A4A4A" }}>
          kernel 6.1.0-axira · all systems ready
        </div>
      </motion.div>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
        className="w-24 h-px"
        style={{ background: "#2A2A2A" }}
      />

      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 280, damping: 24 }}
        onClick={onEnter}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        className="px-10 py-3 rounded-xl text-sm font-semibold tracking-wider"
        style={{
          background: "rgba(212,184,150,0.08)",
          border: "1px solid rgba(212,184,150,0.22)",
          color: "#D4B896",
        }}
      >
        ENTER DESKTOP
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-xs font-mono"
        style={{ color: "#2A2A2A" }}
      >
        press any key or click to continue
      </motion.p>
    </motion.div>
  );
}

type Phase = "boot" | "welcome" | "desktop";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("boot");
  const { open } = useWindowStore();

  const handleBootComplete = useCallback(() => setPhase("welcome"), []);

  const handleEnterDesktop = useCallback(() => {
    setPhase("desktop");
    setTimeout(() => open("terminal"), 400);
    setTimeout(() => open("axira"), 750);
  }, [open]);

  return (
    <main className="fixed inset-0" style={{ background: "#080808" }}>
      <AnimatePresence mode="wait">
        {phase === "boot" && (
          <BootSequence key="boot" onComplete={handleBootComplete} />
        )}
        {phase === "welcome" && (
          <WelcomeOverlay key="welcome" onEnter={handleEnterDesktop} />
        )}
      </AnimatePresence>

      {/* Desktop is mounted but invisible until phase=desktop */}
      <motion.div
        className="fixed inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "desktop" ? 1 : 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ pointerEvents: phase === "desktop" ? "auto" : "none" }}
      >
        <Desktop />
      </motion.div>
    </main>
  );
}
