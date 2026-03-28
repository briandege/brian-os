"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, RefreshCw, Wifi, WifiOff, ChevronDown, Search } from "lucide-react";
import {
  fetchNews, fetchTopHeadlines, searchNews,
  type AxiraArticle, relativeTime, AXIRA_BASE,
} from "@/lib/axiraClient";

const CATEGORY_COLOR: Record<string, string> = {
  Cybersecurity: "#FF5F57",
  Finance:       "#28C840",
  Science:       "#5AC8FA",
  Global:        "#D4B896",
  Technology:    "#B48EAD",
  Politics:      "#FEBC2E",
  Health:        "#34D399",
  Business:      "#C8A97E",
};

function categoryColor(cat: string) {
  return CATEGORY_COLOR[cat] ?? "#6B6B6B";
}

// Fallback articles shown while backend is offline
const FALLBACK: AxiraArticle[] = [
  { id: "f1", title: "AI Systems Breach Detection Reaches 99.2% Accuracy", source: "CyberWatch", category: "Cybersecurity", publishedAt: new Date(Date.now() - 120000).toISOString() },
  { id: "f2", title: "Federal Reserve Signals Continued Rate Stability", source: "Financial Times", category: "Finance", publishedAt: new Date(Date.now() - 840000).toISOString() },
  { id: "f3", title: "NASA Artemis Orbital Tests Complete", source: "NASA JPL", category: "Science", publishedAt: new Date(Date.now() - 2280000).toISOString() },
  { id: "f4", title: "Critical Zero-Day in Cloud Auth Layer Disclosed", source: "CISA", category: "Cybersecurity", publishedAt: new Date(Date.now() - 3600000).toISOString(), urgent: true },
  { id: "f5", title: "G7 Nations Agree on AI Governance Framework", source: "Reuters", category: "Global", publishedAt: new Date(Date.now() - 7200000).toISOString() },
];

