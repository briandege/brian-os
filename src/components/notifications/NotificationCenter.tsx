"use client";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCircle2, AlertTriangle, XCircle, Info, Trash2, CheckCheck, Sparkles } from "lucide-react";
import { useNotificationStore, type Notification, type NotifType } from "@/lib/notificationStore";

const TYPE: Record<NotifType, { icon: React.ReactNode; color: string }> = {
  info:    { icon: <Info size={13} />,           color: "#C8A97E" },
  success: { icon: <CheckCircle2 size={13} />,   color: "#28C840" },
  warning: { icon: <AlertTriangle size={13} />,  color: "#FEBC2E" },
  error:   { icon: <XCircle size={13} />,        color: "#FF5F57" },
};

function relTime(ts: number) {
  const d = Date.now() - ts;
  if (d < 10000)       return "just now";
  if (d < 60000)       return `${Math.floor(d / 1000)}s ago`;
  if (d < 3_600_000)   return `${Math.floor(d / 60000)}m ago`;
  if (d < 86_400_000)  return `${Math.floor(d / 3_600_000)}h ago`;
  return `${Math.floor(d / 86_400_000)}d ago`;
}

function isToday(ts: number) {
  const d = new Date(ts), now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function NotifCard({ n }: { n: Notification }) {
  const { markRead } = useNotificationStore();
  const t = TYPE[n.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      onClick={() => markRead(n.id)}
      className="relative mx-3 mb-2 rounded-xl overflow-hidden cursor-default transition-colors"
      style={{
        background: n.read ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
        border: n.read ? "1px solid rgba(255,255,255,0.04)" : `1px solid rgba(${hexRgb(t.color)},0.18)`,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)")}
    >
      {/* Unread left bar */}
      {!n.read && (
        <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r-full" style={{ background: t.color }} />
      )}

      <div className="flex items-start gap-2.5 px-3 py-2.5">
        <div
          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
          style={{
            background: n.read ? "rgba(255,255,255,0.05)" : `rgba(${hexRgb(t.color)},0.12)`,
            color: n.read ? "rgba(255,255,255,0.2)" : t.color,
          }}
        >
          {t.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-[11.5px] font-semibold leading-tight"
            style={{ color: n.read ? "rgba(240,237,230,0.35)" : "#F0EDE6" }}
          >
            {n.title}
          </div>
          {n.body && (
            <div className="text-[10.5px] mt-0.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.22)" }}>
              {n.body}
            </div>
          )}
        </div>
        <span className="text-[9px] font-mono shrink-0 mt-0.5" style={{ color: "rgba(255,255,255,0.15)" }}>
          {relTime(n.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}

function hexRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : "200,169,126";
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-4 pt-3 pb-1.5 text-[9px] font-bold font-mono tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.18)" }}>
      {label}
    </div>
  );
}

interface Props { open: boolean; onClose: () => void }

export default function NotificationCenter({ open, onClose }: Props) {
  const { notifications, markAllRead, clearAll } = useNotificationStore();
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  const today    = notifications.filter((n) => isToday(n.timestamp));
  const earlier  = notifications.filter((n) => !isToday(n.timestamp));

  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
          className="fixed z-[150] flex flex-col rounded-2xl overflow-hidden"
          style={{
            top: 48,
            right: 16,
            width: 340,
            maxHeight: 500,
            background: "rgba(10,10,15,0.98)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 32px 100px rgba(0,0,0,0.85), 0 8px 32px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.04) inset",
            backdropFilter: "blur(40px)",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="relative">
              <Bell size={13} style={{ color: "#C8A97E" }} />
              {unread > 0 && (
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ background: "#FF5F57" }} />
              )}
            </div>
            <span className="text-[12.5px] font-bold flex-1" style={{ color: "#F0EDE6" }}>
              Notifications
            </span>
            {unread > 0 && (
              <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(255,95,87,0.12)", color: "#FF5F57", border: "1px solid rgba(255,95,87,0.2)" }}>
                {unread} new
              </span>
            )}
            {notifications.length > 0 && (
              <div className="flex gap-0.5">
                <button
                  onClick={markAllRead}
                  title="Mark all read"
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#28C840")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
                >
                  <CheckCheck size={12} />
                </button>
                <button
                  onClick={clearAll}
                  title="Clear all"
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#FF5F57")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto py-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-14">
                <motion.div
                  animate={{ scale: [1, 1.08, 1], opacity: [0.06, 0.1, 0.06] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles size={28} style={{ color: "#C8A97E" }} />
                </motion.div>
                <span className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.18)" }}>
                  all clear
                </span>
              </div>
            ) : (
              <>
                {today.length > 0 && (
                  <>
                    <SectionLabel label="Today" />
                    <AnimatePresence initial={false}>
                      {today.map((n) => <NotifCard key={n.id} n={n} />)}
                    </AnimatePresence>
                  </>
                )}
                {earlier.length > 0 && (
                  <>
                    <SectionLabel label="Earlier" />
                    <AnimatePresence initial={false}>
                      {earlier.map((n) => <NotifCard key={n.id} n={n} />)}
                    </AnimatePresence>
                  </>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
