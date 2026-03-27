"use client";
import { Download } from "lucide-react";

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

export default function ResumeApp() {
  return (
    <div className="h-full flex flex-col" style={{ background: "#0E0E0E" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 shrink-0"
        style={{ borderBottom: "1px solid #1E1E1E" }}
      >
        <div>
          <h1 className="text-base font-bold" style={{ color: "#F5F5F0" }}>Brian Ndege</h1>
          <p className="text-xs mt-0.5" style={{ color: "#8C7A65" }}>Full-Stack Engineer · AI Systems · Cybersecurity</p>
        </div>
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: "rgba(212,184,150,0.08)", border: "1px solid rgba(212,184,150,0.18)", color: "#D4B896" }}
        >
          <Download size={12} />
          Download PDF
        </button>
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
            <div className="space-y-5">
              {section.items.map((item, i) => (
                <div key={i}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "#F5F5F0" }}>{item.role}</div>
                      <div className="text-xs mt-0.5" style={{ color: "#D4B896" }}>{item.company}</div>
                    </div>
                    <div className="text-xs font-mono shrink-0 ml-4" style={{ color: "#4A4A4A" }}>{item.period}</div>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {item.points.map((p, j) => (
                      <li key={j} className="flex gap-2 text-xs" style={{ color: "#7A7A7A" }}>
                        <span style={{ color: "#3A3030", marginTop: 2 }}>▸</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Skills summary */}
        <div>
          <h2
            className="text-xs font-semibold uppercase tracking-widest mb-3 pb-1.5"
            style={{ color: "#4A4A4A", borderBottom: "1px solid #1E1E1E" }}
          >
            Core Stack
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              "TypeScript","Python","Swift","Go","Next.js","FastAPI",
              "Fastify","PostgreSQL","Redis","Prisma","SwiftUI","SwiftData",
              "Framer Motion","Railway","Cloudflare","Docker",
            ].map((t) => (
              <span
                key={t}
                className="px-2 py-1 rounded-md text-xs font-mono"
                style={{ background: "#111111", border: "1px solid #2A2A2A", color: "#6B6B6B" }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
