"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle2, AlertTriangle, XCircle, Bell } from "lucide-react";
import { useNotificationStore, type Notification, type NotifType } from "@/lib/notificationStore";
import { useSettingsStore } from "@/lib/settingsStore";

const TYPE: Record<NotifType, { icon: React.ReactNode; color: string; glow: string }> = {
  info:    { icon: <Bell size={14} />,            color: "#C8A97E", glow: "rgba(200,169,126,0.3)" },
  success: { icon: <CheckCircle2 size={14} />,    color: "#28C840", glow: "rgba(40,200,64,0.3)"   },
  warning: { icon: <AlertTriangle size={14} />,   color: "#FEBC2E", glow: "rgba(254,188,46,0.3)"  },
  error:   { icon: <XCircle size={14} />,         color: "#FF5F57", glow: "rgba(255,95,87,0.3)"   },
};

function Toast({ notif, onDismiss }: { notif: Notification; onDismiss: () => void }) {
  const t = TYPE[notif.type];
  const [pct, setPct] = useState(100);
  const startRef = useRef(Date.now());
  const DURATION = 4500;

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      setPct(Math.max(0, 100 - (elapsed / DURATION) * 100));
      if (elapsed >= DURATION) clearInterval(id);
    }, 25);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.92, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 12, scale: 0.94, filter: "blur(2px)", transition: { duration: 0.22 } }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
      className="relative w-[320px] overflow-hidden rounded-2xl pointer-events-auto"
      style={{
        background: "rgba(11,11,16,0.98)",
        border: `1px solid rgba(255,255,255,0.07)`,
        boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 4px 20px ${t.glow}`,
      }}
    >
      {/* Colored top stripe */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] rounded-t-2xl" style={{ background: t.color }} />

      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Icon bubble */}
        <div
          className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5"
          style={{ background: `rgba(${hexRgb(t.color)},0.12)`, color: t.color }}
        >
          {t.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="text-[12.5px] font-semibold leading-tight" style={{ color: "#F0EDE6" }}>
            {notif.title}
          </div>
          {notif.body && (
            <div className="text-[11px] mt-1 leading-relaxed" style={{ color: "rgba(240,237,230,0.4)" }}>
              {notif.body}
            </div>
          )}
        </div>

        {/* Close */}
        <button
          onClick={onDismiss}
          className="shrink-0 w-5 h-5 rounded-lg flex items-center justify-center mt-0.5 transition-colors"
          style={{ color: "rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.04)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.18)")}
        >
          <X size={11} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 inset-x-0 h-[2px]" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: t.color, opacity: 0.5, transition: "width 25ms linear" }}
        />
      </div>
    </motion.div>
  );
}

function hexRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : "200,169,126";
}

export default function NotificationToast() {
  const { notifications, toastIds, dismissToast, markRead } = useNotificationStore();
  const doNotDisturb = useSettingsStore((s) => s.doNotDisturb);
  const toasts = doNotDisturb
    ? []
    : (toastIds
        .slice(-4)
        .map((id) => notifications.find((n) => n.id === id))
        .filter(Boolean) as Notification[]);

  return (
    <div className="fixed z-[200] flex flex-col-reverse gap-2.5 pointer-events-none" style={{ bottom: 100, right: 20 }}>
      <AnimatePresence mode="sync">
        {toasts.map((n) => (
          <Toast key={n.id} notif={n} onDismiss={() => { dismissToast(n.id); markRead(n.id); }} />
        ))}
      </AnimatePresence>
    </div>
  );
}
