"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Code2, Users, Send, Check } from "lucide-react";

const LINKS = [
  { icon: <Mail size={15} />, label: "Email", value: "brian@axiranews.com", href: "mailto:brian@axiranews.com" },
  { icon: <Code2 size={15} />, label: "GitHub", value: "github.com/briandege", href: "https://github.com/briandege" },
  { icon: <Users size={15} />, label: "LinkedIn", value: "linkedin.com/in/briandege", href: "https://linkedin.com/in/briandege" },
];

export default function ContactApp() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    await new Promise((r) => setTimeout(r, 1200));
    setStatus("sent");
    setForm({ name: "", email: "", message: "" });
    setTimeout(() => setStatus("idle"), 3000);
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6" style={{ background: "#0E0E0E" }}>
      {/* Links */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#4A4A4A" }}>
          Connect
        </h2>
        <div className="space-y-2">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group"
              style={{ background: "#0A0A0A", border: "1px solid #1E1E1E" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1E1E1E")}
            >
              <span style={{ color: "#D4B896" }}>{l.icon}</span>
              <div>
                <div className="text-xs font-medium" style={{ color: "#F5F5F0" }}>{l.label}</div>
                <div className="text-xs" style={{ color: "#6B6B6B" }}>{l.value}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Message form */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#4A4A4A" }}>
          Send a Message
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {(["name", "email"] as const).map((field) => (
            <div key={field}>
              <input
                type={field === "email" ? "email" : "text"}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={form[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                required
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-colors"
                style={{
                  background: "#0A0A0A",
                  border: "1px solid #2A2A2A",
                  color: "#F5F5F0",
                  caretColor: "#D4B896",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#D4B896")}
                onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
              />
            </div>
          ))}
          <textarea
            placeholder="Message"
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            required
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none transition-colors"
            style={{
              background: "#0A0A0A",
              border: "1px solid #2A2A2A",
              color: "#F5F5F0",
              caretColor: "#D4B896",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#D4B896")}
            onBlur={(e) => (e.target.style.borderColor = "#2A2A2A")}
          />

          <motion.button
            type="submit"
            disabled={status !== "idle"}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            style={{
              background: status === "sent" ? "rgba(40,200,64,0.12)" : "rgba(212,184,150,0.1)",
              border: `1px solid ${status === "sent" ? "rgba(40,200,64,0.25)" : "rgba(212,184,150,0.2)"}`,
              color: status === "sent" ? "#28C840" : "#D4B896",
              cursor: status !== "idle" ? "not-allowed" : "pointer",
            }}
          >
            <AnimatePresence mode="wait">
              {status === "sending" ? (
                <motion.div key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Send size={14} className="animate-pulse" />
                </motion.div>
              ) : status === "sent" ? (
                <motion.div key="sent" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                  <Check size={14} />
                  Message sent
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                  <Send size={14} />
                  Send Message
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </form>
      </div>
    </div>
  );
}
