"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette, Monitor, Rocket, Info, ChevronRight,
  Check, RotateCcw, TerminalSquare, Keyboard, Shield, Eye, EyeOff, Lock,
  ShieldAlert, TriangleAlert,
} from "lucide-react";
import { usePanicStore } from "@/lib/panicStore";
import {
  useSettingsStore, applyAccent,
  ACCENT_PALETTE, TERMINAL_THEMES, CLASSIFICATION_CONFIG,
  type AccentColor, type WallpaperStyle,
  type TerminalTheme, type TerminalCursor, type AnimationSpeed, type ClassificationLevel,
} from "@/lib/settingsStore";
import { APP_REGISTRY } from "@/lib/apps";
import type { AppId } from "@/types";

const SECTIONS = [
  { id: "appearance", label: "Appearance",  icon: <Palette size={14} /> },
  { id: "desktop",    label: "Desktop",     icon: <Monitor size={14} /> },
  { id: "security",   label: "Security",    icon: <Shield size={14} /> },
  { id: "terminal",   label: "Terminal",    icon: <TerminalSquare size={14} /> },
  { id: "startup",    label: "Startup",     icon: <Rocket size={14} /> },
  { id: "keyboard",   label: "Keyboard",    icon: <Keyboard size={14} /> },
  { id: "about",      label: "About",       icon: <Info size={14} /> },
] as const;

type SectionId = typeof SECTIONS[number]["id"];

const WALLPAPERS: { id: WallpaperStyle; label: string }[] = [
  { id: "grid",  label: "Grid"  },
  { id: "dots",  label: "Dots"  },
  { id: "noise", label: "Noise" },
  { id: "none",  label: "None"  },
];

const FONT_SIZES = [11, 13, 15, 18];
const CURSORS: { id: TerminalCursor; label: string }[] = [
  { id: "block",     label: "Block"     },
  { id: "bar",       label: "Bar"       },
  { id: "underline", label: "Underline" },
];
const SCROLLBACKS = [1000, 5000, 10000, 50000];
const ANIMATION_SPEEDS: { id: AnimationSpeed; label: string }[] = [
  { id: "fast",   label: "Fast"   },
  { id: "normal", label: "Normal" },
  { id: "slow",   label: "Slow"   },
];

const STARTUP_ELIGIBLE: AppId[] = [
  "terminal", "axira", "about", "projects",
  "systemmonitor", "skills", "simulation", "notebook", "quantum",
];

const SHORTCUTS = [
  { keys: ["Ctrl", "L"],      desc: "Clear terminal"           },
  { keys: ["Ctrl", "C"],      desc: "Cancel command"           },
  { keys: ["↑", "↓"],        desc: "Terminal history"         },
  { keys: ["Right-click"],    desc: "Desktop context menu"     },
  { keys: ["Drag title"],     desc: "Move window"              },
  { keys: ["Drag edge"],      desc: "Resize window"            },
  { keys: ["⊟"],             desc: "Minimize window"          },
  { keys: ["⊞"],             desc: "Maximize / restore"       },
  { keys: ["✕"],             desc: "Close window"             },
  { keys: ["Any key"],        desc: "Skip boot / enter desktop"},
];

