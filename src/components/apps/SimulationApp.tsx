"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "particles" | "network" | "dataflow" | "montecarlo" | "threat";

const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: "particles",   label: "Particle Field",    desc: "Gravitational n-body system" },
  { id: "network",     label: "Network Graph",     desc: "Live topology simulation" },
  { id: "dataflow",    label: "Data Flow",         desc: "News ingestion pipeline" },
  { id: "montecarlo",  label: "Monte Carlo",       desc: "Portfolio path simulation" },
  { id: "threat",      label: "Threat Map",        desc: "Attack surface heatmap" },
];

export default function SimulationApp() {
  const [mode, setMode] = useState<Mode>("particles");
  const [running, setRunning] = useState(true);
  const [fps, setFps] = useState(0);

  return (
    <div className="h-full flex flex-col" style={{ background: "#060607" }}>
      {/* Control bar */}
      <div
        className="flex items-center gap-2 px-4 py-2 shrink-0 overflow-x-auto"
        style={{ borderBottom: "1px solid #111115" }}
      >
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className="shrink-0 flex flex-col px-3 py-1.5 rounded-lg text-left transition-colors"
            style={{
              background: mode === m.id ? "rgba(200,169,126,0.1)" : "transparent",
              border: `1px solid ${mode === m.id ? "rgba(200,169,126,0.2)" : "#1A1A1E"}`,
              color: mode === m.id ? "#C8A97E" : "#4A4A56",
            }}
          >
            <span className="text-[11px] font-semibold whitespace-nowrap">{m.label}</span>
            <span className="text-[9px] whitespace-nowrap" style={{ color: mode === m.id ? "#7A6348" : "#2E2E33" }}>
              {m.desc}
            </span>
          </button>
        ))}

        <div className="flex-1" />
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] font-mono" style={{ color: "#2E2E33" }}>{fps} fps</span>
          <button
            onClick={() => setRunning((r) => !r)}
            className="text-[11px] px-3 py-1.5 rounded-lg font-medium"
            style={{
              background: running ? "rgba(255,95,87,0.08)" : "rgba(40,200,64,0.08)",
              border: `1px solid ${running ? "rgba(255,95,87,0.2)" : "rgba(40,200,64,0.2)"}`,
              color: running ? "#FF5F57" : "#28C840",
            }}
          >
            {running ? "Pause" : "Resume"}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {mode === "particles"  && <ParticleField  running={running} onFps={setFps} />}
            {mode === "network"    && <NetworkGraph   running={running} onFps={setFps} />}
            {mode === "dataflow"   && <DataFlow       running={running} onFps={setFps} />}
            {mode === "montecarlo" && <MonteCarloViz  running={running} onFps={setFps} />}
            {mode === "threat"     && <ThreatMap      running={running} onFps={setFps} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Shared canvas hook ─────────────────────────────────────────────────────
function useCanvas(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => void,
  running: boolean,
  onFps: (f: number) => void,
) {
  const ref = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastFpsTime = useRef(performance.now());
  const fpsCount = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const loop = () => {
      if (!running) { rafRef.current = requestAnimationFrame(loop); return; }
      draw(ctx, canvas.width, canvas.height, frameRef.current++);
      fpsCount.current++;
      const now = performance.now();
      if (now - lastFpsTime.current >= 500) {
        onFps(Math.round(fpsCount.current / ((now - lastFpsTime.current) / 1000)));
        fpsCount.current = 0;
        lastFpsTime.current = now;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [draw, running, onFps]);

  return ref;
}

// ── 1. Particle Field (n-body gravitational) ────────────────────────────────
function ParticleField({ running, onFps }: { running: boolean; onFps: (f: number) => void }) {
  const N = 120;
  type P = { x: number; y: number; vx: number; vy: number; r: number; hue: number };
  const particles = useRef<P[]>([]);

  const init = useCallback((w: number, h: number) => {
    particles.current = Array.from({ length: N }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8,
      r: 1.5 + Math.random() * 2.5,
      hue: Math.random() < 0.7 ? 35 : 200,
    }));
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => {
    if (particles.current.length === 0) init(w, h);
    const ps = particles.current;

    ctx.fillStyle = "rgba(6,6,7,0.18)";
    ctx.fillRect(0, 0, w, h);

    // Connections
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const dx = ps[i].x - ps[j].x, dy = ps[i].y - ps[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 90) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(200,169,126,${(1 - dist / 90) * 0.12})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(ps[i].x, ps[i].y);
          ctx.lineTo(ps[j].x, ps[j].y);
          ctx.stroke();
        }
      }
    }

    // Particles + gravity
    for (const p of ps) {
      // Mutual attraction toward screen center
      const cx = w / 2 - p.x, cy = h / 2 - p.y;
      const dist = Math.sqrt(cx * cx + cy * cy) + 1;
      p.vx += (cx / dist) * 0.003;
      p.vy += (cy / dist) * 0.003;

      // Damping
      p.vx *= 0.995; p.vy *= 0.995;
      p.x += p.vx; p.y += p.vy;

      // Bounce
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      p.x = Math.max(0, Math.min(w, p.x));
      p.y = Math.max(0, Math.min(h, p.y));

      const alpha = 0.7 + 0.3 * Math.sin(frame * 0.03 + p.r);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.hue === 35 ? `rgba(200,169,126,${alpha})` : `rgba(90,200,250,${alpha * 0.6})`;
      ctx.fill();
    }
  }, [init]);

  const ref = useCanvas(draw, running, onFps);
  return <canvas ref={ref} className="w-full h-full" />;
}

