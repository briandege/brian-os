"use client";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BootSequence from "@/components/boot/BootSequence";
import Desktop from "@/components/desktop/Desktop";
import { useWindowStore } from "@/lib/windowStore";

function WelcomeOverlay({ onEnter }: { onEnter: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key !== "F5") onEnter(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onEnter]);

  return (
    <motion.div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "#070708" }}
      exit={{ opacity: 0, filter: "blur(20px)", scale: 1.06 }}
      transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Grid wallpaper behind */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.12 }} preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="wg" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#C8A97E" strokeWidth="0.4" />
          </pattern>
          <radialGradient id="wfade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="wm"><rect width="100%" height="100%" fill="url(#wfade)" /></mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#wg)" mask="url(#wm)" />
      </svg>

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(200,169,126,0.05) 0%, transparent 70%)",
      }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: "spring" as const, stiffness: 280, damping: 26 }}
          className="text-center"
        >
          <div
            className="text-[56px] font-black tracking-[0.1em] font-mono leading-none tan-glow"
            style={{ color: "#C8A97E" }}
          >
            strontium.os
          </div>
          <div className="mt-3 text-[12px] font-mono tracking-[0.22em] uppercase" style={{ color: "#3A3A42" }}>
            kernel 6.1.0-strontium · all systems ready
          </div>
        </motion.div>

        {/* Thin separator */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
          className="w-20 h-px"
          style={{ background: "linear-gradient(90deg, transparent, #C8A97E55, transparent)" }}
        />

        {/* Enter button */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, type: "spring" as const, stiffness: 300, damping: 26 }}
          onClick={onEnter}
          whileHover={{ scale: 1.03, boxShadow: "0 0 40px rgba(200,169,126,0.12)" }}
          whileTap={{ scale: 0.97 }}
          className="relative px-12 py-3.5 rounded-2xl text-[13px] font-semibold tracking-[0.12em] uppercase overflow-hidden"
          style={{
            background: "rgba(200,169,126,0.07)",
            border: "1px solid rgba(200,169,126,0.2)",
            color: "#C8A97E",
          }}
        >
          {/* Button inner glow */}
          <div className="absolute inset-0 rounded-2xl" style={{
            background: "linear-gradient(180deg, rgba(200,169,126,0.06) 0%, transparent 100%)",
          }} />
          <span className="relative">Enter Desktop</span>
        </motion.button>

        {/* Hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-[10px] font-mono tracking-[0.15em]"
          style={{ color: "#1E1E22" }}
        >
          PRESS ANY KEY TO CONTINUE
        </motion.p>
      </div>

      {/* Bottom version */}
      <div className="absolute bottom-6 font-mono text-[10px] tracking-widest" style={{ color: "#1A1A1E" }}>
        strontium.os / {new Date().getFullYear()}
      </div>
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
