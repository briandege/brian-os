"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, Terminal, User, Newspaper, FolderOpen,
  Activity, Database, Mail, FileText, BookOpen, Zap,
  Globe, Settings, Atom, Shield, X, CornerDownLeft,
  ArrowUp, ArrowDown, Hash, Bot, PenSquare,
  Calculator, FileEdit, CalendarDays, Music2, Clipboard,
} from "lucide-react";
import { useWindowStore } from "@/lib/windowStore";
import { APP_REGISTRY } from "@/lib/apps";
import type { AppId } from "@/types";

// ── App metadata (matches Dock colors exactly) ────────────────────────────────
const META: Record<AppId, {
  icon: React.ReactNode;
  color: string;
  bg: string;
  desc: string;
  tags: string[];
}> = {
  terminal:      { icon: <Terminal size={18} strokeWidth={1.5} />,   color: "#28C840", bg: "linear-gradient(145deg,#0E1F12,#153320)", desc: "Real PTY shell — zsh with xterm.js",           tags: ["shell","pty","zsh","bash"]         },
  about:         { icon: <User size={18} strokeWidth={1.5} />,       color: "#C8A97E", bg: "linear-gradient(145deg,#1E1710,#2A1E12)", desc: "Brian Ndege · engineer & AI systems builder", tags: ["profile","bio","portfolio"]         },
  axira:         { icon: <Newspaper size={18} strokeWidth={1.5} />,  color: "#5AC8FA", bg: "linear-gradient(145deg,#0A1520,#0E2030)", desc: "AI-powered global news intelligence",          tags: ["news","ai","live","articles"]       },
  projects:      { icon: <FolderOpen size={18} strokeWidth={1.5} />, color: "#FEBC2E", bg: "linear-gradient(145deg,#1E1800,#2A2206)", desc: "Engineering portfolio — code & systems",       tags: ["code","github","portfolio"]         },
  systemmonitor: { icon: <Activity size={18} strokeWidth={1.5} />,   color: "#FF5F57", bg: "linear-gradient(145deg,#1F0C0C,#2A1010)", desc: "Real-time CPU · RAM · disk · network",         tags: ["cpu","ram","metrics","monitor"]     },
  skills:        { icon: <Database size={18} strokeWidth={1.5} />,   color: "#B48EAD", bg: "linear-gradient(145deg,#18101E,#22162A)", desc: "Proficiency database — languages & tools",     tags: ["skills","languages","frameworks"]   },
  contact:       { icon: <Mail size={18} strokeWidth={1.5} />,       color: "#C8A97E", bg: "linear-gradient(145deg,#1A1510,#24190E)", desc: "Email · GitHub · LinkedIn · contact form",     tags: ["email","social","linkedin"]         },
  resume:        { icon: <FileText size={18} strokeWidth={1.5} />,   color: "#F0EDE6", bg: "linear-gradient(145deg,#181818,#222222)", desc: "Experience timeline and full tech stack",       tags: ["resume","cv","experience","career"] },
  notebook:      { icon: <BookOpen size={18} strokeWidth={1.5} />,   color: "#F97316", bg: "linear-gradient(145deg,#1A1008,#261606)", desc: "JupyterLab — Python & data science",            tags: ["jupyter","python","notebook","data"]},
  simulation:    { icon: <Zap size={18} strokeWidth={1.5} />,        color: "#A78BFA", bg: "linear-gradient(145deg,#14102A,#1E1640)", desc: "5-mode engine — particles, Monte Carlo",        tags: ["physics","simulation","data","viz"] },
  tor:           { icon: <Shield size={18} strokeWidth={1.5} />,     color: "#7D4E8A", bg: "linear-gradient(145deg,#120A18,#1A0F22)", desc: "Anonymous browsing via Tor relay circuit",     tags: ["tor","privacy","relay","anonymous"] },
  clearnet:      { icon: <Globe size={18} strokeWidth={1.5} />,      color: "#FEBC2E", bg: "linear-gradient(145deg,#1A1400,#261E00)", desc: "Direct web access — IP visible",               tags: ["browser","web","clearnet","http"]   },
  settings:      { icon: <Settings size={18} strokeWidth={1.5} />,   color: "#9A9A8A", bg: "linear-gradient(145deg,#141414,#1E1E1E)", desc: "Appearance, terminal, startup, keyboard",      tags: ["settings","theme","config","dock"]  },
  quantum:       { icon: <Atom size={18} strokeWidth={1.5} />,       color: "#5AC8FA", bg: "linear-gradient(145deg,#061520,#0A2030)", desc: "Quantum circuit simulator — 6 gates, 5 presets",tags: ["quantum","qubits","circuit","gate"] },
  ai:            { icon: <Bot size={18} strokeWidth={1.5} />,        color: "#C8A97E", bg: "linear-gradient(145deg,#1A1508,#261E0A)", desc: "ARIA — AI assistant for strontium.os",          tags: ["ai","assistant","chat","aria"]       },
  newsroom:      { icon: <PenSquare size={18} strokeWidth={1.5} />,  color: "#FF5F57", bg: "linear-gradient(145deg,#1F0C0C,#2A1010)", desc: "Newsroom — publish articles and stories",       tags: ["news","editor","publish","write"]    },
  calculator:    { icon: <Calculator size={18} strokeWidth={1.5} />, color: "#C8A97E", bg: "linear-gradient(145deg,#1A1508,#261E0A)", desc: "Standard calculator with keyboard support",     tags: ["math","calculator","calc"]           },
  notes:         { icon: <FileEdit size={18} strokeWidth={1.5} />,   color: "#F97316", bg: "linear-gradient(145deg,#1A1008,#261606)", desc: "Markdown notes with live preview",               tags: ["notes","markdown","editor","write"]  },
  files:         { icon: <FolderOpen size={18} strokeWidth={1.5} />, color: "#FEBC2E", bg: "linear-gradient(145deg,#1E1800,#2A2206)", desc: "File manager with breadcrumb navigation",       tags: ["files","filesystem","explorer"]      },
  calendar:      { icon: <CalendarDays size={18} strokeWidth={1.5}/>,color: "#5AC8FA", bg: "linear-gradient(145deg,#0A1520,#0E2030)", desc: "Monthly calendar with events",                  tags: ["calendar","events","schedule","date"]},
  mediaplayer:   { icon: <Music2 size={18} strokeWidth={1.5} />,     color: "#B48EAD", bg: "linear-gradient(145deg,#18101E,#22162A)", desc: "Audio & video player with visualizer",          tags: ["music","audio","video","media","player"]},
  clipboard:     { icon: <Clipboard size={18} strokeWidth={1.5} />,  color: "#9A9A8A", bg: "linear-gradient(145deg,#141414,#1E1E1E)", desc: "Clipboard history manager with search & pin",   tags: ["clipboard","copy","paste","history"] },
};

