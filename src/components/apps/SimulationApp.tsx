"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "particles" | "network" | "dataflow" | "montecarlo" | "threat";

const MODES: { id: Mode; label: string; desc: string; accent: string }[] = [
  { id: "particles",  label: "Particle Field",  desc: "n-body gravitational",  accent: "#C8A97E" },
  { id: "network",    label: "Network Graph",   desc: "live topology",         accent: "#5AC8FA" },
  { id: "dataflow",   label: "Data Flow",       desc: "ingestion pipeline",    accent: "#28C840" },
  { id: "montecarlo", label: "Monte Carlo",     desc: "GBM portfolio paths",   accent: "#A78BFA" },
  { id: "threat",     label: "Threat Map",      desc: "attack surface grid",   accent: "#FF5F57" },
];

// Shared telemetry bus — canvas components write here each frame
export interface TelemetryFrame {
  tick:      number;
  latency:   number;
  packets:   number;
  nodes:     number;
  threatLvl: number;
  winRate:   number;
  entropy:   number;
}

const EMPTY_TEL: TelemetryFrame = {
  tick: 0, latency: 0, packets: 0, nodes: 0,
  threatLvl: 0, winRate: 0, entropy: 0,
};

// ── Telemetry sidebar ───────────────────────────────────────────────────────
function TelemetrySidebar({
  tel, mode, fps, running,
}: { tel: TelemetryFrame; mode: Mode; fps: number; running: boolean }) {
  const accent = MODES.find((m) => m.id === mode)?.accent ?? "#C8A97E";

  const cards: { label: string; value: string; sub?: string; color?: string }[] = [
    { label: "SIM TICK",    value: tel.tick.toLocaleString(),          sub: "frames" },
    { label: "FRAME RATE",  value: `${fps}`,                           sub: "fps",    color: fps < 30 ? "#FF5F57" : fps < 50 ? "#FEBC2E" : "#28C840" },
    { label: "LATENCY",     value: `${tel.latency.toFixed(1)}`,        sub: "ms" },
    { label: "PACKETS",     value: tel.packets.toLocaleString(),       sub: "total" },
    { label: "NODES",       value: `${tel.nodes}`,                     sub: "active" },
    { label: "THREAT LVL",  value: `${(tel.threatLvl * 100).toFixed(0)}%`,  sub: "risk",  color: tel.threatLvl > 0.65 ? "#FF5F57" : tel.threatLvl > 0.4 ? "#FEBC2E" : "#28C840" },
    { label: "WIN RATE",    value: `${tel.winRate.toFixed(0)}%`,       sub: "profitable", color: tel.winRate > 55 ? "#28C840" : "#FF5F57" },
    { label: "ENTROPY",     value: tel.entropy.toFixed(3),             sub: "bits" },
  ];

  return (
    <div
      className="w-[148px] shrink-0 flex flex-col h-full overflow-hidden"
      style={{ borderLeft: "1px solid #111115", background: "rgba(6,6,7,0.95)" }}
    >
      {/* Header */}
      <div className="px-3 py-2.5" style={{ borderBottom: "1px solid #111115" }}>
        <div className="flex items-center gap-1.5 mb-1">
          {/* LIVE blink dot */}
          <motion.div
            animate={running ? { opacity: [1, 0.2, 1] } : { opacity: 0.2 }}
            transition={running ? { duration: 1.2, repeat: Infinity } : {}}
            className="w-[7px] h-[7px] rounded-full"
            style={{ background: running ? "#FF5F57" : "#3A3A42" }}
          />
          <span
            className="text-[10px] font-bold tracking-[0.15em]"
            style={{ color: running ? "#FF5F57" : "#3A3A42", fontFamily: "monospace" }}
          >
            {running ? "LIVE" : "PAUSED"}
          </span>
        </div>
        <div className="text-[9px]" style={{ color: "#2E2E33", fontFamily: "monospace" }}>
          SYSTEM TELEMETRY
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1.5">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-md px-2.5 py-2"
            style={{ background: "#0A0A0C", border: "1px solid #111115" }}
          >
            <div className="text-[8px] tracking-[0.12em] mb-0.5" style={{ color: "#2E2E33", fontFamily: "monospace" }}>
              {c.label}
            </div>
            <div
              className="text-[15px] font-bold leading-none"
              style={{ color: c.color ?? accent, fontFamily: "monospace" }}
            >
              {c.value}
            </div>
            {c.sub && (
              <div className="text-[8px] mt-0.5" style={{ color: "#2E2E33", fontFamily: "monospace" }}>
                {c.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mini sparklines placeholder */}
      <div className="px-2 py-2" style={{ borderTop: "1px solid #111115" }}>
        <SparkLine value={fps} max={60} color={accent} label="fps" />
        <SparkLine value={tel.latency} max={50} color="#FF5F57" label="ms" />
      </div>
    </div>
  );
}

// ── Sparkline ───────────────────────────────────────────────────────────────
function SparkLine({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const history = useRef<number[]>(Array(30).fill(0));
  useEffect(() => {
    history.current = [...history.current.slice(1), Math.min(value / max, 1)];
  });

  const pts = history.current
    .map((v, i) => `${(i / 29) * 100},${(1 - v) * 20}`)
    .join(" ");

  return (
    <div className="mb-1.5">
      <div className="flex justify-between mb-0.5">
        <span style={{ color: "#2E2E33", fontSize: 8, fontFamily: "monospace" }}>{label}</span>
        <span style={{ color, fontSize: 8, fontFamily: "monospace" }}>{value.toFixed(0)}</span>
      </div>
      <svg viewBox="0 0 100 20" className="w-full" style={{ height: 16 }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.2" opacity="0.7" />
      </svg>
    </div>
  );
}

// ── Main shell ───────────────────────────────────────────────────────────────
export default function SimulationApp() {
  const [mode, setMode]       = useState<Mode>("particles");
  const [running, setRunning] = useState(true);
  const [fps, setFps]         = useState(0);
  const [tel, setTel]         = useState<TelemetryFrame>(EMPTY_TEL);
  const [resetKey, setResetKey] = useState(0);

  const handleTel = useCallback((t: TelemetryFrame) => setTel(t), []);

  return (
    <div className="h-full flex flex-col" style={{ background: "#060607" }}>
      {/* Top control bar */}
      <div
        className="flex items-center gap-1.5 px-3 py-2 shrink-0 overflow-x-auto"
        style={{ borderBottom: "1px solid #111115", minHeight: 46 }}
      >
        {MODES.map((m) => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); setResetKey((k) => k + 1); }}
              className="shrink-0 flex flex-col px-2.5 py-1 rounded-lg text-left transition-all"
              style={{
                background: active ? `${m.accent}12` : "transparent",
                border: `1px solid ${active ? m.accent + "28" : "#111115"}`,
                color: active ? m.accent : "#2E2E33",
              }}
            >
              <span className="text-[10px] font-bold tracking-wide whitespace-nowrap" style={{ fontFamily: "monospace" }}>
                {m.label}
              </span>
              <span className="text-[8px] whitespace-nowrap" style={{ color: active ? m.accent + "99" : "#1A1A1E", fontFamily: "monospace" }}>
                {m.desc}
              </span>
            </button>
          );
        })}

        <div className="flex-1" />

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono" style={{ color: "#1E1E22" }}>
            {fps} fps
          </span>
          <button
            onClick={() => setResetKey((k) => k + 1)}
            className="text-[10px] px-2.5 py-1 rounded-lg font-mono"
            style={{ background: "rgba(30,30,34,0.6)", border: "1px solid #1A1A1E", color: "#3A3A42" }}
          >
            reset
          </button>
          <button
            onClick={() => setRunning((r) => !r)}
            className="text-[10px] px-3 py-1.5 rounded-lg font-mono font-bold"
            style={{
              background: running ? "rgba(255,95,87,0.07)" : "rgba(40,200,64,0.07)",
              border: `1px solid ${running ? "rgba(255,95,87,0.18)" : "rgba(40,200,64,0.18)"}`,
              color: running ? "#FF5F57" : "#28C840",
            }}
          >
            {running ? "⏸ pause" : "▶ play"}
          </button>
        </div>
      </div>

      {/* Body: canvas + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${mode}-${resetKey}`}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {mode === "particles"  && <ParticleField  key={resetKey} running={running} onFps={setFps} onTel={handleTel} />}
              {mode === "network"    && <NetworkGraph   key={resetKey} running={running} onFps={setFps} onTel={handleTel} />}
              {mode === "dataflow"   && <DataFlow       key={resetKey} running={running} onFps={setFps} onTel={handleTel} />}
              {mode === "montecarlo" && <MonteCarloViz  key={resetKey} running={running} onFps={setFps} onTel={handleTel} />}
              {mode === "threat"     && <ThreatMap      key={resetKey} running={running} onFps={setFps} onTel={handleTel} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Telemetry sidebar */}
        <TelemetrySidebar tel={tel} mode={mode} fps={fps} running={running} />
      </div>
    </div>
  );
}

