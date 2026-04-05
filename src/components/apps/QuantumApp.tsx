"use client";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Plus, Minus, Cpu, FlaskConical, BookOpen, Trash2, ChevronRight } from "lucide-react";

// ══════════════════════════════════════════════════════════════════════════════
// Quantum Simulator Core
// ══════════════════════════════════════════════════════════════════════════════

type Cx = [number, number];
const cadd  = (a: Cx, b: Cx): Cx => [a[0]+b[0], a[1]+b[1]];
const cmul  = (a: Cx, b: Cx): Cx => [a[0]*b[0]-a[1]*b[1], a[0]*b[1]+a[1]*b[0]];
const cabs2 = (a: Cx)         => a[0]*a[0]+a[1]*a[1];
const S2 = 1 / Math.SQRT2;

type Mat2 = [Cx, Cx, Cx, Cx]; // row-major 2×2
const MATS: Record<string, Mat2> = {
  H: [[S2,0],[S2,0],[S2,0],[-S2,0]],
  X: [[0,0],[1,0],[1,0],[0,0]],
  Y: [[0,0],[0,-1],[0,1],[0,0]],
  Z: [[1,0],[0,0],[0,0],[-1,0]],
  S: [[1,0],[0,0],[0,0],[0,1]],
  T: [[1,0],[0,0],[0,0],[S2,S2]],
};

function initState(n: number): Cx[] {
  const s: Cx[] = Array.from({ length: 1 << n }, () => [0, 0] as Cx);
  s[0] = [1, 0];
  return s;
}

function applyGate1(state: Cx[], g: string, q: number, n: number): Cx[] {
  const m = MATS[g];
  const out = [...state];
  const mask = 1 << (n - 1 - q);
  for (let i = 0; i < 1 << n; i++) {
    if ((i & mask) === 0) {
      const j = i | mask;
      const a = state[i], b = state[j];
      out[i] = cadd(cmul(m[0], a), cmul(m[1], b));
      out[j] = cadd(cmul(m[2], a), cmul(m[3], b));
    }
  }
  return out;
}

function applyCNOT(state: Cx[], ctrl: number, tgt: number, n: number): Cx[] {
  const out = [...state];
  const cM = 1 << (n - 1 - ctrl), tM = 1 << (n - 1 - tgt);
  for (let i = 0; i < 1 << n; i++) {
    if ((i & cM) && (i ^ tM) > i) { out[i] = state[i ^ tM]; out[i ^ tM] = state[i]; }
  }
  return out;
}

function applySWAP(s: Cx[], q1: number, q2: number, n: number): Cx[] {
  return applyCNOT(applyCNOT(applyCNOT(s, q1, q2, n), q2, q1, n), q1, q2, n);
}

// ── Circuit types ────────────────────────────────────────────────────────────

type SingleOp = { type: "H"|"X"|"Y"|"Z"|"S"|"T"; qubit: number };
type CnotOp   = { type: "CNOT"; control: number; target: number };
type SwapOp   = { type: "SWAP"; q1: number; q2: number };
export type CircuitOp = SingleOp | CnotOp | SwapOp;

function runCircuit(ops: CircuitOp[], n: number): Cx[] {
  let s = initState(n);
  for (const op of ops) {
    if (op.type === "CNOT") s = applyCNOT(s, op.control, op.target, n);
    else if (op.type === "SWAP") s = applySWAP(s, op.q1, op.q2, n);
    else s = applyGate1(s, op.type, op.qubit, n);
  }
  return s;
}

