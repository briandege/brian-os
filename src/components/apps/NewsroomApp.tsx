"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PenSquare, Plus, Trash2, Eye, Edit3, Bold, Italic, Heading,
  Link, Clock, Tag, Globe, Rss, CheckCircle2, Loader2, Radio,
  BarChart3, User, FileText,
} from "lucide-react";
import { useNewsroomStore, type Article } from "@/lib/newsroomStore";
import { notify } from "@/lib/notificationStore";
import { triggerIngest } from "@/lib/axiraClient";

const CATEGORIES = [
  "Breaking", "Technology", "Global", "Finance",
  "Cybersecurity", "Science", "Health", "Politics",
];

function readingTime(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return `~${Math.max(1, Math.ceil(words / 200))} min read`;
}
function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Markdown preview ─────────────────────────────────────────────────────────
function MarkdownPreview({ body }: { body: string }) {
  const html = body
    .replace(/^### (.+)$/gm, '<h3 style="font-size:14px;font-weight:700;margin:12px 0 4px;color:#F0EDE6">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:16px;font-weight:700;margin:14px 0 6px;color:#F0EDE6">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:18px;font-weight:700;margin:16px 0 8px;color:#F0EDE6">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.06);padding:1px 4px;border-radius:3px;font-size:11px;color:#C8A97E">$1</code>')
    .replace(/\n/g, "<br/>");
  return (
    <div
      className="text-[13px] leading-relaxed p-5"
      style={{ color: "#C8C6C0" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ── Distribution badge ───────────────────────────────────────────────────────
type DistStatus = "idle" | "distributing" | "done" | "error";

function DistributionBadge({ status }: { status: DistStatus }) {
  const cfg = {
    idle:         { color: "rgba(255,255,255,0.15)", label: "Not distributed" },
    distributing: { color: "#FEBC2E",                label: "Distributing…"   },
    done:         { color: "#28C840",                label: "Live worldwide"   },
    error:        { color: "#FF5F57",                label: "Distribution failed" },
  }[status];
  return (
    <div className="flex items-center gap-1.5">
      {status === "distributing" ? (
        <Loader2 size={10} className="animate-spin" style={{ color: cfg.color }} />
      ) : status === "done" ? (
        <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.4 }}>
          <CheckCircle2 size={10} style={{ color: cfg.color }} />
        </motion.div>
      ) : (
        <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
      )}
      <span className="text-[9.5px] font-mono" style={{ color: cfg.color }}>{cfg.label}</span>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function NewsroomApp() {
  const {
    articles, draftId,
    createDraft, updateArticle, publishArticle, deleteArticle, setDraftId,
  } = useNewsroomStore();

  const [preview,    setPreview]    = useState(false);
  const [tagInput,   setTagInput]   = useState("");
  const [distStatus, setDistStatus] = useState<DistStatus>("idle");
  const [statsView,  setStatsView]  = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current   = articles.find((a) => a.id === draftId) ?? null;
  const drafts    = articles.filter((a) => a.status === "draft");
  const published = articles.filter((a) => a.status === "published");

  // Auto-generate slug from title
  useEffect(() => {
    if (!current || current.slug !== current.id) return; // already customised
    if (!current.title.trim()) return;
    const auto = slugify(current.title);
    if (auto && auto !== current.slug) updateArticle(current.id, { slug: auto });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.title]);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // Set distStatus when switching articles
  useEffect(() => {
    setDistStatus(current?.distributed ? "done" : "idle");
  }, [current?.id, current?.distributed]);

  const handleBodyChange = useCallback((body: string) => {
    if (!draftId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateArticle(draftId, { body }), 500);
  }, [draftId, updateArticle]);

  const handlePublish = useCallback(async () => {
    if (!current || !current.title.trim()) return;

    // 1. Mark published in local store
    publishArticle(current.id);
    notify("Article published", current.title, "success", "newsroom");

    // 2. Distribute worldwide
    setDistStatus("distributing");
    try {
      const payload = {
        id:          current.id,
        title:       current.title,
        body:        current.body,
        summary:     current.summary || current.body.slice(0, 200).replace(/[#*`]/g, ""),
        author:      current.author || "Brian Ndege",
        category:    current.category,
        tags:        current.tags,
        publishedAt: Date.now(),
        slug:        current.slug || current.id,
      };

      // Push to local public API (Next.js route)
      await fetch("/api/news/publish", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      // Also try AxiraNews backend ingest
      await triggerIngest().catch(() => { /* optional */ });

      updateArticle(current.id, { distributed: true });
      setDistStatus("done");
      notify("Distributed worldwide", `${current.title} is now in the global feed`, "success", "newsroom");
    } catch {
      setDistStatus("error");
    }
  }, [current, publishArticle, updateArticle]);

  const handleAddTag = useCallback(() => {
    if (!current || !tagInput.trim()) return;
    updateArticle(current.id, { tags: [...current.tags, tagInput.trim()] });
    setTagInput("");
  }, [current, tagInput, updateArticle]);

  const handleRemoveTag = useCallback((tag: string) => {
    if (!current) return;
    updateArticle(current.id, { tags: current.tags.filter((t) => t !== tag) });
  }, [current, updateArticle]);

  const insertMarkdown = useCallback((prefix: string, suffix: string) => {
    if (!current) return;
    updateArticle(current.id, { body: current.body + prefix + suffix });
  }, [current, updateArticle]);

  // ── Stats panel ─────────────────────────────────────────────────────────────
  if (statsView) {
    return (
      <div className="flex flex-col h-full p-5 gap-4" style={{ background: "#0A0A0C" }}>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold tracking-wide" style={{ color: "#FF5F57" }}>Newsroom Analytics</span>
          <button
            onClick={() => setStatsView(false)}
            className="text-[10px] font-mono px-3 py-1 rounded-lg"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}
          >
            ← Back
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Articles", value: articles.length, color: "#C8A97E" },
            { label: "Published",      value: published.length, color: "#28C840" },
            { label: "Drafts",         value: drafts.length,    color: "#FEBC2E" },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-[22px] font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9.5px] font-mono mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl p-4 gap-2 flex flex-col" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="text-[10px] font-mono font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.2)" }}>Distribution Endpoints</div>
          {[
            { icon: <Rss size={11} />, label: "RSS Feed",  url: "/api/rss",  color: "#FEBC2E" },
            { icon: <Globe size={11} />, label: "JSON API", url: "/api/news", color: "#5AC8FA" },
          ].map((ep) => (
            <div key={ep.url} className="flex items-center gap-2 mt-1.5">
              <span style={{ color: ep.color }}>{ep.icon}</span>
              <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>{ep.label}</span>
              <code className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)" }}>
                {ep.url}
              </code>
            </div>
          ))}
          <div className="mt-2 text-[9.5px] font-mono" style={{ color: "rgba(255,255,255,0.15)" }}>
            Anyone can subscribe to your RSS feed or call your JSON API to read your articles worldwide.
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="text-[9px] font-mono font-bold tracking-widest uppercase mb-2" style={{ color: "rgba(255,255,255,0.15)" }}>
            Published Articles
          </div>
          {published.length === 0 && (
            <div className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.15)" }}>No articles published yet</div>
          )}
          {published.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex-1 min-w-0">
                <div className="text-[11.5px] font-medium truncate" style={{ color: "#F0EDE6" }}>{a.title}</div>
                <div className="text-[9.5px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                  {a.category} · {new Date(a.publishedAt!).toLocaleDateString()} · {wordCount(a.body)} words
                </div>
              </div>
              {a.distributed && <CheckCircle2 size={12} style={{ color: "#28C840", flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full" style={{ background: "#0A0A0C" }}>

      {/* ── Left Sidebar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col h-full" style={{ width: 210, borderRight: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
        <div className="flex items-center justify-between p-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-1.5">
            <Radio size={11} style={{ color: "#FF5F57" }} />
            <span className="text-[10.5px] font-bold tracking-[0.12em]" style={{ color: "#FF5F57" }}>NEWSROOM</span>
            <span className="text-[9px] font-mono px-1 rounded" style={{ background: "rgba(255,95,87,0.08)", color: "rgba(255,95,87,0.5)" }}>
              {articles.length}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setStatsView(true)}
              className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
              style={{ color: "rgba(255,255,255,0.25)" }}
              title="Analytics"
            >
              <BarChart3 size={11} />
            </button>
            <button
              onClick={() => createDraft()}
              className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
              style={{ background: "rgba(255,95,87,0.08)", color: "#FF5F57", border: "1px solid rgba(255,95,87,0.15)" }}
              title="New Article"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {articles.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
              <PenSquare size={22} style={{ color: "rgba(255,255,255,0.07)" }} />
              <span className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.15)" }}>
                Write your first article and publish it to the world
              </span>
            </div>
          )}

          {drafts.length > 0 && (
            <>
              <div className="px-3 pt-3 pb-1 text-[8px] font-mono font-bold tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.12)" }}>Drafts</div>
              {drafts.map((a) => (
                <ArticleItem key={a.id} article={a} isActive={a.id === draftId} onClick={() => setDraftId(a.id)} onDelete={() => deleteArticle(a.id)} />
              ))}
            </>
          )}

          {published.length > 0 && (
            <>
              <div className="px-3 pt-3 pb-1 text-[8px] font-mono font-bold tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.12)" }}>Published</div>
              {published.map((a) => (
                <ArticleItem key={a.id} article={a} isActive={a.id === draftId} onClick={() => setDraftId(a.id)} onDelete={() => deleteArticle(a.id)} />
              ))}
            </>
          )}
        </div>

        {/* RSS pill at bottom */}
        <div className="p-3 flex items-center gap-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <Rss size={10} style={{ color: "rgba(255,95,87,0.4)" }} />
          <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.15)" }}>/api/rss</span>
          <span className="ml-auto text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(40,200,64,0.08)", color: "#28C840", border: "1px solid rgba(40,200,64,0.15)" }}>
            LIVE
          </span>
        </div>
      </div>

      {/* ── Center: Editor ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0">
        {current ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-4 py-2 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <ToolbarBtn icon={<Bold size={12} />}    onClick={() => insertMarkdown("**", "**")} title="Bold" />
              <ToolbarBtn icon={<Italic size={12} />}  onClick={() => insertMarkdown("*", "*")}   title="Italic" />
              <ToolbarBtn icon={<Heading size={12} />} onClick={() => insertMarkdown("\n## ", "")} title="Heading" />
              <ToolbarBtn icon={<Link size={12} />}    onClick={() => insertMarkdown("[", "](url)")} title="Link" />
              <div className="flex-1" />
              <span className="text-[9px] font-mono mr-2" style={{ color: "rgba(255,255,255,0.15)" }}>
                {wordCount(current.body).toLocaleString()} words
              </span>
              <button
                onClick={() => setPreview((v) => !v)}
                className="px-2.5 py-1 rounded-md text-[10px] font-mono flex items-center gap-1 transition-colors"
                style={{
                  background: preview ? "rgba(200,169,126,0.1)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${preview ? "rgba(200,169,126,0.2)" : "rgba(255,255,255,0.06)"}`,
                  color: preview ? "#C8A97E" : "rgba(255,255,255,0.3)",
                }}
              >
                {preview ? <><Edit3 size={10}/> Edit</> : <><Eye size={10}/> Preview</>}
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {preview ? (
                <MarkdownPreview body={current.body} />
              ) : (
                <textarea
                  value={current.body}
                  onChange={(e) => {
                    updateArticle(current.id, { body: e.target.value });
                    handleBodyChange(e.target.value);
                  }}
                  placeholder={`Start writing "${current.title || "your article"}"...\n\nTip: Use ## for headings, **bold**, *italic*`}
                  className="w-full h-full resize-none p-5 text-[13px] font-mono leading-relaxed outline-none"
                  style={{ background: "transparent", color: "#C8C6C0", caretColor: "#C8A97E" }}
                />
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-4 py-1.5 shrink-0 text-[9.5px] font-mono"
              style={{ borderTop: "1px solid rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.18)" }}
            >
              <div className="flex items-center gap-1">
                <FileText size={9} />
                <span>{wordCount(current.body).toLocaleString()} words</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={9} />
                <span>{readingTime(current.body)}</span>
              </div>
              <DistributionBadge status={distStatus} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center flex flex-col items-center gap-3">
              <Globe size={36} style={{ color: "rgba(255,255,255,0.05)" }} />
              <p className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.12)" }}>
                Your words reach the world.
              </p>
              <button
                onClick={() => createDraft()}
                className="mt-2 px-4 py-2 rounded-xl text-[11px] font-semibold transition-colors"
                style={{ background: "rgba(255,95,87,0.1)", border: "1px solid rgba(255,95,87,0.2)", color: "#FF5F57" }}
              >
                + New Article
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Right Sidebar: Publish Settings ─────────────────────────────── */}
      <AnimatePresence>
        {current && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col h-full overflow-y-auto"
            style={{ width: 220, borderLeft: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}
          >
            <div className="p-3 flex flex-col gap-3">
              <div className="text-[8.5px] font-mono font-bold tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.15)" }}>
                Publish Settings
              </div>

              {/* Title */}
              <Field label="Headline">
                <input
                  value={current.title}
                  onChange={(e) => updateArticle(current.id, { title: e.target.value })}
                  placeholder="Article headline..."
                  className="os-input w-full text-[11px] px-2.5 py-1.5 rounded-lg"
                />
              </Field>

              {/* Summary / lede */}
              <Field label="Summary (SEO)">
                <textarea
                  value={current.summary}
                  onChange={(e) => updateArticle(current.id, { summary: e.target.value })}
                  placeholder="One sentence for RSS & search..."
                  rows={2}
                  className="os-input w-full text-[10.5px] px-2.5 py-1.5 rounded-lg resize-none"
                  style={{ lineHeight: "1.5" }}
                />
              </Field>

              {/* Author */}
              <Field label="Author">
                <div className="relative">
                  <User size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.2)" }} />
                  <input
                    value={current.author}
                    onChange={(e) => updateArticle(current.id, { author: e.target.value })}
                    placeholder="Brian Ndege"
                    className="os-input w-full text-[11px] pl-7 pr-2.5 py-1.5 rounded-lg"
                  />
                </div>
              </Field>

              {/* Category */}
              <Field label="Category">
                <select
                  value={current.category}
                  onChange={(e) => updateArticle(current.id, { category: e.target.value })}
                  className="os-input w-full text-[11px] px-2.5 py-1.5 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.025)", appearance: "none" }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} style={{ background: "#0A0A0C" }}>{c}</option>
                  ))}
                </select>
              </Field>

              {/* Slug */}
              <Field label="URL Slug">
                <input
                  value={current.slug ?? current.id}
                  onChange={(e) => updateArticle(current.id, { slug: slugify(e.target.value) })}
                  placeholder="my-article-slug"
                  className="os-input w-full text-[10px] font-mono px-2.5 py-1.5 rounded-lg"
                />
              </Field>

              {/* Tags */}
              <Field label="Tags">
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {current.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono cursor-pointer hover:opacity-60 transition-opacity"
                      style={{ background: "rgba(255,95,87,0.08)", color: "rgba(255,95,87,0.6)", border: "1px solid rgba(255,95,87,0.12)" }}
                      onClick={() => handleRemoveTag(t)}
                    >
                      <Tag size={7} /> {t} ×
                    </span>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                    placeholder="Add tag + Enter"
                    className="os-input flex-1 text-[10px] px-2 py-1 rounded-md"
                  />
                </div>
              </Field>

              {/* Status & distribution */}
              <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: current.status === "published" ? "#28C840" : "#FEBC2E" }}
                  />
                  <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {current.status === "published" ? "Published" : "Draft"}
                  </span>
                </div>
                {current.status === "published" && <DistributionBadge status={distStatus} />}
              </div>

              {/* Distribution endpoints (after publish) */}
              {current.status === "published" && (
                <div className="rounded-xl p-3 flex flex-col gap-1.5" style={{ background: "rgba(40,200,64,0.03)", border: "1px solid rgba(40,200,64,0.1)" }}>
                  <div className="text-[8px] font-mono font-bold tracking-widest uppercase mb-1" style={{ color: "rgba(40,200,64,0.4)" }}>
                    Live Endpoints
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Rss size={9} style={{ color: "#FEBC2E" }} />
                    <code className="text-[8.5px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>/api/rss</code>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Globe size={9} style={{ color: "#5AC8FA" }} />
                    <code className="text-[8.5px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>/api/news</code>
                  </div>
                </div>
              )}
            </div>

            {/* Publish button — pinned to bottom */}
            <div className="mt-auto p-3">
              {current.status === "draft" ? (
                <button
                  onClick={handlePublish}
                  disabled={!current.title.trim() || distStatus === "distributing"}
                  className="w-full py-2.5 rounded-xl text-[12px] font-bold tracking-wide transition-all flex items-center justify-center gap-2"
                  style={{
                    background:  current.title.trim() ? "rgba(255,95,87,0.12)" : "rgba(255,255,255,0.03)",
                    border:      `1px solid ${current.title.trim() ? "rgba(255,95,87,0.35)" : "rgba(255,255,255,0.06)"}`,
                    color:       current.title.trim() ? "#FF5F57" : "rgba(255,255,255,0.15)",
                    cursor:      current.title.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  <Globe size={12} />
                  Publish Worldwide
                </button>
              ) : (
                <div className="text-center">
                  <div className="text-[10px] font-bold" style={{ color: "#28C840" }}>✓ Live Worldwide</div>
                  <div className="text-[9px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.15)" }}>
                    {current.publishedAt ? new Date(current.publishedAt).toLocaleString() : ""}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[8.5px] font-mono mb-1.5 block font-bold tracking-[0.12em] uppercase" style={{ color: "rgba(255,255,255,0.2)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ArticleItem({
  article, isActive, onClick, onDelete,
}: {
  article: Article; isActive: boolean; onClick: () => void; onDelete: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-start gap-2 px-3 py-2.5 cursor-pointer group transition-colors"
      style={{
        background:  isActive ? "rgba(255,95,87,0.05)" : "transparent",
        borderLeft:  isActive ? "2px solid rgba(255,95,87,0.6)" : "2px solid transparent",
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium truncate" style={{ color: isActive ? "#F0EDE6" : "rgba(255,255,255,0.38)" }}>
            {article.title || "Untitled"}
          </span>
          {article.distributed && <CheckCircle2 size={9} style={{ color: "#28C840", flexShrink: 0 }} />}
        </div>
        <div className="text-[9px] font-mono mt-0.5 flex items-center gap-1" style={{ color: "rgba(255,255,255,0.15)" }}>
          <span className="px-1 py-0.5 rounded" style={{ background: "rgba(255,95,87,0.06)", color: "rgba(255,95,87,0.4)" }}>{article.category}</span>
          <span>{new Date(article.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0"
        style={{ color: "rgba(255,255,255,0.18)" }}
        title="Delete"
      >
        <Trash2 size={10} />
      </button>
    </div>
  );
}

function ToolbarBtn({ icon, onClick, title }: { icon: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/5 transition-colors"
      style={{ color: "rgba(255,255,255,0.25)" }}
    >
      {icon}
    </button>
  );
}
