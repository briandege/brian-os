"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, X, LogIn, LogOut, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore, isAuthed } from "@/lib/authStore";
import { loginWithCredentials } from "@/lib/axiraClient";
import { notify } from "@/lib/notificationStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: Props) {
  const { token, signIn, signOut } = useAuthStore();
  const [clientId, setClientId]       = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSecret, setShowSecret]   = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const authed = isAuthed();

  async function handleSignIn() {
    if (!clientId.trim() || !clientSecret.trim()) {
      setError("Both fields are required.");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await loginWithCredentials(clientId.trim(), clientSecret.trim());
    setLoading(false);
    if (!result) {
      setError("Invalid credentials or backend unreachable.");
      return;
    }
    signIn(result.token, result.expiresAt);
    notify("AxiraNews", "Signed in — personalized feed active", "success", "axira");
    setClientId("");
    setClientSecret("");
    onClose();
  }

  function handleSignOut() {
    signOut();
    notify("AxiraNews", "Signed out", "info", "axira");
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="auth-backdrop"
            className="fixed inset-0 z-[900]"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="auth-panel"
            className="fixed z-[901] left-1/2 top-1/2"
            style={{ translateX: "-50%", translateY: "-50%" }}
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div
              className="w-[380px] rounded-2xl overflow-hidden"
              style={{
                background: "rgba(10,10,16,0.97)",
                border: "1px solid rgba(212,184,150,0.15)",
                boxShadow: "0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Title bar */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(212,184,150,0.1)", border: "1px solid rgba(212,184,150,0.2)" }}>
                    <KeyRound size={14} style={{ color: "#D4B896" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#F0EDE6" }}>AxiraNews Auth</p>
                    <p className="text-[10px] font-mono" style={{ color: "#4A4A4A" }}>
                      {authed ? "session active" : "sign in to personalise your feed"}
                    </p>
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
                  style={{ color: "#4A4A4A" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#888")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#4A4A4A")}>
                  <X size={14} />
                </button>
              </div>

              <div className="p-5">
                {authed ? (
                  /* Signed-in state */
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: "rgba(40,200,64,0.06)", border: "1px solid rgba(40,200,64,0.15)" }}>
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#28C840" }} />
                      <div>
                        <p className="text-xs font-medium" style={{ color: "#28C840" }}>Connected to AxiraNews</p>
                        <p className="text-[10px] font-mono mt-0.5" style={{ color: "#4A4A4A" }}>
                          Personalised feed active · token expires in {
                            useAuthStore.getState().expiresAt
                              ? Math.max(0, Math.round((useAuthStore.getState().expiresAt! - Date.now()) / 60000))
                              : "—"
                          }m
                        </p>
                      </div>
                    </div>
                    <motion.button
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium"
                      style={{
                        background: "rgba(255,95,87,0.08)",
                        border: "1px solid rgba(255,95,87,0.2)",
                        color: "#FF5F57",
                      }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <LogOut size={13} />
                      Sign Out
                    </motion.button>
                  </div>
                ) : (
                  /* Sign-in form */
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-mono mb-1.5" style={{ color: "#6B6B6B" }}>
                        CLIENT ID
                      </label>
                      <input
                        type="text"
                        value={clientId}
                        onChange={e => setClientId(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSignIn()}
                        placeholder="axira-client"
                        className="w-full px-3 py-2.5 rounded-lg text-xs outline-none"
                        style={{
                          background: "#080810",
                          border: "1px solid #1E1E2A",
                          color: "#C8C6C0",
                          caretColor: "#D4B896",
                        }}
                        onFocus={e => (e.target.style.borderColor = "rgba(212,184,150,0.4)")}
                        onBlur={e => (e.target.style.borderColor = "#1E1E2A")}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono mb-1.5" style={{ color: "#6B6B6B" }}>
                        CLIENT SECRET
                      </label>
                      <div className="relative">
                        <input
                          type={showSecret ? "text" : "password"}
                          value={clientSecret}
                          onChange={e => setClientSecret(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleSignIn()}
                          placeholder="••••••••"
                          className="w-full px-3 py-2.5 pr-9 rounded-lg text-xs outline-none"
                          style={{
                            background: "#080810",
                            border: "1px solid #1E1E2A",
                            color: "#C8C6C0",
                            caretColor: "#D4B896",
                          }}
                          onFocus={e => (e.target.style.borderColor = "rgba(212,184,150,0.4)")}
                          onBlur={e => (e.target.style.borderColor = "#1E1E2A")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret(v => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2"
                          style={{ color: "#4A4A4A" }}
                        >
                          {showSecret ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[11px] font-mono"
                        style={{ color: "#FF5F57" }}
                      >
                        {error}
                      </motion.p>
                    )}

                    <motion.button
                      onClick={handleSignIn}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium mt-1"
                      style={{
                        background: loading
                          ? "rgba(212,184,150,0.06)"
                          : "rgba(212,184,150,0.12)",
                        border: "1px solid rgba(212,184,150,0.25)",
                        color: loading ? "#6B6B6B" : "#D4B896",
                      }}
                      whileTap={loading ? {} : { scale: 0.97 }}
                    >
                      {loading
                        ? <><Loader2 size={13} className="animate-spin" /> Authenticating…</>
                        : <><LogIn size={13} /> Sign In to AxiraNews</>
                      }
                    </motion.button>

                    <p className="text-[10px] text-center font-mono" style={{ color: "#2A2A2A" }}>
                      Credentials are sent directly to the AxiraNews API and never stored in plaintext.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
