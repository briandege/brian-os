"use client";
import { useState, useEffect, useRef } from "react";
import {
  Search, Pin, Trash2, Copy, PinOff, Clipboard,
} from "lucide-react";
import { useClipboardStore } from "@/lib/clipboardStore";

const ACCENT = "#C8A97E";

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ClipboardApp() {
  const { entries, addEntry, deleteEntry, togglePin, clearAll, copyEntry } =
    useClipboardStore();
  const [search, setSearch] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const hasElectron = typeof window !== "undefined" && !!window.electronAPI?.clipboardRead;

  // Poll clipboard in Electron mode
  useEffect(() => {
    if (!hasElectron) return;
    const poll = async () => {
      try {
        const text = await window.electronAPI!.clipboardRead();
        if (text) addEntry(text);
      } catch {}
    };
    poll();
    pollRef.current = setInterval(poll, 2000);
    return () => clearInterval(pollRef.current);
  }, [hasElectron, addEntry]);

  const filtered = entries.filter((e) => {
    if (!search.trim()) return true;
    return e.text.toLowerCase().includes(search.toLowerCase());
  });

  // Sort: pinned first, then by time
  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <div className="flex flex-col h-full" style={{ background: "#0A0A0C" }}>
      {/* Search */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 border-b shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <Search size={12} style={{ color: "rgba(255,255,255,0.2)" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clipboard..."
          className="flex-1 bg-transparent text-[11px] outline-none"
          style={{ color: "rgba(255,255,255,0.7)" }}
        />
        <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
          {entries.length}/50
        </span>
      </div>

      {/* Header actions */}
      <div className="flex items-center justify-between px-3 py-1.5 shrink-0">
        <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: "rgba(200,169,126,0.4)" }}>
          History
        </span>
        <button
          onClick={clearAll}
          className="text-[9px] font-mono px-2 py-0.5 rounded transition-colors"
          style={{ color: "rgba(255,85,87,0.5)" }}
          title="Clear all (keeps pinned)"
        >
          Clear All
        </button>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Clipboard size={24} style={{ color: "rgba(255,255,255,0.08)" }} />
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>
              {search ? "No matching entries" : hasElectron ? "Clipboard history will appear here" : "Copy text to start collecting"}
            </span>
          </div>
        ) : (
          sorted.map((entry) => (
            <div
              key={entry.id}
              className="group px-3 py-2.5 border-b transition-colors cursor-pointer"
              style={{
                borderColor: "rgba(255,255,255,0.03)",
                background: entry.pinned ? "rgba(200,169,126,0.04)" : "transparent",
              }}
              onClick={() => copyEntry(entry.id)}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = entry.pinned
                  ? "rgba(200,169,126,0.04)"
                  : "transparent")
              }
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[11px] leading-relaxed break-words"
                    style={{
                      color: "rgba(255,255,255,0.6)",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {entry.text}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
                      {formatTime(entry.timestamp)}
                    </span>
                    {entry.pinned && (
                      <Pin size={8} style={{ color: "rgba(200,169,126,0.4)" }} />
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); copyEntry(entry.id); }}
                    className="p-1 rounded"
                    style={{ color: "rgba(200,169,126,0.5)" }}
                    title="Copy"
                  >
                    <Copy size={11} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePin(entry.id); }}
                    className="p-1 rounded"
                    style={{ color: entry.pinned ? ACCENT : "rgba(255,255,255,0.3)" }}
                    title={entry.pinned ? "Unpin" : "Pin"}
                  >
                    {entry.pinned ? <PinOff size={11} /> : <Pin size={11} />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }}
                    className="p-1 rounded"
                    style={{ color: "rgba(255,85,87,0.5)" }}
                    title="Delete"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Status */}
      <div
        className="flex items-center justify-between px-3 py-1.5 border-t shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.15)" }}>
          {hasElectron ? "Polling clipboard every 2s" : "Web mode - manual only"}
        </span>
        <span className="text-[9px] font-mono" style={{ color: "rgba(200,169,126,0.3)" }}>
          Click to copy
        </span>
      </div>
    </div>
  );
}
