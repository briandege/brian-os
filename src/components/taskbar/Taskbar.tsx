"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, ShieldCheck, BatteryMedium, Bell, SlidersHorizontal, Bot, Volume2, VolumeX } from "lucide-react";
import { useWindowStore } from "@/lib/windowStore";
import { useNotificationStore } from "@/lib/notificationStore";
import { useSettingsStore } from "@/lib/settingsStore";
import { useHealthStore, formatUptime } from "@/lib/healthStore";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import ControlCenter from "@/components/control-center/ControlCenter";

export default function Taskbar() {
  const { windows, focusedId } = useWindowStore();
  const [time, setTime] = useState({ h: "", m: "", s: "", date: "", meridiem: "" });
  const [notifOpen, setNotifOpen] = useState(false);
  const [ccOpen, setCcOpen] = useState(false);
  const [volOpen, setVolOpen] = useState(false);
  const [volume, setVolumeState] = useState(50);
  const unread = useNotificationStore((s) => s.notifications.filter((n) => !n.read).length);
  const doNotDisturb = useSettingsStore((s) => s.doNotDisturb);
  const uptimeSeconds = useHealthStore((s) => s.uptimeSeconds);
  const showUptimeBadge = useHealthStore((s) => s.showUptimeBadge);
  const { open: openApp } = useWindowStore();

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h24 = now.getHours();
      const h12 = h24 % 12 || 12;
      setTime({
        h: h12.toString().padStart(2, "0"),
        m: now.getMinutes().toString().padStart(2, "0"),
        s: now.getSeconds().toString().padStart(2, "0"),
        meridiem: h24 < 12 ? "AM" : "PM",
        date: now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch volume on mount
  useEffect(() => {
    if (window.electronAPI?.getVolume) {
      window.electronAPI.getVolume().then((v) => setVolumeState(v));
    }
  }, []);

  const handleVolumeChange = (level: number) => {
    setVolumeState(level);
    if (window.electronAPI?.setVolume) {
      window.electronAPI.setVolume(level);
    }
  };

  // Close panels when other opens
  const openNotif = () => { setCcOpen(false); setVolOpen(false); setNotifOpen((v) => !v); };
  const openCC    = () => { setNotifOpen(false); setVolOpen(false); setCcOpen((v) => !v); };
  const openVol   = () => { setNotifOpen(false); setCcOpen(false); setVolOpen((v) => !v); };

  const focused   = windows.find((w) => w.instanceId === focusedId && !w.isMinimized);
  const openCount = windows.filter((w) => !w.isMinimized).length;

  return (
    <>
      <div
        className="glass fixed top-0 left-0 right-0 z-50 select-none"
        style={{
          height: 40,
          borderBottom: "1px solid rgba(255,255,255,0.045)",
          boxShadow: "0 1px 0 rgba(0,0,0,0.5), 0 4px 24px rgba(0,0,0,0.4)",
        }}
      >
        {/* Bottom accent line */}
        <div className="absolute bottom-0 inset-x-0 h-px" style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(200,169,126,0.12) 20%, rgba(200,169,126,0.12) 80%, transparent 100%)",
        }} />

        <div className="flex items-center h-full px-4">

          {/* ── Left: Brand ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-2.5 shrink-0 w-[172px]">
            <div className="relative flex items-center justify-center">
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#C8A97E" }}
                animate={{ opacity: [1, 0.35, 1], scale: [1, 0.8, 1] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="absolute w-3 h-3 rounded-full" style={{
                background: "radial-gradient(circle, rgba(200,169,126,0.25) 0%, transparent 70%)",
              }} />
            </div>
            <span className="text-[11px] font-bold font-mono tracking-[0.2em] uppercase" style={{ color: "#C8A97E" }}>
              strontium.os
            </span>
            {openCount > 0 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(200,169,126,0.1)", border: "1px solid rgba(200,169,126,0.18)", color: "rgba(200,169,126,0.6)", lineHeight: 1 }}
              >
                {openCount}
              </motion.span>
            )}
          </div>

          {/* ── Center: Active window ────────────────────────────────────── */}
          <div className="flex-1 flex items-center justify-center min-w-0 px-4">
            <AnimatePresence mode="wait">
              {focused ? (
                <motion.div
                  key={focused.instanceId}
                  initial={{ opacity: 0, y: -5, filter: "blur(3px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: 5, filter: "blur(3px)" }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="flex items-center gap-2 max-w-[300px]"
                >
                  <div className="w-1 h-1 rounded-full shrink-0" style={{ background: "rgba(200,169,126,0.5)" }} />
                  <span className="text-[11.5px] font-medium truncate" style={{ color: "rgba(200,169,126,0.55)" }}>
                    {focused.title}
                  </span>
                </motion.div>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[10px] font-mono tracking-[0.2em] uppercase"
                  style={{ color: "rgba(255,255,255,0.06)" }}
                >
                  no active window
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right: Tray + Clock ──────────────────────────────────────── */}
          <div className="flex items-center gap-2.5 shrink-0 w-[220px] justify-end">

            {/* Status icons */}
            <div className="flex items-center gap-2">
              <ShieldCheck size={11} style={{ color: showUptimeBadge ? "#28C840" : "#4A4A5A", opacity: 0.75 }} />
              <Wifi size={11} style={{ color: "#4A4A5A", opacity: 0.8 }} />
              <BatteryMedium size={12} style={{ color: "#4A4A5A", opacity: 0.7 }} />
              {uptimeSeconds > 60 && (
                <span className="text-[8px] font-mono" style={{ color: "rgba(200,169,126,0.35)" }}>
                  {formatUptime(uptimeSeconds)}
                </span>
              )}
            </div>

            <div className="h-3.5 w-px" style={{ background: "rgba(255,255,255,0.07)" }} />

            {/* Volume */}
            <div className="relative">
              <button
                onClick={openVol}
                title="Volume"
                className="flex items-center justify-center w-5 h-5 rounded-md transition-colors"
                style={{ color: volOpen ? "#C8A97E" : volume === 0 ? "rgba(255,85,87,0.5)" : "rgba(255,255,255,0.28)" }}
              >
                {volume === 0 ? <VolumeX size={12} /> : <Volume2 size={12} />}
              </button>
              <AnimatePresence>
                {volOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    className="absolute top-full right-0 mt-2 z-[200] flex flex-col items-center gap-2 px-3 py-4 rounded-xl"
                    style={{
                      background: "rgba(12,12,16,0.97)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
                      backdropFilter: "blur(20px)",
                    }}
                  >
                    <span className="text-[10px] font-mono" style={{ color: "#C8A97E" }}>{volume}%</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                      className="h-24 appearance-none"
                      style={{
                        writingMode: "vertical-lr" as React.CSSProperties["writingMode"],
                        direction: "rtl" as React.CSSProperties["direction"],
                        width: 4,
                        accentColor: "#C8A97E",
                      }}
                    />
                    <button
                      onClick={() => handleVolumeChange(volume === 0 ? 50 : 0)}
                      className="p-1"
                      style={{ color: volume === 0 ? "rgba(255,85,87,0.6)" : "rgba(255,255,255,0.3)" }}
                    >
                      {volume === 0 ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-3.5 w-px" style={{ background: "rgba(255,255,255,0.07)" }} />

            {/* ARIA AI */}
            <button
              onClick={() => openApp("ai")}
              title="ARIA Assistant"
              className="flex items-center justify-center w-5 h-5 rounded-md transition-colors"
              style={{ color: "rgba(200,169,126,0.45)" }}
            >
              <Bot size={12} />
            </button>

            <div className="h-3.5 w-px" style={{ background: "rgba(255,255,255,0.07)" }} />

            {/* Control Center */}
            <button
              onClick={openCC}
              title="Control Center"
              className="flex items-center justify-center w-5 h-5 rounded-md transition-colors"
              style={{ color: ccOpen ? "#C8A97E" : "rgba(255,255,255,0.28)" }}
            >
              <SlidersHorizontal size={12} />
            </button>

            {/* Notification bell */}
            <button
              onClick={openNotif}
              className="relative flex items-center justify-center w-5 h-5"
              style={{ color: notifOpen ? "#C8A97E" : doNotDisturb ? "#FEBC2E" : "rgba(255,255,255,0.28)" }}
              title={doNotDisturb ? "Do Not Disturb" : "Notifications"}
            >
              <motion.div animate={unread > 0 && !doNotDisturb ? { rotate: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 10 }}>
                <Bell size={12} />
              </motion.div>
              {unread > 0 && !doNotDisturb && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                  style={{ background: "#FF5F57" }}
                />
              )}
              {doNotDisturb && (
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: "#FEBC2E" }} />
              )}
            </button>

            <div className="h-3.5 w-px" style={{ background: "rgba(255,255,255,0.07)" }} />

            {/* Date + Clock */}
            <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>{time.date}</span>
            <div className="h-3.5 w-px" style={{ background: "rgba(255,255,255,0.07)" }} />
            <div className="flex items-baseline gap-0.5">
              <span className="text-[13px] font-semibold tabular-nums font-mono" style={{ color: "rgba(200,169,126,0.7)" }}>
                {time.h}:{time.m}
              </span>
              <span className="text-[8.5px] font-mono" style={{ color: "rgba(200,169,126,0.3)" }}>
                {time.meridiem}
              </span>
            </div>
          </div>
        </div>
      </div>

      <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
      <ControlCenter open={ccOpen} onClose={() => setCcOpen(false)} />
    </>
  );
}
