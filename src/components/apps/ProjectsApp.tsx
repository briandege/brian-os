"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, Folder, FileCode, ExternalLink, ChevronRight } from "lucide-react";

interface Project {
  name: string;
  description: string;
  stack: string[];
  url?: string;
  files: string[];
  status: "live" | "active" | "archived";
}

const PROJECTS: Project[] = [
  {
    name: "AxiraNews",
    description: "AI-powered global news intelligence platform with real-time ingestion, ML personalization, and iOS app.",
    stack: ["TypeScript", "Fastify", "PostgreSQL", "Redis", "SwiftUI", "Prisma"],
    url: "https://axiranews.com",
    files: ["Backend/", "iOS AXIRA.xcodeproj/", "web/ (Next.js)", "OSINT Suite/"],
    status: "live",
  },
  {
    name: "Axira Antivirus",
    description: "Custom threat detection engine with real-time file monitoring, a threat map, and WebSocket live feed.",
    stack: ["Python", "FastAPI", "WebSockets", "SwiftUI"],
    files: ["detection_engine.py", "threat_map.swift", "LiveEventFeedView.swift"],
    status: "active",
  },
  {
    name: "OSINT Intelligence Suite",
    description: "IP reputation, domain RDAP, CVE lookup, email breach check — fire-and-forget article enrichment.",
    stack: ["TypeScript", "VirusTotal API", "Shodan", "NVD", "HIBP"],
    files: ["osint.service.ts", "osint.routes.ts", "OSINTView.swift"],
    status: "active",
  },
  {
    name: "ML Recommendation Engine",
    description: "User vector-based news ranking with serendipity injection and dwell-time weighting.",
    stack: ["TypeScript", "PostgreSQL", "Swift", "Prisma"],
    files: ["userVector.ts", "ranking.ts", "EngagementTracker.swift"],
    status: "active",
  },
  {
    name: "brian.os",
    description: "This portfolio — a browser-based operating system showcasing all projects.",
    stack: ["Next.js 15", "TypeScript", "Framer Motion", "Zustand", "Tailwind v4"],
    files: ["Desktop.tsx", "Window.tsx", "BootSequence.tsx", "windowStore.ts"],
    status: "live",
  },
];

const STATUS_COLOR: Record<string, string> = {
  live: "#28C840",
  active: "#D4B896",
  archived: "#4A4A4A",
};

export default function ProjectsApp() {
  const [selected, setSelected] = useState<Project | null>(null);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(["AxiraNews"]));

  const toggleFolder = (name: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  return (
    <div className="h-full flex" style={{ background: "#0E0E0E" }}>
      {/* Sidebar file tree */}
      <div
        className="w-52 shrink-0 overflow-y-auto p-3 space-y-1"
        style={{ borderRight: "1px solid #1E1E1E", background: "#0A0A0A" }}
      >
        <div className="text-xs font-semibold uppercase tracking-widest mb-2 px-2" style={{ color: "#4A4A4A" }}>
          Projects
        </div>
        {PROJECTS.map((p) => {
          const isOpen = openFolders.has(p.name);
          const isSelected = selected?.name === p.name;
          return (
            <div key={p.name}>
              <button
                onClick={() => {
                  toggleFolder(p.name);
                  setSelected(p);
                }}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left text-xs transition-colors"
                style={{
                  background: isSelected ? "rgba(212,184,150,0.1)" : "transparent",
                  color: isSelected ? "#D4B896" : "#7A7A7A",
                }}
              >
                <ChevronRight
                  size={12}
                  className="transition-transform shrink-0"
                  style={{ transform: isOpen ? "rotate(90deg)" : undefined }}
                />
                {isOpen ? <FolderOpen size={13} /> : <Folder size={13} />}
                <span className="truncate">{p.name}</span>
              </button>

              {isOpen && (
                <div className="ml-5 mt-0.5 space-y-0.5">
                  {p.files.map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs rounded"
                      style={{ color: "#4A4A4A" }}
                    >
                      <FileCode size={11} />
                      <span className="truncate">{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail pane */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.name}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="space-y-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-lg font-bold" style={{ color: "#F5F5F0" }}>
                    {selected.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: STATUS_COLOR[selected.status] }}
                    />
                    <span className="text-xs capitalize" style={{ color: STATUS_COLOR[selected.status] }}>
                      {selected.status}
                    </span>
                  </div>
                </div>
                {selected.url && (
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{ background: "rgba(212,184,150,0.08)", border: "1px solid rgba(212,184,150,0.2)", color: "#D4B896" }}
                  >
                    <ExternalLink size={12} />
                    Visit
                  </a>
                )}
              </div>

              <p className="text-sm leading-relaxed" style={{ color: "#9A9A8A" }}>
                {selected.description}
              </p>

              <div>
                <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#4A4A4A" }}>
                  Stack
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.stack.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-1 rounded-md text-xs font-mono"
                      style={{ background: "#1A1A1A", border: "1px solid #2A2A2A", color: "#8C7A65" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#4A4A4A" }}>
                  Key Files
                </div>
                <div className="space-y-1">
                  {selected.files.map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono"
                      style={{ background: "#0A0A0A", border: "1px solid #1E1E1E", color: "#6B6B6B" }}
                    >
                      <FileCode size={12} style={{ color: "#D4B896" }} />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex items-center justify-center"
            >
              <p className="text-sm" style={{ color: "#3A3A3A" }}>
                Select a project to view details
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
