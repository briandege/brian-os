"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, RefreshCw, Wifi, ChevronDown } from "lucide-react";

const MOCK_ARTICLES = [
  {
    id: "1",
    title: "AI Systems Breach Detection Reaches 99.2% Accuracy in Latest Benchmark",
    source: "CyberWatch",
    category: "Cybersecurity",
    time: "2 min ago",
    snippet: "A new ensemble model combining transformer-based anomaly detection with graph neural networks has set a new standard for enterprise threat identification. Results were validated across 14 independent enterprise datasets.",
  },
  {
    id: "2",
    title: "Federal Reserve Signals Continued Rate Stability Through Q3",
    source: "Financial Times",
    category: "Finance",
    time: "14 min ago",
    snippet: "Chairman reaffirmed a data-dependent approach as inflation metrics show convergence toward the 2% target. Markets priced in a 94% probability of unchanged rates through September.",
  },
  {
    id: "3",
    title: "NASA Artemis Orbital Tests Complete Ahead of Lunar Surface Mission",
    source: "NASA JPL",
    category: "Science",
    time: "38 min ago",
    snippet: "All six orbital mechanics checkpoints have been cleared, opening the path for the first crewed lunar landing since 1972. The mission is scheduled for Q4 pending final crew health evaluations.",
  },
  {
    id: "4",
    title: "Critical Zero-Day in Major Cloud Provider's Auth Layer Disclosed",
    source: "CISA Advisory",
    category: "Cybersecurity",
    time: "1 hr ago",
    snippet: "CVSS 9.8 vulnerability affects token validation in multi-tenant environments. Patch available — immediate deployment strongly recommended. Estimated 40,000+ instances exposed globally.",
    urgent: true,
  },
  {
    id: "5",
    title: "G7 Nations Agree on Coordinated AI Governance Framework",
    source: "Reuters",
    category: "Global",
    time: "2 hr ago",
    snippet: "The joint declaration establishes baseline transparency requirements for frontier model deployments in critical infrastructure. Signatories commit to quarterly compliance audits starting 2027.",
  },
  {
    id: "6",
    title: "OpenAI Releases GPT-5 with Extended Context and Reasoning Chains",
    source: "TechCrunch",
    category: "Technology",
    time: "3 hr ago",
    snippet: "The latest model features a 2M token context window and native chain-of-thought execution that significantly reduces hallucinations in multi-step reasoning tasks.",
  },
];

const CATEGORY_COLOR: Record<string, string> = {
  Cybersecurity: "#FF5F57",
  Finance:       "#28C840",
  Science:       "#5AC8FA",
  Global:        "#D4B896",
  Technology:    "#B48EAD",
};

const ALL_CATEGORIES = ["All", ...Object.keys(CATEGORY_COLOR)];

export default function AxiraApp() {
  const [articles, setArticles] = useState(MOCK_ARTICLES);
  const [loading, setLoading] = useState(false);
  const [ticker, setTicker] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setTicker((t) => (t + 1) % MOCK_ARTICLES.length), 4000);
    return () => clearInterval(id);
  }, []);

  const refresh = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setArticles([...MOCK_ARTICLES].sort(() => Math.random() - 0.5));
    setLoading(false);
  };

  const filtered = activeCategory === "All"
    ? articles
    : articles.filter((a) => a.category === activeCategory);

  return (
    <div className="h-full flex flex-col" style={{ background: "#0E0E0E" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: "1px solid #1E1E1E" }}>
        <div>
          <div className="font-bold text-sm tracking-wider" style={{ color: "#D4B896" }}>
            AXIRA<span style={{ color: "#4A4A4A" }}>NEWS</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Wifi size={10} style={{ color: "#28C840" }} />
            <span className="text-[10px] font-mono" style={{ color: "#28C840" }}>LIVE</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={refresh}
            className="p-1.5 rounded-lg"
            style={{ background: "rgba(212,184,150,0.06)", color: "#6B6B6B" }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            animate={loading ? { rotate: 360 } : { rotate: 0 }}
            transition={loading ? { duration: 0.7, ease: "linear", repeat: Infinity } : {}}
          >
            <RefreshCw size={13} />
          </motion.button>
          <a
            href="https://axiranews.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "rgba(212,184,150,0.1)", border: "1px solid rgba(212,184,150,0.2)", color: "#D4B896" }}
          >
            <ExternalLink size={11} />
            Open App
          </a>
        </div>
      </div>

      {/* Ticker bar */}
      <div className="px-4 py-2 shrink-0 overflow-hidden" style={{ background: "#0A0A0A", borderBottom: "1px solid #1E1E1E" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={ticker}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 text-xs"
          >
            <span className="shrink-0 font-bold font-mono" style={{ color: "#D4B896" }}>BREAKING</span>
            <span className="truncate" style={{ color: "#6B6B6B" }}>{MOCK_ARTICLES[ticker].title}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Category filter tabs */}
      <div
        className="flex gap-1 px-3 py-2 shrink-0 overflow-x-auto"
        style={{ borderBottom: "1px solid #151515" }}
      >
        {ALL_CATEGORIES.map((cat) => (
          <motion.button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium"
            style={{
              background: activeCategory === cat
                ? cat === "All" ? "rgba(212,184,150,0.12)" : `${CATEGORY_COLOR[cat]}18`
                : "transparent",
              border: `1px solid ${activeCategory === cat
                ? cat === "All" ? "rgba(212,184,150,0.3)" : `${CATEGORY_COLOR[cat]}40`
                : "#1E1E1E"}`,
              color: activeCategory === cat
                ? cat === "All" ? "#D4B896" : CATEGORY_COLOR[cat]
                : "#4A4A4A",
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      {/* Articles */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filtered.map((article, i) => {
            const isExpanded = expandedId === article.id;
            const catColor = CATEGORY_COLOR[article.category] ?? "#4A4A4A";
            return (
              <motion.div
                key={article.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ delay: i * 0.04 }}
                className="cursor-pointer"
                style={{ borderBottom: "1px solid #151515" }}
                onClick={() => setExpandedId(isExpanded ? null : article.id)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#111111")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {article.urgent && (
                        <span
                          className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mb-1 mr-2"
                          style={{ background: "rgba(255,95,87,0.15)", color: "#FF5F57", border: "1px solid rgba(255,95,87,0.2)" }}
                        >
                          URGENT
                        </span>
                      )}
                      <p className="text-sm font-medium leading-snug" style={{ color: "#F5F5F0" }}>
                        {article.title}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                          style={{ background: `${catColor}18`, color: catColor }}
                        >
                          {article.category}
                        </span>
                        <span className="text-[10px]" style={{ color: "#3A3A3A" }}>{article.source}</span>
                        <span className="text-[10px]" style={{ color: "#3A3A3A" }}>{article.time}</span>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0 mt-1"
                    >
                      <ChevronDown size={13} style={{ color: "#3A3A3A" }} />
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.p
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="text-xs leading-relaxed overflow-hidden"
                        style={{ color: "#6B6B6B" }}
                      >
                        {article.snippet}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <p className="text-xs" style={{ color: "#3A3A3A" }}>No {activeCategory} articles</p>
          </div>
        )}
      </div>
    </div>
  );
}
