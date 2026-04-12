"use client";
import { useEffect, useRef } from "react";
import { useSettingsStore, TERMINAL_THEMES } from "@/lib/settingsStore";

interface Props {
  /** Existing PTY session ID to attach to, or undefined to create a new one. */
  sessionId?:        string;
  /** Called once the PTY session is ready, with the session ID. */
  onReady?:          (id: string) => void;
  /** Called when the PTY process exits. */
  onExit?:           (id: string, code: number) => void;
  /** Called when the PTY fails to spawn (triggers mock fallback). */
  onPtyFail?:        () => void;
  /** If true, the PTY session is destroyed when the component unmounts.
   *  If false (default), the session is only detached and continues in the background. */
  destroyOnUnmount?: boolean;
  /** Whether this terminal instance is currently visible. */
  active?:           boolean;
}

export default function RealTerminal({
  sessionId,
  onReady,
  onExit,
  onPtyFail,
  destroyOnUnmount = false,
  active = true,
}: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const termRef       = useRef<import("@xterm/xterm").Terminal | null>(null);
  const fitRef        = useRef<import("@xterm/addon-fit").FitAddon | null>(null);
  const sessionIdRef  = useRef<string | undefined>(sessionId);
  const cleanupRef    = useRef<(() => void)[]>([]);
  const mountedRef    = useRef(false);

  const terminalFontSize   = useSettingsStore((s) => s.terminalFontSize);
  const terminalTheme      = useSettingsStore((s) => s.terminalTheme);
  const terminalCursor     = useSettingsStore((s) => s.terminalCursor);
  const terminalScrollback = useSettingsStore((s) => s.terminalScrollback);

  // Apply live theme/font changes without remounting
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    const t = TERMINAL_THEMES[terminalTheme];
    term.options.fontSize    = terminalFontSize;
    term.options.cursorStyle = terminalCursor as "block" | "bar" | "underline";
    term.options.scrollback  = terminalScrollback;
    term.options.theme = buildTheme(t);
    fitRef.current?.fit();
  }, [terminalFontSize, terminalTheme, terminalCursor, terminalScrollback]);

  // When tab becomes active, re-fit so size is correct
  useEffect(() => {
    if (active) fitRef.current?.fit();
  }, [active]);

  // Mount: init xterm + PTY session
  useEffect(() => {
    if (!containerRef.current || !window.electronAPI) return;
    mountedRef.current = true;

    async function init() {
      const [{ Terminal }, { FitAddon }, { WebLinksAddon }] = await Promise.all([
        import("@xterm/xterm"),
        import("@xterm/addon-fit"),
        import("@xterm/addon-web-links"),
      ]);
      if (!mountedRef.current || !containerRef.current) return;

      const t    = TERMINAL_THEMES[terminalTheme];
      const term = new Terminal({
        fontFamily:  '"GeistMono", "Geist Mono", "JetBrains Mono", monospace',
        fontSize:    terminalFontSize,
        lineHeight:  1.5,
        cursorBlink: true,
        cursorStyle: terminalCursor,
        scrollback:  terminalScrollback,
        theme:       buildTheme(t),
      });

      const fit   = new FitAddon();
      const links = new WebLinksAddon();
      term.loadAddon(fit);
      term.loadAddon(links);
      term.open(containerRef.current!);
      fit.fit();

      termRef.current = term;
      fitRef.current  = fit;

      const api = window.electronAPI!;

      // ── Attach or create PTY session ───────────────────────────────
      let id = sessionIdRef.current;
      if (id) {
        // Reattaching an existing session — replay buffered output
        const state = await api.ptyMgrAttach(id);
        if (state) {
          if (state.buffer) term.write(state.buffer);
        } else {
          // Session gone — create a new one
          id = undefined;
        }
      }

      if (!id) {
        const result = await api.ptyMgrCreate(term.cols, term.rows);
        if (!result.ok || !result.id) {
          term.writeln("\r\n\x1b[31mPTY failed to spawn — falling back to mock terminal\x1b[0m");
          term.dispose();
          onPtyFail?.();
          return;
        }
        id = result.id;
        sessionIdRef.current = id;
      }

      const sessionId = id; // stable reference for closures
      onReady?.(sessionId);

      // ── Wire up data / exit streams ────────────────────────────────
      const offData = api.onPtyMgrData(({ id: eid, data }) => {
        if (eid === sessionId) term.write(data);
      });
      cleanupRef.current.push(offData);

      const offExit = api.onPtyMgrExit(({ id: eid, code }) => {
        if (eid !== sessionId) return;
        term.writeln("\r\n\x1b[90m[process exited — close this tab]\x1b[0m");
        onExit?.(sessionId, code);
      });
      cleanupRef.current.push(offExit);

      // ── User input → PTY ──────────────────────────────────────────
      const inputDispose = term.onData((data) => api.ptyMgrWrite(sessionId, data));
      cleanupRef.current.push(() => inputDispose.dispose());

      // ── Resize sync ───────────────────────────────────────────────
      const resizeDispose = term.onResize(({ cols, rows }) => {
        api.ptyMgrResize(sessionId, cols, rows);
      });
      cleanupRef.current.push(() => resizeDispose.dispose());

      const ro = new ResizeObserver(() => fit.fit());
      ro.observe(containerRef.current!);
      cleanupRef.current.push(() => ro.disconnect());

      term.focus();
    }

    init();

    return () => {
      mountedRef.current = false;
      cleanupRef.current.forEach((fn) => fn());
      cleanupRef.current = [];
      termRef.current?.dispose();
      termRef.current = null;

      const id = sessionIdRef.current;
      if (id) {
        if (destroyOnUnmount) {
          window.electronAPI?.ptyMgrDestroy(id);
        } else {
          window.electronAPI?.ptyMgrDetach(id);
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onPtyFail]);

  const bgColor = TERMINAL_THEMES[terminalTheme].bg;
  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ background: bgColor, padding: "6px 8px" }}
    />
  );
}

type ThemeColors = { bg: string; fg: string; cursor: string; selection: string; red: string; green: string; yellow: string; blue: string; magenta: string };
function buildTheme(t: ThemeColors) {
  return {
    background: t.bg, foreground: t.fg, cursor: t.cursor,
    cursorAccent: t.bg, selectionBackground: t.selection,
    black: "#1E1E22", red: t.red, green: t.green,
    yellow: t.yellow, blue: t.blue, magenta: t.magenta,
    cyan: t.blue, white: t.fg,
    brightBlack: "#3A3A42", brightRed: t.red, brightGreen: t.green,
    brightYellow: t.yellow, brightBlue: t.blue, brightMagenta: t.magenta,
    brightCyan: t.blue, brightWhite: "#F0EDE6",
  };
}
