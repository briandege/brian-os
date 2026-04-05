"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Folder, FileIcon, ChevronRight, ArrowLeft, RefreshCw,
  HardDrive, AlertCircle,
} from "lucide-react";

const ACCENT = "#C8A97E";

interface FileEntry {
  name: string;
  isDirectory: boolean;
  path: string;
  size: number;
  modified: string;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "--";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(1)} GB`;
}

function formatDate(iso: string): string {
  if (!iso) return "--";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function FilesApp() {
  const [currentPath, setCurrentPath] = useState("~");
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const hasElectron = typeof window !== "undefined" && !!window.electronAPI?.invoke;

  const loadDir = useCallback(async (dirPath: string) => {
    if (!window.electronAPI?.invoke) return;
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.invoke("fs:readDir", dirPath) as FileEntry[] | { error: string };
      if (result && "error" in result) {
        setError((result as { error: string }).error);
        setEntries([]);
      } else {
        // Filter hidden files
        setEntries((result as FileEntry[]).filter((e) => !e.name.startsWith(".")));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read directory");
      setEntries([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (hasElectron) loadDir(currentPath);
  }, [currentPath, hasElectron, loadDir]);

  const navigateTo = useCallback(
    (path: string) => {
      setHistory((h) => [...h, currentPath]);
      setCurrentPath(path);
    },
    [currentPath]
  );

  const goBack = useCallback(() => {
    const prev = history[history.length - 1];
    if (prev) {
      setHistory((h) => h.slice(0, -1));
      setCurrentPath(prev);
    }
  }, [history]);

  const handleDoubleClick = useCallback(
    (entry: FileEntry) => {
      if (entry.isDirectory) {
        navigateTo(entry.path);
      } else if (window.electronAPI?.invoke) {
        window.electronAPI.invoke("fs:openFile", entry.path);
      }
    },
    [navigateTo]
  );

  // Breadcrumbs
  const pathParts = currentPath === "~" ? ["~"] : currentPath.split("/").filter(Boolean);

  if (!hasElectron) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3" style={{ background: "#0A0A0C" }}>
        <HardDrive size={32} style={{ color: "rgba(255,255,255,0.1)" }} />
        <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.3)" }}>
          File system access requires the desktop app
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#0A0A0C" }}>
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={goBack}
          disabled={history.length === 0}
          className="p-1.5 rounded-md transition-colors"
          style={{
            color: history.length > 0 ? ACCENT : "rgba(255,255,255,0.15)",
          }}
        >
          <ArrowLeft size={14} />
        </button>
        <button
          onClick={() => loadDir(currentPath)}
          className="p-1.5 rounded-md transition-colors"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          <RefreshCw size={12} />
        </button>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto">
          {pathParts.map((part, i) => {
            const fullPath =
              currentPath === "~" && i === 0
                ? "~"
                : "/" + pathParts.slice(0, i + 1).join("/");
            return (
              <div key={i} className="flex items-center shrink-0">
                {i > 0 && (
                  <ChevronRight
                    size={10}
                    style={{ color: "rgba(255,255,255,0.15)" }}
                    className="mx-0.5"
                  />
                )}
                <button
                  onClick={() => {
                    if (fullPath !== currentPath) navigateTo(fullPath);
                  }}
                  className="text-[11px] font-mono px-1.5 py-0.5 rounded transition-colors"
                  style={{
                    color:
                      i === pathParts.length - 1
                        ? ACCENT
                        : "rgba(255,255,255,0.4)",
                  }}
                >
                  {part}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
              Loading...
            </span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <AlertCircle size={20} style={{ color: "rgba(255,85,87,0.5)" }} />
            <span className="text-[11px]" style={{ color: "rgba(255,85,87,0.6)" }}>
              {error}
            </span>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
              Empty folder
            </span>
          </div>
        ) : (
          <div className="grid gap-px" style={{ gridTemplateColumns: "1fr auto auto" }}>
            {/* Header */}
            <div className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.02)" }}>
              Name
            </div>
            <div className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider text-right" style={{ color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.02)", minWidth: 80 }}>
              Size
            </div>
            <div className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider text-right" style={{ color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.02)", minWidth: 100 }}>
              Modified
            </div>

            {entries.map((entry) => (
              <div
                key={entry.path}
                className="contents cursor-pointer group"
                onDoubleClick={() => handleDoubleClick(entry)}
              >
                <div
                  className="flex items-center gap-2 px-3 py-2 transition-colors group-hover:bg-white/[0.03]"
                >
                  {entry.isDirectory ? (
                    <Folder size={14} style={{ color: ACCENT, opacity: 0.7 }} />
                  ) : (
                    <FileIcon size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                  )}
                  <span
                    className="text-[11.5px] truncate"
                    style={{
                      color: entry.isDirectory
                        ? ACCENT
                        : "rgba(255,255,255,0.65)",
                    }}
                  >
                    {entry.name}
                  </span>
                </div>
                <div
                  className="flex items-center justify-end px-3 py-2 text-[10px] font-mono transition-colors group-hover:bg-white/[0.03]"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                >
                  {entry.isDirectory ? "--" : formatSize(entry.size)}
                </div>
                <div
                  className="flex items-center justify-end px-3 py-2 text-[10px] font-mono transition-colors group-hover:bg-white/[0.03]"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                >
                  {formatDate(entry.modified)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-3 py-1.5 border-t shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
          {entries.length} items
        </span>
        <span className="text-[9px] font-mono truncate max-w-[300px]" style={{ color: "rgba(255,255,255,0.15)" }}>
          {currentPath}
        </span>
      </div>
    </div>
  );
}
