"use client";
import { motion } from "framer-motion";

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

function Bar({ level, delay }: { level: number; delay: number }) {
  return (
    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#1E1E1E" }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: "linear-gradient(90deg, #8C7A65, #D4B896)" }}
        initial={{ width: 0 }}
        animate={{ width: `${level}%` }}
        transition={{ duration: 0.9, delay, ease: "easeOut" }}
      />
    </div>
  );
}

export default function SkillsApp() {
  return (
    <div className="h-full overflow-y-auto p-5" style={{ background: "#0E0E0E" }}>
      <div className="mb-4">
        <h1 className="text-sm font-bold font-mono" style={{ color: "#D4B896" }}>
          SELECT * FROM skills ORDER BY proficiency DESC;
        </h1>
      </div>

      <div className="space-y-6">
        {SKILL_GROUPS.map((group, gi) => (
          <motion.div
            key={group.category}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.08, type: "spring", stiffness: 280, damping: 24 }}
          >
            <div
              className="text-xs font-semibold uppercase tracking-widest mb-3 pb-1.5"
              style={{ color: "#4A4A4A", borderBottom: "1px solid #1E1E1E" }}
            >
              {group.category}
            </div>
            <div className="space-y-2.5">
              {group.skills.map((skill, si) => (
                <div key={skill.name} className="flex items-center gap-3">
                  <div className="w-40 text-xs font-mono truncate" style={{ color: "#9A9A8A" }}>
                    {skill.name}
                  </div>
                  <Bar level={skill.level} delay={gi * 0.08 + si * 0.05} />
                  <div className="w-8 text-right text-xs font-mono" style={{ color: "#4A4A4A" }}>
                    {skill.level}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div
        className="mt-6 p-3 rounded-lg font-mono text-xs"
        style={{ background: "#0A0A0A", border: "1px solid #1E1E1E", color: "#4A4A4A" }}
      >
        {SKILL_GROUPS.reduce((a, g) => a + g.skills.length, 0)} rows returned in 0.001ms
      </div>
    </div>
  );
}