// ── Search ────────────────────────────────────────────────────────────────────
function scoreMatch(q: string, target: string): number {
  const qL = q.toLowerCase(), tL = target.toLowerCase();
  if (tL === qL)         return 100;
  if (tL.startsWith(qL)) return 80;
  if (tL.includes(qL))   return 60;
  let qi = 0;
  for (let i = 0; i < tL.length && qi < qL.length; i++) {
    if (tL[i] === qL[qi]) qi++;
  }
  return qi === qL.length ? 30 : 0;
}

interface Result {
  id: string;
  appId?: AppId;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  isWindow?: boolean;
  action: () => void;
}

// ── App grid item (no-query state) ────────────────────────────────────────────
function AppTile({ appId, onClick }: { appId: AppId; onClick: () => void }) {
  const m = META[appId];
  const app = APP_REGISTRY.find((a) => a.id === appId)!;
  const [hov, setHov] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => setHov(true)}
      onHoverEnd={() => setHov(false)}
      whileTap={{ scale: 0.93 }}
      animate={{ scale: hov ? 1.06 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
      className="flex flex-col items-center gap-1.5 p-2"
    >
      <div
        className="w-12 h-12 rounded-[14px] flex items-center justify-center relative overflow-hidden"
        style={{
          background: m.bg,
          border: hov ? `1px solid ${m.color}40` : "1px solid rgba(255,255,255,0.06)",
          boxShadow: hov ? `0 8px 24px rgba(0,0,0,0.6), 0 0 0 1px ${m.color}20` : "0 4px 12px rgba(0,0,0,0.4)",
        }}
      >
        {hov && (
          <div
            className="absolute inset-0"
            style={{ background: `radial-gradient(circle at 50% 30%, ${m.color}22, transparent 70%)` }}
          />
        )}
        <span style={{ color: hov ? m.color : "#4A4A56" }} className="relative z-10">{m.icon}</span>
      </div>
      <span
        className="text-[9.5px] font-mono text-center leading-tight max-w-[56px] truncate"
        style={{ color: hov ? "rgba(240,237,230,0.7)" : "rgba(255,255,255,0.28)" }}
      >
        {app.label}
      </span>
    </motion.button>
  );
}

