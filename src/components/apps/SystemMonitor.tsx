"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Cpu, HardDrive, Globe, Wifi } from "lucide-react";

function useAnimatedValue(target: number, interval = 3000) {
  const [value, setValue] = useState(target);
  useEffect(() => {
    const id = setInterval(() => {
      setValue(target + (Math.random() - 0.5) * 12);
    }, interval);
    return () => clearInterval(id);
  }, [target, interval]);
  return Math.max(0, Math.min(100, value));
}

function Gauge({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const color = value > 80 ? "#FF5F57" : value > 60 ? "#FEBC2E" : "#D4B896";
  return (
    <div className="p-4 rounded-xl space-y-2" style={{ background: "#0A0A0A", border: "1px solid #1E1E1E" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs" style={{ color: "#6B6B6B" }}>
          {icon}
          {label}
        </div>
        <span className="text-sm font-bold font-mono" style={{ color }}>
          {value.toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1E1E1E" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

const VISITORS = [
  { country: "US", flag: "🇺🇸", count: 142 },
  { country: "UK", flag: "🇬🇧", count: 87 },
  { country: "DE", flag: "🇩🇪", count: 63 },
  { country: "JP", flag: "🇯🇵", count: 41 },
  { country: "CA", flag: "🇨🇦", count: 38 },
];

const SERVICES = [
  { name: "AxiraNews API", status: "online", latency: 12 },
  { name: "PostgreSQL", status: "online", latency: 3 },
  { name: "Redis", status: "online", latency: 1 },
  { name: "Cloudflare CDN", status: "online", latency: 8 },
  { name: "Railway Deploy", status: "online", latency: 0 },
];

export default function SystemMonitor() {
  const cpu = useAnimatedValue(34);
  const ram = useAnimatedValue(58);
  const disk = useAnimatedValue(47);
  const net = useAnimatedValue(22);

  const [visitors, setVisitors] = useState(371);
  useEffect(() => {
    const id = setInterval(
      () => setVisitors((v) => v + Math.floor(Math.random() * 3)),
      4000
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4" style={{ background: "#0E0E0E" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: "#F5F5F0" }}>System Monitor</h2>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "#D4B896" }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#28C840" }} />
          All systems operational
        </div>
      </div>

      {/* Resource gauges */}
      <div className="grid grid-cols-2 gap-3">
        <Gauge label="CPU" value={cpu} icon={<Cpu size={13} />} />
        <Gauge label="RAM" value={ram} icon={<Activity size={13} />} />
        <Gauge label="Disk" value={disk} icon={<HardDrive size={13} />} />
        <Gauge label="Network" value={net} icon={<Wifi size={13} />} />
      </div>

      {/* Global visitors */}
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
          {VISITORS.map((v) => (
            <div key={v.country} className="flex items-center gap-2 text-xs">
              <span>{v.flag}</span>
              <span style={{ color: "#6B6B6B" }}>{v.country}</span>
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "#1E1E1E" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(v.count / 142) * 100}%`, background: "#3A3030" }}
                />
              </div>
              <span className="font-mono w-8 text-right" style={{ color: "#4A4A4A" }}>{v.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      <div className="p-4 rounded-xl" style={{ background: "#0A0A0A", border: "1px solid #1E1E1E" }}>
        <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#4A4A4A" }}>
          Services
        </div>
        <div className="space-y-2">
          {SERVICES.map((s) => (
            <div key={s.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#28C840" }} />
                <span style={{ color: "#9A9A8A" }}>{s.name}</span>
              </div>
              {s.latency > 0 && (
                <span className="font-mono" style={{ color: "#4A4A4A" }}>{s.latency}ms</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
