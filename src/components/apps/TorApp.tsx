"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ───────────────────────────────────────────────────────────────────
type CircuitStatus = "idle" | "building" | "established" | "renewing";

interface RelayNode {
  role: "guard" | "middle" | "exit";
  name: string;
  country: string;
  flag: string;
  ip: string;
  bandwidth: string;
  fingerprint: string;
}

// ── Relay pool ───────────────────────────────────────────────────────────────
const GUARD_POOL: RelayNode[] = [
  { role: "guard", name: "TorRelay-DE1",   country: "Germany",     flag: "🇩🇪", ip: "85.214.xxx.xxx",  bandwidth: "94 MB/s",  fingerprint: "A3F2...8C1E" },
  { role: "guard", name: "Freifunk-NL",    country: "Netherlands", flag: "🇳🇱", ip: "94.23.xxx.xxx",   bandwidth: "120 MB/s", fingerprint: "B7D1...4A2F" },
  { role: "guard", name: "PrivacyGuard-SE",country: "Sweden",      flag: "🇸🇪", ip: "46.166.xxx.xxx",  bandwidth: "78 MB/s",  fingerprint: "C9E4...3B5D" },
  { role: "guard", name: "CryptoNode-CH",  country: "Switzerland", flag: "🇨🇭", ip: "195.176.xxx.xxx", bandwidth: "55 MB/s",  fingerprint: "D2A8...7F3C" },
];
const MIDDLE_POOL: RelayNode[] = [
  { role: "middle", name: "MiddleRelay-FR", country: "France",   flag: "🇫🇷", ip: "212.83.xxx.xxx",  bandwidth: "45 MB/s", fingerprint: "E5B3...1D9A" },
  { role: "middle", name: "AnonMid-AT",    country: "Austria",  flag: "🇦🇹", ip: "81.169.xxx.xxx",  bandwidth: "60 MB/s", fingerprint: "F1C6...8E2B" },
  { role: "middle", name: "RelayHop-CZ",   country: "Czechia",  flag: "🇨🇿", ip: "62.141.xxx.xxx",  bandwidth: "38 MB/s", fingerprint: "G3D9...5F4C" },
  { role: "middle", name: "SecMid-NO",     country: "Norway",   flag: "🇳🇴", ip: "88.85.xxx.xxx",   bandwidth: "82 MB/s", fingerprint: "H7A2...2C6D" },
];
const EXIT_POOL: RelayNode[] = [
  { role: "exit", name: "ExitNode-LU",    country: "Luxembourg",  flag: "🇱🇺", ip: "188.165.xxx.xxx", bandwidth: "110 MB/s", fingerprint: "I4E7...9B1F" },
  { role: "exit", name: "FreeExit-IS",    country: "Iceland",     flag: "🇮🇸", ip: "157.157.xxx.xxx", bandwidth: "92 MB/s",  fingerprint: "J8C1...3A4E" },
  { role: "exit", name: "OpenExit-RO",    country: "Romania",     flag: "🇷🇴", ip: "5.2.xxx.xxx",     bandwidth: "67 MB/s",  fingerprint: "K2B5...6D7F" },
  { role: "exit", name: "ExitRelay-FI",   country: "Finland",     flag: "🇫🇮", ip: "193.166.xxx.xxx", bandwidth: "44 MB/s",  fingerprint: "L6F3...0C2E" },
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// ── Circuit canvas ──────────────────────────────────────────────────────────
function CircuitViz({
  nodes, status,
}: { nodes: RelayNode[]; status: CircuitStatus }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const rafRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;
    frameRef.current++;
    const f = frameRef.current;

    ctx.clearRect(0, 0, W, H);

    // Node positions: You → Guard → Middle → Exit → Destination
    const nodeCount = 5;
    const positions = Array.from({ length: nodeCount }, (_, i) => ({
      x: (W / (nodeCount - 1)) * i,
      y: H / 2,
    }));

    const LABELS = ["You", nodes[0]?.flag ?? "?", nodes[1]?.flag ?? "?", nodes[2]?.flag ?? "?", "🌐"];
    const COLORS = ["#5AC8FA", "#28C840", "#C8A97E", "#A78BFA", "#FEBC2E"];

    // Draw edges
    for (let i = 0; i < positions.length - 1; i++) {
      const { x: x1, y: y1 } = positions[i];
      const { x: x2, y: y2 } = positions[i + 1];

      // Base line
      ctx.beginPath();
      ctx.strokeStyle = status === "established" ? "rgba(40,200,64,0.15)" : "rgba(200,169,126,0.08)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.stroke(); ctx.setLineDash([]);

      // Animated packet
      if (status === "established") {
        const t = ((f * 0.012 + i * 0.25) % 1);
        const px = x1 + (x2 - x1) * t;
        const py = y1 + (y2 - y1) * t;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = COLORS[i] + "CC";
        ctx.fill();
        // trail
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = COLORS[i] + "22";
        ctx.fill();
      }

      if (status === "building") {
        const progress = Math.min(1, (f * 0.018 - i * 0.25));
        if (progress > 0) {
          const px = x1 + (x2 - x1) * progress;
          ctx.beginPath();
          ctx.arc(px, H / 2, 3, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(200,169,126,0.7)";
          ctx.fill();
        }
      }
    }

    // Draw nodes
    for (let i = 0; i < positions.length; i++) {
      const { x, y } = positions[i];
      const color = COLORS[i];
      const active = status === "established";
      const pulse = active ? 0.5 + 0.5 * Math.sin(f * 0.06 + i) : 0.3;

      ctx.beginPath();
      ctx.arc(x, y, 18 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = color + "12";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fillStyle = color + (active ? "CC" : "44");
      ctx.fill();

      ctx.font = "14px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(LABELS[i], x, y);

      ctx.font = "bold 8px monospace";
      ctx.fillStyle = color + (active ? "88" : "44");
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(
        i === 0 ? "YOU" : i === 4 ? "DEST" : ["GUARD","MID","EXIT"][i - 1],
        x, y + 16
      );
    }

    // Encryption layer labels
    if (status === "established") {
      const layerColors = ["rgba(90,200,250,0.3)", "rgba(40,200,64,0.3)", "rgba(200,169,126,0.3)"];
      const labels = ["Layer 3", "Layer 2", "Layer 1"];
      for (let i = 0; i < 3; i++) {
        const x1 = positions[0].x, x2 = positions[i + 1].x;
        ctx.fillStyle = layerColors[i];
        ctx.fillRect(x1 - 2, H / 2 - 28 - i * 8, x2 - x1 + 4, 2);
        ctx.font = "7px monospace";
        ctx.textAlign = "right";
        ctx.fillStyle = layerColors[i].replace("0.3", "0.6");
        ctx.fillText(labels[i], x2 + 2, H / 2 - 30 - i * 8);
      }
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [nodes, status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    ro.observe(canvas);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    rafRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [draw]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

// ── Relay card ───────────────────────────────────────────────────────────────
function RelayCard({ node, index, status }: { node: RelayNode; index: number; status: CircuitStatus }) {
  const ROLE_COLOR = { guard: "#5AC8FA", middle: "#C8A97E", exit: "#A78BFA" };
  const color = ROLE_COLOR[node.role];

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.12 }}
      className="rounded-xl p-3"
      style={{ background: "#0A0A0C", border: `1px solid ${color}18` }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{node.flag}</span>
          <div>
            <div className="text-[11px] font-semibold font-mono" style={{ color: "#C8C6C0" }}>{node.name}</div>
            <div className="text-[9px] font-mono" style={{ color: "#3A3A42" }}>{node.country}</div>
          </div>
        </div>
        <span
          className="text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded-md"
          style={{ background: color + "18", color, border: `1px solid ${color}28` }}
        >
          {node.role.toUpperCase()}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {[
          { label: "IP",    val: node.ip },
          { label: "BW",    val: node.bandwidth },
          { label: "FPRINT",val: node.fingerprint },
          { label: "STATUS",val: status === "established" ? "✓ OK" : "...", color: status === "established" ? "#28C840" : "#3A3A42" },
        ].map(({ label, val, color: c }) => (
          <div key={label}>
            <div className="text-[7px] tracking-widest" style={{ color: "#2A2A30" }}>{label}</div>
            <div className="text-[9px] font-mono truncate" style={{ color: c ?? "#52524E" }}>{val}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Main app ─────────────────────────────────────────────────────────────────
export default function TorApp() {
  const [status, setStatus]     = useState<CircuitStatus>("idle");
  const [nodes, setNodes]       = useState<RelayNode[]>([]);
  const [address, setAddress]   = useState("");
  const [log, setLog]           = useState<string[]>([]);
  const [bytesIn, setBytesIn]   = useState(0);
  const [bytesOut, setBytesOut] = useState(0);
  const [uptime, setUptime]     = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = useCallback((msg: string) => {
    setLog((l) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...l.slice(0, 24)]);
  }, []);

  const buildCircuit = useCallback(async () => {
    setStatus("building");
    setNodes([]);
    addLog("Bootstrapping Tor circuit...");
    await delay(400);
    addLog("Fetching consensus from directory authority...");
    await delay(500);

    const guard = pick(GUARD_POOL);
    addLog(`Selected guard node: ${guard.name} (${guard.country})`);
    setNodes([guard]);
    await delay(450);

    const middle = pick(MIDDLE_POOL);
    addLog(`Selected middle relay: ${middle.name} (${middle.country})`);
    setNodes([guard, middle]);
    await delay(450);

    const exit = pick(EXIT_POOL);
    addLog(`Selected exit node: ${exit.name} (${exit.country})`);
    setNodes([guard, middle, exit]);
    await delay(350);

    addLog("Establishing encrypted channel (TLS 1.3)...");
    await delay(300);
    addLog("Negotiating onion keys...");
    await delay(300);
    addLog("Circuit established. 3 hops. Latency ~280ms");
    setStatus("established");

    // Traffic simulation
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setBytesIn((b) => b + Math.floor(Math.random() * 4200));
      setBytesOut((b) => b + Math.floor(Math.random() * 1800));
      setUptime((u) => u + 1);
    }, 1000);
  }, [addLog]);

  const renewCircuit = useCallback(async () => {
    setStatus("renewing");
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setBytesIn(0); setBytesOut(0); setUptime(0);
    addLog("Renewing circuit — requesting new exit node...");
    await delay(300);
    await buildCircuit();
  }, [buildCircuit, addLog]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const STATUS_COLOR  = { idle: "#3A3A42", building: "#FEBC2E", established: "#28C840", renewing: "#C8A97E" };
  const STATUS_LABEL  = { idle: "Disconnected", building: "Building Circuit…", established: "Circuit Established", renewing: "Renewing…" };
  const fmtBytes = (b: number) => b > 1e6 ? `${(b / 1e6).toFixed(2)} MB` : `${(b / 1e3).toFixed(1)} KB`;
  const fmtUptime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  return (
    <div className="h-full flex flex-col font-mono" style={{ background: "#060607" }}>

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 shrink-0"
        style={{ borderBottom: "1px solid #111115" }}
      >
        {/* Onion icon */}
        <div className="text-lg" title="Tor Browser">🧅</div>

        {/* Address bar */}
        <div
          className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: "#0A0A0C", border: "1px solid #1A1A1E" }}
        >
          <span className="text-[10px]" style={{ color: status === "established" ? "#28C840" : "#2E2E33" }}>
            {status === "established" ? "🔒" : "🔓"}
          </span>
          <input
            className="flex-1 bg-transparent outline-none text-[12px]"
            style={{ color: "#8A8A7A", caretColor: "#C8A97E" }}
            placeholder="Enter .onion address or URL…"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {status === "established" && (
            <button
              onClick={renewCircuit}
              className="text-[10px] px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(200,169,126,0.07)", border: "1px solid rgba(200,169,126,0.15)", color: "#C8A97E" }}
            >
              ↺ New Circuit
            </button>
          )}
          <button
            onClick={status === "idle" ? buildCircuit : undefined}
            disabled={status === "building" || status === "renewing"}
            className="text-[10px] px-3 py-1.5 rounded-lg font-bold"
            style={{
              background: status === "established" ? "rgba(40,200,64,0.07)" : status === "idle" ? "rgba(167,139,250,0.1)" : "rgba(254,188,46,0.07)",
              border: `1px solid ${STATUS_COLOR[status]}28`,
              color: STATUS_COLOR[status],
              opacity: (status === "building" || status === "renewing") ? 0.6 : 1,
            }}
          >
            {status === "idle" ? "Connect" : status === "building" ? "Building…" : status === "renewing" ? "Renewing…" : "● Connected"}
          </button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left panel — circuit viz + relay cards */}
        <div className="w-[260px] shrink-0 flex flex-col" style={{ borderRight: "1px solid #0D0D10" }}>

          {/* Circuit diagram */}
          <div className="h-[130px] shrink-0 p-2" style={{ borderBottom: "1px solid #0D0D10" }}>
            <CircuitViz nodes={nodes} status={status} />
          </div>

          {/* Relay cards */}
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
            <AnimatePresence>
              {nodes.length === 0 && status === "idle" && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl mb-3 opacity-30">🧅</div>
                    <div className="text-[10px]" style={{ color: "#2A2A30" }}>No circuit</div>
                    <div className="text-[9px]" style={{ color: "#1E1E22" }}>Click Connect to build</div>
                  </div>
                </div>
              )}
              {nodes.map((node, i) => (
                <RelayCard key={node.fingerprint} node={node} index={i} status={status} />
              ))}
            </AnimatePresence>
          </div>

          {/* Stats bar */}
          <div
            className="px-3 py-2 shrink-0 grid grid-cols-3 gap-2"
            style={{ borderTop: "1px solid #0D0D10" }}
          >
            {[
              { label: "↓ IN",   val: fmtBytes(bytesIn) },
              { label: "↑ OUT",  val: fmtBytes(bytesOut) },
              { label: "⏱",       val: uptime > 0 ? fmtUptime(uptime) : "--" },
            ].map(({ label, val }) => (
              <div key={label} className="text-center">
                <div className="text-[8px]" style={{ color: "#252528" }}>{label}</div>
                <div className="text-[9px] font-mono" style={{ color: "#3A3A42" }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — browser area + log */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Browser content */}
          <div className="flex-1 flex items-center justify-center" style={{ background: "#050506" }}>
            {status !== "established" ? (
              <div className="text-center px-8">
                <motion.div
                  animate={status === "building" ? { scale: [1, 1.08, 1], opacity: [0.4, 1, 0.4] } : {}}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  className="text-5xl mb-5"
                >
                  🧅
                </motion.div>
                <div className="text-[13px] font-semibold mb-1" style={{ color: "#C8A97E" }}>
                  {STATUS_LABEL[status]}
                </div>
                <div className="text-[10px]" style={{ color: "#2A2A30" }}>
                  {status === "idle" ? "Build a circuit to browse anonymously" : "Negotiating onion layers…"}
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col">
                {/* Mock browser page */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-lg mx-auto">
                    <div className="mb-4 pb-3" style={{ borderBottom: "1px solid #111115" }}>
                      <div className="text-[11px] mb-1" style={{ color: "#28C840" }}>🔒 Secure · Anonymous · Onion-routed</div>
                      <div className="text-[14px] font-bold" style={{ color: "#C8A97E" }}>
                        {address || "about:tor"}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="text-[11px] leading-relaxed" style={{ color: "#52524E" }}>
                        Your connection is routed through 3 encrypted hops across the Tor network. Your real IP address is hidden from the destination. Traffic is wrapped in {3} layers of encryption (onion routing).
                      </div>
                      <div className="rounded-lg p-3" style={{ background: "#0A0A0C", border: "1px solid #111115" }}>
                        <div className="text-[9px] tracking-widest mb-2" style={{ color: "#252528" }}>CIRCUIT PATH</div>
                        <div className="flex items-center gap-2 text-[10px] font-mono" style={{ color: "#3A3A42" }}>
                          <span style={{ color: "#5AC8FA" }}>You</span>
                          <span>→</span>
                          <span style={{ color: "#28C840" }}>{nodes[0]?.flag} {nodes[0]?.name}</span>
                          <span>→</span>
                          <span style={{ color: "#C8A97E" }}>{nodes[1]?.flag} {nodes[1]?.name}</span>
                          <span>→</span>
                          <span style={{ color: "#A78BFA" }}>{nodes[2]?.flag} {nodes[2]?.name}</span>
                          <span>→</span>
                          <span>🌐</span>
                        </div>
                      </div>
                      <div className="text-[10px]" style={{ color: "#2A2A30" }}>
                        Exit IP visible to destination: <span style={{ color: "#A78BFA" }}>{nodes[2]?.ip}</span> ({nodes[2]?.country})
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Log console */}
          <div
            className="h-[140px] shrink-0 overflow-y-auto px-3 py-2"
            style={{ background: "#030304", borderTop: "1px solid #0D0D10" }}
          >
            <div className="text-[8px] tracking-widest mb-1.5" style={{ color: "#1A1A1E" }}>TOR LOG</div>
            {log.length === 0 ? (
              <div className="text-[9px]" style={{ color: "#1A1A1E" }}>No log entries</div>
            ) : (
              log.map((line, i) => (
                <div key={i} className="text-[9px] font-mono leading-[1.6]" style={{ color: i === 0 ? "#52524E" : "#2A2A30" }}>
                  {line}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
