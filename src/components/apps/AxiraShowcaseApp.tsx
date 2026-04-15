"use client";
/**
 * AxiraShowcaseApp — portfolio showcase for the AxiraNews platform.
 * Shows live backend health, article stats, tech stack, and feature highlights.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ExternalLink, Activity, Database, Globe, Shield, Brain,
  Newspaper, Cpu, Code2, Smartphone, Server, Zap, Map, Radio,
} from "lucide-react";
import {
  checkHealth, fetchStats,
  type BackendHealth, type BackendStats,
} from "@/lib/axiraClient";

const TECH_STACK = [
  { label: "SwiftUI",      desc: "iOS / iPadOS app",              color: "#5AC8FA", icon: <Smartphone size={14}/> },
  { label: "Fastify",      desc: "TypeScript REST + SSE backend", color: "#28C840", icon: <Server size={14}/> },
  { label: "PostgreSQL",   desc: "Primary data store",            color: "#5AC8FA", icon: <Database size={14}/> },
  { label: "Prisma ORM",   desc: "Type-safe query layer",         color: "#B48EAD", icon: <Code2 size={14}/> },
  { label: "Firebase",     desc: "Auth & JWKS verification",      color: "#FEBC2E", icon: <Shield size={14}/> },
  { label: "SwiftData",    desc: "On-device persistence",         color: "#FF5F57", icon: <Cpu size={14}/> },
  { label: "Next.js",      desc: "Web + Strontium OS portal",     color: "#C8A97E", icon: <Globe size={14}/> },
];

const FEATURES = [
  { icon: <Brain size={14}/>,     label: "ML Recommendation Engine", desc: "User-vector personalised feed — category, source & geo affinity" },
  { icon: <Map size={14}/>,       label: "Geo Intelligence",          desc: "Cluster articles by location, live event strips, story bubbles" },
  { icon: <Shield size={14}/>,    label: "OSINT Integration",         desc: "IP/domain/URL/email enrichment via VirusTotal, Shodan, HIBP & more" },
  { icon: <Radio size={14}/>,     label: "Real-time SSE Feed",        desc: "Live ingestion events pushed server-sent to all connected clients" },
  { icon: <Activity size={14}/>,  label: "Engagement Tracking",       desc: "Impression, click, dwell & save events drive the ranking model" },
  { icon: <Zap size={14}/>,       label: "Multi-source Ingestion",    desc: "NewsAPI, FMP, OSINT feeds aggregated and deduplicated hourly" },
];

function StatusDot({ status }: { status: "online" | "degraded" | "offline" | null }) {
  const color = status === "online" ? "#28C840" : status === "degraded" ? "#FEBC2E" : status === "offline" ? "#FF5F57" : "#4A4A4A";
  return (
    <motion.div
      className="w-2 h-2 rounded-full shrink-0"
      style={{ background: color }}
      animate={status === "online" ? { opacity: [1, 0.5, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    />
  );
}

export default function AxiraShowcaseApp() {
  const [health, setHealth]   = useState<BackendHealth | null>(null);
  const [stats, setStats]     = useState<BackendStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [h, s] = await Promise.all([checkHealth(), fetchStats()]);
      setHealth(h);
      setStats(s);
      setLoading(false);
    }
    load();
  }, []);

  const categoryEntries = stats
    ? Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])
    : [];
  const maxCount = categoryEntries[0]?.[1] ?? 1;

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(160deg, #060810 0%, #0A0B14 60%, #080610 100%)" }}
    >
      {/* Hero */}
      <div
        className="shrink-0 px-6 pt-6 pb-4"
        style={{ borderBottom: "1px solid rgba(212,184,150,0.08)" }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Newspaper size={18} style={{ color: "#D4B896" }} />
              <h1 className="text-xl font-black italic tracking-tight"
                style={{ color: "#D4B896", fontFamily: "Georgia, serif" }}>
                AXIRA<span style={{ color: "#424242" }}>NEWS</span>
              </h1>
            </div>
            <p className="text-xs" style={{ color: "#5A5A5A" }}>
              AI-powered global news intelligence platform
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="https://axiranews.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium"
              style={{
                background: "rgba(212,184,150,0.08)",
                border: "1px solid rgba(212,184,150,0.18)",
                color: "#D4B896",
              }}
            >
              <Globe size={11} /> Website
            </a>
            <a
              href="https://github.com/briandege/AxiraNews"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#6B6B6B",
              }}
            >
              <ExternalLink size={11} /> GitHub
            </a>
          </div>
        </div>

        {/* Live stats row */}
        <div className="flex gap-4 mt-4">
          {[
            { label: "Articles indexed", value: loading ? "…" : stats ? `${stats.totalArticles}+` : "—" },
            { label: "Sources",          value: loading ? "…" : stats ? String(stats.sources) : "—" },
            { label: "Categories",       value: loading ? "…" : stats ? String(Object.keys(stats.byCategory).length) : "—" },
            { label: "API latency",      value: loading ? "…" : health?.reachable ? `${health.api.latencyMs}ms` : "offline" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-lg font-bold font-mono" style={{ color: "#D4B896" }}>{value}</p>
              <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "#3A3A3A" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-px" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>

          {/* Backend health */}
          <section className="px-5 py-4" style={{ borderRight: "1px solid rgba(255,255,255,0.04)" }}>
            <h2 className="text-[10px] font-bold font-mono tracking-widest uppercase mb-3" style={{ color: "#4A4A4A" }}>
              Backend Health
            </h2>
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => (
                  <div key={i} className="h-8 rounded-lg animate-pulse" style={{ background: "#111" }} />
                ))}
              </div>
            ) : health ? (
              <div className="space-y-2">
                {[health.api, health.postgres, health.redis].map(svc => (
                  <div
                    key={svc.name}
                    className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div className="flex items-center gap-2">
                      <StatusDot status={svc.status} />
                      <span className="text-[11px]" style={{ color: "#C8C6C0" }}>{svc.name}</span>
                    </div>
                    <span className="text-[10px] font-mono" style={{ color: "#3A3A3A" }}>
                      {svc.status === "online" && svc.latencyMs > 0 ? `${svc.latencyMs}ms` : svc.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono" style={{ color: "#FF5F57" }}>Backend unreachable</p>
            )}
          </section>

          {/* Article distribution */}
          <section className="px-5 py-4">
            <h2 className="text-[10px] font-bold font-mono tracking-widest uppercase mb-3" style={{ color: "#4A4A4A" }}>
              Article Distribution
            </h2>
            {loading ? (
              <div className="space-y-2">
                {[1,2,3,4].map(i => <div key={i} className="h-5 rounded animate-pulse" style={{ background: "#111" }} />)}
              </div>
            ) : categoryEntries.length > 0 ? (
              <div className="space-y-2">
                {categoryEntries.slice(0, 6).map(([cat, count]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="w-20 text-[10px] font-mono shrink-0" style={{ color: "#6B6B6B" }}>{cat}</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#151515" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, #D4B896, #8A6A40)" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / maxCount) * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-[9px] font-mono w-5 text-right shrink-0" style={{ color: "#3A3A3A" }}>{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono" style={{ color: "#3A3A3A" }}>No data</p>
            )}
          </section>
        </div>

        {/* Tech stack */}
        <section className="px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <h2 className="text-[10px] font-bold font-mono tracking-widest uppercase mb-3" style={{ color: "#4A4A4A" }}>
            Tech Stack
          </h2>
          <div className="flex flex-wrap gap-2">
            {TECH_STACK.map(({ label, desc, color, icon }) => (
              <motion.div
                key={label}
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{
                  background: `${color}08`,
                  border: `1px solid ${color}20`,
                }}
                whileHover={{ scale: 1.03 }}
                title={desc}
              >
                <span style={{ color }}>{icon}</span>
                <span className="text-[11px] font-medium" style={{ color }}>{label}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Feature highlights */}
        <section className="px-5 py-5">
          <h2 className="text-[10px] font-bold font-mono tracking-widest uppercase mb-3" style={{ color: "#4A4A4A" }}>
            Feature Highlights
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {FEATURES.map(({ icon, label, desc }, i) => (
              <motion.div
                key={label}
                className="p-3 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.015)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span style={{ color: "#D4B896" }}>{icon}</span>
                  <span className="text-[11px] font-semibold" style={{ color: "#C8C6C0" }}>{label}</span>
                </div>
                <p className="text-[10px] leading-relaxed" style={{ color: "#4A4A4A" }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
