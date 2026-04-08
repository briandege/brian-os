"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Palette, Monitor, Rocket, Info, ChevronRight,
  Check, RotateCcw, TerminalSquare, Keyboard,
} from "lucide-react";
import {
  useSettingsStore, applyAccent,
  ACCENT_PALETTE, TERMINAL_THEMES,
  type AccentColor, type WallpaperStyle,
  type TerminalTheme, type TerminalCursor, type AnimationSpeed,
} from "@/lib/settingsStore";
import { APP_REGISTRY } from "@/lib/apps";
import type { AppId } from "@/types";

const SECTIONS = [
  { id: "appearance", label: "Appearance",  icon: <Palette size={14} /> },
  { id: "desktop",    label: "Desktop",     icon: <Monitor size={14} /> },
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
    topSecretBanners, setTopSecretBanners,
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

            <SettingRow label="TOP SECRET Banners" desc="Classified document-style top & bottom bars">
              <Toggle value={topSecretBanners} onChange={setTopSecretBanners} />
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
