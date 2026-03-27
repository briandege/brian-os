"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, RefreshCw, Wifi } from "lucide-react";

// Placeholder articles while real API is wired up
const MOCK_ARTICLES = [
  {
    id: "1",
    title: "AI Systems Breach Detection Reaches 99.2% Accuracy in Latest Benchmark",
    source: "CyberWatch",
    category: "Cybersecurity",
    time: "2 min ago",
    snippet: "A new ensemble model combining transformer-based anomaly detection with graph neural networks has set a new standard for enterprise threat identification.",
  },
  {
    id: "2",
    title: "Federal Reserve Signals Continued Rate Stability Through Q3",
    source: "Financial Times",
    category: "Finance",
    time: "14 min ago",
    snippet: "Chairman reaffirmed a data-dependent approach as inflation metrics show convergence toward the 2% target.",
  },
  {
    id: "3",
    title: "NASA Artemis Orbital Tests Complete Ahead of Lunar Surface Mission",
    source: "NASA JPL",
    category: "Science",
    time: "38 min ago",
    snippet: "All six orbital mechanics checkpoints have been cleared, clearing the path for the first crewed lunar landing since 1972.",
  },
  {
    id: "4",
    title: "Critical Zero-Day in Major Cloud Provider's Auth Layer Disclosed",
    source: "CISA Advisory",
    category: "Cybersecurity",
    time: "1 hr ago",
    snippet: "CVSS 9.8 vulnerability affects token validation in multi-tenant environments. Patch available, immediate deployment recommended.",
    urgent: true,
  },
  {
    id: "5",
    title: "G7 Nations Agree on Coordinated AI Governance Framework",
    source: "Reuters",
    category: "Global",
    time: "2 hr ago",
    snippet: "The joint declaration establishes baseline transparency requirements for frontier model deployments in critical infrastructure.",
  },
];

const CATEGORY_COLOR: Record<string, string> = {
  Cybersecurity: "#FF5F57",
  Finance: "#28C840",
  Science: "#5AC8FA",
  Global: "#D4B896",
  Technology: "#B48EAD",
};

export default function AxiraApp() {
  const [articles, setArticles] = useState(MOCK_ARTICLES);
  const [loading, setLoading] = useState(false);
  const [ticker, setTicker] = useState(0);

  // Cycle ticker headline every 4s
  useEffect(() => {
    const id = setInterval(() => setTicker((t) => (t + 1) % MOCK_ARTICLES.length), 4000);
    return () => clearInterval(id);
  }, []);

  const refresh = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setArticles([...MOCK_ARTICLES].sort(() => Math.random() - 0.5));
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col" style={{ background: "#0E0E0E" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid #1E1E1E" }}
      >
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
          <button
            onClick={refresh}
            className="p-1.5 rounded-lg transition-colors"
            style={{ background: "rgba(212,184,150,0.06)", color: "#6B6B6B" }}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
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
      <div
        className="px-4 py-2 shrink-0 overflow-hidden"
        style={{ background: "#0A0A0A", borderBottom: "1px solid #1E1E1E" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={ticker}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 text-xs"
          >
            <span
              className="shrink-0 font-bold font-mono"
              style={{ color: "#D4B896" }}
            >
              BREAKING
            </span>
            <span className="truncate" style={{ color: "#6B6B6B" }}>
              {MOCK_ARTICLES[ticker].title}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Articles */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {articles.map((article, i) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="px-4 py-3 cursor-pointer transition-colors"
              style={{ borderBottom: "1px solid #1A1A1A" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#111111")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
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
                  <p className="text-xs mt-1.5 leading-relaxed line-clamp-2" style={{ color: "#6B6B6B" }}>
                    {article.snippet}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{
                        background: `${CATEGORY_COLOR[article.category] ?? "#4A4A4A"}18`,
                        color: CATEGORY_COLOR[article.category] ?? "#4A4A4A",
                      }}
                    >
                      {article.category}
                    </span>
                    <span className="text-[10px]" style={{ color: "#3A3A3A" }}>{article.source}</span>
                    <span className="text-[10px]" style={{ color: "#3A3A3A" }}>{article.time}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