// ── 2. Network Graph ────────────────────────────────────────────────────────
function NetworkGraph({ running, onFps }: { running: boolean; onFps: (f: number) => void }) {
  type Node = { x: number; y: number; vx: number; vy: number; label: string; type: string; pulse: number };
  const nodes = useRef<Node[]>([]);
  const edges = useRef<[number, number][]>([]);

  const LABELS = ['API', 'Auth', 'DB', 'Redis', 'AI', 'CDN', 'iOS', 'Browser', 'OSINT', 'News'];
  const TYPES  = ['service','service','database','database','ai','cdn','client','client','security','service'];

  const init = useCallback((w: number, h: number) => {
    nodes.current = LABELS.map((label, i) => ({
      x: w / 2 + Math.cos((i / LABELS.length) * Math.PI * 2) * (Math.min(w, h) * 0.32),
      y: h / 2 + Math.sin((i / LABELS.length) * Math.PI * 2) * (Math.min(w, h) * 0.32),
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      label, type: TYPES[i], pulse: Math.random() * Math.PI * 2,
    }));
    edges.current = [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[0,9],[1,2],[4,9],[5,6],[5,7]];
  }, []);

  const TYPE_COLORS: Record<string, string> = {
    service: '#C8A97E', database: '#B48EAD', ai: '#5AC8FA',
    cdn: '#28C840', client: '#FEBC2E', security: '#FF5F57',
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => {
    if (nodes.current.length === 0) init(w, h);
    const ns = nodes.current;

    ctx.fillStyle = "rgba(6,6,7,0.2)";
    ctx.fillRect(0, 0, w, h);

    // Force-directed layout
    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        const dx = ns[j].x - ns[i].x, dy = ns[j].y - ns[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 1;
        const force = 800 / (dist * dist);
        ns[i].vx -= dx * force / dist; ns[i].vy -= dy * force / dist;
        ns[j].vx += dx * force / dist; ns[j].vy += dy * force / dist;
      }
      // Center attraction
      ns[i].vx += (w / 2 - ns[i].x) * 0.001;
      ns[i].vy += (h / 2 - ns[i].y) * 0.001;
      ns[i].vx *= 0.92; ns[i].vy *= 0.92;
      ns[i].x = Math.max(40, Math.min(w - 40, ns[i].x + ns[i].vx));
      ns[i].y = Math.max(40, Math.min(h - 40, ns[i].y + ns[i].vy));
      ns[i].pulse += 0.04;
    }

    // Edges with data packet animation
    for (const [a, b] of edges.current) {
      const t = ((frame * 0.012) % 1);
      ctx.beginPath();
      ctx.strokeStyle = "rgba(37,37,40,0.8)";
      ctx.lineWidth = 1;
      ctx.moveTo(ns[a].x, ns[a].y); ctx.lineTo(ns[b].x, ns[b].y); ctx.stroke();
      // Traveling packet
      const px = ns[a].x + (ns[b].x - ns[a].x) * t;
      const py = ns[a].y + (ns[b].y - ns[a].y) * t;
      ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(200,169,126,0.6)"; ctx.fill();
    }

    // Nodes
    for (const n of ns) {
      const color = TYPE_COLORS[n.type] ?? '#C8A97E';
      const pulse = 0.6 + 0.4 * Math.sin(n.pulse);
      ctx.beginPath(); ctx.arc(n.x, n.y, 14 + 3 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `${color}18`; ctx.fill();
      ctx.beginPath(); ctx.arc(n.x, n.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = `${color}CC`; ctx.fill();
      ctx.fillStyle = "#F0EDE6";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(n.label, n.x, n.y + 22);
    }
  }, [init]);

  const ref = useCanvas(draw, running, onFps);
  return <canvas ref={ref} className="w-full h-full" />;
}

// ── 3. Data Flow (pipeline viz) ─────────────────────────────────────────────
function DataFlow({ running, onFps }: { running: boolean; onFps: (f: number) => void }) {
  type Packet = { x: number; stage: number; progress: number; speed: number; color: string; size: number };
  const packets = useRef<Packet[]>([]);

  const STAGES  = ['Ingest', 'Parse', 'Classify', 'Rank', 'Cache', 'Serve'];
  const SOURCES  = ['RSS', 'FMP', 'Gov', 'OSINT', 'SSE'];
  const COLORS   = ['#FF5F57', '#FEBC2E', '#28C840', '#5AC8FA', '#C8A97E'];

  useEffect(() => { packets.current = []; }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => {
    ctx.fillStyle = "#060607";
    ctx.fillRect(0, 0, w, h);

    const stageW = w / STAGES.length;
    const centerY = h / 2;

    // Spawn packets
    if (frame % 8 === 0 && packets.current.length < 60) {
      const idx = Math.floor(Math.random() * SOURCES.length);
      packets.current.push({
        x: 0, stage: 0, progress: 0,
        speed: 0.008 + Math.random() * 0.012,
        color: COLORS[idx], size: 3 + Math.random() * 3,
      });
    }

    // Stage lanes
    for (let i = 0; i < STAGES.length; i++) {
      const x = stageW * i + stageW / 2;
      // Column glow
      const grad = ctx.createLinearGradient(x - stageW/2, 0, x + stageW/2, 0);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, 'rgba(200,169,126,0.025)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(stageW * i, 0, stageW, h);

      // Label
      ctx.fillStyle = "#252528";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(STAGES[i].toUpperCase(), x, 28);

      // Separator line
      if (i > 0) {
        ctx.beginPath();
        ctx.strokeStyle = "#111115"; ctx.lineWidth = 1;
        ctx.moveTo(stageW * i, 0); ctx.lineTo(stageW * i, h); ctx.stroke();
      }
    }

    // Flow path
    ctx.beginPath();
    ctx.strokeStyle = "#161618"; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    ctx.moveTo(0, centerY);
    for (let i = 0; i < STAGES.length; i++) {
      ctx.lineTo(stageW * (i + 1), centerY);
    }
    ctx.stroke(); ctx.setLineDash([]);

    // Move and draw packets
    packets.current = packets.current.filter((p) => p.stage < STAGES.length);
    for (const p of packets.current) {
      p.progress += p.speed;
      if (p.progress >= 1) { p.stage++; p.progress = 0; }

      const stageStart = stageW * p.stage;
      const stageEnd   = stageW * (p.stage + 1);
      p.x = stageStart + (stageEnd - stageStart) * p.progress;

      // Trail
      ctx.beginPath();
      ctx.arc(p.x, centerY, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color + "AA"; ctx.fill();
      // Glow
      ctx.beginPath();
      ctx.arc(p.x, centerY, p.size * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = p.color + "22"; ctx.fill();
    }

    // Live counter
    ctx.fillStyle = "#3A3A42";
    ctx.font = "10px monospace"; ctx.textAlign = "left";
    ctx.fillText(`packets: ${packets.current.length}`, 12, h - 12);
  }, []);

  const ref = useCanvas(draw, running, onFps);
  return <canvas ref={ref} className="w-full h-full" />;
}

// ── 4. Monte Carlo paths ────────────────────────────────────────────────────
function MonteCarloViz({ running, onFps }: { running: boolean; onFps: (f: number) => void }) {
  const paths = useRef<number[][]>([]);
  const revealed = useRef(0);
  const N = 80, STEPS = 252;

  useEffect(() => {
    const rng = () => Math.random();
    const mu = 0.12 / STEPS, sigma = 0.20 / Math.sqrt(STEPS);
    paths.current = Array.from({ length: N }, () => {
      const path = [100000];
      for (let i = 1; i <= STEPS; i++) {
        const ret = mu + sigma * (
          Math.sqrt(-2 * Math.log(rng())) * Math.cos(2 * Math.PI * rng())
        );
        path.push(path[i - 1] * Math.exp(ret));
      }
      return path;
    });
    revealed.current = 0;
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => {
    ctx.fillStyle = "#060607";
    ctx.fillRect(0, 0, w, h);
    if (!paths.current.length) return;

    revealed.current = Math.min(STEPS, revealed.current + 1);
    const steps = revealed.current;

    const allVals = paths.current.flatMap((p) => p.slice(0, steps + 1));
    const minV = Math.min(...allVals) * 0.95;
    const maxV = Math.max(...allVals) * 1.05;
    const toX = (i: number) => (i / STEPS) * (w - 60) + 30;
    const toY = (v: number) => h - 40 - ((v - minV) / (maxV - minV)) * (h - 80);

    // Grid
    ctx.strokeStyle = "#111115"; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = 40 + (i / 4) * (h - 80);
      ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(w - 30, y); ctx.stroke();
      const val = maxV - (i / 4) * (maxV - minV);
      ctx.fillStyle = "#2E2E33"; ctx.font = "9px monospace"; ctx.textAlign = "right";
      ctx.fillText(`$${(val / 1000).toFixed(0)}k`, 26, y + 3);
    }

    // Paths
    for (let pi = 0; pi < paths.current.length; pi++) {
      const p = paths.current[pi];
      const final = p[steps];
      const profit = final > 100000;
      ctx.beginPath();
      ctx.strokeStyle = profit ? `rgba(40,200,64,0.25)` : `rgba(255,95,87,0.2)`;
      ctx.lineWidth = 0.8;
      for (let i = 0; i <= steps; i++) {
        const x = toX(i), y = toY(p[i]);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Baseline
    ctx.beginPath();
    ctx.strokeStyle = "rgba(200,169,126,0.3)"; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    ctx.moveTo(toX(0), toY(100000)); ctx.lineTo(toX(steps), toY(100000));
    ctx.stroke(); ctx.setLineDash([]);

    // Median path
    const medians = Array.from({ length: steps + 1 }, (_, i) =>
      [...paths.current].map((p) => p[i]).sort((a, b) => a - b)[Math.floor(N / 2)]
    );
    ctx.beginPath();
    ctx.strokeStyle = "#C8A97E"; ctx.lineWidth = 2;
    medians.forEach((v, i) => i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)));
    ctx.stroke();

    // Stats
    const finals = paths.current.map((p) => p[steps]);
    const winRate = (finals.filter((v) => v > 100000).length / N * 100).toFixed(0);
    const med = [...finals].sort((a,b)=>a-b)[Math.floor(N/2)];
    ctx.fillStyle = "#3A3A42"; ctx.font = "10px monospace"; ctx.textAlign = "left";
    ctx.fillText(`day ${steps}/${STEPS}  |  median: $${(med/1000).toFixed(1)}k  |  profitable: ${winRate}%`, 30, h - 14);
  }, []);

  const ref = useCanvas(draw, running, onFps);
  return <canvas ref={ref} className="w-full h-full" />;
}

// ── 5. Threat Heatmap ───────────────────────────────────────────────────────
function ThreatMap({ running, onFps }: { running: boolean; onFps: (f: number) => void }) {
  const grid = useRef<number[][]>([]);
  const COLS = 20, ROWS = 12;

  useEffect(() => {
    grid.current = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => Math.random())
    );
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, frame: number) => {
    ctx.fillStyle = "#060607";
    ctx.fillRect(0, 0, w, h);
    if (!grid.current.length) return;

    const cellW = w / COLS, cellH = (h - 60) / ROWS;

    // Evolve grid (diffusion + noise)
    if (frame % 4 === 0) {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const neighbors = [
            grid.current[r > 0 ? r - 1 : r][c],
            grid.current[r < ROWS - 1 ? r + 1 : r][c],
            grid.current[r][c > 0 ? c - 1 : c],
            grid.current[r][c < COLS - 1 ? c + 1 : c],
          ];
          const avg = neighbors.reduce((a, b) => a + b, 0) / 4;
          grid.current[r][c] = Math.max(0, Math.min(1,
            grid.current[r][c] * 0.94 + avg * 0.05 + (Math.random() - 0.5) * 0.04
          ));
        }
      }
      // Random threat spike
      if (Math.random() < 0.08) {
        const r = Math.floor(Math.random() * ROWS);
        const c = Math.floor(Math.random() * COLS);
        grid.current[r][c] = 0.85 + Math.random() * 0.15;
      }
    }

    // Draw cells
    const SERVICES = ['CDN','API','Auth','DB','Redis','AI','OSINT','Ingest','SSE','iOS',
                      'Web','Admin','Jobs','Cache','Queue','Logs','AV','DNS','Net','LB'];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = grid.current[r][c];
        const x = c * cellW, y = 40 + r * cellH;
        // Color: green (safe) → tan → red (threat)
        let color: string;
        if (v < 0.4)      color = `rgba(40,200,64,${v * 0.8})`;
        else if (v < 0.65) color = `rgba(254,188,46,${v * 0.9})`;
        else               color = `rgba(255,95,87,${0.5 + v * 0.5})`;

        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

        // Label
        if (r === 0 && SERVICES[c]) {
          ctx.fillStyle = "#1E1E22"; ctx.font = "8px monospace";
          ctx.textAlign = "center";
          ctx.fillText(SERVICES[c], x + cellW / 2, 30);
        }
        // Value
        if (v > 0.6) {
          ctx.fillStyle = `rgba(255,255,255,${(v - 0.6) * 2})`;
          ctx.font = "8px monospace"; ctx.textAlign = "center";
          ctx.fillText(v.toFixed(2), x + cellW / 2, y + cellH / 2 + 3);
        }
      }
    }

    // Legend
    const legX = 20, legY = h - 16;
    ['Safe', 'Elevated', 'Critical'].forEach((label, i) => {
      const colors = ['#28C840', '#FEBC2E', '#FF5F57'];
      ctx.fillStyle = colors[i]; ctx.fillRect(legX + i * 90, legY - 8, 10, 10);
      ctx.fillStyle = "#3A3A42"; ctx.font = "9px monospace"; ctx.textAlign = "left";
      ctx.fillText(label, legX + i * 90 + 14, legY);
    });
  }, []);

  const ref = useCanvas(draw, running, onFps);
  return <canvas ref={ref} className="w-full h-full" />;
}
