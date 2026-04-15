"use client";
/**
 * AxiraHQApp — Strontium OS Headquarters for AxiraNews.
 * Command and control: health, ingestion, articles, security ops, OSINT.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Zap, Newspaper, Shield, Search,
  RefreshCw, Play, Pause, AlertTriangle, CheckCircle,
  Wifi, WifiOff, Radio, Globe, Lock, Unlock, Eye,
  ChevronRight, X, Loader2, Database,
} from "lucide-react";
import {
  checkHealth, fetchNews, fetchStats, fetchIngestStatus, runIngestionCycle,
  fetchSecurityStatus, fetchSecurityStats, fetchDetections, acknowledgeDetection,
  pauseShield, resumeShield, startScan, fetchScanStatus, fetchCisaKev, osintLookup,
  searchNews, relativeTime,
  type BackendHealth, type BackendStats, type IngestStatus,
  type Detection, type CisaKevEntry, type AxiraArticle,
} from "@/lib/axiraClient";
import { useAuthStore, isAuthed, getToken } from "@/lib/authStore";
import { notify } from "@/lib/notificationStore";

// ── Tab definition ────────────────────────────────────────────────────────────
type Tab = "overview" | "ingestion" | "articles" | "security" | "osint";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview",  label: "Overview",  icon: <Activity size={13} />  },
  { id: "ingestion", label: "Ingestion", icon: <Zap size={13} />       },
  { id: "articles",  label: "Articles",  icon: <Newspaper size={13} /> },
  { id: "security",  label: "Security",  icon: <Shield size={13} />    },
  { id: "osint",     label: "OSINT",     icon: <Globe size={13} />     },
];

// ── Shared primitives ─────────────────────────────────────────────────────────
function StatusDot({ online }: { online: boolean | null }) {
  const color = online === null ? "#FEBC2E" : online ? "#28C840" : "#FF5F57";
  return (
    <motion.div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }}
      animate={online ? { opacity: [1, 0.4, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }} />
  );
}

function Pill({ children, color = "#D4B896" }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded"
      style={{ background: `${color}18`, color, border: `1px solid ${color}28` }}>
      {children}
    </span>
  );
}

function AdminGate({ children }: { children: React.ReactNode }) {
  const authed = isAuthed();
  if (authed) return <>{children}</>;
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
      <Lock size={28} style={{ color: "#4A4A56" }} />
      <p className="text-xs font-mono text-center" style={{ color: "#4A4A56" }}>
        Sign in to AxiraNews<br />to access this panel
      </p>
    </div>
  );
}

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <span className="text-[10px] font-bold font-mono tracking-widest uppercase" style={{ color: "#4A4A56" }}>{title}</span>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function HQButton({ onClick, loading, disabled, danger, children }: {
  onClick: () => void; loading?: boolean; disabled?: boolean; danger?: boolean; children: React.ReactNode;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium"
      style={{
        background: danger ? "rgba(255,95,87,0.08)" : "rgba(212,184,150,0.08)",
        border: `1px solid ${danger ? "rgba(255,95,87,0.2)" : "rgba(212,184,150,0.2)"}`,
        color: (disabled || loading) ? "#3A3A42" : danger ? "#FF5F57" : "#D4B896",
      }}
      whileTap={{ scale: 0.96 }}
    >
      {loading ? <Loader2 size={11} className="animate-spin" /> : null}
      {children}
    </motion.button>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab() {
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [stats, setStats]   = useState<BackendStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [h, s] = await Promise.all([checkHealth(), fetchStats()]);
    setHealth(h);
    setStats(s);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); const id = setInterval(refresh, 30_000); return () => clearInterval(id); }, [refresh]);

  const categoryEntries = stats ? Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]) : [];
  const maxCount = categoryEntries[0]?.[1] ?? 1;

  return (
    <div className="space-y-4">
      {/* Services */}
      <SectionCard title="Services" action={
        <button onClick={refresh} style={{ color: "#3A3A42" }}>
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
        </button>
      }>
        <div className="grid grid-cols-3 gap-3">
          {health ? [health.api, health.postgres, health.redis].map(svc => (
            <div key={svc.name} className="flex flex-col gap-1.5 p-3 rounded-lg"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex items-center gap-1.5">
                <StatusDot online={svc.status === "online"} />
                <span className="text-[10px] font-mono" style={{ color: "#6A6A76" }}>{svc.name}</span>
              </div>
              <span className="text-lg font-bold font-mono" style={{ color: svc.status === "online" ? "#28C840" : "#FF5F57" }}>
                {svc.status === "online" && svc.latencyMs > 0 ? `${svc.latencyMs}ms` : svc.status.toUpperCase()}
              </span>
            </div>
          )) : [1,2,3].map(i => (
            <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: "#111" }} />
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-2 gap-4">
        {/* Stats */}
        <SectionCard title="Corpus">
          <div className="space-y-3">
            {[
              { label: "Articles",   value: stats ? `${stats.totalArticles}` : "—" },
              { label: "Sources",    value: stats ? `${stats.sources}`        : "—" },
              { label: "Categories", value: stats ? `${Object.keys(stats.byCategory).length}` : "—" },
              { label: "SSE clients",value: "live" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[10px] font-mono" style={{ color: "#4A4A56" }}>{label}</span>
                <span className="text-[12px] font-bold font-mono" style={{ color: "#D4B896" }}>{value}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Category breakdown */}
        <SectionCard title="Category Distribution">
          <div className="space-y-2">
            {loading ? [1,2,3,4].map(i => <div key={i} className="h-4 rounded animate-pulse" style={{ background: "#111" }} />)
            : categoryEntries.slice(0, 6).map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-2">
                <span className="w-20 text-[9px] font-mono shrink-0 truncate" style={{ color: "#4A4A56" }}>{cat}</span>
                <div className="flex-1 h-1 rounded-full" style={{ background: "#151515" }}>
                  <motion.div className="h-full rounded-full" style={{ background: "#D4B896" }}
                    initial={{ width: 0 }} animate={{ width: `${(count / maxCount) * 100}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }} />
                </div>
                <span className="text-[9px] font-mono w-4 text-right shrink-0" style={{ color: "#3A3A42" }}>{count}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ── Ingestion Tab ─────────────────────────────────────────────────────────────
function IngestionTab() {
  const [status, setStatus]   = useState<IngestStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const refresh = useCallback(async () => {
    const t = getToken();
    if (!t) return;
    setLoading(true);
    setStatus(await fetchIngestStatus(t));
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleRun = async () => {
    const t = getToken();
    if (!t) return;
    setRunning(true);
    const ok = await runIngestionCycle(t);
    setRunning(false);
    if (ok) {
      notify("AxiraNews HQ", "Ingestion cycle started", "success", "axira");
      setTimeout(refresh, 3000);
    } else {
      notify("AxiraNews HQ", "Failed — check admin scope", "error", "axira");
    }
  };

  return (
    <AdminGate>
      <div className="space-y-4">
        <SectionCard title="Ingestion Control" action={
          <HQButton onClick={handleRun} loading={running}>
            <Play size={10} /> Run Cycle
          </HQButton>
        }>
          {loading ? (
            <div className="h-20 rounded animate-pulse" style={{ background: "#111" }} />
          ) : status ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono" style={{ color: "#4A4A56" }}>SSE connections</span>
                <span className="text-sm font-bold font-mono" style={{ color: "#5AC8FA" }}>{status.sseConnections}</span>
              </div>
              <div>
                <p className="text-[10px] font-mono mb-2" style={{ color: "#4A4A56" }}>Last cycle</p>
                {typeof status.lastCycle === "string" ? (
                  <p className="text-xs font-mono" style={{ color: "#3A3A42" }}>{status.lastCycle}</p>
                ) : (
                  <div className="space-y-1.5">
                    {Object.entries(status.lastCycle).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between px-3 py-1.5 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.02)" }}>
                        <span className="text-[10px] font-mono" style={{ color: "#4A4A56" }}>{k}</span>
                        <span className="text-[11px] font-mono" style={{ color: "#C8C6C0" }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs font-mono" style={{ color: "#3A3A42" }}>No data — sign in with admin scope</p>
          )}
        </SectionCard>
      </div>
    </AdminGate>
  );
}

// ── Articles Tab ──────────────────────────────────────────────────────────────
function ArticlesTab() {
  const [articles, setArticles]     = useState<AxiraArticle[]>([]);
  const [loading, setLoading]       = useState(true);
  const [query, setQuery]           = useState("");
  const [searching, setSearching]   = useState(false);
  const [expanded, setExpanded]     = useState<string | null>(null);

  useEffect(() => {
    fetchNews({ limit: 50 }).then(a => { setArticles(a); setLoading(false); });
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) { setLoading(true); fetchNews({ limit: 50 }).then(a => { setArticles(a); setLoading(false); }); return; }
    setSearching(true);
    const r = await searchNews(query.trim(), 30);
    setArticles(r);
    setSearching(false);
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Search bar */}
      <div className="flex gap-2 shrink-0">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <Search size={11} style={{ color: "#4A4A56" }} />
          <input className="flex-1 bg-transparent outline-none text-xs" style={{ color: "#C8C6C0", caretColor: "#D4B896" }}
            placeholder="Search articles…" value={query}
            onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} />
          {query && <button onClick={() => { setQuery(""); fetchNews({ limit: 50 }).then(a => setArticles(a)); }} style={{ color: "#3A3A42", fontSize: 10 }}>✕</button>}
        </div>
        <HQButton onClick={handleSearch} loading={searching}>
          {searching ? "" : "Search"}
        </HQButton>
      </div>

      {/* Count */}
      <div className="shrink-0">
        <span className="text-[10px] font-mono" style={{ color: "#3A3A42" }}>{articles.length} articles</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-px">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg animate-pulse mb-1" style={{ background: "#111" }} />
          ))
        ) : articles.map(a => (
          <div key={a.id}>
            <button className="w-full text-left px-3 py-2.5 rounded-lg transition-colors"
              style={{ background: expanded === a.id ? "rgba(212,184,150,0.05)" : "transparent" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
              onMouseLeave={e => (e.currentTarget.style.background = expanded === a.id ? "rgba(212,184,150,0.05)" : "transparent")}
              onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
              <div className="flex items-center gap-2">
                {a.urgent && <Pill color="#FF5F57">URGENT</Pill>}
                <Pill>{a.category}</Pill>
                <span className="flex-1 text-[11px] truncate" style={{ color: "#C8C6C0" }}>{a.title}</span>
                <span className="text-[9px] font-mono shrink-0" style={{ color: "#3A3A42" }}>{relativeTime(a.publishedAt)}</span>
                <ChevronRight size={10} style={{ color: "#3A3A42", transform: expanded === a.id ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
              </div>
            </button>
            <AnimatePresence>
              {expanded === a.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden px-3 pb-2">
                  <p className="text-[10px] leading-relaxed" style={{ color: "#5A5A5A" }}>
                    {a.summary ?? a.content ?? "No summary available."}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[9px] font-mono" style={{ color: "#3A3A42" }}>{a.source}</span>
                    {a.country && <span className="text-[9px] font-mono" style={{ color: "#3A3A42" }}>{a.country}</span>}
                    {a.url && <a href={a.url} target="_blank" rel="noreferrer" className="text-[9px] font-mono" style={{ color: "#5AC8FA" }}>Open ↗</a>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Security Tab ──────────────────────────────────────────────────────────────
function SecurityTab() {
  const [secStatus, setSecStatus]   = useState<Record<string, unknown> | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [scanStatus, setScanStatus] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading]       = useState(true);
  const [scanning, setScanning]     = useState(false);
  const [shieldPaused, setShieldPaused] = useState(false);

  const refresh = useCallback(async () => {
    const t = getToken();
    if (!t) return;
    setLoading(true);
    const [st, det, sc] = await Promise.all([
      fetchSecurityStatus(t),
      fetchDetections(t, 20),
      fetchScanStatus(t),
    ]);
    setSecStatus(st);
    setDetections(det);
    setScanStatus(sc);
    if (st && typeof st.shield_paused === "boolean") setShieldPaused(st.shield_paused as boolean);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleToggleShield = async () => {
    const t = getToken();
    if (!t) return;
    const ok = shieldPaused ? await resumeShield(t) : await pauseShield(t);
    if (ok) { setShieldPaused(p => !p); notify("AxiraNews HQ", `Shield ${shieldPaused ? "resumed" : "paused"}`, "info", "axira"); }
  };

  const handleScan = async () => {
    const t = getToken();
    if (!t) return;
    setScanning(true);
    await startScan(t);
    notify("AxiraNews HQ", "Scan initiated", "info", "axira");
    setTimeout(() => { setScanning(false); refresh(); }, 3000);
  };

  const handleAck = async (id: string) => {
    const t = getToken();
    if (!t) return;
    const ok = await acknowledgeDetection(id, t);
    if (ok) setDetections(d => d.filter(x => x.id !== id));
  };

  return (
    <AdminGate>
      <div className="space-y-4">
        {/* Shield controls */}
        <SectionCard title="Shield" action={
          <div className="flex gap-2">
            <HQButton onClick={handleToggleShield} danger={!shieldPaused}>
              {shieldPaused ? <><Play size={10} /> Resume</> : <><Pause size={10} /> Pause</>}
            </HQButton>
            <HQButton onClick={handleScan} loading={scanning}>
              <Radio size={10} /> {scanning ? "Scanning…" : "Run Scan"}
            </HQButton>
          </div>
        }>
          {loading ? <div className="h-10 rounded animate-pulse" style={{ background: "#111" }} /> : (
            <div className="flex items-center gap-3">
              <StatusDot online={!shieldPaused} />
              <span className="text-sm font-mono" style={{ color: shieldPaused ? "#FEBC2E" : "#28C840" }}>
                {shieldPaused ? "PAUSED" : "ACTIVE"}
              </span>
              {scanStatus && (
                <span className="text-[10px] font-mono ml-auto" style={{ color: "#4A4A56" }}>
                  scan: {String(scanStatus.status ?? "idle")}
                </span>
              )}
            </div>
          )}
        </SectionCard>

        {/* Detections */}
        <SectionCard title={`Detections (${detections.length})`} action={
          <button onClick={refresh} style={{ color: "#3A3A42" }}><RefreshCw size={11} /></button>
        }>
          {loading ? (
            <div className="h-20 rounded animate-pulse" style={{ background: "#111" }} />
          ) : detections.length === 0 ? (
            <div className="flex items-center gap-2 py-2">
              <CheckCircle size={14} style={{ color: "#28C840" }} />
              <span className="text-xs font-mono" style={{ color: "#28C840" }}>No active detections</span>
            </div>
          ) : (
            <div className="space-y-2">
              {detections.map(d => (
                <div key={d.id} className="flex items-start gap-3 px-3 py-2 rounded-lg"
                  style={{ background: "rgba(255,95,87,0.05)", border: "1px solid rgba(255,95,87,0.12)" }}>
                  <AlertTriangle size={12} style={{ color: "#FF5F57", marginTop: 1 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate" style={{ color: "#C8C6C0" }}>
                      {String(d.type ?? d.vulnerabilityName ?? d.id)}
                    </p>
                    {d.path && <p className="text-[9px] font-mono truncate" style={{ color: "#4A4A56" }}>{d.path}</p>}
                    {d.detected_at && <p className="text-[9px] font-mono" style={{ color: "#3A3A42" }}>{relativeTime(d.detected_at)}</p>}
                  </div>
                  {d.severity && <Pill color={d.severity === "high" || d.severity === "critical" ? "#FF5F57" : "#FEBC2E"}>{d.severity}</Pill>}
                  <button onClick={() => handleAck(d.id)} className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                    style={{ color: "#28C840" }} title="Acknowledge">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </AdminGate>
  );
}

// ── OSINT Tab ─────────────────────────────────────────────────────────────────
function OsintTab() {
  const [kevEntries, setKevEntries] = useState<CisaKevEntry[]>([]);
  const [kevLoading, setKevLoading] = useState(true);
  const [lookupType, setLookupType] = useState<"ip" | "domain" | "email" | "cve">("ip");
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResult, setLookupResult] = useState<Record<string, unknown> | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [kevExpanded, setKevExpanded] = useState<string | null>(null);

  useEffect(() => {
    const t = getToken();
    if (!t) { setKevLoading(false); return; }
    fetchCisaKev(t).then(e => { setKevEntries(e.slice(0, 30)); setKevLoading(false); });
  }, []);

  const handleLookup = async () => {
    const t = getToken();
    if (!t || !lookupQuery.trim()) return;
    setLookupLoading(true);
    setLookupResult(null);
    const result = await osintLookup(lookupType, lookupQuery.trim(), t);
    setLookupResult(result);
    setLookupLoading(false);
  };

  return (
    <AdminGate>
      <div className="flex flex-col gap-4 h-full">
        {/* Lookup tool */}
        <SectionCard title="Intelligence Lookup">
          <div className="space-y-3">
            <div className="flex gap-1.5">
              {(["ip","domain","email","cve"] as const).map(t => (
                <button key={t} onClick={() => setLookupType(t)}
                  className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-widest"
                  style={{
                    background: lookupType === t ? "rgba(212,184,150,0.12)" : "transparent",
                    border: `1px solid ${lookupType === t ? "rgba(212,184,150,0.3)" : "rgba(255,255,255,0.06)"}`,
                    color: lookupType === t ? "#D4B896" : "#4A4A56",
                  }}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#C8C6C0", caretColor: "#D4B896" }}
                placeholder={lookupType === "ip" ? "8.8.8.8" : lookupType === "domain" ? "example.com" : lookupType === "email" ? "user@domain.com" : "CVE-2024-1234"}
                value={lookupQuery} onChange={e => setLookupQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLookup()} />
              <HQButton onClick={handleLookup} loading={lookupLoading}>
                <Eye size={11} /> Lookup
              </HQButton>
            </div>
            {lookupResult && (
              <div className="rounded-lg overflow-auto max-h-40 p-3 font-mono text-[10px]"
                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", color: "#8A9A7A" }}>
                <pre className="whitespace-pre-wrap">{JSON.stringify(lookupResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </SectionCard>

        {/* CISA KEV feed */}
        <SectionCard title={`CISA KEV — Known Exploited Vulnerabilities (${kevEntries.length})`}>
          <div className="overflow-y-auto max-h-64 space-y-1.5">
            {kevLoading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 rounded animate-pulse" style={{ background: "#111" }} />)
            ) : kevEntries.length === 0 ? (
              <p className="text-xs font-mono" style={{ color: "#3A3A42" }}>No data — sign in with auth scope</p>
            ) : kevEntries.map((e, i) => (
              <div key={i}>
                <button className="w-full text-left px-3 py-2 rounded-lg"
                  style={{ background: "rgba(255,95,87,0.04)", border: "1px solid rgba(255,95,87,0.1)" }}
                  onClick={() => setKevExpanded(kevExpanded === e.cveID ? null : (e.cveID ?? null))}>
                  <div className="flex items-center gap-2">
                    <Pill color="#FF5F57">{e.cveID ?? "CVE"}</Pill>
                    <span className="flex-1 text-[11px] truncate" style={{ color: "#C8C6C0" }}>
                      {e.vulnerabilityName ?? e.product ?? "—"}
                    </span>
                    {e.dateAdded && <span className="text-[9px] font-mono" style={{ color: "#3A3A42" }}>{e.dateAdded}</span>}
                  </div>
                </button>
                <AnimatePresence>
                  {kevExpanded === e.cveID && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden px-3 pb-2">
                      <p className="text-[10px] leading-relaxed" style={{ color: "#5A5A5A" }}>{e.shortDescription ?? "No description."}</p>
                      {e.vendorProject && <p className="text-[9px] font-mono mt-1" style={{ color: "#3A3A42" }}>Vendor: {e.vendorProject}</p>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AdminGate>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function AxiraHQApp() {
  const [tab, setTab] = useState<Tab>("overview");
  const { token } = useAuthStore();
  const authed = isAuthed();

  return (
    <div className="h-full flex flex-col" style={{ background: "#070710" }}>
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid rgba(212,184,150,0.08)", background: "rgba(212,184,150,0.02)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Database size={14} style={{ color: "#D4B896" }} />
            <span className="font-black text-sm tracking-widest" style={{ color: "#D4B896", fontFamily: "Georgia, serif" }}>
              AXIRA<span style={{ color: "#424242" }}>NEWS</span>
            </span>
            <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded ml-1 tracking-widest"
              style={{ background: "rgba(212,184,150,0.1)", border: "1px solid rgba(212,184,150,0.2)", color: "#D4B896" }}>
              HQ
            </span>
          </div>
          <span className="text-[9px] font-mono" style={{ color: "#2A2A32" }}>Strontium OS Command Centre</span>
        </div>
        <div className="flex items-center gap-2">
          {authed
            ? <><div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#28C840" }} />
                <span className="text-[10px] font-mono" style={{ color: "#28C840" }}>authenticated</span></>
            : <><Lock size={10} style={{ color: "#4A4A56" }} />
                <span className="text-[10px] font-mono" style={{ color: "#4A4A56" }}>sign in for admin ops</span></>
          }
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex items-center gap-1 px-5 py-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {TABS.map(t => (
          <motion.button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium"
            style={{
              background: tab === t.id ? "rgba(212,184,150,0.1)" : "transparent",
              border: `1px solid ${tab === t.id ? "rgba(212,184,150,0.2)" : "transparent"}`,
              color: tab === t.id ? "#D4B896" : "#4A4A56",
            }}
            whileTap={{ scale: 0.96 }}>
            <span style={{ color: tab === t.id ? "#D4B896" : "#3A3A42" }}>{t.icon}</span>
            {t.label}
          </motion.button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-5">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }} className="h-full">
            {tab === "overview"  && <OverviewTab />}
            {tab === "ingestion" && <IngestionTab />}
            {tab === "articles"  && <ArticlesTab />}
            {tab === "security"  && <SecurityTab />}
            {tab === "osint"     && <OsintTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
