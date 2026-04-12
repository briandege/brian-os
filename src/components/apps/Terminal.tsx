"use client";
import { useState, useRef, useEffect, KeyboardEvent, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useWindowStore } from "@/lib/windowStore";
import { checkHealth, fetchNews, triggerIngest, AXIRA_BASE } from "@/lib/axiraClient";
import { useSettingsStore, TERMINAL_THEMES } from "@/lib/settingsStore";
import { useTerminalStore, type TerminalTab } from "@/lib/terminalStore";
import type { AppId } from "@/types";

// Load real xterm PTY terminal (Electron-only, no SSR)
const RealTerminal = dynamic(() => import("./RealTerminal"), { ssr: false });

const PROMPT = "brian@strontium:~$ ";

const BANNER = `
 █████╗ ██╗  ██╗██╗██████╗  █████╗
██╔══██╗╚██╗██╔╝██║██╔══██╗██╔══██╗
███████║ ╚███╔╝ ██║██████╔╝███████║
██╔══██║ ██╔██╗ ██║██╔══██╗██╔══██║
██║  ██║██╔╝ ██╗██║██║  ██║██║  ██║
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝`.trim();

const HELP_TEXT = `
Commands:
  whoami         About Brian Ndege
  neofetch       System & profile snapshot
  open <app>     Open an app (terminal, about, axira, projects,
                   skills, contact, resume, notebook, simulation,
                   systemmonitor, tor, clearnet, settings)
  skills         Open Skills.db
  projects       Open Projects
  axira          Launch AxiraNews
  contact        Open Contact
  resume         Open Resume
  simulation     Launch Simulation engine
  notebook       Open JupyterLab
  ls             List directory
  cat <file>     Read a file  (resume.md, about.txt, contact.txt)
  echo <text>    Print text
  ps             Running processes
  history        Command history
  pwd            Working directory
  date           Current date/time
  uname          Kernel info
  axira status   Check AxiraNews backend health
  axira news     Fetch latest headlines from backend
  axira search <q> Search AxiraNews articles
  axira ingest   Trigger news ingestion (admin)
  clear          Clear terminal  (also Ctrl+L)
  help           This menu
`.trim();

const NEOFETCH = `
           ████████          brian@strontium
          ██████████         ──────────────────────────
         ████  ████          OS:     strontium.os  6.1.0-strontium
        ██  ██  ████         Kernel: Next.js 15 · React 19
       ████████████          Shell:  zsh 5.9
      ██████████████         Resolution: adaptive × adaptive
     ████  ████  ████        WM:     Framer Motion
    ██  ██  ██  ██  ██       Theme:  Void Dark [Axira]
   ████████████████████      Icons:  Lucide React
  ██████████████████████     Memory: 64 GB LPDDR5
                             CPU:    Apple M-Series · 12 cores
  ████  ████  ████  ████     GPU:    Apple Neural Engine
  ████  ████  ████  ████     Stack:  TypeScript · Python · Swift`.trim();

const FS: Record<string, string> = {
  "resume.md": `# Brian Ndege
Software Engineer · AI Engineer · Cybersecurity

## Stack
  Languages:  TypeScript · Python · Swift · Go · SQL
  Frontend:   Next.js · React · SwiftUI · Tailwind
  Backend:    Fastify · FastAPI · Node.js
  Database:   PostgreSQL · Redis · Prisma · SwiftData
  AI/ML:      Recommendation Systems · NLP · Local LLMs
  Security:   OSINT · JWT/OAuth · Antivirus Systems
  Cloud:      Railway · Vercel · Cloudflare · Azure

## Projects
  AxiraNews       AI-powered news intelligence platform
  strontium.os        This portfolio OS
  Axira AV        Custom antivirus engine
  OSINT Suite     IP/domain/CVE intelligence

## Contact
  Email:    brian@strontiumnews.com
  GitHub:   github.com/briandege`,

  "about.txt": `Full-stack developer and AI systems builder.
I build intelligence tools from the data layer up.
Currently working on AxiraNews — a real-time
AI-powered global news platform.`,

  "contact.txt": `Email:    brian@strontiumnews.com
GitHub:   github.com/briandege
LinkedIn: linkedin.com/in/briandege
Web:      axiranews.com`,
};