// ── Shared canvas hook (delta-time aware) ──────────────────────────────────
function useCanvas(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, frame: number, dt: number) => void,
  running: boolean,
  onFps: (f: number) => void,
) {
  const ref        = useRef<HTMLCanvasElement>(null);
  const frameRef   = useRef(0);
  const rafRef     = useRef<number>(0);
  const lastTime   = useRef(performance.now());
  const lastFpsT   = useRef(performance.now());
  const fpsCount   = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime.current) / 16.67, 3); // delta in ~frames at 60fps
      lastTime.current = now;

      if (running) {
        draw(ctx, canvas.width, canvas.height, frameRef.current++, dt);
        fpsCount.current++;
        if (now - lastFpsT.current >= 500) {
          onFps(Math.round(fpsCount.current / ((now - lastFpsT.current) / 1000)));
          fpsCount.current = 0; lastFpsT.current = now;
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [draw, running, onFps]);

  return ref;
}

// ── 1. Particle Field ───────────────────────────────────────────────────────
function ParticleField({
  running, onFps, onTel,
}: { running: boolean; onFps: (f: number) => void; onTel: (t: TelemetryFrame) => void }) {
  type P = { x: number; y: number; vx: number; vy: number; r: number; hue: number };
  const N = 130;
  const particles = useRef<P[]>([]);
  const connCount  = useRef(0);
  const tick       = useRef(0);

  const init = useCallback((w: number, h: number) => {
    particles.current = Array.from({ length: N }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.9, vy: (Math.random() - 0.5) * 0.9,
      r: 1.5 + Math.random() * 2.5,
      hue: Math.random() < 0.65 ? 35 : 200,
    }));
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, frame: number, dt: number) => {
    if (!particles.current.length) init(w, h);
    const ps = particles.current;
    tick.current = frame;

    ctx.fillStyle = "rgba(6,6,7,0.16)";
    ctx.fillRect(0, 0, w, h);

    let conns = 0;
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const dx = ps[i].x - ps[j].x, dy = ps[i].y - ps[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 8100) { // 90²
          conns++;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(200,169,126,${(1 - Math.sqrt(d2) / 90) * 0.11})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(ps[i].x, ps[i].y);
          ctx.lineTo(ps[j].x, ps[j].y);
          ctx.stroke();
        }
      }
    }
    connCount.current = conns;

    for (const p of ps) {
      const cx = w / 2 - p.x, cy = h / 2 - p.y;
      const dist = Math.sqrt(cx * cx + cy * cy) + 1;
      p.vx += (cx / dist) * 0.003 * dt;
      p.vy += (cy / dist) * 0.003 * dt;
      p.vx *= 0.995; p.vy *= 0.995;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < 0 || p.x > w) { p.vx *= -1; p.x = Math.max(0, Math.min(w, p.x)); }
      if (p.y < 0 || p.y > h) { p.vy *= -1; p.y = Math.max(0, Math.min(h, p.y)); }

      const alpha = 0.6 + 0.4 * Math.sin(frame * 0.03 + p.r);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.hue === 35 ? `rgba(200,169,126,${alpha})` : `rgba(90,200,250,${alpha * 0.6})`;
      ctx.fill();
    }

    if (frame % 12 === 0) {
      onTel({
        tick: frame, latency: 8 + Math.random() * 4,
        packets: frame * 3 + connCount.current,
        nodes: N, threatLvl: 0.08,
        winRate: 0, entropy: conns / 500,
      });
    }
  }, [init, onTel]);

  const ref = useCanvas(draw, running, onFps);
  return <canvas ref={ref} className="w-full h-full" />;
}

