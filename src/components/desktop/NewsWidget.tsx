"use client";
/**
 * NewsWidget — a compact floating widget pinned to the desktop (not a window).
 * Shows a rotating headline from AxiraNews with urgency and category indicators.
 * Can be dismissed or expanded into the full AxiraApp.
 */
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, ChevronRight, X, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { fetchTopHeadlines, type AxiraArticle, relativeTime } from "@/lib/axiraClient";
import { useWindowStore } from "@/lib/windowStore";

const ROTATE_MS = 7000;

const CATEGORY_COLOR: Record<string, string> = {
  Cybersecurity: "#FF5F57",
  Finance:       "#28C840",
  Science:       "#5AC8FA",
  Technology:    "#B48EAD",
  Politics:      "#FEBC2E",
  Health:        "#34D399",
  Global:        "#D4B896",
  Business:      "#C8A97E",
};

export default function NewsWidget() {
  const [items, setItems]       = useState<AxiraArticle[]>([]);
  const [idx, setIdx]           = useState(0);
  const [online, setOnline]     = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const timerRef                = useRef<ReturnType<typeof setInterval> | null>(null);
  const { open }                = useWindowStore();

  useEffect(() => {
    async function load() {
      const articles = await fetchTopHeadlines(12);
      if (articles.length > 0) {
        setItems(articles);
        setOnline(true);
      } else {
        setOnline(false);
      }
    }
    load();
    const id = setInterval(load, 120_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % items.length), ROTATE_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [items]);

  if (dismissed || items.length === 0) return null;

  const current = items[idx];
  const catColor = CATEGORY_COLOR[current.category] ?? "#6B6B6B";
  const urgentItems = items.filter(a => a.urgent);

  return (
    <div
      className="fixed bottom-[92px] right-4 z-30 select-none"
      style={{ width: expanded ? 320 : 240 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={expanded ? "expanded" : "compact"}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(8,8,16,0.88)",
            border: "1px solid rgba(212,184,150,0.12)",
            boxShadow: "0 12px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-3 py-2.5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center gap-2">
              <Newspaper size={11} style={{ color: "#D4B896" }} />
              <span className="text-[10px] font-bold tracking-wider font-mono" style={{ color: "#D4B896" }}>
                AXIRA<span style={{ color: "#4A4A4A" }}>NEWS</span>
              </span>
              {urgentItems.length > 0 && (
                <motion.div
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(255,95,87,0.15)", border: "1px solid rgba(255,95,87,0.25)" }}
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  <AlertTriangle size={8} style={{ color: "#FF5F57" }} />
                  <span className="text-[8px] font-bold font-mono" style={{ color: "#FF5F57" }}>
                    {urgentItems.length} URGENT
                  </span>
                </motion.div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {online === true
                ? <Wifi size={9} style={{ color: "#28C840", opacity: 0.7 }} />
                : online === false
                  ? <WifiOff size={9} style={{ color: "#FF5F57", opacity: 0.7 }} />
                  : null
              }
              <button
                onClick={() => setExpanded(v => !v)}
                className="p-1 rounded opacity-40 hover:opacity-80 transition-opacity"
                style={{ color: "#C8A97E" }}
              >
                <motion.div animate={{ rotate: expanded ? 90 : 0 }}>
                  <ChevronRight size={11} />
                </motion.div>
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="p-1 rounded opacity-30 hover:opacity-70 transition-opacity"
                style={{ color: "#888" }}
              >
                <X size={10} />
              </button>
            </div>
          </div>

          {/* Current headline */}
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span
                className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded"
                style={{ background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}30` }}
              >
                {current.category}
              </span>
              {current.urgent && (
                <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(255,95,87,0.12)", color: "#FF5F57", border: "1px solid rgba(255,95,87,0.2)" }}>
                  URGENT
                </span>
              )}
              <span className="text-[9px] font-mono ml-auto" style={{ color: "#3A3A3A" }}>
                {relativeTime(current.publishedAt)}
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={idx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.25 }}
                className="text-[12px] font-medium leading-snug"
                style={{ color: "#E8E5DF" }}
              >
                {current.title}
              </motion.p>
            </AnimatePresence>

            {current.summary && expanded && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-[10px] leading-relaxed mt-1.5 overflow-hidden"
                style={{ color: "#5A5A5A" }}
              >
                {current.summary.slice(0, 140)}…
              </motion.p>
            )}

            <p className="text-[9px] font-mono mt-1" style={{ color: "#3A3A3A" }}>
              {current.source}
            </p>
          </div>

          {/* Expanded: article list */}
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
              {items.slice(0, 5).map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => setIdx(i)}
                  className="w-full text-left px-3 py-2 transition-colors"
                  style={{ background: i === idx ? "rgba(212,184,150,0.05)" : "transparent" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,184,150,0.04)")}
                  onMouseLeave={e => (e.currentTarget.style.background = i === idx ? "rgba(212,184,150,0.05)" : "transparent")}
                >
                  <p className="text-[10px] leading-snug truncate" style={{ color: i === idx ? "#E8E5DF" : "#5A5A5A" }}>
                    {a.title}
                  </p>
                </button>
              ))}
            </motion.div>
          )}

          {/* Footer */}
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
          >
            {/* Dot indicators */}
            <div className="flex gap-1">
              {items.slice(0, Math.min(items.length, 8)).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === idx ? 12 : 4,
                    height: 4,
                    background: i === idx ? "#D4B896" : "rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => open("axira")}
              className="text-[9px] font-mono flex items-center gap-1 opacity-40 hover:opacity-80 transition-opacity"
              style={{ color: "#D4B896" }}
            >
              Open app <ChevronRight size={8} />
            </button>
          </div>

          {/* Progress bar */}
          <motion.div
            className="h-px"
            style={{ background: `linear-gradient(90deg, ${catColor}60, transparent)` }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: ROTATE_MS / 1000, ease: "linear", repeat: Infinity }}
            key={idx}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
