"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowUpDown } from "lucide-react";

interface SkillGroup {
  category: string;
  skills: { name: string; level: number }[];
}

const SKILL_GROUPS: SkillGroup[] = [
  {
    category: "Languages",
    skills: [
      { name: "TypeScript", level: 95 },
      { name: "Python", level: 92 },
      { name: "Swift", level: 88 },
      { name: "Go", level: 72 },
      { name: "SQL", level: 90 },
    ],
  },
  {
    category: "Frontend",
    skills: [
      { name: "Next.js / React", level: 93 },
      { name: "SwiftUI", level: 88 },
      { name: "Tailwind CSS", level: 95 },
      { name: "Framer Motion", level: 85 },
    ],
  },
  {
    category: "Backend",
    skills: [
      { name: "Fastify / Node.js", level: 90 },
      { name: "FastAPI / Python", level: 88 },
      { name: "PostgreSQL", level: 90 },
      { name: "Redis", level: 80 },
      { name: "Prisma ORM", level: 88 },
    ],
  },
  {
    category: "AI / ML",
    skills: [
      { name: "Recommendation Systems", level: 85 },
      { name: "NLP / Text Analysis", level: 80 },
      { name: "Local LLM Integration", level: 82 },
      { name: "Vector Embeddings", level: 75 },
    ],
  },
  {
    category: "Security & DevOps",
    skills: [
      { name: "OSINT Tooling", level: 88 },
      { name: "JWT / OAuth", level: 90 },
      { name: "Cloudflare / Railway", level: 85 },
      { name: "Docker", level: 80 },
    ],
  },
];

const ALL_CATEGORIES = ["All", ...SKILL_GROUPS.map((g) => g.category)];

function levelLabel(level: number) {
  if (level >= 90) return "Expert";
  if (level >= 80) return "Advanced";
  if (level >= 70) return "Proficient";
  return "Learning";
}

function levelColor(level: number) {
  if (level >= 90) return "#5AC8FA";
  if (level >= 80) return "#28C840";
  if (level >= 70) return "#FEBC2E";
  return "#FF5F57";
}

function Bar({ level, delay, active }: { level: number; delay: number; active: boolean }) {
  const color = active ? levelColor(level) : "linear-gradient(90deg, #8C7A65, #D4B896)";
  return (
    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#1E1E1E" }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${level}%` }}
        transition={{ duration: 0.9, delay, ease: "easeOut" }}
      />
    </div>
  );
}

export default function SkillsApp() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sortDesc, setSortDesc] = useState(false);
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);

  const visibleGroups = SKILL_GROUPS
    .filter((g) => activeCategory === "All" || g.category === activeCategory)
    .map((g) => ({
      ...g,
      skills: g.skills
        .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => sortDesc ? b.level - a.level : 0),
    }))
    .filter((g) => g.skills.length > 0);

  const totalRows = visibleGroups.reduce((a, g) => a + g.skills.length, 0);

  return (
    <div className="h-full flex flex-col" style={{ background: "#0E0E0E" }}>
      {/* Toolbar */}
      <div className="px-5 pt-5 pb-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-sm font-bold font-mono truncate" style={{ color: "#D4B896" }}>
            SELECT * FROM skills{sortDesc ? " ORDER BY proficiency DESC" : ""};
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            {/* Sort toggle */}
            <motion.button
              onClick={() => setSortDesc((v) => !v)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px]"
              style={{
                background: sortDesc ? "rgba(212,184,150,0.12)" : "#111",
                border: `1px solid ${sortDesc ? "rgba(212,184,150,0.3)" : "#2A2A2A"}`,
                color: sortDesc ? "#D4B896" : "#6B6B6B",
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <ArrowUpDown size={10} />
              sort
            </motion.button>

            {/* Search */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ background: "#111", border: "1px solid #2A2A2A" }}>
              <Search size={10} style={{ color: "#4A4A4A" }} />
              <input
                className="bg-transparent text-xs outline-none w-20"
                style={{ color: "#9A9A8A" }}
                placeholder="search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")}>
                  <X size={10} style={{ color: "#4A4A4A" }} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 flex-wrap">
          {ALL_CATEGORIES.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium"
              style={{
                background: activeCategory === cat ? "rgba(212,184,150,0.12)" : "transparent",
                border: `1px solid ${activeCategory === cat ? "rgba(212,184,150,0.3)" : "#1E1E1E"}`,
                color: activeCategory === cat ? "#D4B896" : "#4A4A4A",
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              {cat}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Skills list */}
      <div className="flex-1 overflow-y-auto px-5 space-y-5 pb-5">
        <AnimatePresence mode="popLayout">
          {visibleGroups.map((group, gi) => (
            <motion.div
              key={group.category}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: gi * 0.05, type: "spring", stiffness: 280, damping: 24 }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-widest mb-3 pb-1.5"
                style={{ color: "#4A4A4A", borderBottom: "1px solid #1E1E1E" }}
              >
                {group.category}
              </div>
              <div className="space-y-2.5">
                {group.skills.map((skill, si) => {
                  const isHovered = hoveredSkill === `${group.category}-${skill.name}`;
                  return (
                    <motion.div
                      key={skill.name}
                      layout
                      className="flex items-center gap-3 cursor-default"
                      onMouseEnter={() => setHoveredSkill(`${group.category}-${skill.name}`)}
                      onMouseLeave={() => setHoveredSkill(null)}
                    >
                      <div className="w-40 text-xs font-mono truncate" style={{ color: isHovered ? "#D4B896" : "#9A9A8A" }}>
                        {skill.name}
                      </div>
                      <Bar level={skill.level} delay={gi * 0.08 + si * 0.05} active={isHovered} />
                      <div className="w-8 text-right text-xs font-mono" style={{ color: isHovered ? levelColor(skill.level) : "#4A4A4A" }}>
                        {skill.level}
                      </div>
                      <AnimatePresence>
                        {isHovered && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{
                              background: `${levelColor(skill.level)}18`,
                              color: levelColor(skill.level),
                              border: `1px solid ${levelColor(skill.level)}30`,
                              minWidth: 58,
                              textAlign: "center",
                            }}
                          >
                            {levelLabel(skill.level)}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {totalRows === 0 && (
          <p className="text-xs text-center pt-6" style={{ color: "#3A3A3A" }}>No results for &ldquo;{search}&rdquo;</p>
        )}

        <div
          className="p-3 rounded-lg font-mono text-xs"
          style={{ background: "#0A0A0A", border: "1px solid #1E1E1E", color: "#4A4A4A" }}
        >
          {totalRows} rows returned in 0.001ms
        </div>
      </div>
    </div>
  );
}
