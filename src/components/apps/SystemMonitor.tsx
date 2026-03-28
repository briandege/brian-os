"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Cpu, HardDrive, Globe, Wifi, RefreshCw, ChevronDown } from "lucide-react";
import { checkHealth, type BackendHealth, AXIRA_BASE } from "@/lib/axiraClient";

function useAnimatedValue(target: number, interval = 3000) {
  const [value, setValue] = useState(target);
  const refresh = useCallback(() => {
    setValue(target + (Math.random() - 0.5) * 18);
  }, [target]);
  useEffect(() => {
    const id = setInterval(refresh, interval);
    return () => clearInterval(id);
  }, [refresh, interval]);
  return [Math.max(0, Math.min(100, value)), refresh] as const;
}

function Gauge({
  label, value, icon, onClick, active,
}: {
  label: string; value: number; icon: React.ReactNode; onClick: () => void; active: boolean;
}) {
  const color = value > 80 ? "#FF5F57" : value > 60 ? "#FEBC2E" : "#D4B896";
  return (
    <motion.button
      onClick={onClick}
      className="p-4 rounded-xl space-y-2 w-full text-left"
      style={{
        background: active ? "#111111" : "#0A0A0A",
        border: `1px solid ${active ? "#2A2A2A" : "#1E1E1E"}`,
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs" style={{ color: "#6B6B6B" }}>
          {icon}
          {label}
        </div>
        <motion.span
          key={value.toFixed(0)}
          initial={{ opacity: 0.5, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-bold font-mono"
          style={{ color }}
        >
          {value.toFixed(1)}%
        </motion.span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1E1E1E" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </motion.button>
  );
}

const INITIAL_VISITORS = [
  { country: "US", flag: "🇺🇸", count: 142 },
  { country: "UK", flag: "🇬🇧", count: 87 },
  { country: "DE", flag: "🇩🇪", count: 63 },
  { country: "JP", flag: "🇯🇵", count: 41 },
  { country: "CA", flag: "🇨🇦", count: 38 },
];

type SvcStatus = "online" | "offline" | "degraded" | "checking";
type Svc = { name: string; status: SvcStatus; latency: number };

const INITIAL_SERVICES: Svc[] = [
  { name: "AxiraNews API", status: "checking", latency: 0 },
  { name: "PostgreSQL",    status: "checking", latency: 0 },
  { name: "Redis",         status: "checking", latency: 0 },
  { name: "Cloudflare CDN",status: "online",   latency: 8 },
  { name: "strontium.os",  status: "online",   latency: 0 },
];

export default function SystemMonitor() {
  const [cpu, refreshCpu] = useAnimatedValue(34);
  const [ram, refreshRam] = useAnimatedValue(58);
  const [disk, refreshDisk] = useAnimatedValue(47);
  const [net, refreshNet] = useAnimatedValue(22);

  const [visitors, setVisitors] = useState(371);
  const [visitorData, setVisitorData] = useState(INITIAL_VISITORS);
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [pingingService, setPingingService] = useState<string | null>(null);
  const [activeGauge, setActiveGauge] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [health, setHealth] = useState<BackendHealth | null>(null);

  // Real health check on mount + every 30s
  const runHealthCheck = useCallback(async () => {
    const h = await checkHealth();
    setHealth(h);
    setServices(prev => prev.map(s => {
      if (s.name === "AxiraNews API") return { ...s, status: h.api.status, latency: h.api.latencyMs };
      if (s.name === "PostgreSQL")    return { ...s, status: h.postgres.status, latency: h.postgres.latencyMs };
      if (s.name === "Redis")         return { ...s, status: h.redis.status, latency: h.redis.latencyMs };
      return s;
    }));
  }, []);

  useEffect(() => {
    runHealthCheck();
    const id = setInterval(runHealthCheck, 30000);
    return () => clearInterval(id);
  }, [runHealthCheck]);

  useEffect(() => {
    const id = setInterval(() => setVisitors((v) => v + Math.floor(Math.random() * 3)), 4000);
    return () => clearInterval(id);
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    refreshCpu(); refreshRam(); refreshDisk(); refreshNet();
    setVisitorData((prev) =>
      prev.map((v) => ({ ...v, count: v.count + Math.floor(Math.random() * 8) }))
    );
    await runHealthCheck();
    setRefreshing(false);
  }, [refreshCpu, refreshRam, refreshDisk, refreshNet, runHealthCheck]);

  const pingService = useCallback(async (name: string) => {
    if (name === "AxiraNews API" || name === "PostgreSQL" || name === "Redis") {
      setPingingService(name);
      await runHealthCheck();
      setPingingService(null);
      return;
    }
    setPingingService(name);
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 600));
    setServices((prev) =>
      prev.map((s) =>
        s.name === name ? { ...s, latency: Math.floor(1 + Math.random() * 40) } : s
      )
    );
    setPingingService(null);
  }, [runHealthCheck]);

  const maxCount = Math.max(...visitorData.map((v) => v.count));

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4" style={{ background: "#0E0E0E" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: "#F5F5F0" }}>System Monitor</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: health === null ? "#FEBC2E" : health.reachable ? "#28C840" : "#FF5F57" }} />
            <span style={{ color: health?.reachable ? "#D4B896" : health === null ? "#FEBC2E" : "#FF5F57" }}>
              {health === null ? "Checking…" : health.reachable ? `${AXIRA_BASE}` : "Backend offline"}
            </span>
          </div>
          <motion.button
            onClick={refreshAll}
            className="p-1.5 rounded-md"
            style={{ background: "#111", border: "1px solid #2A2A2A" }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={refreshing ? { duration: 0.7, ease: "linear" } : {}}
          >
            <RefreshCw size={12} style={{ color: "#6B6B6B" }} />
          </motion.button>
        </div>
      </div>

      {/* Resource gauges — click to highlight */}
      <div className="grid grid-cols-2 gap-3">
        <Gauge label="CPU" value={cpu} icon={<Cpu size={13} />} onClick={() => setActiveGauge(activeGauge === "cpu" ? null : "cpu")} active={activeGauge === "cpu"} />
        <Gauge label="RAM" value={ram} icon={<Activity size={13} />} onClick={() => setActiveGauge(activeGauge === "ram" ? null : "ram")} active={activeGauge === "ram"} />
        <Gauge label="Disk" value={disk} icon={<HardDrive size={13} />} onClick={() => setActiveGauge(activeGauge === "disk" ? null : "disk")} active={activeGauge === "disk"} />
        <Gauge label="Network" value={net} icon={<Wifi size={13} />} onClick={() => setActiveGauge(activeGauge === "net" ? null : "net")} active={activeGauge === "net"} />
      </div>

      {/* Global visitors — click country for detail */}
      <div className="p-4 rounded-xl" style={{ background: "#0A0A0A", border: "1px solid #1E1E1E" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs" style={{ color: "#6B6B6B" }}>
            <Globe size={13} />
            Global Visitors (24h)
          </div>
          <motion.span
            key={visitors}
            initial={{ opacity: 0.6, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-bold font-mono"
            style={{ color: "#D4B896" }}
          >
            {visitors.toLocaleString()}
          </motion.span>
        </div>
        <div className="space-y-2">
          {visitorData.map((v) => (
            <div key={v.country}>
              <motion.button
                className="w-full flex items-center gap-2 text-xs"
                onClick={() => setExpandedCountry(expandedCountry === v.country ? null : v.country)}
                whileHover={{ x: 2 }}
              >
                <span>{v.flag}</span>
                <span style={{ color: "#6B6B6B", width: 24 }}>{v.country}</span>
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "#1E1E1E" }}>
                  <motion.div
                    className="h-full rounded-full"
                    animate={{ width: `${(v.count / maxCount) * 100}%` }}
                    style={{ background: "#3A3030" }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="font-mono w-8 text-right" style={{ color: "#4A4A4A" }}>{v.count}</span>
                <motion.div animate={{ rotate: expandedCountry === v.country ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={10} style={{ color: "#3A3A3A" }} />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {expandedCountry === v.country && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1.5 ml-8 text-[11px] space-y-0.5" style={{ color: "#4A4A4A" }}>
                      <div>Sessions: {Math.floor(v.count * 0.62)}</div>
                      <div>Avg. duration: {(1.5 + Math.random()).toFixed(1)}min</div>
                      <div>Bounce rate: {Math.floor(30 + Math.random() * 30)}%</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Services — click to ping */}
      <div className="p-4 rounded-xl" style={{ background: "#0A0A0A", border: "1px solid #1E1E1E" }}>
        <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#4A4A4A" }}>
          Services
        </div>
        <div className="space-y-2">
          {services.map((s) => {
            const isPinging = pingingService === s.name;
            return (
              <motion.button
                key={s.name}
                className="w-full flex items-center justify-between text-xs rounded-md px-2 py-1.5 transition-colors"
                style={{ background: isPinging ? "#111111" : "transparent" }}
                onClick={() => pingService(s.name)}
                whileHover={{ background: "#111111" }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: s.status === "offline" ? "#FF5F57" : s.status === "checking" ? "#FEBC2E" : "#28C840" }}
                    animate={isPinging || s.status === "checking" ? { scale: [1, 1.6, 1], opacity: [1, 0.5, 1] } : {}}
                    transition={isPinging || s.status === "checking" ? { duration: 0.5, repeat: Infinity } : {}}
                  />
                  <span style={{ color: "#9A9A8A" }}>{s.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isPinging ? (
                    <span className="font-mono" style={{ color: "#FEBC2E" }}>pinging…</span>
                  ) : (
                    s.latency > 0 && (
                      <motion.span
                        key={s.latency}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-mono"
                        style={{ color: s.latency > 20 ? "#FEBC2E" : "#4A4A4A" }}
                      >
                        {s.latency}ms
                      </motion.span>
                    )
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
        <p className="text-[10px] mt-2" style={{ color: "#2A2A2A" }}>Click a service to ping it</p>
      </div>
    </div>
  );
}
