"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, TrendingUp, Globe } from "lucide-react";
import { fetchTopHeadlines, type AxiraArticle, relativeTime } from "@/lib/axiraClient";
import { useNewsroomStore } from "@/lib/newsroomStore";

const ROTATE_MS = 6000;

export default function NewsTicker() {
  const [items, setItems]     = useState<{ headline: string; cat: string; time: string; live?: boolean }[]>([]);
  const [idx, setIdx]         = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef              = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pull from AxiraNews + local Newsroom published articles
  useEffect(() => {
    async function load() {
      const [remoteRaw, local] = await Promise.allSettled([
        fetchTopHeadlines(12),
        Promise.resolve([] as AxiraArticle[]),
      ]);

      const remote: { headline: string; cat: string; time: string; live?: boolean }[] = [];

      if (remoteRaw.status === "fulfilled") {
        remoteRaw.value.slice(0, 12).forEach((a) => {
          remote.push({ headline: a.title, cat: a.category, time: relativeTime(a.publishedAt), live: a.urgent });
        });
      }

      // Add locally published articles from Newsroom
      const localArticles = useNewsroomStore
        .getState()
        .articles.filter((a) => a.status === "published")
        .slice(0, 4)
        .map((a) => ({
          headline: a.title,
          cat:      a.category,
          time:     relativeTime(new Date(a.publishedAt ?? a.createdAt).toISOString()),
          live:     Date.now() - (a.publishedAt ?? 0) < 3600_000, // < 1h = live
        }));

      const merged = [...localArticles, ...remote];
      if (merged.length > 0) setItems(merged);
    }

    load();
    const refreshId = setInterval(load, 90_000);
    return () => clearInterval(refreshId);
  }, []);

  // Rotate headline
  useEffect(() => {
    if (items.length < 2) return;
    timerRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % items.length);
    }, ROTATE_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [items]);

  if (!visible || items.length === 0) return null;

  const current = items[idx];

  return (
    <div
      className="fixed bottom-[52px] left-0 right-0 z-40 flex items-center h-7 select-none pointer-events-none"
      style={{
        background: "linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.48) 60%, transparent 100%)",
        backdropFilter: "blur(8px)",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {/* LIVE badge */}
      <div className="flex items-center gap-1.5 pl-3 pr-2.5 shrink-0">
        {current.live ? (
          <motion.div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded"
            style={{ background: "rgba(255,95,87,0.15)", border: "1px solid rgba(255,95,87,0.3)" }}
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            <Radio size={8} style={{ color: "#FF5F57" }} />
            <span className="text-[8.5px] font-bold font-mono tracking-widest" style={{ color: "#FF5F57" }}>LIVE</span>
          </motion.div>
        ) : (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded"
            style={{ background: "rgba(200,169,126,0.08)", border: "1px solid rgba(200,169,126,0.15)" }}>
            <Globe size={8} style={{ color: "#C8A97E" }} />
            <span className="text-[8.5px] font-bold font-mono tracking-widest" style={{ color: "rgba(200,169,126,0.6)" }}>NEWS</span>
          </div>
        )}
      </div>

      {/* Category pill */}
      <div
        className="shrink-0 text-[8.5px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded mr-2.5"
        style={{
          background: "rgba(90,200,250,0.08)",
          border: "1px solid rgba(90,200,250,0.15)",
          color: "rgba(90,200,250,0.7)",
        }}
      >
        {current.cat}
      </div>

      {/* Headline (animated) */}
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute text-[11.5px] font-medium whitespace-nowrap truncate max-w-[calc(100%-60px)]"
            style={{ color: "rgba(240,237,230,0.8)" }}
          >
            {current.headline}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Time + dots */}
      <div className="flex items-center gap-2 pr-3 shrink-0">
        <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
          {current.time}
        </span>
        {/* Dot indicators */}
        <div className="flex gap-0.5">
          {items.slice(0, Math.min(items.length, 8)).map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full transition-all duration-300"
              style={{
                background: i === idx % Math.min(items.length, 8)
                  ? "rgba(200,169,126,0.8)"
                  : "rgba(255,255,255,0.12)",
              }}
            />
          ))}
        </div>
        {/* Close */}
        <button
          className="pointer-events-auto text-[9px] font-mono ml-1 opacity-40 hover:opacity-80 transition-opacity"
          style={{ color: "rgba(255,255,255,0.5)" }}
          onClick={() => setVisible(false)}
        >
          ×
        </button>
      </div>

      {/* Progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-px"
        style={{ background: "rgba(200,169,126,0.3)" }}
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: ROTATE_MS / 1000, ease: "linear", repeat: Infinity }}
        key={idx}
      />
    </div>
  );
}
