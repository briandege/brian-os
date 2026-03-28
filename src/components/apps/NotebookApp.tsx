"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ExternalLink, AlertTriangle, BookOpen } from "lucide-react";

const JUPYTER_URL = "http://localhost:8888";
const JUPYTER_TOKEN = "brianOS";
const EMBED_URL = `${JUPYTER_URL}/lab?token=${JUPYTER_TOKEN}`;

type Status = "checking" | "online" | "offline";

export default function NotebookApp() {
  const [status, setStatus] = useState<Status>("checking");
  const [loaded, setLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const checkStatus = async () => {
    setStatus("checking");
    setLoaded(false);
    try {
      const res = await fetch(`${JUPYTER_URL}/api`, {
        headers: { Authorization: `token ${JUPYTER_TOKEN}` },
        signal: AbortSignal.timeout(3000),
      });
      setStatus(res.ok ? "online" : "offline");
    } catch {
      setStatus("offline");
    }
  };

  useEffect(() => { checkStatus(); }, []);

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
          <motion.button
            onClick={checkStatus}
            whileTap={{ scale: 0.92 }}
            className="p-1.5 rounded-lg"
            style={{ background: "rgba(255,255,255,0.04)", color: "#4A4A56" }}
            title="Refresh connection"
          >
            <RefreshCw size={12} className={status === "checking" ? "animate-spin" : ""} />
          </motion.button>
          <a
            href={EMBED_URL}
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
                  Start it from your terminal, then refresh
                </div>
              </div>

              {/* Launch instruction */}
              <div
                className="w-full max-w-sm rounded-xl p-4 font-mono text-[11px] space-y-1"
                style={{ background: "#060607", border: "1px solid #161618" }}
              >
                <div style={{ color: "#3A3A42" }}># from brian-os project root</div>
                <div>
                  <span style={{ color: "#7A6348" }}>$ </span>
                  <span style={{ color: "#C8A97E" }}>./start-jupyter.sh</span>
                </div>
                <div style={{ color: "#3A3A42" }}># or directly:</div>
                <div>
                  <span style={{ color: "#7A6348" }}>$ </span>
                  <span style={{ color: "#8A8A7A" }}>jupyter lab --no-browser \</span>
                </div>
                <div>
                  <span style={{ color: "#3A3A42" }}>    --ServerApp.token=</span>
                  <span style={{ color: "#C8A97E" }}>&apos;brianOS&apos;</span>
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
                src={EMBED_URL}
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
