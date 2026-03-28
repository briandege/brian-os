"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BootLine {
  text: string;
  delay: number;
  type: "ok" | "info" | "warn" | "blank" | "header";
}

const LINES: BootLine[] = [
  { type: "header", text: "AXIRA_BIOS v3.1.0  |  64-bit UEFI  |  ARM64  |  2026",              delay: 0    },
  { type: "blank",  text: "",                                                                     delay: 80   },
  { type: "info",   text: "CPU: Apple M-Series  —  12 cores / 32GB Neural Engine",               delay: 160  },
  { type: "info",   text: "RAM: 64GB LPDDR5  —  bandwidth 800 GB/s",                             delay: 290  },
  { type: "blank",  text: "",                                                                     delay: 380  },
  { type: "ok",     text: "[ OK ] Verifying cryptographic integrity",                             delay: 460  },
  { type: "ok",     text: "[ OK ] Loading kernel image .................. strontium/6.1.0-strontium", delay: 580  },
  { type: "ok",     text: "[ OK ] Mounting encrypted root filesystem ............... /dev/nvme0n1p2", delay: 720  },
  { type: "ok",     text: "[ OK ] Starting systemd .................................... v252",    delay: 860  },
  { type: "ok",     text: "[ OK ] Brought up network interface ........................ eth0",   delay: 980  },
  { type: "ok",     text: "[ OK ] Connecting to Cloudflare tunnel ..................... edge-node-iad", delay: 1100 },
  { type: "ok",     text: "[ OK ] Starting PostgreSQL 16 .............................. port 5432", delay: 1220 },
  { type: "ok",     text: "[ OK ] Starting Redis 7.2 .................................. port 6379", delay: 1330 },
  { type: "ok",     text: "[ OK ] Loading AI inference runtime ........................ AXIRA_CORE", delay: 1440 },
  { type: "ok",     text: "[ OK ] Starting AxiraNews ingestion daemon ................. 6 sources", delay: 1550 },
  { type: "ok",     text: "[ OK ] Spawning Node.js API workers ........................ 4 threads", delay: 1650 },
  { type: "ok",     text: "[ OK ] Compiling UI assets ................................. done",    delay: 1740 },
  { type: "blank",  text: "",                                                                     delay: 1840 },
  { type: "ok",     text: "[ OK ] All systems operational",                                       delay: 1900 },
  { type: "blank",  text: "",                                                                     delay: 1980 },
  { type: "header", text: "Welcome back, Brian.",                                                 delay: 2080 },
];

const OK_LINES = LINES.filter((l) => l.type === "ok").length;
const DONE_DELAY = 2080 + 1600;
const EXIT_DELAY = DONE_DELAY + 800;

interface Props { onComplete: () => void }

export default function BootSequence({ onComplete }: Props) {
  const [visible, setVisible] = useState(0);
  const [exiting, setExiting] = useState(false);
  const called = useRef(false);

  // How many OK lines have been shown so far
  const okShown = LINES.slice(0, visible).filter((l) => l.type === "ok").length;
  const progress = Math.round((okShown / OK_LINES) * 100);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    LINES.forEach((line, i) =>
      timers.push(setTimeout(() => setVisible(i + 1), line.delay))
    );
    timers.push(setTimeout(() => setExiting(true), DONE_DELAY));
    timers.push(setTimeout(() => {
      if (!called.current) { called.current = true; onComplete(); }
    }, EXIT_DELAY));
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const lineColor = (type: BootLine["type"]) => {
    switch (type) {
      case "ok":     return "#C8A97E";
      case "info":   return "#52524E";
      case "warn":   return "#FEBC2E";
      case "header": return "#F0EDE6";
      default:       return "transparent";
    }
  };

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="boot"
          className="scanlines vignette fixed inset-0 z-[100] flex flex-col justify-end overflow-hidden"
          style={{ background: "#050506" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeIn" }}
        >
          {/* Phosphor glow at bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
            style={{ background: "linear-gradient(to top, rgba(200,169,126,0.03) 0%, transparent 100%)" }}
          />

          <div className="relative z-10 p-8 pb-6 space-y-[2px] font-mono text-[13px] leading-[1.7]">
            {LINES.slice(0, visible).map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.1 }}
                style={{
                  color: lineColor(line.type),
                  fontWeight: line.type === "header" ? 600 : 400,
                  letterSpacing: line.type === "header" ? "0.02em" : undefined,
                }}
              >
                {line.text || "\u00A0"}
              </motion.div>
            ))}
            {visible < LINES.length && (
              <span className="terminal-cursor" style={{ color: "#C8A97E" }}>█</span>
            )}
          </div>

          {/* Progress bar */}
          <div className="relative z-10 px-8 pb-8">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[10px]" style={{ color: "#3A3A42" }}>BOOTING</span>
              <span className="font-mono text-[10px]" style={{ color: "#3A3A42" }}>{progress}%</span>
            </div>
            <div className="h-[2px] w-full rounded-full overflow-hidden" style={{ background: "#111114" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #8C7A65, #D4B896)" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Version watermark */}
          <div className="absolute bottom-4 right-6 font-mono text-[10px]" style={{ color: "#1E1E22" }}>
            strontium.os / build {new Date().getFullYear()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
