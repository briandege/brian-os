"use client";
import { useState, useRef, useCallback } from "react";
import { Plus, Trash2, Eye, Edit3, FileText } from "lucide-react";
import { useNotesStore } from "@/lib/notesStore";

const ACCENT = "#C8A97E";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// Very simple markdown renderer (bold, italic, headers, code, links)
function renderMarkdown(md: string) {
  const lines = md.split("\n");
  return lines.map((line, i) => {
    // Headers
    if (line.startsWith("### ")) return <h3 key={i} className="text-[14px] font-bold mt-3 mb-1" style={{ color: ACCENT }}>{line.slice(4)}</h3>;
    if (line.startsWith("## ")) return <h2 key={i} className="text-[16px] font-bold mt-3 mb-1" style={{ color: ACCENT }}>{line.slice(3)}</h2>;
    if (line.startsWith("# ")) return <h1 key={i} className="text-[18px] font-bold mt-3 mb-1" style={{ color: ACCENT }}>{line.slice(2)}</h1>;
    // Code block line
    if (line.startsWith("```")) return <div key={i} className="h-px" />;

    // Inline formatting
    const html = line
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 rounded text-[11px]" style="background:rgba(200,169,126,0.1);color:#C8A97E">$1</code>')
      .replace(/\[(.+?)\]\((.+?)\)/g, (_, text, url) => {
        const safe = /^https?:\/\//i.test(url) ? url : "#";
        return `<a href="${safe}" style="color:#C8A97E;text-decoration:underline">${text}</a>`;
      });

    if (!line.trim()) return <div key={i} className="h-2" />;
    return <p key={i} className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }} dangerouslySetInnerHTML={{ __html: html }} />;
  });
}

export default function NotesApp() {
  const { notes, activeId, addNote, deleteNote, updateNote, setActive } = useNotesStore();
  const [preview, setPreview] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const active = notes.find((n) => n.id === activeId) ?? null;

  const handleUpdate = useCallback(
    (field: "title" | "content", value: string) => {
      if (!activeId) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateNote(activeId, { [field]: value });
      }, 500);
    },
    [activeId, updateNote]
  );

  // Immediate update for title (small field)
  const handleTitleChange = useCallback(
    (value: string) => {
      if (!activeId) return;
      updateNote(activeId, { title: value });
    },
    [activeId, updateNote]
  );

  return (
    <div className="flex h-full" style={{ background: "#0A0A0C" }}>
      {/* Sidebar */}
      <div
        className="flex flex-col w-[200px] shrink-0 border-r"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: "rgba(200,169,126,0.5)" }}>
            Notes
          </span>
          <button
            onClick={addNote}
            className="p-1 rounded-md transition-colors"
            style={{ color: ACCENT }}
            title="New Note"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 px-4">
              <FileText size={24} style={{ color: "rgba(255,255,255,0.1)" }} />
              <span className="text-[10px] text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
                No notes yet. Click + to create one.
              </span>
            </div>
          ) : (
            notes.map((note) => (
              <button
                key={note.id}
                onClick={() => setActive(note.id)}
                className="w-full text-left px-3 py-2.5 border-b transition-colors"
                style={{
                  borderColor: "rgba(255,255,255,0.03)",
                  background:
                    note.id === activeId
                      ? "rgba(200,169,126,0.08)"
                      : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (note.id !== activeId)
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    note.id === activeId
                      ? "rgba(200,169,126,0.08)"
                      : "transparent";
                }}
              >
                <div
                  className="text-[11px] font-medium truncate"
                  style={{
                    color:
                      note.id === activeId
                        ? ACCENT
                        : "rgba(255,255,255,0.6)",
                  }}
                >
                  {note.title || "Untitled"}
                </div>
                <div
                  className="text-[9px] font-mono mt-0.5"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                >
                  {formatDate(note.updatedAt)}
                </div>
                <div
                  className="text-[10px] mt-0.5 truncate"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                >
                  {note.content.slice(0, 60) || "Empty note"}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Editor / Preview */}
      <div className="flex-1 flex flex-col min-w-0">
        {active ? (
          <>
            {/* Toolbar */}
            <div
              className="flex items-center gap-2 px-4 py-2 border-b shrink-0"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <input
                className="flex-1 bg-transparent text-[13px] font-medium outline-none"
                style={{ color: "rgba(255,255,255,0.85)" }}
                value={active.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Note title..."
              />
              <button
                onClick={() => setPreview((v) => !v)}
                className="p-1.5 rounded-md transition-colors"
                style={{
                  color: preview ? ACCENT : "rgba(255,255,255,0.3)",
                  background: preview ? "rgba(200,169,126,0.1)" : "transparent",
                }}
                title={preview ? "Edit" : "Preview"}
              >
                {preview ? <Edit3 size={13} /> : <Eye size={13} />}
              </button>
              <button
                onClick={() => deleteNote(active.id)}
                className="p-1.5 rounded-md transition-colors"
                style={{ color: "rgba(255,85,87,0.6)" }}
                title="Delete Note"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {preview ? (
                <div className="p-4">{renderMarkdown(active.content)}</div>
              ) : (
                <textarea
                  className="w-full h-full resize-none bg-transparent p-4 text-[12px] font-mono outline-none leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                  value={active.content}
                  onChange={(e) => handleUpdate("content", e.target.value)}
                  placeholder="Start writing... (Markdown supported)"
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <FileText size={32} style={{ color: "rgba(255,255,255,0.08)" }} />
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
              Select a note or create a new one
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