// ── 2. Network Graph ────────────────────────────────────────────────────────
const NG_LABELS = ['API', 'Auth', 'DB', 'Redis', 'AI', 'CDN', 'iOS', 'Browser', 'OSINT', 'News'];
const NG_TYPES  = ['service','service','database','database','ai','cdn','client','client','security','service'];
const NG_TYPE_COLORS: Record<string, string> = {
  service: '#C8A97E', database: '#B48EAD', ai: '#5AC8FA',
  cdn: '#28C840', client: '#FEBC2E', security: '#FF5F57',
};

function NetworkGraph({
  running, onFps, onTel,
}: { running: boolean; onFps: (f: number) => void; onTel: (t: TelemetryFrame) => void }) {
  type Node = { x: number; y: number; vx: number; vy: number; label: string; type: string; pulse: number };
  const nodes = useRef<Node[]>([]);
  const edges = useRef<[number, number][]>([]);

  const init = useCallback((w: number, h: number) => {
    nodes.current = NG_LABELS.map((label, i) => ({
      x: w / 2 + Math.cos((i / NG_LABELS.length) * Math.PI * 2) * (Math.min(w, h) * 0.30),
      y: h / 2 + Math.sin((i / NG_LABELS.length) * Math.PI * 2) * (Math.min(w, h) * 0.30),
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      label, type: NG_TYPES[i], pulse: Math.random() * Math.PI * 2,
    }));
    edges.current = [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[0,9],[1,2],[4,9],[5,6],[5,7]];
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, frame: number, dt: number) => {
    if (!nodes.current.length) init(w, h);
    const ns = nodes.current;

    ctx.fillStyle = "rgba(6,6,7,0.18)";
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        const dx = ns[j].x - ns[i].x, dy = ns[j].y - ns[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 1;
        const force = 900 / (dist * dist);
        ns[i].vx -= dx * force / dist * dt * 0.5;
        ns[i].vy -= dy * force / dist * dt * 0.5;
        ns[j].vx += dx * force / dist * dt * 0.5;
        ns[j].vy += dy * force / dist * dt * 0.5;
      }
      ns[i].vx += (w / 2 - ns[i].x) * 0.001 * dt;
      ns[i].vy += (h / 2 - ns[i].y) * 0.001 * dt;
      ns[i].vx *= 0.92; ns[i].vy *= 0.92;
      ns[i].x = Math.max(45, Math.min(w - 45, ns[i].x + ns[i].vx * dt));
      ns[i].y = Math.max(45, Math.min(h - 45, ns[i].y + ns[i].vy * dt));
      ns[i].pulse += 0.04 * dt;
    }

    for (const [a, b] of edges.current) {
      const t = ((frame * 0.01) % 1);
      ctx.beginPath();
      ctx.strokeStyle = "rgba(30,30,36,0.9)";
      ctx.lineWidth = 1;
      ctx.moveTo(ns[a].x, ns[a].y); ctx.lineTo(ns[b].x, ns[b].y); ctx.stroke();
      const px = ns[a].x + (ns[b].x - ns[a].x) * t;
      const py = ns[a].y + (ns[b].y - ns[a].y) * t;
      ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(200,169,126,0.55)"; ctx.fill();
    }

    for (const n of ns) {
      const color = NG_TYPE_COLORS[n.type] ?? '#C8A97E';
      const pulse = 0.5 + 0.5 * Math.sin(n.pulse);
      ctx.beginPath(); ctx.arc(n.x, n.y, 16 + 4 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `${color}14`; ctx.fill();
      ctx.beginPath(); ctx.arc(n.x, n.y, 11, 0, Math.PI * 2);
      ctx.fillStyle = `${color}CC`; ctx.fill();
      ctx.fillStyle = "#F0EDE6"; ctx.font = "bold 8px monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(n.label, n.x, n.y + 24);
    }

    if (frame % 12 === 0) {
      onTel({
        tick: frame, latency: 12 + Math.random() * 8,
        packets: frame * edges.current.length,
        nodes: ns.length, threatLvl: 0.12,
        winRate: 0, entropy: 0.5,
      });
    }
  }, [init, onTel]);

  const ref = useCanvas(draw, running, onFps);
  return <canvas ref={ref} className="w-full h-full" />;
}

