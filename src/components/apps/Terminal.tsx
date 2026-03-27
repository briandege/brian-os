"use client";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useWindowStore } from "@/lib/windowStore";
import type { AppId } from "@/types";

const PROMPT = "brian@axira-os:~$ ";

type Line = { type: "input" | "output" | "error" | "blank"; text: string };

const HELP_TEXT = `
Available commands:

  whoami          — About Brian Ndege
  skills          — Tech stack & expertise
  projects        — All projects & apps
  axira           — Open AxiraNews
  contact         — Contact information
  ls              — List directory contents
  cat resume.md   — View resume
  clear           — Clear terminal
  help            — Show this menu
`.trim();

const FS: Record<string, string> = {
  "resume.md": `# Brian Ndege — Software Engineer

## Experience
- Full-Stack Developer & AI Engineer
- Cybersecurity Specialist
- iOS & Mobile Application Developer
- Database Architect

## Stack
Languages:   TypeScript · Python · Swift · Go
Frontend:    Next.js · React · SwiftUI
Backend:     FastAPI · Fastify · Node.js
Database:    PostgreSQL · Redis · Prisma · SwiftData
AI/ML:       Local LLMs · Recommendation Systems · NLP
Cloud:       Railway · Vercel · Cloudflare · Azure
Security:    OSINT · Antivirus Systems · JWT · OAuth

## Projects
- AxiraNews     — AI-powered global news intelligence platform
- brian.os      — This portfolio OS
- Axira AV      — Custom antivirus & threat detection engine
- OSINT Suite   — IP/domain/CVE intelligence tooling

## Contact
  Email:    brian@axiranews.com
  GitHub:   github.com/briandege
  LinkedIn: linkedin.com/in/briandege
`,
};

function ls(): string {
  return `drwxr-xr-x  projects/
drwxr-xr-x  skills/
-rw-r--r--  resume.md
-rw-r--r--  about.txt
-rw-r--r--  contact.txt`;
}

export default function TerminalApp() {
  const { open } = useWindowStore();
  const [lines, setLines] = useState<Line[]>([
    { type: "output", text: "brian.os terminal v1.0.0" },
    { type: "output", text: 'Type "help" to see available commands.' },
    { type: "blank", text: "" },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function pushLine(line: Line) {
    setLines((l) => [...l, line]);
  }
  function pushOutput(text: string) {
    text.split("\n").forEach((t) => pushLine({ type: "output", text: t }));
  }
  function pushError(text: string) {
    pushLine({ type: "error", text });
  }

  function runCommand(raw: string) {
    const cmd = raw.trim().toLowerCase();
    pushLine({ type: "input", text: PROMPT + raw });

    if (!cmd) {
      pushLine({ type: "blank", text: "" });
      return;
    }

    setHistory((h) => [raw, ...h]);
    setHistIdx(-1);

    switch (true) {
      case cmd === "help":
        pushOutput(HELP_TEXT);
        break;
      case cmd === "whoami":
        pushOutput(
          "Brian Ndege\nFull-stack developer · AI engineer · Cybersecurity specialist\nBuilding intelligence systems from the ground up."
        );
        break;
      case cmd === "skills":
        open("skills");
        pushOutput("Opening Skills.db window...");
        break;
      case cmd === "projects":
        open("projects");
        pushOutput("Opening Projects window...");
        break;
      case cmd === "axira":
        open("axira");
        pushOutput("Launching AxiraNews...");
        break;
      case cmd === "contact":
        open("contact");
        pushOutput("Opening Contact window...");
        break;
      case cmd === "ls":
        pushOutput(ls());
        break;
      case cmd === "clear":
        setLines([]);
        return;
      case cmd.startsWith("cat "):
        {
          const filename = raw.slice(4).trim();
          const content = FS[filename];
          if (content) pushOutput(content);
          else pushError(`cat: ${filename}: No such file or directory`);
        }
        break;
      case cmd === "pwd":
        pushOutput("/home/brian");
        break;
      case cmd === "date":
        pushOutput(new Date().toString());
        break;
      case cmd === "uname":
      case cmd === "uname -a":
        pushOutput("Linux brian-axira-os 6.1.0-axira #1 SMP brian.os");
        break;
      case cmd === "exit":
        pushOutput("Use the window close button to exit.");
        break;
      default:
        pushError(`command not found: ${cmd}  (type "help" for commands)`);
    }

    pushLine({ type: "blank", text: "" });
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      runCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(next);
      setInput(history[next] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setInput(next === -1 ? "" : history[next]);
    }
  }

  return (
    <div
      className="h-full flex flex-col font-mono text-sm overflow-hidden"
      style={{ background: "#080808" }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Output */}
      <div className="flex-1 overflow-y-auto p-4 space-y-[1px]">
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              color:
                line.type === "input"
                  ? "#D4B896"
                  : line.type === "error"
                  ? "#FF5F57"
                  : line.type === "blank"
                  ? "transparent"
                  : "#9A9A8A",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {line.text || "\u00A0"}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input line */}
      <div
        className="flex items-center gap-0 px-4 py-3 shrink-0"
        style={{ borderTop: "1px solid #1E1E1E" }}
      >
        <span style={{ color: "#D4B896" }}>{PROMPT}</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: "#F5F5F0", caretColor: "#D4B896" }}
          spellCheck={false}
          autoComplete="off"
        />
        <span className="terminal-cursor" style={{ color: "#D4B896" }}>
          █
        </span>
      </div>
    </div>
  );
}
