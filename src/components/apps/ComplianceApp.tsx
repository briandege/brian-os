"use client";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Download, Trash2, Filter, AlertTriangle,
  Info, AlertCircle, Clock, ChevronDown,
} from "lucide-react";
import { useAuditStore, audit, type AuditCategory, type AuditSeverity, type AuditEvent } from "@/lib/auditStore";

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<AuditCategory, string> = {
  auth:        "Authentication",
  "data-access": "Data Access",
  network:     "Network",
  terminal:    "Terminal",
  clipboard:   "Clipboard",
  settings:    "Settings",
  app:         "App Lifecycle",
  security:    "Security",
  system:      "System",
  ai:          "AI Activity",
  compliance:  "Compliance",
};

const SEVERITY_CONFIG: Record<AuditSeverity, { color: string; bg: string; icon: React.ReactNode }> = {
  info:     { color: "#5AC8FA", bg: "rgba(90,200,250,0.08)",   icon: <Info size={11} /> },
  warning:  { color: "#FEBC2E", bg: "rgba(254,188,46,0.08)",   icon: <AlertTriangle size={11} /> },
  critical: { color: "#FF5F57", bg: "rgba(255,95,87,0.08)",    icon: <AlertCircle size={11} /> },
};

const CATEGORY_COLORS: Record<AuditCategory, string> = {
  auth:          "#C8A97E",
  "data-access": "#FFC940",
  network:       "#5AC8FA",
  terminal:      "#28C840",
  clipboard:     "#B48EAD",
  settings:      "#AAAAAA",
  app:           "#60D0FF",
  security:      "#FF5F57",
  system:        "#FF8C42",
  ai:            "#DDB87A",
  compliance:    "#C8A97E",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function groupByDate(events: AuditEvent[]): [string, AuditEvent[]][] {
  const map = new Map<string, AuditEvent[]>();
  for (const e of [...events].reverse()) {
    const key = formatDate(e.timestamp);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries());
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div
      className="flex flex-col gap-1 p-3 rounded-xl"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="text-[20px] font-bold font-mono" style={{ color }}>{value}</div>
      <div className="text-[10px] font-mono tracking-wider uppercase" style={{ color: "#4A4A5A" }}>{label}</div>
    </div>
  );
}

