"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ExternalLink } from "lucide-react";

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
  { role: "guard", name: "TorRelay-DE1",    country: "Germany",     flag: "🇩🇪", ip: "85.214.xxx.xxx",  bandwidth: "94 MB/s",  fingerprint: "A3F2...8C1E" },
  { role: "guard", name: "Freifunk-NL",     country: "Netherlands", flag: "🇳🇱", ip: "94.23.xxx.xxx",   bandwidth: "120 MB/s", fingerprint: "B7D1...4A2F" },
  { role: "guard", name: "PrivacyGuard-SE", country: "Sweden",      flag: "🇸🇪", ip: "46.166.xxx.xxx",  bandwidth: "78 MB/s",  fingerprint: "C9E4...3B5D" },
  { role: "guard", name: "CryptoNode-CH",   country: "Switzerland", flag: "🇨🇭", ip: "195.176.xxx.xxx", bandwidth: "55 MB/s",  fingerprint: "D2A8...7F3C" },
];
const MIDDLE_POOL: RelayNode[] = [
  { role: "middle", name: "MiddleRelay-FR", country: "France",   flag: "🇫🇷", ip: "212.83.xxx.xxx",  bandwidth: "45 MB/s", fingerprint: "E5B3...1D9A" },
  { role: "middle", name: "AnonMid-AT",     country: "Austria",  flag: "🇦🇹", ip: "81.169.xxx.xxx",  bandwidth: "60 MB/s", fingerprint: "F1C6...8E2B" },
  { role: "middle", name: "RelayHop-CZ",    country: "Czechia",  flag: "🇨🇿", ip: "62.141.xxx.xxx",  bandwidth: "38 MB/s", fingerprint: "G3D9...5F4C" },
  { role: "middle", name: "SecMid-NO",      country: "Norway",   flag: "🇳🇴", ip: "88.85.xxx.xxx",   bandwidth: "82 MB/s", fingerprint: "H7A2...2C6D" },
];
const EXIT_POOL: RelayNode[] = [
  { role: "exit", name: "ExitNode-LU",  country: "Luxembourg", flag: "🇱🇺", ip: "188.165.xxx.xxx", bandwidth: "110 MB/s", fingerprint: "I4E7...9B1F" },
  { role: "exit", name: "FreeExit-IS",  country: "Iceland",    flag: "🇮🇸", ip: "157.157.xxx.xxx", bandwidth: "92 MB/s",  fingerprint: "J8C1...3A4E" },
  { role: "exit", name: "OpenExit-RO",  country: "Romania",    flag: "🇷🇴", ip: "5.2.xxx.xxx",     bandwidth: "67 MB/s",  fingerprint: "K2B5...6D7F" },
  { role: "exit", name: "ExitRelay-FI", country: "Finland",    flag: "🇫🇮", ip: "193.166.xxx.xxx", bandwidth: "44 MB/s",  fingerprint: "L6F3...0C2E" },
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ── Circuit canvas ───────────────────────────────────────────────────────────
function CircuitViz({ nodes, status }: { nodes: RelayNode[]; status: CircuitStatus }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef  = useRef(0);
  const rafRef    = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;
    frameRef.current++;
    const f = frameRef.current;

    ctx.fillStyle = "#060607";
    ctx.fillRect(0, 0, W, H);

    const nodeCount = 5;
    const pad = 32;
    const positions = Array.from({ length: nodeCount }, (_, i) => ({
      x: pad + ((W - pad * 2) / (nodeCount - 1)) * i,
      y: H / 2,
    }));

    const LABELS = ["You", nodes[0]?.flag ?? "?", nodes[1]?.flag ?? "?", nodes[2]?.flag ?? "?", "🌐"];
    const COLORS = ["#5AC8FA", "#28C840", "#C8A97E", "#A78BFA", "#FEBC2E"];

    // Edges
    for (let i = 0; i < positions.length - 1; i++) {
      const { x: x1, y: y1 } = positions[i];
      const { x: x2, y: y2 } = positions[i + 1];

      ctx.beginPath();
      ctx.strokeStyle = status === "established" ? "rgba(40,200,64,0.2)" : "rgba(200,169,126,0.1)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.stroke(); ctx.setLineDash([]);

      if (status === "established") {
        const t = ((f * 0.012 + i * 0.25) % 1);
        const px = x1 + (x2 - x1) * t;
        const py = y1 + (y2 - y1) * t;
        ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = COLORS[i] + "CC"; ctx.fill();
        ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = COLORS[i] + "22"; ctx.fill();
      }

      if (status === "building") {
        const progress = Math.min(1, f * 0.018 - i * 0.25);
        if (progress > 0) {
          const px = x1 + (x2 - x1) * progress;
          ctx.beginPath(); ctx.arc(px, H / 2, 3, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(200,169,126,0.7)"; ctx.fill();
        }
      }
    }

    // Nodes
    for (let i = 0; i < positions.length; i++) {
      const { x, y } = positions[i];
      const color = COLORS[i];
      const active = status === "established";
      const pulse = active ? 0.5 + 0.5 * Math.sin(f * 0.06 + i) : 0.3;

      ctx.beginPath(); ctx.arc(x, y, 18 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = color + "12"; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fillStyle = color + (active ? "CC" : "44"); ctx.fill();

      ctx.font = "13px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(LABELS[i], x, y);

      ctx.font = "bold 8px monospace";
      ctx.fillStyle = color + (active ? "99" : "44");
      ctx.textBaseline = "top";
      ctx.fillText(i === 0 ? "YOU" : i === 4 ? "DEST" : ["GUARD","MID","EXIT"][i - 1], x, y + 16);
    }

    // Encryption layers
    if (status === "established") {
      const layerColors = ["rgba(90,200,250,0.35)", "rgba(40,200,64,0.35)", "rgba(200,169,126,0.35)"];
      for (let i = 0; i < 3; i++) {
        const x1 = positions[0].x, x2 = positions[i + 1].x;
        ctx.fillStyle = layerColors[i];
        ctx.fillRect(x1 - 2, H / 2 - 30 - i * 8, x2 - x1 + 4, 2);
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
      transition={{ delay: index * 0.1 }}
      className="rounded-xl p-3"
      style={{ background: "#0A0A0C", border: `1px solid ${color}22` }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{node.flag}</span>
          <div>
            <div className="text-[11px] font-semibold font-mono" style={{ color: "#C8C6C0" }}>{node.name}</div>
            <div className="text-[9px] font-mono" style={{ color: "#6A6A72" }}>{node.country}</div>
          </div>
        </div>
        <span className="text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded-md" style={{ background: color + "18", color, border: `1px solid ${color}28` }}>
          {node.role.toUpperCase()}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {[
          { label: "IP",     val: node.ip },
          { label: "BW",     val: node.bandwidth },
          { label: "FPRINT", val: node.fingerprint },
          { label: "STATUS", val: status === "established" ? "✓ OK" : "...", color: status === "established" ? "#28C840" : "#4A4A54" },
        ].map(({ label, val, color: c }) => (
          <div key={label}>
            <div className="text-[7px] tracking-widest" style={{ color: "#4A4A54" }}>{label}</div>
            <div className="text-[9px] font-mono truncate" style={{ color: c ?? "#7A7A72" }}>{val}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Main app ─────────────────────────────────────────────────────────────────
export default function TorApp() {
  const [status, setStatus]       = useState<CircuitStatus>("idle");
  const [nodes, setNodes]         = useState<RelayNode[]>([]);
  const [addressInput, setAddressInput] = useState("");
  const [currentUrl, setCurrentUrl]     = useState("");
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [log, setLog]             = useState<string[]>([]);
  const [bytesIn, setBytesIn]     = useState(0);
  const [bytesOut, setBytesOut]   = useState(0);
  const [uptime, setUptime]       = useState(0);
  const [showCircuit, setShowCircuit] = useState(false);
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
    addLog(`Guard: ${guard.name} (${guard.country})`);
    setNodes([guard]);
    await delay(450);

    const middle = pick(MIDDLE_POOL);
    addLog(`Middle: ${middle.name} (${middle.country})`);
    setNodes([guard, middle]);
    await delay(450);

    const exit = pick(EXIT_POOL);
    addLog(`Exit: ${exit.name} (${exit.country})`);
    setNodes([guard, middle, exit]);
    await delay(350);

    addLog("Establishing encrypted channel (TLS 1.3)...");
    await delay(300);
    addLog("Negotiating onion keys (3 layers)...");
    await delay(300);
    addLog("✓ Circuit established — 3 hops, latency ~280ms");
    setStatus("established");

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setBytesIn((b) => b + Math.floor(Math.random() * 4200));
      setBytesOut((b) => b + Math.floor(Math.random() * 1800));
      setUptime((u) => u + 1);
    }, 1000);
  }, [addLog]);

  // Auto-build circuit on open
  useEffect(() => {
    buildCircuit();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [buildCircuit]);

  const renewCircuit = useCallback(async () => {
    setStatus("renewing");
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setBytesIn(0); setBytesOut(0); setUptime(0);
    setCurrentUrl(""); setIframeLoaded(false);
    addLog("Renewing circuit...");
    await delay(300);
    await buildCircuit();
  }, [buildCircuit, addLog]);

  const navigate = useCallback(() => {
    if (!addressInput.trim() || status !== "established") return;
    let url = addressInput.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      // bare hostname like "google" → add .com; already has dot → just add https
      const hasDot = url.includes(".");
      url = "https://" + (hasDot ? url : url + ".com");
    }
    setCurrentUrl(url);
    setIframeLoaded(false);
    addLog(`→ ${url}`);
  }, [addressInput, status, addLog]);

  const STATUS_COLOR = { idle: "#3A3A42", building: "#FEBC2E", established: "#28C840", renewing: "#C8A97E" };
  const fmtBytes = (b: number) => b > 1e6 ? `${(b / 1e6).toFixed(2)} MB` : `${(b / 1e3).toFixed(1)} KB`;
  const fmtUptime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  return (
    <div className="h-full flex flex-col font-mono" style={{ background: "#060607" }}>

      {/* ── Top bar ── */}
      <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ borderBottom: "1px solid #111115" }}>
        {/* Onion + status */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-base">🧅</span>
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: STATUS_COLOR[status], boxShadow: status === "established" ? `0 0 6px ${STATUS_COLOR[status]}` : "none" }}
          />
        </div>

        {/* Address bar */}
        <div
          className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: "#0A0A0C", border: `1px solid ${status === "established" ? "rgba(40,200,64,0.2)" : "#1A1A1E"}` }}
        >
          <span className="text-[11px] shrink-0" style={{ color: status === "established" ? "#28C840" : "#3A3A42" }}>
            {status === "established" ? "🔒" : "⏳"}
          </span>
          <input
            className="flex-1 bg-transparent outline-none text-[12px]"
            style={{ color: status === "established" ? "#C8C6C0" : "#4A4A54", caretColor: "#C8A97E" }}
            placeholder={status === "established" ? "Enter URL or .onion address…" : "Building circuit…"}
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && navigate()}
            disabled={status !== "established"}
            spellCheck={false}
          />
          {currentUrl && (
            <a href={currentUrl} target="_blank" rel="noreferrer" title="Open in new tab">
              <ExternalLink size={11} style={{ color: "#4A4A54" }} />
            </a>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {status === "established" && (
            <button
              onClick={() => setShowCircuit((v) => !v)}
              className="text-[9px] px-2 py-1 rounded-lg"
              style={{ background: showCircuit ? "rgba(40,200,64,0.1)" : "rgba(30,30,34,0.6)", border: "1px solid #1A1A1E", color: showCircuit ? "#28C840" : "#4A4A54" }}
            >
              circuit
            </button>
          )}
          <button
            onClick={status === "established" || status === "renewing" ? renewCircuit : buildCircuit}
            disabled={status === "building" || status === "renewing"}
            className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-lg"
            style={{ background: "rgba(30,30,34,0.6)", border: "1px solid #1A1A1E", color: STATUS_COLOR[status], opacity: (status === "building" || status === "renewing") ? 0.5 : 1 }}
          >
            <RefreshCw size={10} className={status === "building" || status === "renewing" ? "animate-spin" : ""} />
            {status === "idle" ? "connect" : status === "building" ? "building…" : status === "renewing" ? "renewing…" : "new circuit"}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: circuit panel (collapsible) */}
        <AnimatePresence initial={false}>
          {showCircuit && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring" as const, stiffness: 320, damping: 28 }}
              className="shrink-0 flex flex-col overflow-hidden"
              style={{ borderRight: "1px solid #0D0D10" }}
            >
              {/* Circuit viz */}
              <div className="h-[120px] shrink-0" style={{ borderBottom: "1px solid #0D0D10" }}>
                <CircuitViz nodes={nodes} status={status} />
              </div>

              {/* Relay cards */}
              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
                {nodes.map((node, i) => (
                  <RelayCard key={node.fingerprint} node={node} index={i} status={status} />
                ))}
              </div>

              {/* Stats */}
              <div className="px-3 py-2 shrink-0 grid grid-cols-3 gap-1" style={{ borderTop: "1px solid #0D0D10" }}>
                {[
                  { label: "↓ IN",  val: fmtBytes(bytesIn) },
                  { label: "↑ OUT", val: fmtBytes(bytesOut) },
                  { label: "⏱",      val: uptime > 0 ? fmtUptime(uptime) : "--" },
                ].map(({ label, val }) => (
                  <div key={label} className="text-center">
                    <div className="text-[7px]" style={{ color: "#4A4A54" }}>{label}</div>
                    <div className="text-[9px]" style={{ color: "#7A7A72" }}>{val}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Browser / status area */}
          <div className="flex-1 relative overflow-hidden" style={{ background: "#050506" }}>
            {status !== "established" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <motion.div
                  animate={status === "building" ? { scale: [1, 1.1, 1], opacity: [0.4, 1, 0.4] } : {}}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  className="text-5xl"
                >
                  🧅
                </motion.div>
                <div className="text-[13px] font-semibold" style={{ color: "#C8A97E" }}>
                  {status === "idle" ? "Disconnected" : "Building Circuit…"}
                </div>
                <div className="text-[10px]" style={{ color: "#4A4A54" }}>
                  {status === "building" ? "Negotiating onion layers — please wait" : "Click connect to route through Tor"}
                </div>
              </div>
            ) : currentUrl ? (
              <>
                {!iframeLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#28C840" }} />
                      <span className="text-[11px] font-mono" style={{ color: "#4A4A54" }}>Routing through Tor…</span>
                    </div>
                  </div>
                )}
                <iframe
                  key={currentUrl}
                  src={currentUrl}
                  className="w-full h-full border-0"
                  style={{ opacity: iframeLoaded ? 1 : 0, transition: "opacity 0.3s", background: "#fff" }}
                  onLoad={() => setIframeLoaded(true)}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  title="Tor Browser"
                />
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8">
                <div className="text-3xl opacity-60">🧅</div>
                <div className="text-center">
                  <div className="text-[13px] font-semibold mb-1" style={{ color: "#28C840" }}>
                    Circuit Established
                  </div>
                  <div className="text-[10px]" style={{ color: "#4A4A54" }}>
                    3 hops · encrypted · anonymous
                  </div>
                </div>
                {/* Exit node info */}
                {nodes[2] && (
                  <div className="rounded-xl p-3 w-full max-w-xs" style={{ background: "#0A0A0C", border: "1px solid #111115" }}>
                    <div className="text-[8px] tracking-widest mb-2" style={{ color: "#4A4A54" }}>EXIT NODE</div>
                    <div className="flex items-center gap-2">
                      <span>{nodes[2].flag}</span>
                      <div>
                        <div className="text-[11px] font-mono" style={{ color: "#A78BFA" }}>{nodes[2].name}</div>
                        <div className="text-[9px]" style={{ color: "#5A5A62" }}>{nodes[2].country} · {nodes[2].ip}</div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="text-[10px]" style={{ color: "#3A3A42" }}>
                  Type a URL in the address bar to browse
                </div>
              </div>
            )}
          </div>

          {/* Log console */}
          <div
            className="h-[100px] shrink-0 overflow-y-auto px-3 py-2"
            style={{ background: "#030304", borderTop: "1px solid #0D0D10" }}
          >
            <div className="text-[7px] tracking-widest mb-1" style={{ color: "#4A4A54" }}>TOR LOG</div>
            {log.length === 0 ? (
              <div className="text-[9px]" style={{ color: "#3A3A42" }}>No entries</div>
            ) : (
              log.map((line, i) => (
                <div key={i} className="text-[9px] leading-[1.6]" style={{ color: i === 0 ? "#8A8A7A" : "#4A4A54" }}>
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