// ── 3. Data Flow ─────────────────────────────────────────────────────────────
const DF_STAGES = ['Ingest','Parse','Classify','Rank','Cache','Serve'];
const DF_COLORS  = ['#FF5F57','#FEBC2E','#28C840','#5AC8FA','#C8A97E','#A78BFA'];

function DataFlow({
  running, onFps, onTel,
}: { running: boolean; onFps: (f: number) => void; onTel: (t: TelemetryFrame) => void }) {
  type Pkt = { x: number; stage: number; progress: number; speed: number; color: string; size: number };
  const packets = useRef<Pkt[]>([]);
  const totalProcessed = useRef(0);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, frame: number, dt: number) => {
    ctx.fillStyle = "#060607";
    ctx.fillRect(0, 0, w, h);

    const stageW = w / DF_STAGES.length;
    const cy = h / 2;

    if (frame % 7 === 0 && packets.current.length < 70) {
      const idx = Math.floor(Math.random() * DF_COLORS.length);
      packets.current.push({ x: 0, stage: 0, progress: 0, speed: 0.009 + Math.random() * 0.012, color: DF_COLORS[idx], size: 3 + Math.random() * 3 });
    }

    for (let i = 0; i < DF_STAGES.length; i++) {
      const x = stageW * i + stageW / 2;
      const grad = ctx.createLinearGradient(stageW * i, 0, stageW * (i + 1), 0);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, `${DF_COLORS[i]}08`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(stageW * i, 0, stageW, h);

      if (i > 0) {
        ctx.beginPath(); ctx.strokeStyle = "#0D0D10"; ctx.lineWidth = 1;
        ctx.moveTo(stageW * i, 0); ctx.lineTo(stageW * i, h); ctx.stroke();
      }

      ctx.fillStyle = "#1A1A20"; ctx.font = "bold 10px monospace"; ctx.textAlign = "center";
      ctx.fillText(DF_STAGES[i].toUpperCase(), x, 24);
    }

    ctx.beginPath(); ctx.strokeStyle = "#111116"; ctx.lineWidth = 1.5; ctx.setLineDash([5, 8]);
    ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke(); ctx.setLineDash([]);

    packets.current = packets.current.filter((p) => p.stage < DF_STAGES.length);
    for (const p of packets.current) {
      p.progress += p.speed * dt;
      if (p.progress >= 1) { p.stage++; p.progress = 0; if (p.stage >= DF_STAGES.length) totalProcessed.current++; }
      const sx = stageW * p.stage, ex = stageW * (p.stage + 1);
      p.x = sx + (ex - sx) * p.progress;
      ctx.beginPath(); ctx.arc(p.x, cy, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color + "BB"; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, cy, p.size * 2.8, 0, Math.PI * 2);
      ctx.fillStyle = p.color + "1A"; ctx.fill();
    }

    // Throughput label
    ctx.fillStyle = "#1E1E24"; ctx.font = "9px monospace"; ctx.textAlign = "left";
    ctx.fillText(`active: ${packets.current.length}   processed: ${totalProcessed.current}`, 12, h - 12);

    if (frame % 8 === 0) {
      onTel({
        tick: frame, latency: 4 + packets.current.length * 0.3,
        packets: totalProcessed.current, nodes: DF_STAGES.length,
        threatLvl: 0.05, winRate: 0,
        entropy: packets.current.length / 70,
      });
    }
  }, [onTel]);

  const ref = useCanvas(draw, running, onFps);
  return <canvas ref={ref} className="w-full h-full" />;
}

