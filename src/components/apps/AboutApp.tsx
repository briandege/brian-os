"use client";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Globe, Shield, Cpu, Database, Code2, Users, ExternalLink, MapPin } from "lucide-react";

const BADGES = [
  { label: "Full-Stack Dev",  icon: <Code2 size={11} />,    color: "#C8A97E" },
  { label: "AI Engineer",     icon: <Cpu size={11} />,       color: "#5AC8FA" },
  { label: "Cybersecurity",   icon: <Shield size={11} />,    color: "#FF5F57" },
  { label: "DB Architect",    icon: <Database size={11} />,  color: "#B48EAD" },
];

const TIMELINE = [
  {
    year: "2024 – Now",
    role: "Founder & Lead Engineer",
    company: "AxiraNews",
    desc: "AI-powered global news intelligence platform — backend, iOS app, ML personalization, OSINT enrichment.",
    color: "#5AC8FA",
  },
  {
    year: "2023 – Now",
    role: "iOS Developer",
    company: "Axira Suite",
    desc: "SwiftUI applications with SwiftData, real-time SSE streaming, and on-device AI categorization.",
    color: "#C8A97E",
  },
  {
    year: "2022 – Now",
    role: "Security Engineer",
    company: "Axira AV",
    desc: "Custom antivirus engine, real-time threat detection, OSINT tooling for IP/domain/CVE intelligence.",
    color: "#FF5F57",
  },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 320, damping: 28 } },
};

export default function AboutApp() {
  return (
    <div className="h-full overflow-y-auto" style={{ background: "#0A0A0C" }}>
      {/* Header banner */}
      <div
        className="relative px-6 pt-8 pb-6"
        style={{
          background: "linear-gradient(180deg, rgba(200,169,126,0.06) 0%, transparent 100%)",
          borderBottom: "1px solid #161618",
        }}
      >
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex items-start gap-5"
        >
          {/* Avatar */}
          <motion.div variants={item} className="shrink-0">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center relative overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #1A1510, #2A1E12)",
                border: "1px solid rgba(200,169,126,0.2)",
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: "radial-gradient(circle at 40% 30%, rgba(200,169,126,0.15), transparent 60%)",
                }}
              />
              <span
                className="relative text-2xl font-black font-mono"
                style={{ color: "#C8A97E", letterSpacing: "-0.05em" }}
              >
                BN
              </span>
            </div>
          </motion.div>

          <div className="flex-1 min-w-0">
            <motion.div variants={item}>
              <h1 className="text-xl font-bold leading-tight" style={{ color: "#F0EDE6" }}>
                Brian Ndege
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin size={11} style={{ color: "#5A5A62" }} />
                <span className="text-[11px]" style={{ color: "#5A5A62" }}>
                  Software Engineer · AI Systems Builder
                </span>
              </div>
            </motion.div>

            {/* Badges */}
            <motion.div variants={item} className="flex flex-wrap gap-1.5 mt-3">
              {BADGES.map((b) => (
                <div
                  key={b.label}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium"
                  style={{
                    background: `${b.color}10`,
                    border: `1px solid ${b.color}25`,
                    color: b.color,
                  }}
                >
                  {b.icon}
                  {b.label}
                </div>
              ))}
            </motion.div>

            {/* Social links */}
            <motion.div variants={item} className="flex gap-3 mt-3">
              {[
                { label: "GitHub", href: "https://github.com/briandege", icon: <Code2 size={13} /> },
                { label: "LinkedIn", href: "https://linkedin.com/in/briandege", icon: <Users size={13} /> },
                { label: "axiranews.com", href: "https://axiranews.com", icon: <Globe size={13} /> },
              ].map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-[11px] transition-colors"
                  style={{ color: "#4A4A56" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#C8A97E")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#4A4A56")}
                >
                  {l.icon}
                  {l.label}
                </a>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Body */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="p-6 space-y-6"
      >
        {/* Bio */}
        <motion.div variants={item}>
          <SectionLabel>About</SectionLabel>
          <p className="text-[13px] leading-relaxed" style={{ color: "#6A6A72" }}>
            I build intelligent systems from scratch — from the database schema to the
            AI inference layer to the mobile UI. My focus is on crafting tools that turn
            raw data into actionable intelligence.
          </p>
          <p className="text-[13px] leading-relaxed mt-2.5" style={{ color: "#6A6A72" }}>
            Currently building{" "}
            <a
              href="https://axiranews.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1"
              style={{ color: "#C8A97E" }}
            >
              AxiraNews <ExternalLink size={10} />
            </a>
            {" "}— an AI-powered global news platform with real-time ingestion,
            ML-based personalization, and an iOS app backed by SwiftData.
          </p>
        </motion.div>

        {/* Timeline */}
        <motion.div variants={item}>
          <SectionLabel>Timeline</SectionLabel>
          <div className="space-y-0">
            {TIMELINE.map((t, i) => (
              <div key={i} className="flex gap-4">
                {/* Line */}
                <div className="flex flex-col items-center pt-1">
                  <div
                    className="w-2 h-2 rounded-full shrink-0 mt-[3px]"
                    style={{ background: t.color }}
                  />
                  {i < TIMELINE.length - 1 && (
                    <div
                      className="w-px flex-1 mt-1.5"
                      style={{ background: `linear-gradient(to bottom, ${t.color}40, transparent)`, minHeight: 32 }}
                    />
                  )}
                </div>

                <div className="pb-5">
                  <div className="text-[10px] font-mono" style={{ color: "#3A3A42" }}>{t.year}</div>
                  <div className="text-[13px] font-semibold mt-0.5" style={{ color: "#F0EDE6" }}>{t.role}</div>
                  <div className="text-[11px] font-medium mt-0.5" style={{ color: t.color }}>{t.company}</div>
                  <div className="text-[12px] mt-1.5 leading-relaxed" style={{ color: "#52524E" }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-3"
      style={{ color: "#3A3A42" }}
    >
      {children}
    </div>
  );
}
