"use client";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useWindowStore } from "@/lib/windowStore";
import type { AppId } from "@/types";

const PROMPT = "brian@axira:~$ ";

const BANNER = `
 █████╗ ██╗  ██╗██╗██████╗  █████╗
██╔══██╗╚██╗██╔╝██║██╔══██╗██╔══██╗
███████║ ╚███╔╝ ██║██████╔╝███████║
██╔══██║ ██╔██╗ ██║██╔══██╗██╔══██║
██║  ██║██╔╝ ██╗██║██║  ██║██║  ██║
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
`.trim();

const HELP_TEXT = `
Commands:
  whoami         About Brian Ndege
  skills         Open Skills.db window
  projects       Open Projects window
  axira          Launch AxiraNews
  contact        Open Contact
  ls             List directory
  cat <file>     Read a file (try: cat resume.md)
  pwd            Print working directory
  uname          System info
  clear          Clear terminal
  notebook       Open JupyterLab window
  simulation     Launch simulation engine
  help           This menu
`.trim();

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
  brian.os        This portfolio OS
  Axira AV        Custom antivirus engine
  OSINT Suite     IP/domain/CVE intelligence

## Contact
  Email:    brian@axiranews.com
  GitHub:   github.com/briandege`,

  "about.txt": `Full-stack developer and AI systems builder.
I build intelligence tools from the data layer up.
Currently working on AxiraNews — a real-time
AI-powered global news platform.`,

  "contact.txt": `Email:    brian@axiranews.com
GitHub:   github.com/briandege
LinkedIn: linkedin.com/in/briandege
Web:      axiranews.com`,
};

type LineType = "banner" | "input" | "output" | "error" | "blank" | "dim";
interface Line { type: LineType; text: string }

const INITIAL: Line[] = [
  { type: "banner", text: BANNER },
  { type: "dim",    text: "brian.os terminal v1.0  —  type 'help' for commands" },
  { type: "blank",  text: "" },
];

export default function TerminalApp() {
  const { open } = useWindowStore();
  const [lines, setLines] = useState<Line[]>(INITIAL);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const push  = (line: Line) => setLines((l) => [...l, line]);
  const out   = (text: string) => text.split("\n").forEach((t) => push({ type: "output", text: t }));
  const err   = (text: string) => push({ type: "error", text });
  const blank = () => push({ type: "blank", text: "" });

  function run(raw: string) {
    const cmd = raw.trim().toLowerCase();
    push({ type: "input", text: PROMPT + raw });

    if (!cmd) { blank(); return; }
    setHistory((h) => [raw, ...h.slice(0, 49)]);
    setHistIdx(-1);

    const first = cmd.split(" ")[0];
    switch (first) {
      case "help":    out(HELP_TEXT); break;
      case "whoami":
        out("Brian Ndege");
        out("Full-stack engineer · AI systems builder · Cybersecurity specialist");
        out("Building intelligence infrastructure from scratch.");
        break;
      case "skills":    open("skills"); out("→ opening Skills.db"); break;
      case "projects":  open("projects"); out("→ opening Projects"); break;
      case "axira":     open("axira"); out("→ launching AxiraNews"); break;
      case "contact":   open("contact"); out("→ opening Contact"); break;
      case "notebook":    open("notebook");    out("→ launching JupyterLab"); break;
      case "jupyter":     open("notebook");    out("→ launching JupyterLab"); break;
      case "simulation":  open("simulation");  out("→ launching simulation engine"); break;
      case "ls":
        out("total 4");
        out("drwxr-xr-x  projects/");
        out("-rw-r--r--  resume.md");
        out("-rw-r--r--  about.txt");
        out("-rw-r--r--  contact.txt");
        break;
      case "cat": {
        const file = raw.trim().slice(4).trim();
        if (!file) { err("usage: cat <filename>"); break; }
        const content = FS[file];
        if (content) out(content);
        else err(`cat: ${file}: No such file or directory`);
        break;
      }
      case "clear":
        setLines([{ type: "dim", text: "brian.os terminal v1.0" }, { type: "blank", text: "" }]);
        return;
      case "pwd":     out("/home/brian"); break;
      case "date":    out(new Date().toString()); break;
      case "uname":   out("Linux axira-os 6.1.0-axira #1 SMP ARM64 GNU/Linux"); break;
      case "exit":    out("Use the ✕ button to close the window."); break;
      case "sudo":    err("Nice try."); break;
      case "rm":      err("Permission denied. (nice try)"); break;
      default:        err(`command not found: ${cmd.split(" ")[0]}  —  try 'help'`);
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
    }
  }

  const lineStyle = (type: LineType): React.CSSProperties => {
    switch (type) {
      case "banner":  return { color: "#C8A97E", fontWeight: 600, lineHeight: 1.3 };
      case "input":   return { color: "#DFC49A" };
      case "output":  return { color: "#8A8A7A" };
      case "error":   return { color: "#FF5F57" };
      case "dim":     return { color: "#3A3A42" };
      default:        return { color: "transparent" };
    }
  };

  return (
    <div
      className="h-full flex flex-col font-mono text-[12.5px] leading-[1.7]"
      style={{ background: "#060607" }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Output */}
      <div className="flex-1 overflow-y-auto p-4 pb-2">
        {lines.map((line, i) => (
          <div
            key={i}
            style={{ ...lineStyle(line.type), whiteSpace: "pre", overflowX: "auto" }}
          >
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
        <span style={{ color: "#7A6348" }}>brian</span>
        <span style={{ color: "#3A3A42" }}>@axira</span>
        <span style={{ color: "#3A3A42" }}>:~$ </span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          className="flex-1 bg-transparent outline-none"
          style={{ color: "#F0EDE6", caretColor: "#C8A97E" }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
        <span className="terminal-cursor leading-none" style={{ color: "#C8A97E" }}>█</span>
      </div>
    </div>
  );
}
