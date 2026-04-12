"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ExternalLink, AlertTriangle, BookOpen, Play, Square } from "lucide-react";
import { useJupyter } from "@/hooks/useJupyter";

// Fallback: probe a manually-started Jupyter if Electron API is unavailable
const FALLBACK_URL   = "http://localhost:8888";
const FALLBACK_TOKEN = "brianOS";

type Status = "checking" | "online" | "offline";

export default function NotebookApp() {
  const { state: jState, start, stop } = useJupyter();
  const isElectron = typeof window !== "undefined" && !!window.electronAPI;

  const [status, setStatus]   = useState<Status>("checking");
  const [loaded, setLoaded]   = useState(false);
  const [starting, setStarting] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Derive embed URL from Jupyter manager state or fallback
  const embedUrl = isElectron && jState.url
    ? jState.url
    : `${FALLBACK_URL}/lab?token=${FALLBACK_TOKEN}`;

  // Sync status with jState when in Electron
  useEffect(() => {
    if (!isElectron) return;
    if (jState.status === "ready")    { setStatus("online");  setLoaded(false); }
    if (jState.status === "starting") setStatus("checking");
    if (jState.status === "stopped" || jState.status === "error" || jState.status === "idle")
      setStatus("offline");
  }, [jState.status, isElectron]);

  const checkStatus = async () => {
    if (isElectron) { start(); setStarting(true); setTimeout(() => setStarting(false), 5000); return; }
    setStatus("checking");
    setLoaded(false);
    try {
      const res = await fetch(`${FALLBACK_URL}/api`, {
        headers: { Authorization: `token ${FALLBACK_TOKEN}` },
        signal: AbortSignal.timeout(3000),
      });
      setStatus(res.ok ? "online" : "offline");
    } catch { setStatus("offline"); }
  };

  useEffect(() => {
    if (isElectron) {
      // If idle, don't auto-start — let user click button
      if (jState.status === "ready") { setStatus("online"); return; }
      if (jState.status !== "idle") setStatus("checking");
      else setStatus("offline");
    } else {
      checkStatus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full flex flex-col" style={{ background: "#0A0A0C" }}>
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{ borderBottom: "1px solid #161618" }}
      >
        <div className="flex items-center gap-2.5">
          <BookOpen size={14} style={{ color: "#C8A97E" }} />
          <span className="text-[12px] font-semibold" style={{ color: "#F0EDE6" }}>
            JupyterLab
          </span>
          <StatusBadge status={status} />
        </div>

        <div className="flex items-center gap-2">
          {isElectron && status === "online" && (
            <motion.button
              onClick={stop}
              whileTap={{ scale: 0.92 }}
              className="p-1.5 rounded-lg"
              style={{ background: "rgba(255,95,87,0.08)", color: "#FF5F57" }}
              title="Stop Jupyter server"
            >
              <Square size={12} />
            </motion.button>
          )}
          <motion.button
            onClick={checkStatus}
            whileTap={{ scale: 0.92 }}
            className="p-1.5 rounded-lg"
            style={{ background: "rgba(255,255,255,0.04)", color: "#4A4A56" }}
            title="Refresh connection"
          >
            <RefreshCw size={12} className={status === "checking" ? "animate-spin" : ""} />
          </motion.button>
          {status === "online" && (
            <a
              href={embedUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium"
              style={{
                background: "rgba(200,169,126,0.08)",
                border: "1px solid rgba(200,169,126,0.15)",
                color: "#C8A97E",
              }}
            >
              <ExternalLink size={11} />
              Open Tab
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {status === "checking" && (
            <motion.div
              key="checking"
              className="absolute inset-0 flex flex-col items-center justify-center gap-4"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#C8A97E" }} />
                <span className="text-[12px] font-mono" style={{ color: "#4A4A56" }}>
                  Connecting to JupyterLab...
                </span>
              </div>
            </motion.div>
          )}

          {status === "offline" && (
            <motion.div
              key="offline"
              className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ type: "spring" as const, stiffness: 300, damping: 28 }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,95,87,0.08)", border: "1px solid rgba(255,95,87,0.15)" }}
              >
                <AlertTriangle size={20} style={{ color: "#FF5F57" }} />
              </div>

              <div className="text-center space-y-1.5">
                <div className="text-[14px] font-semibold" style={{ color: "#F0EDE6" }}>
                  JupyterLab is not running
                </div>
                <div className="text-[12px]" style={{ color: "#4A4A56" }}>
                  {isElectron ? "Launch the server directly from here" : "Start it from your terminal, then refresh"}
                </div>
                {jState.error && (
                  <div className="text-[11px] font-mono mt-1" style={{ color: "#FF5F57" }}>{jState.error}</div>
                )}
              </div>

              {isElectron ? (
                <motion.button
                  onClick={() => { start(); setStarting(true); }}
                  disabled={starting || jState.status === "starting"}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[12px] font-semibold"
                  style={{
                    background: "rgba(40,200,64,0.08)",
                    border: "1px solid rgba(40,200,64,0.2)",
                    color: "#28C840",
                    opacity: (starting || jState.status === "starting") ? 0.6 : 1,
                  }}
                >
                  <Play size={13} />
                  {jState.status === "starting" ? "Starting…" : "Launch Jupyter"}
                </motion.button>
              ) : (
                <>
                  {/* Manual launch instruction */}
                  <div
                    className="w-full max-w-sm rounded-xl p-4 font-mono text-[11px] space-y-1"
                    style={{ background: "#060607", border: "1px solid #161618" }}
                  >
                    <div style={{ color: "#3A3A42" }}># from brian-os project root</div>
                    <div>
                      <span style={{ color: "#7A6348" }}>$ </span>
                      <span style={{ color: "#C8A97E" }}>jupyter lab --no-browser</span>
                    </div>
                  </div>
                  <motion.button
                    onClick={checkStatus}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[12px] font-semibold"
                    style={{
                      background: "rgba(200,169,126,0.08)",
                      border: "1px solid rgba(200,169,126,0.2)",
                      color: "#C8A97E",
                    }}
                  >
                    <RefreshCw size={13} />
                    Check Again
                  </motion.button>
                </>
              )}
            </motion.div>
          )}

          {status === "online" && (
            <motion.div
              key="online"
              className="absolute inset-0"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Loading shimmer while iframe initializes */}
              {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#C8A97E" }} />
                    <span className="text-[12px] font-mono" style={{ color: "#4A4A56" }}>
                      Loading JupyterLab...
                    </span>
                  </div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                src={embedUrl}
                className="w-full h-full border-0"
                style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.3s" }}
                onLoad={() => setLoaded(true)}
                allow="clipboard-read; clipboard-write"
                title="JupyterLab"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const cfg = {
    checking: { color: "#C8A97E", bg: "rgba(200,169,126,0.1)",  label: "connecting" },
    online:   { color: "#28C840", bg: "rgba(40,200,64,0.1)",    label: "online" },
    offline:  { color: "#FF5F57", bg: "rgba(255,95,87,0.1)",    label: "offline" },
  }[status];

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <div
        className={`w-1 h-1 rounded-full ${status === "online" ? "animate-pulse" : ""}`}
        style={{ background: cfg.color }}
      />
      {cfg.label}
    </div>
  );
}