function sampleMeasure(state: Cx[], shots = 1024): Record<string, number> {
  const n = Math.round(Math.log2(state.length));
  const probs = state.map(cabs2);
  const counts: Record<string, number> = {};
  for (let s = 0; s < shots; s++) {
    let r = Math.random(), idx = state.length - 1;
    for (let i = 0; i < state.length; i++) { r -= probs[i]; if (r <= 0) { idx = i; break; } }
    const k = idx.toString(2).padStart(n, "0");
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return counts;
}

function fmtCx([r, i]: Cx): string {
  if (Math.abs(r) < 1e-4 && Math.abs(i) < 1e-4) return "0";
  if (Math.abs(i) < 1e-4) return r.toFixed(3);
  if (Math.abs(r) < 1e-4) return `${i.toFixed(3)}i`;
  return `${r.toFixed(3)}${i >= 0 ? "+" : ""}${i.toFixed(3)}i`;
}

// ── Presets ──────────────────────────────────────────────────────────────────

interface Preset { name: string; desc: string; qubits: number; ops: CircuitOp[]; insight: string }

const PRESETS: Preset[] = [
  {
    name: "Bell State |Φ⁺⟩", qubits: 2,
    desc: "Maximally entangled 2-qubit state.",
    ops: [{ type:"H", qubit:0 }, { type:"CNOT", control:0, target:1 }],
    insight: "(|00⟩+|11⟩)/√2 — foundation of quantum teleportation & QKD.",
  },
  {
    name: "GHZ State", qubits: 3,
    desc: "3-qubit Greenberger–Horne–Zeilinger entanglement.",
    ops: [{ type:"H", qubit:0 }, { type:"CNOT", control:0, target:1 }, { type:"CNOT", control:0, target:2 }],
    insight: "(|000⟩+|111⟩)/√2 — used in quantum error correction and Bell inequality tests.",
  },
  {
    name: "Superposition", qubits: 1,
    desc: "Single qubit in equal superposition via Hadamard.",
    ops: [{ type:"H", qubit:0 }],
    insight: "|0⟩ → (|0⟩+|1⟩)/√2 — the foundation of quantum parallelism.",
  },
  {
    name: "Quantum Phase Kickback", qubits: 2,
    desc: "Phase kickback from oracle onto control qubit.",
    ops: [{ type:"H", qubit:0 }, { type:"X", qubit:1 }, { type:"H", qubit:1 }, { type:"CNOT", control:0, target:1 }, { type:"H", qubit:0 }],
    insight: "Core primitive in Deutsch–Jozsa and Grover's algorithm.",
  },
  {
    name: "Grover's Search (2Q)", qubits: 2,
    desc: "Search N=4 items in O(√N) steps. Marks |11⟩.",
    ops: [
      { type:"H", qubit:0 }, { type:"H", qubit:1 },
      { type:"X", qubit:0 }, { type:"X", qubit:1 }, { type:"CNOT", control:0, target:1 }, { type:"X", qubit:0 }, { type:"X", qubit:1 },
      { type:"H", qubit:0 }, { type:"H", qubit:1 }, { type:"X", qubit:0 }, { type:"X", qubit:1 },
      { type:"CNOT", control:0, target:1 }, { type:"X", qubit:0 }, { type:"X", qubit:1 }, { type:"H", qubit:0 }, { type:"H", qubit:1 },
    ],
    insight: "Classical: O(N). Quantum: O(√N). For N=2²=4, one Grover iteration amplifies |11⟩ to probability ≈1.",
  },
  {
    name: "QFT (2 qubits)", qubits: 2,
    desc: "2-qubit Quantum Fourier Transform — key subroutine in Shor's algorithm.",
    ops: [{ type:"H", qubit:0 }, { type:"S", qubit:0 }, { type:"CNOT", control:1, target:0 }, { type:"H", qubit:1 }, { type:"SWAP", q1:0, q2:1 }],
    insight: "QFT runs in O(n2) gates vs classical FFT O(n*2n). Powers Shor integer factoring.",
  },
];

// ── Gate palette ─────────────────────────────────────────────────────────────

const GATE_META: Record<string, { color: string; desc: string }> = {
  H:    { color: "#C8A97E", desc: "Hadamard — superposition" },
  X:    { color: "#FF5F57", desc: "Pauli-X — bit flip" },
  Y:    { color: "#FF9F0A", desc: "Pauli-Y — bit+phase flip" },
  Z:    { color: "#5AC8FA", desc: "Pauli-Z — phase flip" },
  S:    { color: "#B48EAD", desc: "S gate — π/2 phase" },
  T:    { color: "#28C840", desc: "T gate — π/4 phase" },
  CNOT: { color: "#FF5F57", desc: "CNOT — controlled NOT" },
  SWAP: { color: "#FEBC2E", desc: "SWAP — exchange qubits" },
};

// ══════════════════════════════════════════════════════════════════════════════
// Circuit SVG Renderer
// ══════════════════════════════════════════════════════════════════════════════

const STEP_W = 56, QUBIT_H = 52, LABEL_W = 36, PAD = 16;

function CircuitSVG({
  ops, numQubits, onRemove,
}: {
  ops: CircuitOp[];
  numQubits: number;
  onRemove?: (i: number) => void;
}) {
  const W = LABEL_W + ops.length * STEP_W + PAD * 2;
  const H = numQubits * QUBIT_H + PAD * 2;

  const qY = (q: number) => PAD + q * QUBIT_H + QUBIT_H / 2;

  return (
    <svg width={Math.max(W, 260)} height={H} style={{ overflow: "visible" }}>
      {/* Qubit labels + wires */}
      {Array.from({ length: numQubits }, (_, q) => (
        <g key={q}>
          <text x={4} y={qY(q) + 4} fontSize={11} fill="#4A4A56" fontFamily="monospace">
            q{q}
          </text>
          <line
            x1={LABEL_W} y1={qY(q)} x2={W} y2={qY(q)}
            stroke="#1E1E26" strokeWidth={1.5}
          />
        </g>
      ))}

      {/* Gates */}
      {ops.map((op, step) => {
        const x = LABEL_W + step * STEP_W + STEP_W / 2;

        if (op.type === "CNOT") {
          const cy = qY(op.control), ty = qY(op.target);
          const col = GATE_META.CNOT.color;
          return (
            <g key={step} onClick={() => onRemove?.(step)} style={{ cursor: "pointer" }}>
              <line x1={x} y1={Math.min(cy, ty)} x2={x} y2={Math.max(cy, ty)} stroke={col} strokeWidth={1.5} strokeOpacity={0.7} />
              <circle cx={x} cy={cy} r={6} fill={col} />
              <circle cx={x} cy={ty} r={10} fill="none" stroke={col} strokeWidth={1.5} />
              <line x1={x} y1={ty - 10} x2={x} y2={ty + 10} stroke={col} strokeWidth={1.5} />
              <line x1={x - 10} y1={ty} x2={x + 10} y2={ty} stroke={col} strokeWidth={1.5} />
            </g>
          );
        }

        if (op.type === "SWAP") {
          const y1 = qY(op.q1), y2 = qY(op.q2);
          const col = GATE_META.SWAP.color;
          const cross = (cx: number, cy: number) => (
            <g>
              <line x1={cx-8} y1={cy-8} x2={cx+8} y2={cy+8} stroke={col} strokeWidth={2} />
              <line x1={cx+8} y1={cy-8} x2={cx-8} y2={cy+8} stroke={col} strokeWidth={2} />
            </g>
          );
          return (
            <g key={step} onClick={() => onRemove?.(step)} style={{ cursor: "pointer" }}>
              <line x1={x} y1={y1} x2={x} y2={y2} stroke={col} strokeWidth={1.5} strokeOpacity={0.6} />
              {cross(x, y1)}{cross(x, y2)}
            </g>
          );
        }

        // Single-qubit gate
        const y = qY(op.qubit);
        const col = GATE_META[op.type]?.color ?? "#888";
        return (
          <g key={step} onClick={() => onRemove?.(step)} style={{ cursor: "pointer" }}>
            <rect x={x - 16} y={y - 13} width={32} height={26} rx={5}
              fill={col + "22"} stroke={col} strokeWidth={1.2} />
            <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight="700"
              fill={col} fontFamily="monospace">
              {op.type}
            </text>
          </g>
        );
      })}

      {/* End markers */}
      {Array.from({ length: numQubits }, (_, q) => (
        <line key={q} x1={W - 4} y1={qY(q) - 8} x2={W - 4} y2={qY(q) + 8}
          stroke="#2A2A34" strokeWidth={2} />
      ))}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main App
// ══════════════════════════════════════════════════════════════════════════════

const SECTIONS = [
  { id: "lab",        label: "Circuit Lab",   icon: <FlaskConical size={14} /> },
  { id: "algorithms", label: "Algorithms",    icon: <BookOpen size={14} /> },
  { id: "hardware",   label: "Hardware",      icon: <Cpu size={14} /> },
] as const;
type SectionId = typeof SECTIONS[number]["id"];

const HARDWARE = [
  { name: "IBM Quantum Eagle", qubits: 127, tech: "Superconducting", fidelity: "99.5%", speed: "~50 ns gate", color: "#5AC8FA", status: "Available" },
  { name: "Google Sycamore", qubits: 53, tech: "Superconducting", fidelity: "99.7%", speed: "~12 ns gate", color: "#28C840", status: "Research" },
  { name: "IonQ Forte", qubits: 36, tech: "Trapped Ion", fidelity: "99.9%", speed: "~100 μs gate", color: "#B48EAD", status: "Commercial" },
  { name: "Rigetti Ankaa", qubits: 84, tech: "Superconducting", fidelity: "99.0%", speed: "~40 ns gate", color: "#FEBC2E", status: "Cloud" },
  { name: "PsiQuantum", qubits: "~1M (target)", tech: "Photonic", fidelity: "—", speed: "Speed of light", color: "#FF9F0A", status: "2025+" },
];

export default function QuantumApp() {
  const [section, setSection] = useState<SectionId>("lab");
  const [numQubits, setNumQubits] = useState(2);
  const [ops, setOps] = useState<CircuitOp[]>([{ type:"H", qubit:0 }, { type:"CNOT", control:0, target:1 }]);
  const [selectedGate, setSelectedGate] = useState<string>("H");
  const [selectedQubit, setSelectedQubit] = useState(0);
  const [controlQubit, setControlQubit] = useState(0);
  const [targetQubit, setTargetQubit] = useState(1);
  const [ran, setRan] = useState(false);
  const [shots, setShots] = useState<Record<string, number>>({});

  const stateVec = useMemo(() => runCircuit(ops, numQubits), [ops, numQubits]);

  const probs = useMemo(() =>
    stateVec.map(cabs2).map((p, i) => ({
      label: i.toString(2).padStart(numQubits, "0"),
      prob: p,
      amp: stateVec[i],
    })).filter(x => x.prob > 1e-6),
    [stateVec, numQubits]
  );

  const maxProb = useMemo(() => Math.max(...probs.map(x => x.prob), 0.01), [probs]);

  const addOp = useCallback(() => {
    if (selectedGate === "CNOT") {
      if (controlQubit === targetQubit) return;
      setOps(o => [...o, { type:"CNOT", control: controlQubit, target: targetQubit }]);
    } else if (selectedGate === "SWAP") {
      if (controlQubit === targetQubit) return;
      setOps(o => [...o, { type:"SWAP", q1: controlQubit, q2: targetQubit }]);
    } else {
      setOps(o => [...o, { type: selectedGate as SingleOp["type"], qubit: selectedQubit }]);
    }
    setRan(false);
  }, [selectedGate, selectedQubit, controlQubit, targetQubit]);

  const runSim = useCallback(() => {
    setShots(sampleMeasure(stateVec));
    setRan(true);
  }, [stateVec]);

  const loadPreset = useCallback((p: Preset) => {
    setNumQubits(p.qubits);
    setOps(p.ops);
    setRan(false);
    setShots({});
  }, []);

  return (
    <div className="h-full flex" style={{ background: "#060608" }}>
      {/* Sidebar */}
      <nav className="w-44 shrink-0 flex flex-col py-4 gap-0.5 px-2"
        style={{ borderRight: "1px solid #0E0E14", background: "#050508" }}>
        <div className="text-[10px] font-semibold uppercase tracking-[0.15em] px-3 mb-2" style={{ color: "#2A2A36" }}>
          quantum
        </div>
        {SECTIONS.map(s => {
          const active = section === s.id;
          return (
            <motion.button key={s.id} onClick={() => setSection(s.id)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[12px] font-medium"
              style={{
                background: active ? "rgba(90,200,250,0.08)" : "transparent",
                color: active ? "#5AC8FA" : "#3A3A48",
                border: active ? "1px solid rgba(90,200,250,0.12)" : "1px solid transparent",
              }}
              whileHover={{ x: active ? 0 : 2 }} transition={{ duration: 0.1 }}
            >
              <span style={{ color: active ? "#5AC8FA" : "#28283A" }}>{s.icon}</span>
              {s.label}
              {active && <ChevronRight size={11} className="ml-auto" style={{ color: "#5AC8FA", opacity: 0.5 }} />}
            </motion.button>
          );
        })}

        {/* Qubit count */}
        <div className="mt-4 px-3">
          <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#2A2A36" }}>Qubits</div>
          <div className="flex items-center gap-2">
            <motion.button onClick={() => { if (numQubits > 1) { setNumQubits(n => n - 1); setOps([]); setRan(false); } }}
              className="w-6 h-6 rounded flex items-center justify-center text-[14px]"
              style={{ background: "#0E0E18", border: "1px solid #1A1A26", color: "#4A4A5A" }}
              whileTap={{ scale: 0.9 }}>
              <Minus size={10} />
            </motion.button>
            <span className="text-[16px] font-bold font-mono flex-1 text-center" style={{ color: "#5AC8FA" }}>
              {numQubits}
            </span>
            <motion.button onClick={() => { if (numQubits < 4) { setNumQubits(n => n + 1); setOps([]); setRan(false); } }}
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ background: "#0E0E18", border: "1px solid #1A1A26", color: "#4A4A5A" }}
              whileTap={{ scale: 0.9 }}>
              <Plus size={10} />
            </motion.button>
          </div>
          <div className="text-[9px] mt-1" style={{ color: "#1E1E2A" }}>max 4 qubits</div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Circuit Lab ─────────────────────────────────────────────────── */}
        {section === "lab" && (
          <div className="flex flex-col h-full">
            {/* Gate palette */}
            <div className="flex items-center gap-2 px-4 py-3 flex-wrap"
              style={{ borderBottom: "1px solid #0E0E14", background: "#060609" }}>
              {Object.entries(GATE_META).map(([g, m]) => (
                <motion.button key={g}
                  onClick={() => setSelectedGate(g)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold font-mono"
                  style={{
                    background: selectedGate === g ? m.color + "22" : "#0C0C14",
                    border: `1px solid ${selectedGate === g ? m.color + "55" : "#16161E"}`,
                    color: selectedGate === g ? m.color : "#3A3A4A",
                  }}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  title={m.desc}
                >
                  {g}
                </motion.button>
              ))}

              <div className="h-4 w-px ml-1" style={{ background: "#1A1A22" }} />

              {/* Qubit selectors */}
              {(selectedGate === "CNOT" || selectedGate === "SWAP") ? (
                <>
                  <select value={controlQubit} onChange={e => setControlQubit(+e.target.value)}
                    className="text-[11px] px-2 py-1 rounded font-mono"
                    style={{ background: "#0C0C14", border: "1px solid #16161E", color: "#5AC8FA" }}>
                    {Array.from({ length: numQubits }, (_, i) => (
                      <option key={i} value={i}>ctrl q{i}</option>
                    ))}
                  </select>
                  <select value={targetQubit} onChange={e => setTargetQubit(+e.target.value)}
                    className="text-[11px] px-2 py-1 rounded font-mono"
                    style={{ background: "#0C0C14", border: "1px solid #16161E", color: "#FF5F57" }}>
                    {Array.from({ length: numQubits }, (_, i) => (
                      <option key={i} value={i}>tgt q{i}</option>
                    ))}
                  </select>
                </>
              ) : (
                <select value={selectedQubit} onChange={e => setSelectedQubit(+e.target.value)}
                  className="text-[11px] px-2 py-1 rounded font-mono"
                  style={{ background: "#0C0C14", border: "1px solid #16161E", color: "#5AC8FA" }}>
                  {Array.from({ length: numQubits }, (_, i) => (
                    <option key={i} value={i}>q{i}</option>
                  ))}
                </select>
              )}

              <motion.button onClick={addOp}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium"
                style={{ background: "rgba(90,200,250,0.1)", border: "1px solid rgba(90,200,250,0.2)", color: "#5AC8FA" }}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Plus size={10} /> Add Gate
              </motion.button>

              <motion.button onClick={() => { setOps([]); setRan(false); setShots({}); }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px]"
                style={{ background: "#0C0C14", border: "1px solid #1A1A22", color: "#3A3A4A" }}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Trash2 size={10} />
              </motion.button>

              <div className="ml-auto">
                <motion.button onClick={runSim}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-semibold"
                  style={{ background: "rgba(40,200,64,0.12)", border: "1px solid rgba(40,200,64,0.25)", color: "#28C840" }}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Play size={11} fill="#28C840" /> Run (1024 shots)
                </motion.button>
              </div>
            </div>

            {/* Circuit diagram */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              <div className="rounded-xl p-4 overflow-x-auto"
                style={{ background: "#080810", border: "1px solid #0E0E18" }}>
                {ops.length === 0 ? (
                  <div className="text-[12px] py-4 text-center" style={{ color: "#2A2A36" }}>
                    Select a gate and click Add Gate — or load a preset below
                  </div>
                ) : (
                  <CircuitSVG
                    ops={ops} numQubits={numQubits}
                    onRemove={i => { setOps(o => o.filter((_, j) => j !== i)); setRan(false); }}
                  />
                )}
              </div>
              <div className="text-[10px]" style={{ color: "#2A2A36" }}>Click any gate to remove it</div>

              {/* State vector */}
              <div>
                <div className="text-[11px] uppercase tracking-widest mb-3 font-semibold" style={{ color: "#2A2A36" }}>
                  State Vector  ψ
                </div>
                <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                  {stateVec.map((amp, i) => {
                    const p = cabs2(amp);
                    if (p < 1e-6) return null;
                    const label = i.toString(2).padStart(numQubits, "0");
                    return (
                      <div key={i} className="rounded-lg px-3 py-2"
                        style={{ background: "#080810", border: "1px solid #0E0E18" }}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-mono text-[13px]" style={{ color: "#5AC8FA" }}>|{label}⟩</span>
                          <span className="font-mono text-[10px]" style={{ color: "#4A4A5A" }}>{(p*100).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#0E0E18" }}>
                          <motion.div className="h-full rounded-full" style={{ background: "#5AC8FA" }}
                            initial={{ width: 0 }} animate={{ width: `${(p / maxProb) * 100}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }} />
                        </div>
                        <div className="text-[10px] mt-1 font-mono" style={{ color: "#2A2A36" }}>
                          {fmtCx(amp)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Measurement results */}
              <AnimatePresence>
                {ran && Object.keys(shots).length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="text-[11px] uppercase tracking-widest mb-3 font-semibold" style={{ color: "#2A2A36" }}>
                      Measurement Histogram  (1024 shots)
                    </div>
                    <div className="rounded-xl p-4" style={{ background: "#080810", border: "1px solid #0E0E18" }}>
                      {Object.entries(shots).sort((a, b) => b[1] - a[1]).map(([label, count]) => (
                        <div key={label} className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-[12px] w-16 text-right shrink-0" style={{ color: "#5AC8FA" }}>|{label}⟩</span>
                          <div className="flex-1 h-5 rounded overflow-hidden" style={{ background: "#0C0C14" }}>
                            <motion.div className="h-full rounded"
                              style={{ background: "linear-gradient(90deg, #5AC8FA44, #5AC8FA)" }}
                              initial={{ width: 0 }}
                              animate={{ width: `${(count / 1024) * 100}%` }}
                              transition={{ duration: 0.6, ease: "easeOut" }} />
                          </div>
                          <span className="text-[11px] font-mono w-12 shrink-0" style={{ color: "#4A4A5A" }}>
                            {count}
                          </span>
                          <span className="text-[11px] font-mono w-12 shrink-0" style={{ color: "#2A2A36" }}>
                            {(count / 10.24).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Presets */}
              <div>
                <div className="text-[11px] uppercase tracking-widest mb-3 font-semibold" style={{ color: "#2A2A36" }}>
                  Preset Circuits
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map(p => (
                    <motion.button key={p.name} onClick={() => loadPreset(p)}
                      className="text-left rounded-xl px-4 py-3"
                      style={{ background: "#080810", border: "1px solid #0E0E18" }}
                      whileHover={{ borderColor: "#5AC8FA33", scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      <div className="text-[12px] font-semibold mb-1" style={{ color: "#C8C6C0" }}>{p.name}</div>
                      <div className="text-[10px] mb-1.5" style={{ color: "#3A3A4A" }}>{p.desc}</div>
                      <div className="text-[9px] font-mono" style={{ color: "#5AC8FA66" }}>{p.qubits}Q · {p.ops.length} gates</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Algorithms ──────────────────────────────────────────────────── */}
        {section === "algorithms" && (
          <div className="p-6 space-y-4">
            <div className="text-[11px] uppercase tracking-widest mb-4 font-semibold" style={{ color: "#2A2A36" }}>
              Quantum Algorithms
            </div>
            {[
              { name: "Shor's Algorithm", complexity: "O(log³N)", classical: "O(eᴺ^(1/3))", use: "Integer factorization — breaks RSA encryption",
                detail: "Combines QFT + modular exponentiation to find the period of a function. Threatens all public-key cryptography based on factoring.", color: "#FF5F57" },
              { name: "Grover's Search", complexity: "O(√N)", classical: "O(N)", use: "Unstructured database search",
                detail: "Uses amplitude amplification to quadratically speed up searching. Runs on NISQ hardware today. Weakens symmetric encryption (AES) by halving key security.", color: "#28C840" },
              { name: "Quantum Key Distribution (BB84)", complexity: "O(N)", classical: "N/A", use: "Unconditionally secure key exchange",
                detail: "Any eavesdropping on quantum channel disturbs photon states, revealing interception. Information-theoretically secure — independent of computational hardness.", color: "#5AC8FA" },
              { name: "VQE (Variational Quantum Eigensolver)", complexity: "Hybrid", classical: "O(exp(N))", use: "Molecular energy estimation for drug discovery",
                detail: "NISQ-friendly algorithm combining quantum state preparation with classical optimization. Used by pharma companies to simulate molecular interactions.", color: "#B48EAD" },
              { name: "Quantum Approximate Optimization (QAOA)", complexity: "Polynomial", classical: "NP-hard", use: "Combinatorial optimization — logistics, finance, ML",
                detail: "Variational algorithm for NP-hard problems. Encodes optimization problems into quantum Hamiltonians. Near-term hardware target for quantum advantage.", color: "#FEBC2E" },
              { name: "HHL Algorithm", complexity: "O(log N)", classical: "O(N²)", use: "Solving linear systems — machine learning, simulation",
                detail: "Exponential speedup for sparse linear systems. Underpins quantum machine learning. Requires fault-tolerant hardware — ~2030+ practical implementation.", color: "#C8A97E" },
            ].map(a => (
              <motion.div key={a.name} className="rounded-xl p-4"
                style={{ background: "#080810", border: "1px solid #0E0E18" }}
                whileHover={{ borderColor: a.color + "33" }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="text-[13px] font-semibold" style={{ color: "#C8C6C0" }}>{a.name}</div>
                  <div className="flex gap-2 shrink-0 ml-4">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: a.color + "18", color: a.color, border: `1px solid ${a.color}33` }}>
                      Q: {a.complexity}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: "#111118", color: "#3A3A4A", border: "1px solid #1A1A22" }}>
                      C: {a.classical}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] mb-2 font-medium" style={{ color: a.color + "CC" }}>{a.use}</div>
                <div className="text-[11px] leading-relaxed" style={{ color: "#3A3A4A" }}>{a.detail}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Hardware ────────────────────────────────────────────────────── */}
        {section === "hardware" && (
          <div className="p-6 space-y-4">
            <div className="text-[11px] uppercase tracking-widest mb-4 font-semibold" style={{ color: "#2A2A36" }}>
              Quantum Hardware  /  2025
            </div>
            {HARDWARE.map(h => (
              <motion.div key={h.name} className="rounded-xl p-4"
                style={{ background: "#080810", border: "1px solid #0E0E18" }}
                whileHover={{ borderColor: h.color + "33" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[13px] font-semibold" style={{ color: "#C8C6C0" }}>{h.name}</div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: h.color + "18", color: h.color, border: `1px solid ${h.color}33` }}>
                    {h.status}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Qubits", value: String(h.qubits), color: h.color },
                    { label: "Technology", value: h.tech, color: "#C8C6C0" },
                    { label: "Gate Fidelity", value: h.fidelity, color: "#28C840" },
                    { label: "Gate Speed", value: h.speed, color: "#5AC8FA" },
                  ].map(f => (
                    <div key={f.label} className="rounded-lg p-2.5" style={{ background: "#0C0C14", border: "1px solid #12121A" }}>
                      <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "#2A2A36" }}>{f.label}</div>
                      <div className="text-[12px] font-mono font-semibold" style={{ color: f.color }}>{f.value}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}

            <div className="rounded-xl p-4 mt-2" style={{ background: "#08080E", border: "1px solid #0E0E14" }}>
              <div className="text-[11px] font-semibold mb-2" style={{ color: "#3A3A48" }}>Quantum Readiness Roadmap</div>
              {[
                { year: "2025", label: "NISQ Era — ~1000 noisy qubits, limited error correction", color: "#28C840" },
                { year: "2027", label: "Fault-tolerant prototypes — first logical qubits at scale", color: "#5AC8FA" },
                { year: "2030", label: "Cryptographically relevant — Shor's on RSA-2048 possible", color: "#FEBC2E" },
                { year: "2035+", label: "Quantum advantage across chemistry, optimization, ML", color: "#B48EAD" },
              ].map(r => (
                <div key={r.year} className="flex items-start gap-3 mb-2.5 last:mb-0">
                  <span className="font-mono text-[10px] w-8 shrink-0 mt-0.5" style={{ color: r.color }}>{r.year}</span>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: r.color }} />
                  <span className="text-[11px]" style={{ color: "#3A3A4A" }}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
