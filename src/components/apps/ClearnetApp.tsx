"use client";
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, RefreshCw, ExternalLink, Lock, ShieldAlert } from "lucide-react";

const ADMIN_PASSWORD = "strontium";

export default function ClearnetApp() {
  const [unlocked, setUnlocked]   = useState(false);
  const [input, setInput]         = useState("");
  const [error, setError]         = useState("");
  const [attempts, setAttempts]   = useState(0);
  const [addressInput, setAddressInput] = useState("");
  const [currentUrl, setCurrentUrl]     = useState("");
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const tryUnlock = useCallback(() => {
    if (input === ADMIN_PASSWORD) {
      setUnlocked(true);
      setError("");
    } else {
      const next = attempts + 1;
      setAttempts(next);
      setError(next >= 3 ? `Access denied (${next} attempts). Hint: the OS name.` : "Incorrect password.");
      setInput("");
      inputRef.current?.focus();
    }
  }, [input, attempts]);

  const navigate = useCallback(() => {
    if (!addressInput.trim()) return;
    let url = addressInput.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      const hasDot = url.includes(".");
      url = "https://" + (hasDot ? url : url + ".com");
    }
    setCurrentUrl(url);
    setIframeLoaded(false);
  }, [addressInput]);

  // ── Lock screen ──────────────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <div className="h-full flex flex-col items-center justify-center" style={{ background: "#060607" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" as const, stiffness: 300, damping: 26 }}
          className="w-full max-w-sm px-6"
        >
          {/* Icon */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(255,95,87,0.08)", border: "1px solid rgba(255,95,87,0.2)" }}
            >
              <ShieldAlert size={28} style={{ color: "#FF5F57" }} />
            </div>
            <div className="text-[15px] font-bold" style={{ color: "#F0EDE6" }}>Restricted Access</div>
            <div className="text-[11px] mt-1 text-center" style={{ color: "#4A4A54" }}>
              Clearnet browsing requires administrator credentials
            </div>
          </div>

          {/* Warning banner */}
          <div
            className="rounded-xl p-3 mb-5 flex items-start gap-2.5"
            style={{ background: "rgba(254,188,46,0.06)", border: "1px solid rgba(254,188,46,0.15)" }}
          >
            <Globe size={13} style={{ color: "#FEBC2E", marginTop: 1, flexShrink: 0 }} />
            <div className="text-[10px] leading-relaxed font-mono" style={{ color: "#7A7A62" }}>
              Clearnet traffic is <span style={{ color: "#FEBC2E" }}>unencrypted</span> and{" "}
              <span style={{ color: "#FEBC2E" }}>traceable</span>. Your real IP address will be
              visible to destinations. Use <span style={{ color: "#28C840" }}>Tor Browser</span>{" "}
              for anonymous browsing.
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-3">
            <div>
              <label className="text-[9px] tracking-widest block mb-1.5" style={{ color: "#4A4A54" }}>
                ADMIN PASSWORD
              </label>
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{
                  background: "#0A0A0C",
                  border: `1px solid ${error ? "rgba(255,95,87,0.4)" : "rgba(255,255,255,0.08)"}`,
                }}
              >
                <Lock size={12} style={{ color: "#4A4A54", flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  type="password"
                  className="flex-1 bg-transparent outline-none text-[13px] font-mono"
                  style={{ color: "#F0EDE6", caretColor: "#C8A97E" }}
                  placeholder="Enter password…"
                  value={input}
                  onChange={(e) => { setInput(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
                  autoFocus
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] font-mono px-1"
                  style={{ color: "#FF5F57" }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={tryUnlock}
              className="w-full py-2.5 rounded-xl text-[12px] font-bold"
              style={{
                background: "rgba(255,95,87,0.08)",
                border: "1px solid rgba(255,95,87,0.25)",
                color: "#FF5F57",
              }}
            >
              Authenticate
            </button>

            <div className="text-center text-[9px] font-mono" style={{ color: "#2A2A30" }}>
              Tor Browser is available without authentication
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Browser ──────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col" style={{ background: "#060607" }}>
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ borderBottom: "1px solid #111115" }}>
        {/* Warning badge */}
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg shrink-0"
          style={{ background: "rgba(254,188,46,0.07)", border: "1px solid rgba(254,188,46,0.15)" }}
        >
          <ShieldAlert size={11} style={{ color: "#FEBC2E" }} />
          <span className="text-[9px] font-bold font-mono" style={{ color: "#FEBC2E" }}>CLEARNET</span>
        </div>

        {/* Address bar */}
        <div
          className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: "#0A0A0C", border: "1px solid rgba(254,188,46,0.15)" }}
        >
          <Globe size={11} style={{ color: "#FEBC2E", flexShrink: 0 }} />
          <input
            className="flex-1 bg-transparent outline-none text-[12px] font-mono"
            style={{ color: "#C8C6C0", caretColor: "#C8A97E" }}
            placeholder="Enter URL…"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && navigate()}
            spellCheck={false}
          />
          {currentUrl && (
            <a href={currentUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={11} style={{ color: "#4A4A54" }} />
            </a>
          )}
        </div>

        <button
          onClick={navigate}
          className="shrink-0 p-1.5 rounded-lg"
          style={{ background: "rgba(254,188,46,0.07)", border: "1px solid rgba(254,188,46,0.15)", color: "#FEBC2E" }}
        >
          <RefreshCw size={12} />
        </button>

        <button
          onClick={() => setUnlocked(false)}
          className="shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-mono"
          style={{ background: "rgba(255,95,87,0.07)", border: "1px solid rgba(255,95,87,0.2)", color: "#FF5F57" }}
        >
          lock
        </button>
      </div>

      {/* Unencrypted warning strip */}
      <div
        className="px-4 py-1.5 flex items-center gap-2 shrink-0 text-[9px] font-mono"
        style={{ background: "rgba(254,188,46,0.04)", borderBottom: "1px solid rgba(254,188,46,0.08)", color: "#6A6A52" }}
      >
        <ShieldAlert size={10} style={{ color: "#FEBC2E" }} />
        Your IP address is visible · traffic is not encrypted · not anonymous
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {!currentUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
            <Globe size={40} style={{ color: "#2A2A30" }} />
            <div className="text-center">
              <div className="text-[13px] font-semibold mb-1" style={{ color: "#6A6A52" }}>Clearnet Browser</div>
              <div className="text-[10px] font-mono" style={{ color: "#3A3A42" }}>Admin access granted · IP visible</div>
            </div>
            <div className="text-[10px] font-mono" style={{ color: "#2A2A30" }}>Enter a URL above to browse</div>
          </div>
        ) : (
          <>
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#FEBC2E" }} />
                  <span className="text-[11px] font-mono" style={{ color: "#4A4A54" }}>Loading…</span>
                </div>
              </div>
            )}
            <iframe
              key={currentUrl}
              src={currentUrl}
              className="w-full h-full border-0"
              style={{ opacity: iframeLoaded ? 1 : 0, transition: "opacity 0.3s", background: "#fff" }}
              onLoad={() => setIframeLoaded(true)}
              title="Clearnet Browser"
            />
          </>
        )}
      </div>
    </div>
  );
}