export default function SettingsApp() {
  const [section, setSection] = useState<SectionId>("appearance");
  const {
    accent, setAccent,
    wallpaper, setWallpaper,
    reduceMotion, setReduceMotion,
    terminalFontSize, setTerminalFontSize,
    terminalTheme, setTerminalTheme,
    terminalCursor, setTerminalCursor,
    terminalScrollback, setTerminalScrollback,
    dockMagnification, setDockMagnification,
    animationSpeed, setAnimationSpeed,
    startupApps, toggleStartupApp,
    classificationLevel, setClassificationLevel,
    setClassificationPassword, verifyClassificationPassword,
  } = useSettingsStore();

  useEffect(() => { applyAccent(accent); }, [accent]);

  return (
    <div className="h-full flex" style={{ background: "#0A0A0C" }}>
      {/* Sidebar */}
      <nav
        className="w-44 shrink-0 flex flex-col py-4 gap-0.5 px-2"
        style={{ borderRight: "1px solid #161618", background: "#080809" }}
      >
        <div className="text-[10px] font-semibold uppercase tracking-[0.15em] px-3 mb-2" style={{ color: "#3A3A42" }}>
          strontium.os
        </div>
        {SECTIONS.map((s) => {
          const active = section === s.id;
          return (
            <motion.button
              key={s.id}
              onClick={() => setSection(s.id)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[12px] font-medium"
              style={{
                background: active ? "rgba(200,169,126,0.1)" : "transparent",
                color: active ? "var(--color-tan, #C8A97E)" : "#4A4A56",
                border: active ? "1px solid rgba(200,169,126,0.12)" : "1px solid transparent",
              }}
              whileHover={{ x: active ? 0 : 2 }}
              transition={{ duration: 0.1 }}
            >
              <span style={{ color: active ? "var(--color-tan, #C8A97E)" : "#3A3A42" }}>{s.icon}</span>
              {s.label}
              {active && <ChevronRight size={11} className="ml-auto" style={{ color: "var(--color-tan, #C8A97E)", opacity: 0.5 }} />}
            </motion.button>
          );
        })}
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── Appearance ── */}
        {section === "appearance" && (
          <Section title="Appearance">
            <SettingRow label="Accent Color" desc="Applied across the entire OS">
              <div className="flex gap-2 flex-wrap">
                {(Object.entries(ACCENT_PALETTE) as [AccentColor, typeof ACCENT_PALETTE[AccentColor]][]).map(([id, p]) => (
                  <motion.button
                    key={id}
                    onClick={() => setAccent(id)}
                    className="relative w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: p.primary, boxShadow: accent === id ? `0 0 0 3px rgba(255,255,255,0.15), 0 0 12px ${p.primary}60` : "none" }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    title={p.label}
                  >
                    {accent === id && <Check size={13} style={{ color: "rgba(0,0,0,0.7)" }} strokeWidth={3} />}
                  </motion.button>
                ))}
              </div>
            </SettingRow>

            <SettingRow label="Wallpaper" desc="Desktop background pattern">
              <div className="flex gap-2 flex-wrap">
                {WALLPAPERS.map((w) => (
                  <ChipButton key={w.id} active={wallpaper === w.id} onClick={() => setWallpaper(w.id)}>
                    {w.label}
                  </ChipButton>
                ))}
              </div>
            </SettingRow>

            <SettingRow label="Reduce Motion" desc="Minimize animations throughout the OS">
              <Toggle value={reduceMotion} onChange={setReduceMotion} />
            </SettingRow>
          </Section>
        )}

        {/* ── Desktop ── */}
        {section === "desktop" && (
          <Section title="Desktop">
            <SettingRow label="Dock Magnification" desc="Icons grow when hovering">
              <Toggle value={dockMagnification} onChange={setDockMagnification} />
            </SettingRow>

            <SettingRow label="Animation Speed" desc="Window and UI animation timing">
              <div className="flex gap-2">
                {ANIMATION_SPEEDS.map((s) => (
                  <ChipButton key={s.id} active={animationSpeed === s.id} onClick={() => setAnimationSpeed(s.id)}>
                    {s.label}
                  </ChipButton>
                ))}
              </div>
            </SettingRow>

            <SettingRow label="Taskbar Position" desc="Always top — macOS style">
              <StaticChip>Top</StaticChip>
            </SettingRow>

            <SettingRow label="Dock Position" desc="Always bottom">
              <StaticChip>Bottom</StaticChip>
            </SettingRow>

            <SettingRow label="Window Style" desc="Frosted glass with spring physics">
              <StaticChip>Glass</StaticChip>
            </SettingRow>
          </Section>
        )}

        {/* ── Security ── */}
        {section === "security" && (
          <>
            <SecuritySection
              level={classificationLevel}
              onLevelChange={setClassificationLevel}
              onPasswordChange={setClassificationPassword}
              verifyPassword={verifyClassificationPassword}
            />
            <PanicLockdownSection />
          </>
        )}

        {/* ── Terminal ── */}
        {section === "terminal" && (
          <>
            <Section title="Terminal">
              {/* Theme preview + selector */}
              <SettingRow label="Color Scheme" desc="Terminal color palette">
                <div className="flex gap-2 flex-wrap">
                  {(Object.entries(TERMINAL_THEMES) as [TerminalTheme, typeof TERMINAL_THEMES[TerminalTheme]][]).map(([id, t]) => (
                    <motion.button
                      key={id}
                      onClick={() => setTerminalTheme(id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium"
                      style={{
                        background: terminalTheme === id ? `${t.bg}` : "#111113",
                        border: `1px solid ${terminalTheme === id ? t.preview + "55" : "#1E1E22"}`,
                        color: terminalTheme === id ? t.preview : "#4A4A56",
                      }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: t.preview, boxShadow: terminalTheme === id ? `0 0 6px ${t.preview}80` : "none" }}
                      />
                      {t.label}
                    </motion.button>
                  ))}
                </div>
              </SettingRow>

              <SettingRow label="Font Size" desc="Terminal text size in pixels">
                <div className="flex gap-2">
                  {FONT_SIZES.map((n) => (
                    <ChipButton key={n} active={terminalFontSize === n} onClick={() => setTerminalFontSize(n)}>
                      {n}px
                    </ChipButton>
                  ))}
                </div>
              </SettingRow>

              <SettingRow label="Cursor Style" desc="Terminal cursor appearance">
                <div className="flex gap-2">
                  {CURSORS.map((c) => (
                    <ChipButton key={c.id} active={terminalCursor === c.id} onClick={() => setTerminalCursor(c.id)}>
                      {c.label}
                    </ChipButton>
                  ))}
                </div>
              </SettingRow>

              <SettingRow label="Scrollback Lines" desc="History buffer size">
                <div className="flex gap-2">
                  {SCROLLBACKS.map((n) => (
                    <ChipButton key={n} active={terminalScrollback === n} onClick={() => setTerminalScrollback(n)}>
                      {n >= 1000 ? `${n / 1000}k` : n}
                    </ChipButton>
                  ))}
                </div>
              </SettingRow>
            </Section>

            {/* Live preview */}
            <Section title="Preview">
              <TerminalPreview
                theme={TERMINAL_THEMES[terminalTheme]}
                fontSize={terminalFontSize}
                cursor={terminalCursor}
              />
            </Section>
          </>
        )}

        {/* ── Startup ── */}
        {section === "startup" && (
          <Section title="Startup Apps">
            <p className="text-[12px] mb-4" style={{ color: "#3A3A42" }}>
              Apps opened automatically when you enter the desktop.
            </p>
            <div className="space-y-1">
              {STARTUP_ELIGIBLE.map((id) => {
                const app = APP_REGISTRY.find((a) => a.id === id);
                if (!app) return null;
                const enabled = startupApps.includes(id);
                return (
                  <motion.button
                    key={id}
                    onClick={() => toggleStartupApp(id)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{
                      background: enabled ? "rgba(200,169,126,0.05)" : "#0C0C0E",
                      border: `1px solid ${enabled ? "rgba(200,169,126,0.12)" : "#161618"}`,
                    }}
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.997 }}
                  >
                    <span className="text-[12px] font-medium" style={{ color: enabled ? "#C8C6C0" : "#4A4A56" }}>
                      {app.label}
                    </span>
                    <Toggle value={enabled} onChange={() => toggleStartupApp(id)} />
                  </motion.button>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── Keyboard ── */}
        {section === "keyboard" && (
          <Section title="Keyboard Shortcuts">
            <div className="space-y-px overflow-hidden rounded-xl" style={{ border: "1px solid #161618" }}>
              {SHORTCUTS.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ background: i % 2 === 0 ? "#0C0C0E" : "#090909" }}
                >
                  <span className="text-[12px]" style={{ color: "#6A6A76" }}>{s.desc}</span>
                  <div className="flex gap-1">
                    {s.keys.map((k, j) => (
                      <span
                        key={j}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: "#1A1A1E", border: "1px solid #2A2A30", color: "#C8A97E" }}
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {section === "about" && <AboutSection />}
      </div>
    </div>
  );
}

// ── Terminal preview ────────────────────────────────────────────────────────

function TerminalPreview({
  theme, fontSize, cursor,
}: {
  theme: typeof TERMINAL_THEMES[keyof typeof TERMINAL_THEMES];
  fontSize: number;
  cursor: TerminalCursor;
}) {
  const lines = [
    { prompt: true,  text: "neofetch" },
    { prompt: false, text: `OS: strontium.os 6.1.0` },
    { prompt: false, text: `Shell: zsh 5.9  ·  Node 20` },
    { prompt: true,  text: "axira status" },
    { prompt: false, text: `● API online  12ms` },
    { prompt: false, text: `● PostgreSQL online  3ms` },
    { prompt: true,  text: "" },
  ];

  const cursorChar = cursor === "block" ? "█" : cursor === "bar" ? "▍" : "_";

  return (
    <div
      className="rounded-xl overflow-hidden font-mono"
      style={{
        background: theme.bg,
        border: `1px solid ${theme.cursor}22`,
        fontSize,
        lineHeight: 1.6,
        padding: "14px 16px",
        boxShadow: `inset 0 0 40px rgba(0,0,0,0.4)`,
      }}
    >
      {lines.map((l, i) => (
        <div key={i} style={{ color: l.prompt ? theme.fg : theme.green }}>
          {l.prompt && (
            <span style={{ color: theme.cursor, marginRight: 6 }}>brian@strontium:~$</span>
          )}
          {l.text}
          {i === lines.length - 1 && (
            <span style={{ color: theme.cursor, animation: "blink 1s step-end infinite" }}>
              {cursorChar}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-4" style={{ color: "#3A3A42" }}>
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl"
      style={{ background: "#0C0C0E", border: "1px solid #161618" }}
    >
      <div>
        <div className="text-[12px] font-medium" style={{ color: "#C8C6C0" }}>{label}</div>
        {desc && <div className="text-[11px] mt-0.5" style={{ color: "#3A3A42" }}>{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function ChipButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-[11px] font-medium"
      style={{
        background: active ? "rgba(200,169,126,0.12)" : "#111113",
        border: `1px solid ${active ? "rgba(200,169,126,0.3)" : "#1E1E22"}`,
        color: active ? "var(--color-tan, #C8A97E)" : "#4A4A56",
      }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      {children}
    </motion.button>
  );
}

function StaticChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] px-2.5 py-1 rounded-md" style={{ background: "#111113", border: "1px solid #1E1E22", color: "#3A3A42" }}>
      {children}
    </span>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.button
      onClick={(e) => { e.stopPropagation(); onChange(!value); }}
      className="relative w-9 h-5 rounded-full shrink-0"
      style={{ background: value ? "var(--color-tan, #C8A97E)" : "#1E1E22", border: "1px solid rgba(255,255,255,0.06)" }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute top-0.5 w-4 h-4 rounded-full"
        style={{ background: value ? "#000" : "#3A3A42" }}
        animate={{ left: value ? "calc(100% - 18px)" : "2px" }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
}

// ── Security Section ────────────────────────────────────────────────────────

const LEVELS: { id: ClassificationLevel; label: string; color: string; desc: string }[] = [
  { id: "none",        label: "None",         color: "#3A3A42", desc: "No classification banners" },
  { id: "confidential",label: "Confidential", color: "#3A7BD5", desc: "AES-128-CBC · TLS 1.3" },
  { id: "secret",      label: "Secret",       color: "#CC2222", desc: "AES-256-CBC · TLS 1.3" },
  { id: "top-secret",  label: "Top Secret",   color: "#C00000", desc: "AES-256-GCM · TLS 1.3 · FIPS 140-3" },
];

function SecuritySection({
  level, onLevelChange, onPasswordChange, verifyPassword,
}: {
  level: ClassificationLevel;
  onLevelChange: (l: ClassificationLevel) => void;
  onPasswordChange: (p: string) => Promise<void>;
  verifyPassword: (attempt: string) => Promise<boolean>;
}) {
  const [promptTarget, setPromptTarget] = useState<ClassificationLevel | null>(null);
  const [promptInput, setPromptInput]   = useState("");
  const [promptError, setPromptError]   = useState("");
  const [showPw, setShowPw]             = useState(false);

  // Change-password state
  const [cpCurrent, setCpCurrent]   = useState("");
  const [cpNew, setCpNew]           = useState("");
  const [cpConfirm, setCpConfirm]   = useState("");
  const [cpMsg, setCpMsg]           = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [showCpPw, setShowCpPw]     = useState(false);

  const submitPrompt = async () => {
    const ok = await verifyPassword(promptInput);
    if (ok) {
      onLevelChange(promptTarget!);
      setPromptTarget(null);
      setPromptInput("");
      setPromptError("");
    } else {
      setPromptError("Incorrect password");
      setPromptInput("");
    }
  };

  const submitPasswordChange = async () => {
    const ok = await verifyPassword(cpCurrent);
    if (!ok)               { setCpMsg({ type: "err", text: "Current password incorrect" }); return; }
    if (cpNew.length < 1)  { setCpMsg({ type: "err", text: "New password cannot be empty" }); return; }
    if (cpNew !== cpConfirm) { setCpMsg({ type: "err", text: "Passwords do not match" }); return; }
    await onPasswordChange(cpNew);
    setCpCurrent(""); setCpNew(""); setCpConfirm("");
    setCpMsg({ type: "ok", text: "Password updated — PBKDF2-SHA256 hash stored" });
    setTimeout(() => setCpMsg(null), 2500);
  };

  return (
    <>
      {/* Classification Level */}
      <Section title="Classification Level">
        <p className="text-[11px] mb-3" style={{ color: "#3A3A42" }}>
          Password required to change classification. Default: <span style={{ color: "#C8A97E" }}>admin</span>
        </p>
        <div className="space-y-2">
          {LEVELS.map((l) => {
            const active = level === l.id;
            const cfg = l.id !== "none" ? CLASSIFICATION_CONFIG[l.id as Exclude<ClassificationLevel, "none">] : null;
            return (
              <motion.button
                key={l.id}
                onClick={() => {
                  if (active) return;
                  setPromptTarget(l.id);
                  setPromptInput("");
                  setPromptError("");
                }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left"
                style={{
                  background: active ? `${l.color}14` : "#0C0C0E",
                  border: `1px solid ${active ? l.color + "44" : "#161618"}`,
                }}
                whileHover={{ scale: active ? 1 : 1.005 }}
                whileTap={{ scale: 0.998 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: l.color, boxShadow: active ? `0 0 8px ${l.color}80` : "none" }} />
                  <div>
                    <div className="text-[12px] font-semibold" style={{ color: active ? l.color : "#6A6A76" }}>{l.label}</div>
                    <div className="text-[10px] font-mono mt-0.5" style={{ color: "#3A3A42" }}>{l.desc}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {cfg && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "#111113", border: "1px solid #1E1E22", color: "#4A4A56" }}>
                      {cfg.markings}
                    </span>
                  )}
                  {active && <Check size={13} style={{ color: l.color }} strokeWidth={2.5} />}
                  {!active && <Lock size={11} style={{ color: "#2A2A32" }} />}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Password Prompt */}
        <AnimatePresence>
          {promptTarget !== null && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              className="mt-3 p-4 rounded-xl"
              style={{ background: "#0A0A0C", border: "1px solid #1E1E26" }}
            >
              <div className="text-[11px] font-medium mb-2" style={{ color: "#C8C6C0" }}>
                Enter password to switch to <span style={{ color: LEVELS.find(l => l.id === promptTarget)?.color }}>{LEVELS.find(l => l.id === promptTarget)?.label}</span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPw ? "text" : "password"}
                    value={promptInput}
                    onChange={(e) => { setPromptInput(e.target.value); setPromptError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && submitPrompt()}
                    placeholder="Password"
                    autoFocus
                    className="os-input w-full px-3 py-2 rounded-lg text-[12px] font-mono pr-8"
                    style={{ userSelect: "text" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    style={{ color: "#3A3A42" }}
                  >
                    {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                <motion.button
                  onClick={submitPrompt}
                  className="px-4 py-2 rounded-lg text-[12px] font-medium"
                  style={{ background: "rgba(200,169,126,0.12)", border: "1px solid rgba(200,169,126,0.25)", color: "#C8A97E" }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Confirm
                </motion.button>
                <motion.button
                  onClick={() => { setPromptTarget(null); setPromptError(""); }}
                  className="px-3 py-2 rounded-lg text-[12px]"
                  style={{ background: "#111113", border: "1px solid #1E1E22", color: "#4A4A56" }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Cancel
                </motion.button>
              </div>
              {promptError && (
                <div className="text-[11px] mt-2" style={{ color: "#FF5F57" }}>{promptError}</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      {/* Change Password */}
      <Section title="Change Password">
        <div className="space-y-2">
          {[
            { label: "Current password", value: cpCurrent, set: setCpCurrent },
            { label: "New password",     value: cpNew,     set: setCpNew     },
            { label: "Confirm new",      value: cpConfirm, set: setCpConfirm },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "#0C0C0E", border: "1px solid #161618" }}>
              <span className="text-[12px] w-32 shrink-0" style={{ color: "#6A6A76" }}>{f.label}</span>
              <div className="relative flex-1">
                <input
                  type={showCpPw ? "text" : "password"}
                  value={f.value}
                  onChange={(e) => { f.set(e.target.value); setCpMsg(null); }}
                  placeholder="••••••••"
                  className="os-input w-full px-3 py-1.5 rounded-lg text-[12px] font-mono"
                  style={{ userSelect: "text" }}
                />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <motion.button
              onClick={submitPasswordChange}
              className="px-4 py-2 rounded-lg text-[12px] font-medium"
              style={{ background: "rgba(200,169,126,0.12)", border: "1px solid rgba(200,169,126,0.25)", color: "#C8A97E" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              Update Password
            </motion.button>
            <button onClick={() => setShowCpPw(v => !v)} className="flex items-center gap-1.5 text-[11px]" style={{ color: "#3A3A42" }}>
              {showCpPw ? <EyeOff size={12} /> : <Eye size={12} />}
              {showCpPw ? "Hide" : "Show"}
            </button>
            <AnimatePresence>
              {cpMsg && (
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[11px]"
                  style={{ color: cpMsg.type === "ok" ? "#28C840" : "#FF5F57" }}
                >
                  {cpMsg.text}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Section>
    </>
  );
}

// ── Panic & Lockdown Section ────────────────────────────────────────────────

function PanicLockdownSection() {
  const initiate = usePanicStore((s) => s.initiate);
  const [armed, setArmed]       = useState(false);
  const [holdProgress, setHold] = useState(0);
  const holdRef                 = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hold-to-confirm: hold the button for 2 seconds to trigger
  const startHold = () => {
    if (!armed) return;
    holdRef.current = setInterval(() => {
      setHold(p => {
        if (p >= 100) {
          clearInterval(holdRef.current!);
          setHold(0);
          setArmed(false);
          initiate();
          return 0;
        }
        return p + 5;
      });
    }, 100);
  };

  const endHold = () => {
    if (holdRef.current) clearInterval(holdRef.current);
    setHold(0);
  };

  return (
    <Section title="Emergency Lockdown">
      {/* Warning card */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid rgba(255,40,40,0.2)", background: "rgba(255,20,20,0.04)" }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2.5 px-4 py-3"
          style={{ borderBottom: "1px solid rgba(255,40,40,0.12)", background: "rgba(255,20,20,0.06)" }}
        >
          <ShieldAlert size={14} style={{ color: "#FF3030" }} />
          <span className="text-[12px] font-semibold" style={{ color: "#FF4040" }}>
            Panic &amp; Lockdown
          </span>
          <span
            className="ml-auto text-[9px] font-bold font-mono px-2 py-0.5 rounded tracking-widest"
            style={{ background: "rgba(255,40,40,0.15)", color: "#FF4040", border: "1px solid rgba(255,40,40,0.25)" }}
          >
            DANGER ZONE
          </span>
        </div>

        {/* Body */}
        <div className="px-4 py-4 space-y-3">
          <p className="text-[11px] leading-relaxed" style={{ color: "#6A6A76" }}>
            Immediately executes a full system lockdown. The following actions are performed in sequence:
          </p>
          <ul className="space-y-1.5">
            {[
              "POST critical alert to the AxiraNews security backend",
              "Close all open application windows",
              "Elevate classification to TOP SECRET",
              "Lock the screen — password required to re-enter",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px]" style={{ color: "#4A4A56" }}>
                <span style={{ color: "rgba(255,40,40,0.4)" }} className="shrink-0 mt-0.5">▸</span>
                {item}
              </li>
            ))}
          </ul>

          {/* Arm toggle */}
          <div
            className="flex items-center justify-between px-3 py-2.5 rounded-lg mt-2"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-2">
              <TriangleAlert size={12} style={{ color: armed ? "#FF4040" : "#3A3A42" }} />
              <span className="text-[11px] font-medium" style={{ color: armed ? "#FF6060" : "#4A4A56" }}>
                {armed ? "Armed — hold button to execute" : "Arm lockdown"}
              </span>
            </div>
            <Toggle value={armed} onChange={setArmed} />
          </div>

          {/* Hold-to-trigger button */}
          <AnimatePresence>
            {armed && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="relative overflow-hidden rounded-xl"
              >
                {/* Progress fill */}
                <motion.div
                  className="absolute inset-0 origin-left"
                  style={{
                    background: "rgba(255,40,40,0.18)",
                    scaleX: holdProgress / 100,
                    transformOrigin: "left",
                  }}
                />
                <motion.button
                  className="relative w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-bold tracking-widest uppercase font-mono"
                  style={{
                    background: "transparent",
                    border: `1px solid rgba(255,40,40,${0.3 + holdProgress / 200})`,
                    color: holdProgress > 0 ? "#FF2020" : "#FF4040",
                    textShadow: holdProgress > 50 ? "0 0 20px rgba(255,32,32,0.6)" : "none",
                    cursor: "pointer",
                  }}
                  onMouseDown={startHold}
                  onMouseUp={endHold}
                  onMouseLeave={endHold}
                  onTouchStart={startHold}
                  onTouchEnd={endHold}
                  animate={holdProgress > 0 ? { opacity: [1, 0.85, 1] } : {}}
                  transition={{ duration: 0.3, repeat: Infinity }}
                >
                  <ShieldAlert size={15} />
                  {holdProgress > 0
                    ? `INITIATING… ${Math.round(holdProgress)}%`
                    : "HOLD TO INITIATE LOCKDOWN"
                  }
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Section>
  );
}

function AboutSection() {
  const [sysInfo, setSysInfo] = useState<{ cpu: number; ram: number; disk: number } | null>(null);
  const [meta, setMeta] = useState<{ version: string; platform: string; arch: string } | null>(null);
  const [loginItem, setLoginItem] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI) return;
    window.electronAPI.getSysInfo().then(setSysInfo);
    Promise.all([
      window.electronAPI.getVersion?.() ?? Promise.resolve("1.0.0-beta"),
      window.electronAPI.getPlatform?.() ?? Promise.resolve("darwin"),
      window.electronAPI.getArch?.() ?? Promise.resolve("arm64"),
    ]).then(([version, platform, arch]) => setMeta({ version, platform, arch }));
    window.electronAPI.getLoginItem?.().then(setLoginItem);
  }, []);

  const toggleLogin = async () => {
    if (!window.electronAPI?.setLoginItem) return;
    const next = !loginItem;
    await window.electronAPI.setLoginItem(next);
    setLoginItem(next);
  };

  const platformLabel = meta
    ? { darwin: "macOS", win32: "Windows", linux: "Linux" }[meta.platform] ?? meta.platform
    : "—";

  const rows = [
    { label: "OS",       value: "strontium.os" },
    { label: "Version",  value: meta?.version ?? "1.0.0-beta" },
    { label: "Platform", value: meta ? `${platformLabel} · ${meta.arch}` : "—" },
    { label: "Runtime",  value: "Next.js 15 · React 19 · Electron 41" },
    { label: "Author",   value: "Brian Ndege" },
    ...(sysInfo ? [
      { label: "CPU Load", value: `${sysInfo.cpu}%` },
      { label: "RAM Used", value: `${sysInfo.ram}%` },
      { label: "Disk",     value: `${sysInfo.disk}% used` },
    ] : []),
  ];

  return (
    <Section title="About strontium.os">
      <div className="space-y-px overflow-hidden rounded-xl" style={{ border: "1px solid #161618" }}>
        {rows.map((r, i) => (
          <div
            key={r.label}
            className="flex items-center justify-between px-4 py-3"
            style={{ background: i % 2 === 0 ? "#0C0C0E" : "#090909" }}
          >
            <span className="text-[11px]" style={{ color: "#3A3A42" }}>{r.label}</span>
            <span className="text-[11px] font-mono" style={{ color: "#8A8A7A" }}>{r.value}</span>
          </div>
        ))}
      </div>

      {/* Launch at login — only shown in Electron */}
      {typeof window !== "undefined" && window.electronAPI?.setLoginItem && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl mt-2"
          style={{ background: "#0C0C0E", border: "1px solid #161618" }}>
          <div>
            <div className="text-[12px] font-medium" style={{ color: "#C8C6C0" }}>Launch at Login</div>
            <div className="text-[11px] mt-0.5" style={{ color: "#3A3A42" }}>Start strontium.os when you log in</div>
          </div>
          <Toggle value={loginItem} onChange={toggleLogin} />
        </div>
      )}

      <motion.button
        className="flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-[11px]"
        style={{ background: "#111113", border: "1px solid #1E1E22", color: "#3A3A42" }}
        whileHover={{ scale: 1.02, color: "#C8A97E" }}
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          localStorage.removeItem("strontium-settings");
          window.location.reload();
        }}
      >
        <RotateCcw size={11} />
        Reset all settings
      </motion.button>
    </Section>
  );
}