const APP_IDS: AppId[] = [
  "terminal","about","axira","projects","skills",
  "contact","resume","notebook","simulation","systemmonitor",
  "tor","clearnet","settings","quantum",
];

type LineType = "banner" | "input" | "output" | "error" | "blank" | "dim" | "success";
interface Line { type: LineType; text: string }

const INITIAL: Line[] = [
  { type: "banner",  text: BANNER },
  { type: "dim",     text: "strontium.os terminal v2.0  —  type 'help' for commands" },
  { type: "blank",   text: "" },
];

// ── Multi-tab PTY terminal ────────────────────────────────────────────────────

function MultiTabTerminal({ onPtyFail }: { onPtyFail: () => void }) {
  const { tabs, activeId, addTab, removeTab, setActiveTab, updateTab } = useTerminalStore();
  const terminalTheme = useSettingsStore((s) => s.terminalTheme);
  const theme         = TERMINAL_THEMES[terminalTheme];

  const openNewTab = useCallback(() => {
    const tab: TerminalTab = {
      id:        `tab-${Date.now()}`,
      title:     `Shell ${tabs.length + 1}`,
      status:    "connecting",
      createdAt: Date.now(),
    };
    addTab(tab);
  }, [tabs.length, addTab]);

  // Open first tab on mount
  useEffect(() => {
    if (tabs.length === 0) openNewTab();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeTab = useCallback((id: string) => {
    // Destroy the PTY session — RealTerminal's destroyOnUnmount handles this
    // but we also need to remove from the tab store
    removeTab(id);
  }, [removeTab]);

  return (
    <div className="h-full flex flex-col" style={{ background: theme.bg }}>
      {/* Tab bar */}
      <div
        className="flex items-center gap-0 shrink-0 overflow-x-auto"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)", minHeight: 34 }}
      >
        <AnimatePresence initial={false}>
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0, scaleX: 0.7 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0, scaleX: 0.7 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono shrink-0 relative"
              style={{
                color:      tab.id === activeId ? theme.fg : theme.fg + "66",
                background: tab.id === activeId ? "rgba(255,255,255,0.06)" : "transparent",
                borderRight: "1px solid rgba(255,255,255,0.04)",
                maxWidth: 140,
              }}
            >
              <span className="truncate">{tab.title}</span>
              {tab.status === "connecting" && (
                <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: theme.yellow }} />
              )}
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                className="ml-0.5 rounded opacity-40 hover:opacity-100 transition-opacity"
                style={{ color: theme.red }}
              >
                <X size={10} />
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
        <button
          onClick={openNewTab}
          className="px-2 py-1.5 opacity-40 hover:opacity-80 transition-opacity shrink-0"
          style={{ color: theme.fg }}
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Terminal panes — keep all mounted via visibility, only show active */}
      <div className="flex-1 relative overflow-hidden">
        {tabs.map((tab, idx) => (
          <div
            key={tab.id}
            className="absolute inset-0"
            style={{ visibility: tab.id === activeId ? "visible" : "hidden" }}
          >
            <RealTerminal
              onReady={() => updateTab(tab.id, { title: `Shell ${idx + 1}`, status: "ready" })}
              onExit={() => updateTab(tab.id, { status: "exited", title: `[exited ${idx + 1}]` })}
              onPtyFail={onPtyFail}
              destroyOnUnmount={true}
              active={tab.id === activeId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TerminalApp() {
  const { open } = useWindowStore();
  const [lines, setLines] = useState<Line[]>(INITIAL);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const terminalFontSize = useSettingsStore((s) => s.terminalFontSize);
  const terminalTheme    = useSettingsStore((s) => s.terminalTheme);
  const theme            = TERMINAL_THEMES[terminalTheme];

  const [ptyFailed, setPtyFailed] = useState(false);

  // In Electron (with preload), use the real PTY terminal (unless PTY spawn failed)
  const isElectron = typeof window !== "undefined" && !!window.electronAPI;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lines]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const push    = (line: Line) => setLines((l) => [...l, line]);
  const out     = (text: string) => text.split("\n").forEach((t) => push({ type: "output", text: t }));
  const err     = (text: string) => push({ type: "error",   text });
  const success = (text: string) => push({ type: "success", text });
  const blank   = () => push({ type: "blank", text: "" });

  function run(raw: string) {
    const trimmed = raw.trim();
    push({ type: "input", text: PROMPT + raw });

    if (!trimmed) { blank(); return; }
    setHistory((h) => [raw, ...h.slice(0, 49)]);
    setHistIdx(-1);

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case "help":
        out(HELP_TEXT);
        break;

      case "whoami":
        out("Brian Ndege");
        out("Full-stack engineer · AI systems builder · Cybersecurity specialist");
        out("Building intelligence infrastructure from scratch.");
        break;

      case "neofetch":
        push({ type: "banner", text: NEOFETCH });
        break;

      case "open": {
        const target = args[0]?.toLowerCase() as AppId;
        if (!target) { err("usage: open <app>"); break; }
        if (APP_IDS.includes(target)) {
          open(target);
          success(`→ opened ${target}`);
        } else {
          err(`open: unknown app '${target}'\nAvailable: ${APP_IDS.join(", ")}`);
        }
        break;
      }

      case "echo":
        out(args.join(" ") || "");
        break;

      case "skills":       open("skills");       success("→ opening Skills.db");        break;
      case "projects":     open("projects");     success("→ opening Projects");          break;
      case "axira":        open("axira");        success("→ launching AxiraNews");       break;
      case "contact":      open("contact");      success("→ opening Contact");           break;
      case "resume":       open("resume");       success("→ opening Resume");            break;
      case "notebook":
      case "jupyter":      open("notebook");     success("→ launching JupyterLab");      break;
      case "simulation":   open("simulation");   success("→ launching simulation engine"); break;
      case "tor":          open("tor");          success("→ launching Tor Browser");                    break;
      case "clearnet":
      case "browser":      open("clearnet");     success("→ launching Clearnet Browser (admin required)"); break;
      case "sudo": {
        const sub = args[0];
        if (sub === "clearnet" || sub === "browser") {
          open("clearnet"); success("→ root access granted — launching Clearnet Browser");
        } else if (sub) {
          err(`sudo: ${sub}: command not found`);
        } else {
          err("usage: sudo <command>");
        }
        break;
      }
      case "axira": {
        const sub2 = args[0];
        if (!sub2 || sub2 === "status") {
          out(`Pinging ${AXIRA_BASE}…`);
          checkHealth().then((h) => {
            out(`API        ${h.api.status === "online" ? "●" : "○"} ${h.api.status}  ${h.api.latencyMs}ms`);
            out(`PostgreSQL ${h.postgres.status === "online" ? "●" : "○"} ${h.postgres.status}  ${h.postgres.latencyMs}ms`);
            out(`Redis      ${h.redis.status === "online" ? "●" : "○"} ${h.redis.status}  ${h.redis.latencyMs}ms`);
            if (!h.reachable) err("Backend unreachable — is the server running?");
            else success("All systems nominal");
            blank();
          });
        } else if (sub2 === "news") {
          out("Fetching headlines…");
          fetchNews({ limit: 5 }).then((articles) => {
            if (!articles.length) { err("No articles returned — backend may be offline"); blank(); return; }
            articles.forEach((a, i) => out(`${i + 1}. [${a.category}] ${a.title}  — ${a.source}`));
            blank();
          });
        } else if (sub2 === "search") {
          const q = args.slice(1).join(" ");
          if (!q) { err("usage: axira search <query>"); break; }
          out(`Searching for "${q}"…`);
          fetchNews({ search: q, limit: 5 }).then((articles) => {
            if (!articles.length) { out("No results found"); blank(); return; }
            articles.forEach((a, i) => out(`${i + 1}. ${a.title}  [${a.category}]`));
            blank();
          });
        } else if (sub2 === "ingest") {
          out("Triggering ingestion pipeline…");
          triggerIngest().then((ok) => {
            if (ok) success("✓ Ingestion triggered successfully");
            else err("Failed — check auth token or backend status");
            blank();
          });
        } else {
          err(`axira: unknown subcommand '${sub2}'`);
          out("Usage: axira [status|news|search <q>|ingest]");
        }
        break;
      }
      case "about":        open("about");        success("→ opening about.brian");       break;
      case "settings":     open("settings");     success("→ opening Settings");          break;
      case "quantum":      open("quantum");      success("→ launching Quantum Lab");     break;

      case "ls":
        out("total 4");
        out("drwxr-xr-x  projects/");
        out("-rw-r--r--  resume.md");
        out("-rw-r--r--  about.txt");
        out("-rw-r--r--  contact.txt");
        break;

      case "cat": {
        const file = args.join(" ");
        if (!file) { err("usage: cat <filename>"); break; }
        const content = FS[file];
        if (content) out(content);
        else err(`cat: ${file}: No such file or directory`);
        break;
      }

      case "ps":
        out("  PID TTY          TIME CMD");
        out("    1 ?        00:00:01 systemd");
        out("  420 ?        00:00:04 node (AxiraNews API)");
        out("  421 ?        00:00:02 postgres");
        out("  422 ?        00:00:01 redis-server");
        out("  888 pts/0    00:00:00 zsh");
        out(" 1337 pts/0    00:00:00 strontium.os");
        break;

      case "history":
        if (history.length === 0) { out("(no history)"); break; }
        history.slice().reverse().forEach((h, i) => out(`  ${i + 1}  ${h}`));
        break;

      case "clear":
      case "cls":
        setLines([{ type: "dim", text: "strontium.os terminal v2.0" }, { type: "blank", text: "" }]);
        return;

      case "pwd":   out("/home/brian"); break;
      case "date":  out(new Date().toString()); break;
      case "uname": out("Linux strontium-os 6.1.0-strontium #1 SMP ARM64 GNU/Linux"); break;
      case "exit":  out("Use the ✕ button to close the window."); break;
      case "sudo":  err("Nice try."); break;
      case "rm":    err("Permission denied. (nice try)"); break;
      case "vim":
      case "nano":  err("nano/vim not available — use the GUI apps instead."); break;
      case "curl":  err("curl: network access disabled in sandbox."); break;
      case "ping":  out(`PING ${args[0] ?? "axira.internal"}: 64 bytes, ttl=64, time=1.2ms`); break;

      default:
        err(`command not found: ${cmd}  —  try 'help'`);
    }
    blank();
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { run(input); setInput(""); }
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(next); setInput(history[next] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next); setInput(next === -1 ? "" : history[next]);
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([{ type: "blank", text: "" }]);
    } else if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      push({ type: "input", text: PROMPT + input + "^C" });
      setInput("");
      blank();
    }
  }

  const lineStyle = (type: LineType): React.CSSProperties => {
    switch (type) {
      case "banner":  return { color: theme.cursor, fontWeight: 600, lineHeight: 1.3 };
      case "input":   return { color: theme.fg };
      case "output":  return { color: theme.fg + "99" };
      case "error":   return { color: theme.red };
      case "success": return { color: theme.green };
      case "dim":     return { color: theme.fg + "44" };
      default:        return { color: "transparent" };
    }
  };

  if (isElectron && !ptyFailed) return <MultiTabTerminal onPtyFail={() => setPtyFailed(true)} />;

  return (
    <div
      className="h-full flex flex-col font-mono leading-[1.7]"
      style={{ background: theme.bg, fontSize: terminalFontSize }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Output */}
      <div className="flex-1 overflow-y-auto p-4 pb-2">
        {lines.map((line, i) => (
          <div key={i} style={{ ...lineStyle(line.type), whiteSpace: "pre", overflowX: "auto" }}>
            {line.text || "\u00A0"}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div
        className="flex items-center px-4 py-2.5 gap-0 shrink-0"
        style={{ borderTop: "1px solid #111115" }}
      >
        <span style={{ color: theme.cursor + "AA" }}>brian</span>
        <span style={{ color: theme.fg + "55" }}>@strontium</span>
        <span style={{ color: theme.fg + "44" }}>:~</span>
        <span style={{ color: theme.cursor }}>$ </span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          className="flex-1 bg-transparent outline-none"
          style={{ color: theme.fg, caretColor: theme.cursor }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
        <span className="terminal-cursor leading-none" style={{ color: theme.cursor }}>█</span>
      </div>
    </div>
  );
}