// ── 4. Monte Carlo ──────────────────────────────────────────────────────────
function MonteCarloViz({
  running, onFps, onTel,
}: { running: boolean; onFps: (f: number) => void; onTel: (t: TelemetryFrame) => void }) {
  const paths   = useRef<number[][]>([]);
  const revealed = useRef(0);
  const N = 80, STEPS = 252;

  useEffect(() => {
    const mu = 0.12 / STEPS, sigma = 0.20 / Math.sqrt(STEPS);
    paths.current = Array.from({ length: N }, () => {
      const p = [100_000];
      for (let i = 1; i <= STEPS; i++) {
        const z = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
        p.push(p[i - 1] * Math.exp(mu + sigma * z));
      }
      return p;
    });
    revealed.current = 0;
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, frame: number, dt: number) => {
    ctx.fillStyle = "#060607"; ctx.fillRect(0, 0, w, h);
    if (!paths.current.length) return;

    revealed.current = Math.min(STEPS, revealed.current + Math.ceil(dt));
    const steps = revealed.current;

    const allVals = paths.current.flatMap((p) => p.slice(0, steps + 1));
    const minV = Math.min(...allVals) * 0.95;
    const maxV = Math.max(...allVals) * 1.05;
    const toX = (i: number) => (i / STEPS) * (w - 64) + 36;
    const toY = (v: number) => h - 44 - ((v - minV) / (maxV - minV)) * (h - 88);

    // Grid
    for (let i = 0; i <= 4; i++) {
      const y = 44 + (i / 4) * (h - 88);
      ctx.beginPath(); ctx.strokeStyle = "#0E0E12"; ctx.lineWidth = 1;
      ctx.moveTo(36, y); ctx.lineTo(w - 28, y); ctx.stroke();
      ctx.fillStyle = "#1E1E24"; ctx.font = "9px monospace"; ctx.textAlign = "right";
      ctx.fillText(`$${((maxV - (i / 4) * (maxV - minV)) / 1000).toFixed(0)}k`, 32, y + 3);
    }

    // Paths
    for (const p of paths.current) {
      ctx.beginPath();
      ctx.strokeStyle = p[steps] > 100_000 ? "rgba(40,200,64,0.22)" : "rgba(255,95,87,0.18)";
      ctx.lineWidth = 0.8;
      for (let i = 0; i <= steps; i++) { if (i === 0) { ctx.moveTo(toX(i), toY(p[i])); } else { ctx.lineTo(toX(i), toY(p[i])); } }
      ctx.stroke();
    }

    // Baseline
    ctx.beginPath(); ctx.strokeStyle = "rgba(200,169,126,0.22)"; ctx.lineWidth = 1.5; ctx.setLineDash([4, 5]);
    ctx.moveTo(toX(0), toY(100_000)); ctx.lineTo(toX(steps), toY(100_000));
    ctx.stroke(); ctx.setLineDash([]);

    // Median
    const medians = Array.from({ length: steps + 1 }, (_, i) =>
      [...paths.current].map((p) => p[i]).sort((a, b) => a - b)[Math.floor(N / 2)]
    );
    ctx.beginPath(); ctx.strokeStyle = "#A78BFA"; ctx.lineWidth = 2;
    medians.forEach((v, i) => { if (i === 0) { ctx.moveTo(toX(i), toY(v)); } else { ctx.lineTo(toX(i), toY(v)); } });
    ctx.stroke();

    const finals  = paths.current.map((p) => p[steps]);
    const wins    = finals.filter((v) => v > 100_000);
    const med     = [...finals].sort((a, b) => a - b)[Math.floor(N / 2)];
    const winRate = (wins.length / N) * 100;

    ctx.fillStyle = "#1E1E24"; ctx.font = "9px monospace"; ctx.textAlign = "left";
    ctx.fillText(`day ${steps}/${STEPS}  ·  median $${(med / 1000).toFixed(1)}k  ·  ${winRate.toFixed(0)}% profitable`, 36, h - 14);

    if (frame % 10 === 0) {
      onTel({ tick: frame, latency: 2, packets: steps * N, nodes: N, threatLvl: 0, winRate, entropy: Math.log(N) });
    }
  }, [onTel]);

  const ref = useCanvas(draw, running, onFps);
  return <canvas ref={ref} className="w-full h-full" />;
}