function EventRow({ event }: { event: AuditEvent }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEVERITY_CONFIG[event.severity];
  const catColor = CATEGORY_COLORS[event.category];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg overflow-hidden"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Severity indicator */}
        <div
          className="flex items-center justify-center w-5 h-5 rounded-md shrink-0"
          style={{ background: sev.bg, color: sev.color }}
        >
          {sev.icon}
        </div>

        {/* Category pill */}
        <div
          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0"
          style={{ background: `${catColor}14`, color: catColor }}
        >
          {CATEGORY_LABELS[event.category]}
        </div>

        {/* Action */}
        <div className="flex-1 text-[11px] font-mono truncate" style={{ color: "#C8C6C0" }}>
          {event.action}
        </div>

        {/* Time */}
        <div className="text-[10px] font-mono shrink-0" style={{ color: "#3A3A4A" }}>
          {formatTime(event.timestamp)}
        </div>

        <ChevronDown
          size={12}
          style={{ color: "#3A3A4A", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div
              className="px-3 pb-2.5 pt-0 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono border-t"
              style={{ borderColor: "rgba(255,255,255,0.05)", color: "#5A5A6A" }}
            >
              <div><span style={{ color: "#3A3A4A" }}>ID </span>{event.id}</div>
              <div><span style={{ color: "#3A3A4A" }}>Module </span><span style={{ color: "#7A7A8A" }}>{event.module}</span></div>
              <div><span style={{ color: "#3A3A4A" }}>Timestamp </span>{event.timestamp}</div>
              <div><span style={{ color: "#3A3A4A" }}>Data subject </span>{event.dataSubject ?? "—"}</div>
              {event.detail && (
                <div className="col-span-2">
                  <span style={{ color: "#3A3A4A" }}>Detail </span>
                  <span style={{ color: "#7A7A8A" }}>{event.detail}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main app ──────────────────────────────────────────────────────────────────

export default function ComplianceApp() {
  const { events, clear, export: exportLog } = useAuditStore();
  const [filterCategory, setFilterCategory] = useState<AuditCategory | "all">("all");

  // Art. 52 — log access to the supervisory authority itself
  useEffect(() => {
    audit({ category: "compliance", severity: "info", action: "Compliance Monitor opened (Art. 52)", module: "ComplianceApp" });
  }, []);
  const [filterSeverity, setFilterSeverity] = useState<AuditSeverity | "all">("all");
  const [confirmClear, setConfirmClear] = useState(false);
  const [activeTab, setActiveTab] = useState<"log" | "summary" | "articles">("log");

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (filterCategory !== "all" && e.category !== filterCategory) return false;
      if (filterSeverity !== "all" && e.severity !== filterSeverity) return false;
      return true;
    }).slice().reverse();
  }, [events, filterCategory, filterSeverity]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  // Stats
  const stats = useMemo(() => {
    const bySev = { info: 0, warning: 0, critical: 0 };
    const byCat: Partial<Record<AuditCategory, number>> = {};
    for (const e of events) {
      bySev[e.severity]++;
      byCat[e.category] = (byCat[e.category] ?? 0) + 1;
    }
    const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
    return { bySev, byCat, topCat };
  }, [events]);

  const handleExport = () => {
    const json = exportLog();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `strontium-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col" style={{ background: "#060607", color: "#C8C6C0" }}>

      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(200,169,126,0.1)", border: "1px solid rgba(200,169,126,0.2)" }}
        >
          <Shield size={16} style={{ color: "#C8A97E" }} />
        </div>
        <div>
          <div className="text-[13px] font-bold" style={{ color: "#F0EDE6" }}>Compliance Monitor</div>
          <div className="text-[10px] font-mono" style={{ color: "#3A3A4A" }}>
            GDPR Art. 51/52 · Independent Supervisory Authority · {events.length.toLocaleString()} events
          </div>
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono"
          style={{ background: "rgba(90,200,250,0.07)", border: "1px solid rgba(90,200,250,0.2)", color: "#5AC8FA" }}
        >
          <Download size={11} /> Export
        </button>

        {confirmClear ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono" style={{ color: "#FEBC2E" }}>Erase all? (Art. 17)</span>
            <button
              onClick={() => { clear(); setConfirmClear(false); }}
              className="px-2 py-1 rounded-lg text-[10px] font-mono"
              style={{ background: "rgba(255,95,87,0.1)", border: "1px solid rgba(255,95,87,0.3)", color: "#FF5F57" }}
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="px-2 py-1 rounded-lg text-[10px] font-mono"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#5A5A6A" }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono"
            style={{ background: "rgba(255,95,87,0.06)", border: "1px solid rgba(255,95,87,0.15)", color: "#FF5F57" }}
          >
            <Trash2 size={11} /> Clear
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div
        className="flex items-center gap-1 px-4 pt-2 pb-0 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {(["log", "summary", "articles"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-3 py-2 text-[11px] font-mono capitalize rounded-t-lg"
            style={{
              color: activeTab === tab ? "#C8A97E" : "#3A3A4A",
              borderBottom: activeTab === tab ? "2px solid #C8A97E" : "2px solid transparent",
            }}
          >
            {tab === "articles" ? "GDPR Articles" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden">

        {/* ─ Audit Log Tab ─ */}
        {activeTab === "log" && (
          <div className="h-full flex flex-col">
            {/* Filters */}
            <div className="flex items-center gap-2 px-4 py-2 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <Filter size={11} style={{ color: "#3A3A4A" }} />
              <span className="text-[10px] font-mono" style={{ color: "#3A3A4A" }}>Filter:</span>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as AuditCategory | "all")}
                className="bg-transparent text-[10px] font-mono outline-none cursor-pointer"
                style={{ color: "#7A7A8A" }}
              >
                <option value="all">All categories</option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>

              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as AuditSeverity | "all")}
                className="bg-transparent text-[10px] font-mono outline-none cursor-pointer"
                style={{ color: "#7A7A8A" }}
              >
                <option value="all">All severities</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>

              <div className="flex-1" />
              <span className="text-[10px] font-mono" style={{ color: "#2A2A3A" }}>
                {filtered.length} events
              </span>
            </div>

            {/* Event list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
                  <Shield size={32} style={{ color: "#3A3A4A" }} />
                  <div className="text-[12px] font-mono" style={{ color: "#3A3A4A" }}>No audit events recorded yet</div>
                </div>
              ) : (
                grouped.map(([date, evs]) => (
                  <div key={date}>
                    <div className="text-[9px] font-mono tracking-widest uppercase py-2 flex items-center gap-2" style={{ color: "#2A2A3A" }}>
                      <Clock size={9} />
                      {date}
                      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.04)" }} />
                    </div>
                    <div className="space-y-1">
                      {evs.map((ev) => <EventRow key={ev.id} event={ev} />)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ─ Summary Tab ─ */}
        {activeTab === "summary" && (
          <div className="h-full overflow-y-auto px-4 py-4 space-y-4">
            {/* Severity breakdown */}
            <div>
              <div className="text-[10px] font-mono tracking-widest uppercase mb-2" style={{ color: "#3A3A4A" }}>Severity Breakdown</div>
              <div className="grid grid-cols-3 gap-2">
                <StatCard label="Info" value={stats.bySev.info} color="#5AC8FA" />
                <StatCard label="Warning" value={stats.bySev.warning} color="#FEBC2E" />
                <StatCard label="Critical" value={stats.bySev.critical} color="#FF5F57" />
              </div>
            </div>

            {/* Category breakdown */}
            <div>
              <div className="text-[10px] font-mono tracking-widest uppercase mb-2" style={{ color: "#3A3A4A" }}>Activity by Category</div>
              <div className="space-y-1.5">
                {Object.entries(stats.byCat)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, count]) => {
                    const c = cat as AuditCategory;
                    const pct = events.length > 0 ? Math.round((count / events.length) * 100) : 0;
                    return (
                      <div key={cat} className="flex items-center gap-2">
                        <div className="text-[10px] font-mono w-28 shrink-0" style={{ color: CATEGORY_COLORS[c] }}>
                          {CATEGORY_LABELS[c]}
                        </div>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: CATEGORY_COLORS[c], opacity: 0.6 }}
                          />
                        </div>
                        <div className="text-[10px] font-mono w-8 text-right shrink-0" style={{ color: "#3A3A4A" }}>{count}</div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* GDPR compliance status */}
            <div>
              <div className="text-[10px] font-mono tracking-widest uppercase mb-2" style={{ color: "#3A3A4A" }}>GDPR Compliance Status</div>
              <div className="space-y-2">
                {[
                  { art: "Art. 5",  title: "Lawfulness & transparency",         status: "compliant",   note: "Audit log provides full transparency" },
                  { art: "Art. 17", title: "Right to erasure",                   status: "compliant",   note: "Clear function available in Compliance app" },
                  { art: "Art. 25", title: "Data protection by design",          status: "compliant",   note: "PBKDF2-SHA256, end-to-end PQC architecture" },
                  { art: "Art. 32", title: "Security of processing",             status: "compliant",   note: "AES-256-GCM · ML-KEM-768 · FIPS 203/205" },
                  { art: "Art. 35", title: "Data protection impact assessment",  status: "pending",     note: "DPIA report export available via Export" },
                  { art: "Art. 51", title: "Supervisory authority",              status: "compliant",   note: "Compliance Monitor acts as internal DPA" },
                  { art: "Art. 52", title: "Supervisory independence",           status: "compliant",   note: "Audit store is write-isolated from other stores" },
                ].map(({ art, title, status, note }) => (
                  <div
                    key={art}
                    className="flex items-start gap-3 p-2.5 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                      style={{ background: status === "compliant" ? "#28C840" : "#FEBC2E" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono font-bold" style={{ color: "#C8A97E" }}>{art}</span>
                        <span className="text-[11px] font-medium" style={{ color: "#C8C6C0" }}>{title}</span>
                      </div>
                      <div className="text-[10px] font-mono" style={{ color: "#4A4A5A" }}>{note}</div>
                    </div>
                    <div
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        background: status === "compliant" ? "rgba(40,200,64,0.08)" : "rgba(254,188,46,0.08)",
                        color: status === "compliant" ? "#28C840" : "#FEBC2E",
                      }}
                    >
                      {status.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─ GDPR Articles Tab ─ */}
        {activeTab === "articles" && (
          <div className="h-full overflow-y-auto px-4 py-4 space-y-3">
            {[
              {
                number: "Article 51",
                title: "Supervisory authority",
                text: "Each Member State shall provide for one or more independent public authorities to be responsible for monitoring the application of this Regulation, in order to protect the fundamental rights and freedoms of natural persons in relation to processing and to facilitate the free flow of personal data.",
                impl: "strontium.os implements this via the Compliance Monitor — an independent app that monitors all data processing activities across every OS module, logs them to an isolated audit store, and provides reporting.",
              },
              {
                number: "Article 52",
                title: "Independence",
                text: "Each supervisory authority shall act with complete independence in performing its tasks and exercising its powers. The member or members of each supervisory authority shall, in the performance of their tasks and exercise of their powers, remain free from external influence.",
                impl: "The auditStore is architecturally isolated: only the audit() helper can append events. Other stores cannot mutate or read the audit log directly. The store uses its own persistence key (strontium-audit-log) separate from all other stores.",
              },
              {
                number: "Article 5",
                title: "Principles relating to processing",
                text: "Personal data shall be processed lawfully, fairly and in a transparent manner. Collected for specified, explicit and legitimate purposes. Adequate, relevant and limited to what is necessary. Accurate and kept up to date. Not kept longer than necessary. Processed with appropriate security.",
                impl: "All personal data processing in strontium.os is logged here. The OS collects no telemetry, no analytics, and no external data without explicit user action.",
              },
              {
                number: "Article 17",
                title: "Right to erasure ('right to be forgotten')",
                text: "The data subject shall have the right to obtain from the controller the erasure of personal data without undue delay.",
                impl: "The Clear button erases the audit log. The erasure itself is recorded as the first entry in the new log, maintaining the chain of custody.",
              },
              {
                number: "Article 25",
                title: "Data protection by design and by default",
                text: "The controller shall implement appropriate technical and organisational measures designed to implement the data-protection principles effectively.",
                impl: "Passwords use PBKDF2-SHA256 (310,000 iterations, NIST SP 800-132). Communications planned to use hybrid X25519 + ML-KEM-768 (NIST FIPS 203). No plaintext secrets are ever stored.",
              },
              {
                number: "Article 32",
                title: "Security of processing",
                text: "The controller and processor shall implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk, including encryption of personal data.",
                impl: "Encryption at rest: PBKDF2-SHA256. Classification system: Confidential (AES-256-GCM + X25519+ML-KEM-768), Secret (ML-KEM-768, FIPS 203), Top Secret (ML-KEM-1024 + SLH-DSA, FIPS 203/205).",
              },
            ].map((article) => (
              <div
                key={article.number}
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(200,169,126,0.1)" }}
              >
                <div
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{ background: "rgba(200,169,126,0.05)", borderBottom: "1px solid rgba(200,169,126,0.08)" }}
                >
                  <Shield size={13} style={{ color: "#C8A97E" }} />
                  <div>
                    <span className="text-[11px] font-mono font-bold" style={{ color: "#C8A97E" }}>{article.number} — </span>
                    <span className="text-[11px] font-semibold" style={{ color: "#F0EDE6" }}>{article.title}</span>
                  </div>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <p className="text-[11px] leading-relaxed" style={{ color: "#6A6A7E" }}>
                    {article.text}
                  </p>
                  <div
                    className="text-[10px] font-mono leading-relaxed p-2.5 rounded-lg"
                    style={{ background: "rgba(200,169,126,0.04)", color: "#8A8A6A", borderLeft: "2px solid rgba(200,169,126,0.2)" }}
                  >
                    <span style={{ color: "#C8A97E" }}>Implementation: </span>{article.impl}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
