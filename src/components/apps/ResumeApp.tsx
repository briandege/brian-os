"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, ChevronDown, Search, X } from "lucide-react";

const SECTIONS = [
  {
    title: "Experience",
    items: [
      {
        role: "Founder & Lead Engineer",
        company: "AxiraNews",
        period: "2024 – Present",
        points: [
          "Architected full-stack news intelligence platform (Fastify + PostgreSQL + Redis)",
          "Built ML recommendation engine with user vector personalization",
          "Shipped iOS app with SwiftUI, SwiftData, and real-time SSE streaming",
          "Integrated OSINT tooling for automatic article threat enrichment",
        ],
      },
      {
        role: "Security Engineer & iOS Developer",
        company: "Axira Suite",
        period: "2022 – Present",
        points: [
          "Built custom antivirus engine with real-time file monitoring (Python / FastAPI)",
          "Implemented OSINT intelligence suite (IP, domain, CVE, email breach)",
          "Designed threat map visualization and WebSocket live event feed",
        ],
      },
    ],
  },
  {
    title: "Education",
    items: [
      {
        role: "Computer Science",
        company: "Self-directed + Formal Study",
        period: "Ongoing",
        points: [
          "Algorithms & data structures, distributed systems",
          "Applied cryptography and network security",
          "Machine learning systems and NLP",
        ],
      },
    ],
  },
];

const ALL_TECH = [
  "TypeScript","Python","Swift","Go","Next.js","FastAPI",
  "Fastify","PostgreSQL","Redis","Prisma","SwiftUI","SwiftData",
  "Framer Motion","Railway","Cloudflare","Docker",
];

export default function ResumeApp() {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [techSearch, setTechSearch] = useState("");
  const [highlightedTech, setHighlightedTech] = useState<string | null>(null);

  const toggleItem = (key: string) =>
    setExpandedItems((prev) => ({ ...prev, [key]: !prev[key] }));

  const filteredTech = ALL_TECH.filter((t) =>
    t.toLowerCase().includes(techSearch.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col" style={{ background: "#0E0E0E" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: "1px solid #1E1E1E" }}>
        <div>
          <h1 className="text-base font-bold" style={{ color: "#F5F5F0" }}>Brian Ndege</h1>
          <p className="text-xs mt-0.5" style={{ color: "#8C7A65" }}>Full-Stack Engineer · AI Systems · Cybersecurity</p>
        </div>
        <motion.button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: "rgba(212,184,150,0.08)", border: "1px solid rgba(212,184,150,0.18)", color: "#D4B896" }}
          whileHover={{ background: "rgba(212,184,150,0.14)", scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => window.print()}
        >
          <Download size={12} />
          Download PDF
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2
              className="text-xs font-semibold uppercase tracking-widest mb-4 pb-1.5"
              style={{ color: "#4A4A4A", borderBottom: "1px solid #1E1E1E" }}
            >
              {section.title}
            </h2>
            <div className="space-y-3">
              {section.items.map((item, i) => {
                const key = `${section.title}-${i}`;
                const isOpen = !!expandedItems[key];
                return (
                  <motion.div
                    key={i}
                    className="rounded-lg overflow-hidden"
                    style={{ border: "1px solid #1A1A1A" }}
                  >
                    <button
                      className="w-full text-left px-4 py-3 flex items-start justify-between gap-3 transition-colors"
                      style={{ background: isOpen ? "#111111" : "#0A0A0A" }}
                      onClick={() => toggleItem(key)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#111111")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = isOpen ? "#111111" : "#0A0A0A")}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold" style={{ color: "#F5F5F0" }}>{item.role}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#D4B896" }}>{item.company}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono" style={{ color: "#4A4A4A" }}>{item.period}</span>
                        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown size={13} style={{ color: "#4A4A4A" }} />
                        </motion.div>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <ul className="px-4 pb-3 pt-1 space-y-2" style={{ borderTop: "1px solid #181818" }}>
                            {item.points.map((p, j) => (
                              <motion.li
                                key={j}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: j * 0.06 }}
                                className="flex gap-2 text-xs"
                                style={{ color: "#7A7A7A" }}
                              >
                                <span style={{ color: "#3A3030", marginTop: 2 }}>▸</span>
                                {p}
                              </motion.li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Tech stack with search + highlight */}
        <div>
          <div className="flex items-center justify-between mb-3 pb-1.5" style={{ borderBottom: "1px solid #1E1E1E" }}>
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#4A4A4A" }}>
              Core Stack
            </h2>
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-md"
              style={{ background: "#0A0A0A", border: "1px solid #1E1E1E" }}
            >
              <Search size={10} style={{ color: "#4A4A4A" }} />
              <input
                className="bg-transparent text-xs outline-none w-24"
                style={{ color: "#9A9A8A" }}
                placeholder="filter..."
                value={techSearch}
                onChange={(e) => setTechSearch(e.target.value)}
              />
              {techSearch && (
                <button onClick={() => setTechSearch("")}>
                  <X size={10} style={{ color: "#4A4A4A" }} />
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {filteredTech.map((t) => (
                <motion.button
                  key={t}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  onClick={() => setHighlightedTech(highlightedTech === t ? null : t)}
                  className="px-2 py-1 rounded-md text-xs font-mono transition-all"
                  style={{
                    background: highlightedTech === t ? "rgba(212,184,150,0.12)" : "#111111",
                    border: `1px solid ${highlightedTech === t ? "rgba(212,184,150,0.4)" : "#2A2A2A"}`,
                    color: highlightedTech === t ? "#D4B896" : "#6B6B6B",
                  }}
                  whileHover={{ scale: 1.05, color: "#D4B896" }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
          {filteredTech.length === 0 && (
            <p className="text-xs mt-2" style={{ color: "#3A3A3A" }}>No match for &ldquo;{techSearch}&rdquo;</p>
          )}
        </div>
      </div>
    </div>
  );
}