// ── 5. Threat Heatmap ───────────────────────────────────────────────────────
const TM_SERVICES = ['CDN','API','Auth','DB','Redis','AI','OSINT','Ingest','SSE','iOS','Web','Admin','Jobs','Cache','Queue','Logs','AV','DNS','Net','LB'];
const TM_COLS = 20, TM_ROWS = 11;

function ThreatMap({
  running, onFps, onTel,
}: { running: boolean; onFps: (f: number) => void; onTel: (t: TelemetryFrame) => void }) {
  const grid = useRef<number[][]>([]);

  useEffect(() => {
    grid.current = Array.from({ length: TM_ROWS }, () => Array.from({ length: TM_COLS }, () => Math.random() * 0.5));
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, frame: number, _dt: number) => {
    void _dt;
    ctx.fillStyle = "#060607"; ctx.fillRect(0, 0, w, h);
    if (!grid.current.length) return;

    const cellW = w / TM_COLS, cellH = (h - 56) / TM_ROWS;
    let totalThreat = 0, cellCount = 0;

    if (frame % 3 === 0) {
      for (let r = 0; r < TM_ROWS; r++) {
        for (let c = 0; c < TM_COLS; c++) {
          const neighbors = [
            grid.current[Math.max(0, r - 1)][c],
            grid.current[Math.min(TM_ROWS - 1, r + 1)][c],
            grid.current[r][Math.max(0, c - 1)],
            grid.current[r][Math.min(TM_COLS - 1, c + 1)],
          ];
          const avg = neighbors.reduce((a, b) => a + b, 0) / 4;
          grid.current[r][c] = Math.max(0, Math.min(1,
            grid.current[r][c] * 0.93 + avg * 0.05 + (Math.random() - 0.5) * 0.035
          ));
        }
      }
      if (Math.random() < 0.06) {
        grid.current[Math.floor(Math.random() * TM_ROWS)][Math.floor(Math.random() * TM_COLS)] = 0.8 + Math.random() * 0.2;
      }
    }

    for (let r = 0; r < TM_ROWS; r++) {
      for (let c = 0; c < TM_COLS; c++) {
        const v = grid.current[r][c];
        totalThreat += v; cellCount++;
        const x = c * cellW, y = 36 + r * cellH;
        let color: string;
        if (v < 0.35)       color = `rgba(40,200,64,${v * 1.2 + 0.05})`;
        else if (v < 0.60)  color = `rgba(254,188,46,${v})`;
        else                color = `rgba(255,95,87,${0.45 + v * 0.55})`;
        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
        if (v > 0.58) {
          ctx.fillStyle = `rgba(255,255,255,${(v - 0.58) * 1.5})`;
          ctx.font = "7px monospace"; ctx.textAlign = "center";
          ctx.fillText(v.toFixed(2), x + cellW / 2, y + cellH / 2 + 3);
        }
      }
    }

    // Column headers
    for (let c = 0; c < TM_COLS; c++) {
      ctx.fillStyle = "#1A1A20"; ctx.font = "7px monospace"; ctx.textAlign = "center";
      ctx.fillText(TM_SERVICES[c] ?? '', c * cellW + cellW / 2, 26);
    }

    // Legend
    const avgThreat = totalThreat / cellCount;
    (['Safe','Elevated','Critical'] as const).forEach((label, i) => {
      const colors = ['#28C840','#FEBC2E','#FF5F57'];
      const lx = 16 + i * 88;
      ctx.fillStyle = colors[i]; ctx.fillRect(lx, h - 16, 9, 9);
      ctx.fillStyle = "#1E1E24"; ctx.font = "8px monospace"; ctx.textAlign = "left";
      ctx.fillText(label, lx + 13, h - 8);
    });
    ctx.fillStyle = "#1E1E24"; ctx.font = "8px monospace"; ctx.textAlign = "right";
    ctx.fillText(`avg threat: ${(avgThreat * 100).toFixed(1)}%`, w - 12, h - 8);

    if (frame % 6 === 0) {
      onTel({ tick: frame, latency: 3 + avgThreat * 40, packets: frame * TM_COLS, nodes: TM_COLS * TM_ROWS, threatLvl: avgThreat, winRate: 0, entropy: avgThreat * 2 });
    }
  }, [onTel]);

  const ref = useCanvas(draw, running, onFps);
  return <canvas ref={ref} className="w-full h-full" />;
}