export default function AxiraApp() {
  const [articles, setArticles]     = useState<AxiraArticle[]>([]);
  const [headlines, setHeadlines]   = useState<AxiraArticle[]>([]);
  const [loading, setLoading]       = useState(true);
  const [online, setOnline]         = useState<boolean | null>(null);
  const [ticker, setTicker]         = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [query, setQuery]           = useState("");
  const [searching, setSearching]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [news, heads] = await Promise.all([
      fetchNews({ limit: 30 }),
      fetchTopHeadlines(8),
    ]);
    if (news.length > 0) {
      setArticles(news);
      setHeadlines(heads.length > 0 ? heads : news.slice(0, 6));
      setOnline(true);
    } else {
      setArticles(FALLBACK);
      setHeadlines(FALLBACK);
      setOnline(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Advance ticker
  useEffect(() => {
    const src = headlines.length > 0 ? headlines : articles;
    if (!src.length) return;
    const id = setInterval(() => setTicker((t) => (t + 1) % src.length), 4000);
    return () => clearInterval(id);
  }, [headlines, articles]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) { load(); return; }
    setSearching(true);
    const results = await searchNews(query.trim());
    setArticles(results.length > 0 ? results : FALLBACK.filter(a =>
      a.title.toLowerCase().includes(query.toLowerCase())
    ));
    setOnline(results.length > 0);
    setSearching(false);
  }, [query, load]);

  const categories = ["All", ...Array.from(new Set(articles.map(a => a.category))).sort()];

  const filtered = activeCategory === "All"
    ? articles
    : articles.filter(a => a.category === activeCategory);

  const tickerSrc = headlines.length > 0 ? headlines : articles;
  const tickerItem = tickerSrc[ticker % Math.max(1, tickerSrc.length)];

  return (
    <div className="h-full flex flex-col" style={{ background: "#0E0E0E" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: "1px solid #1E1E1E" }}>
        <div>
          <div className="font-bold text-sm tracking-wider" style={{ color: "#D4B896" }}>
            AXIRA<span style={{ color: "#4A4A4A" }}>NEWS</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {online === null ? (
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#FEBC2E" }} />
            ) : online ? (
              <><Wifi size={10} style={{ color: "#28C840" }} /><span className="text-[10px] font-mono" style={{ color: "#28C840" }}>LIVE · {AXIRA_BASE}</span></>
            ) : (
              <><WifiOff size={10} style={{ color: "#FF5F57" }} /><span className="text-[10px] font-mono" style={{ color: "#FF5F57" }}>OFFLINE · cached</span></>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={load}
            className="p-1.5 rounded-lg"
            style={{ background: "rgba(212,184,150,0.06)", color: "#6B6B6B" }}
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
            <ExternalLink size={11} /> Open App
          </a>
        </div>
      </div>

      {/* Ticker */}
      {tickerItem && (
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
              <span className="truncate" style={{ color: "#6B6B6B" }}>{tickerItem.title}</span>
              <span className="shrink-0 text-[10px] font-mono" style={{ color: "#3A3A3A" }}>
                {relativeTime(tickerItem.publishedAt)}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Search bar */}
      <div className="px-3 py-2 shrink-0 flex gap-2" style={{ borderBottom: "1px solid #151515" }}>
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "#0A0A0A", border: "1px solid #1E1E1E" }}>
          <Search size={11} style={{ color: "#4A4A4A" }} />
          <input
            className="flex-1 bg-transparent outline-none text-[11px]"
            style={{ color: "#C8C6C0", caretColor: "#D4B896" }}
            placeholder="Search AxiraNews…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
          {query && (
            <button onClick={() => { setQuery(""); load(); }} style={{ color: "#4A4A4A", fontSize: 10 }}>✕</button>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={searching}
          className="px-3 py-1.5 rounded-lg text-[10px] font-mono"
          style={{ background: "rgba(212,184,150,0.08)", border: "1px solid rgba(212,184,150,0.15)", color: "#D4B896" }}
        >
          {searching ? "…" : "go"}
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 px-3 py-2 shrink-0 overflow-x-auto" style={{ borderBottom: "1px solid #151515" }}>
        {categories.map(cat => (
          <motion.button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium"
            style={{
              background: activeCategory === cat ? `${categoryColor(cat)}18` : "transparent",
              border: `1px solid ${activeCategory === cat ? `${categoryColor(cat)}40` : "#1E1E1E"}`,
              color: activeCategory === cat ? categoryColor(cat) : "#4A4A4A",
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
        {loading ? (
          <div className="flex items-center justify-center h-32 gap-3">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#D4B896" }} />
            <span className="text-xs font-mono" style={{ color: "#4A4A4A" }}>Fetching from AxiraNews…</span>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((article, i) => {
              const isExpanded = expandedId === article.id;
              const catColor = categoryColor(article.category);
              return (
                <motion.div
                  key={article.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ delay: i * 0.03 }}
                  className="cursor-pointer"
                  style={{ borderBottom: "1px solid #151515" }}
                  onClick={() => setExpandedId(isExpanded ? null : article.id)}
                  onMouseEnter={e => (e.currentTarget.style.background = "#111111")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {article.urgent && (
                          <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mb-1 mr-2"
                            style={{ background: "rgba(255,95,87,0.15)", color: "#FF5F57", border: "1px solid rgba(255,95,87,0.2)" }}>
                            URGENT
                          </span>
                        )}
                        <p className="text-sm font-medium leading-snug" style={{ color: "#F5F5F0" }}>
                          {article.title}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                            style={{ background: `${catColor}18`, color: catColor }}>
                            {article.category}
                          </span>
                          <span className="text-[10px]" style={{ color: "#3A3A3A" }}>{article.source}</span>
                          <span className="text-[10px]" style={{ color: "#3A3A3A" }}>{relativeTime(article.publishedAt)}</span>
                          {article.country && (
                            <span className="text-[10px]" style={{ color: "#3A3A3A" }}>{article.country}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 mt-1">
                        {article.url && (
                          <a href={article.url} target="_blank" rel="noreferrer"
                            onClick={e => e.stopPropagation()}>
                            <ExternalLink size={11} style={{ color: "#3A3A3A" }} />
                          </a>
                        )}
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}>
                          <ChevronDown size={13} style={{ color: "#3A3A3A" }} />
                        </motion.div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="text-xs leading-relaxed" style={{ color: "#6B6B6B" }}>
                            {article.summary ?? article.content ?? "No summary available."}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}

            {filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center justify-center h-32">
                <p className="text-xs" style={{ color: "#3A3A3A" }}>No {activeCategory} articles</p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
