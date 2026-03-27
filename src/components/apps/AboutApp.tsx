"use client";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { ExternalLink, Globe, Shield, Cpu, Database, Code2, Users } from "lucide-react";

const BADGES = [
  { label: "Full-Stack", icon: <Globe size={13} /> },
  { label: "AI Engineer", icon: <Cpu size={13} /> },
  { label: "Cybersecurity", icon: <Shield size={13} /> },
  { label: "DB Architect", icon: <Database size={13} /> },
];

const TIMELINE = [
  { year: "2024–Now", role: "Founder & Lead Engineer", co: "AxiraNews", desc: "AI-powered global news intelligence platform" },
  { year: "2023–Now", role: "iOS Developer", co: "Axira Suite", desc: "SwiftUI apps with SwiftData & ML recommendation systems" },
  { year: "2022–Now", role: "Security Engineer", co: "Axira AV", desc: "Custom antivirus engine and OSINT intelligence tooling" },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 26 } },
};

export default function AboutApp() {
  return (
    <div className="h-full overflow-y-auto p-6" style={{ background: "#0E0E0E" }}>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-lg mx-auto space-y-6"
      >
        {/* Header */}
        <motion.div variants={item} className="flex items-start gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0"
            style={{ background: "rgba(212,184,150,0.1)", border: "1px solid rgba(212,184,150,0.2)", color: "#D4B896" }}
          >
            BN
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#F5F5F0" }}>
              Brian Ndege
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#8C7A65" }}>
              Software Engineer & AI Systems Builder
            </p>
            <div className="flex gap-3 mt-2">
              <a href="https://github.com/briandege" target="_blank" rel="noreferrer" title="GitHub">
                <Code2 size={16} style={{ color: "#6B6B6B" }} className="hover:text-[#D4B896] transition-colors" />
              </a>
              <a href="https://linkedin.com/in/briandege" target="_blank" rel="noreferrer" title="LinkedIn">
                <Users size={16} style={{ color: "#6B6B6B" }} className="hover:text-[#D4B896] transition-colors" />
              </a>
              <a href="https://axiranews.com" target="_blank" rel="noreferrer" title="AxiraNews">
                <Globe size={16} style={{ color: "#6B6B6B" }} className="hover:text-[#D4B896] transition-colors" />
              </a>
            </div>
          </div>
        </motion.div>

        {/* Badges */}
        <motion.div variants={item} className="flex flex-wrap gap-2">
          {BADGES.map((b) => (
            <div
              key={b.label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "rgba(212,184,150,0.08)", border: "1px solid rgba(212,184,150,0.16)", color: "#D4B896" }}
            >
              {b.icon}
              {b.label}
            </div>
          ))}
        </motion.div>

        {/* Bio */}
        <motion.div variants={item}>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#4A4A4A" }}>
            About
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#9A9A8A" }}>
            I build intelligent systems from scratch — from the database schema
            to the AI inference layer to the mobile UI. My focus is on crafting
            tools that turn raw data into actionable intelligence.
          </p>
          <p className="text-sm leading-relaxed mt-3" style={{ color: "#9A9A8A" }}>
            Currently building <span style={{ color: "#D4B896" }}>AxiraNews</span>,
            an AI-powered global news platform with real-time ingestion, ML-based
            personalization, and an iOS app backed by SwiftData.
          </p>
        </motion.div>

        {/* Timeline */}
        <motion.div variants={item}>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#4A4A4A" }}>
            Timeline
          </h2>
          <div className="space-y-4">
            {TIMELINE.map((t, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: "#D4B896" }} />
                  {i < TIMELINE.length - 1 && (
                    <div className="w-px flex-1 mt-1" style={{ background: "#2A2A2A" }} />
                  )}
                </div>
                <div className="pb-4">
                  <div className="text-xs font-mono" style={{ color: "#6B6B6B" }}>{t.year}</div>
                  <div className="text-sm font-semibold mt-0.5" style={{ color: "#F5F5F0" }}>{t.role}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#D4B896" }}>{t.co}</div>
                  <div className="text-xs mt-1" style={{ color: "#6B6B6B" }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