// ── Result row ────────────────────────────────────────────────────────────────
function ResultRow({ r, active, onEnter, onClick }: {
  r: Result; active: boolean; onEnter: () => void; onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      onHoverStart={onEnter}
      layout="position"
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left relative"
      style={{
        background: active ? `rgba(${hexRgb(r.color)},0.07)` : "transparent",
        borderLeft: `2px solid ${active ? r.color : "transparent"}`,
      }}
    >
      <div
        className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
        style={{
          background: active ? r.bg : "rgba(255,255,255,0.04)",
          border: active ? `1px solid ${r.color}30` : "1px solid rgba(255,255,255,0.05)",
          color: active ? r.color : "rgba(255,255,255,0.28)",
          transition: "all 0.15s ease",
        }}
      >
        {r.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-medium" style={{ color: active ? "#F0EDE6" : "rgba(240,237,230,0.6)" }}>
          {r.title}
        </div>
        <div className="text-[10.5px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          {r.subtitle}
        </div>
      </div>
      {r.isWindow && (
        <div className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: r.color, opacity: 0.7 }} />
      )}
      {active && <CornerDownLeft size={11} className="shrink-0" style={{ color: "rgba(255,255,255,0.2)" }} />}
    </motion.button>
  );
}

// ── Preview panel ─────────────────────────────────────────────────────────────
function Preview({ r }: { r: Result }) {
  return (
    <motion.div
      key={r.id}
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.15 }}
      className="h-full flex flex-col items-center justify-center gap-4 px-6 text-center"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.85 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 24 }}
        className="w-[72px] h-[72px] rounded-[22px] flex items-center justify-center relative overflow-hidden"
        style={{
          background: r.bg,
          border: `1px solid ${r.color}30`,
          boxShadow: `0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px ${r.color}18`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle at 50% 30%, ${r.color}25, transparent 70%)` }}
        />
        <span style={{ color: r.color }} className="relative z-10">
          {/* Upscale icon in preview */}
          {r.appId ? (
            <span style={{ transform: "scale(1.4)", display: "inline-block" }}>{r.icon}</span>
          ) : r.icon}
        </span>
      </motion.div>

      {/* Name */}
      <div>
        <div className="text-[15px] font-bold" style={{ color: "#F0EDE6" }}>{r.title}</div>
        {r.appId && (
          <div className="text-[11px] mt-1.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>
            {META[r.appId].desc}
          </div>
        )}
      </div>

      {/* Tags */}
      {r.appId && (
        <div className="flex flex-wrap gap-1 justify-center">
          {META[r.appId].tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" }}
            >
              <Hash size={7} />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Open button */}
      <button
        onClick={r.action}
        className="flex items-center gap-2 px-5 py-2 rounded-xl text-[12px] font-semibold transition-all"
        style={{
          background: `rgba(${hexRgb(r.color)},0.1)`,
          border: `1px solid ${r.color}35`,
          color: r.color,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(${hexRgb(r.color)},0.18)`; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = `rgba(${hexRgb(r.color)},0.1)`; }}
      >
        {r.isWindow ? "Focus Window" : "Open"} →
      </button>
    </motion.div>
  );
}

function hexRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : "200,169,126";
}

// ── Main ──────────────────────────────────────────────────────────────────────
interface Props { open: boolean; onClose: () => void }

export default function Spotlight({ open: isOpen, onClose }: Props) {
  const [query, setQuery]       = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);
  const { windows, open, closeAll } = useWindowStore();

  // Build flat result list
  const results: Result[] = useMemo(() => {
    const q = query.trim();
    const out: Result[] = [];

    // Apps
    APP_REGISTRY
      .map((app) => ({ app, s: Math.max(scoreMatch(q, app.label), ...META[app.id].tags.map((t) => scoreMatch(q, t) * 0.8)) }))
      .filter(({ s }) => q === "" ? true : s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, q ? 7 : 0) // only show in list mode when typing
      .forEach(({ app }) => {
        const m = META[app.id];
        out.push({
          id: `app-${app.id}`,
          appId: app.id,
          title: app.label,
          subtitle: m.desc,
          icon: m.icon,
          color: m.color,
          bg: m.bg,
          action: () => { open(app.id); onClose(); },
        });
      });

    // Open windows (always show if matching)
    windows
      .filter((w) => !w.isMinimized && (q === "" || scoreMatch(q, w.title) > 0))
      .slice(0, 3)
      .forEach((w) => {
        const m = META[w.appId as AppId];
        if (!m) return;
        out.push({
          id: `win-${w.instanceId}`,
          appId: w.appId as AppId,
          title: w.title,
          subtitle: "Running · bring to front",
          icon: m.icon,
          color: m.color,
          bg: m.bg,
          isWindow: true,
          action: () => { useWindowStore.getState().focus(w.instanceId); onClose(); },
        });
      });

    // Actions
    if (q === "" || scoreMatch(q, "Close All Windows") > 0 || scoreMatch(q, "close") > 0) {
      out.push({
        id: "act-close",
        title: "Close All Windows",
        subtitle: "Dismiss every open app",
        icon: <X size={18} strokeWidth={1.5} />,
        color: "#FF5F57",
        bg: "linear-gradient(145deg,#1F0C0C,#2A1010)",
        action: () => { closeAll(); onClose(); },
      });
    }

    return out;
  }, [query, windows, open, closeAll, onClose]);

  const activeResult = results[activeIdx] ?? null;

  const execute = useCallback((idx: number) => {
    results[idx]?.action();
  }, [results]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape")    { onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter")     { e.preventDefault(); execute(activeIdx); }
  }, [results.length, activeIdx, execute, onClose]);

  const hasQuery = query.trim().length > 0;
  const isMac = typeof navigator !== "undefined" && /mac/i.test(navigator.platform);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[180]"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px) saturate(80%)" }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -20, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.96, y: -12, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="fixed z-[190] rounded-[22px] overflow-hidden flex flex-col"
            style={{
              top: "16%",
              left: "50%",
              marginLeft: -330,
              width: hasQuery ? 660 : 560,
              transition: "width 0.2s cubic-bezier(0.4,0,0.2,1)",
              background: "rgba(9,9,14,0.99)",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 40px 120px rgba(0,0,0,0.92), 0 12px 40px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.04) inset",
            }}
          >
            {/* Search bar */}
            <div
              className="flex items-center gap-3 px-5 py-4 shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.055)" }}
            >
              <Search size={17} style={{ color: hasQuery ? "rgba(200,169,126,0.8)" : "rgba(255,255,255,0.2)", flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search apps, windows, actions…"
                className="flex-1 bg-transparent outline-none text-[15px] font-medium"
                style={{ color: "#F0EDE6", caretColor: "#C8A97E" }}
                spellCheck={false}
                autoComplete="off"
              />
              <div className="flex items-center gap-2 shrink-0">
                {query ? (
                  <button
                    onClick={() => setQuery("")}
                    className="w-5 h-5 rounded-md flex items-center justify-center"
                    style={{ color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.06)" }}
                  >
                    <X size={11} />
                  </button>
                ) : (
                  <div
                    className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-mono"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {isMac ? "⌘" : "Ctrl"}K
                  </div>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="flex" style={{ minHeight: hasQuery ? 320 : 280 }}>

              {/* Left: grid or results */}
              <div className={`flex flex-col ${hasQuery ? "w-[380px] border-r border-white/5" : "flex-1"}`}>
                {!hasQuery ? (
                  /* App grid */
                  <div className="p-4">
                    <div className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase mb-3 px-1" style={{ color: "rgba(255,255,255,0.18)" }}>
                      Applications
                    </div>
                    <div className="grid grid-cols-5 gap-0">
                      {APP_REGISTRY.map((app) => (
                        <AppTile
                          key={app.id}
                          appId={app.id}
                          onClick={() => { open(app.id); onClose(); }}
                        />
                      ))}
                    </div>
                    {windows.filter((w) => !w.isMinimized).length > 0 && (
                      <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <div className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase mb-2 px-1" style={{ color: "rgba(255,255,255,0.18)" }}>
                          Open Windows
                        </div>
                        <div className="flex flex-col">
                          {windows.filter((w) => !w.isMinimized).map((w) => {
                            const m = META[w.appId as AppId];
                            if (!m) return null;
                            return (
                              <button
                                key={w.instanceId}
                                onClick={() => { useWindowStore.getState().focus(w.instanceId); onClose(); }}
                                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-colors"
                                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: m.color }} />
                                <span className="text-[11px]" style={{ color: "rgba(240,237,230,0.45)" }}>{w.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Search results */
                  <div ref={listRef} className="flex-1 overflow-y-auto py-2">
                    {results.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-12">
                        <Search size={20} style={{ color: "rgba(255,255,255,0.07)" }} />
                        <span className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
                          no results for &ldquo;{query}&rdquo;
                        </span>
                      </div>
                    ) : (
                      results.map((r, idx) => (
                        <div key={r.id} data-idx={idx}>
                          <ResultRow
                            r={r}
                            active={activeIdx === idx}
                            onEnter={() => setActiveIdx(idx)}
                            onClick={() => execute(idx)}
                          />
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Right: preview (only in search mode) */}
              {hasQuery && (
                <div className="w-[280px] relative overflow-hidden">
                  <div
                    className="absolute inset-0"
                    style={{
                      background: activeResult
                        ? `radial-gradient(ellipse 80% 60% at 50% 40%, rgba(${hexRgb(activeResult.color)},0.07) 0%, transparent 70%)`
                        : "transparent",
                      transition: "all 0.3s ease",
                    }}
                  />
                  <AnimatePresence mode="wait">
                    {activeResult ? (
                      <Preview key={activeResult.id} r={activeResult} />
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-full flex items-center justify-center"
                      >
                        <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.1)" }}>
                          select a result
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center gap-4 px-5 py-2.5 shrink-0 text-[9.5px] font-mono"
              style={{ borderTop: "1px solid rgba(255,255,255,0.045)", color: "rgba(255,255,255,0.15)" }}
            >
              {hasQuery && (
                <>
                  <span className="flex items-center gap-1"><ArrowUp size={9} /><ArrowDown size={9} /> navigate</span>
                  <span className="flex items-center gap-1"><CornerDownLeft size={9} /> open</span>
                </>
              )}
              <span className="flex items-center gap-1">esc · close</span>
              {hasQuery && results.length > 0 && (
                <span className="ml-auto">{results.length} result{results.length !== 1 ? "s" : ""}</span>
              )}
              {!hasQuery && (
                <span className="ml-auto">start typing to search</span>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
