"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BOOT_LINES = [
  { text: "BIOS v2.4.1  |  AXIRA_CORE  |  ARM64", delay: 0 },
  { text: "[ OK ] Initializing memory subsystem .............. 64GB", delay: 180 },
  { text: "[ OK ] Loading kernel modules", delay: 340 },
  { text: "[ OK ] Mounting encrypted filesystem .............. /dev/sda1", delay: 500 },
  { text: "[ OK ] Starting network interface ................. eth0", delay: 660 },
  { text: "[ OK ] Establishing secure tunnel ................. Cloudflare Edge", delay: 820 },
  { text: "[ OK ] Connecting to PostgreSQL ................... localhost:5432", delay: 980 },
  { text: "[ OK ] Connecting to Redis ........................ localhost:6379", delay: 1120 },
  { text: "[ OK ] Loading AI inference engine ................ AXIRA_CORE v1.0", delay: 1280 },
  { text: "[ OK ] Starting AxiraNews ingestion daemon", delay: 1440 },
  { text: "[ OK ] Compiling UI assets", delay: 1580 },
  { text: "[ OK ] All services operational", delay: 1720 },
  { text: "", delay: 1860 },
  { text: "Welcome, Brian.", delay: 1960 },
];

interface Props {
  onComplete: () => void;
}

export default function BootSequence({ onComplete }: Props) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    BOOT_LINES.forEach((line, i) => {
      timers.push(
        setTimeout(() => setVisibleLines(i + 1), line.delay + 300)
      );
    });

    // Trigger exit after last line
    const lastDelay = BOOT_LINES[BOOT_LINES.length - 1].delay + 1400;
    timers.push(setTimeout(() => setDone(true), lastDelay));
    timers.push(setTimeout(() => onComplete(), lastDelay + 900));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!done ? (
        <motion.div
          key="boot"
          className="scanlines fixed inset-0 z-50 flex flex-col justify-end p-10 overflow-hidden"
          style={{ background: "#050505" }}
          exit={{ opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {/* Dim amber phosphor effect */}
          <div className="flex flex-col gap-[3px] font-mono text-sm leading-6 max-w-3xl">
            {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  color: line.text.startsWith("[ OK ]")
                    ? "#D4B896"
                    : line.text === "Welcome, Brian."
                    ? "#F5F5F0"
                    : "#6B6050",
                  fontWeight: line.text === "Welcome, Brian." ? 600 : 400,
                  fontSize: line.text === "Welcome, Brian." ? "1.1rem" : undefined,
                }}
              >
                {line.text || "\u00A0"}
              </motion.div>
            ))}

            {/* Blinking cursor */}
            {visibleLines < BOOT_LINES.length && (
              <span className="terminal-cursor" style={{ color: "#D4B896" }}>
                █
              </span>
            )}
          </div>

          {/* Bottom brand */}
          <div
            className="absolute bottom-6 right-10 font-mono text-xs"
            style={{ color: "#2A2A2A" }}
          >
            brian.os / kernel 6.1.0-axira
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
