"use client";
import { useEffect, useRef } from "react";
import { useSettingsStore, TERMINAL_THEMES } from "@/lib/settingsStore";


export default function RealTerminal({ onPtyFail }: { onPtyFail?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef      = useRef<import("@xterm/xterm").Terminal | null>(null);
  const fitRef       = useRef<import("@xterm/addon-fit").FitAddon | null>(null);
  const cleanupRef   = useRef<(() => void)[]>([]);

  const terminalFontSize  = useSettingsStore((s) => s.terminalFontSize);
  const terminalTheme     = useSettingsStore((s) => s.terminalTheme);
  const terminalCursor    = useSettingsStore((s) => s.terminalCursor);
  const terminalScrollback = useSettingsStore((s) => s.terminalScrollback);

  // Apply theme/font changes to running terminal without remounting
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    const t = TERMINAL_THEMES[terminalTheme];
    term.options.fontSize    = terminalFontSize;
    term.options.cursorStyle = terminalCursor;
    term.options.scrollback  = terminalScrollback;
    term.options.theme = {
      background: t.bg, foreground: t.fg, cursor: t.cursor,
      cursorAccent: t.bg, selectionBackground: t.selection,
      black: "#1E1E22", red: t.red, green: t.green,
      yellow: t.yellow, blue: t.blue, magenta: t.magenta,
      cyan: t.blue, white: t.fg,
      brightBlack: "#3A3A42", brightRed: t.red, brightGreen: t.green,
      brightYellow: t.yellow, brightBlue: t.blue, brightMagenta: t.magenta,
      brightCyan: t.blue, brightWhite: "#F0EDE6",
    };
    fitRef.current?.fit();
  }, [terminalFontSize, terminalTheme, terminalCursor, terminalScrollback]);

  useEffect(() => {
    if (!containerRef.current || !window.electronAPI) return;

    let mounted = true;

    async function init() {
      const [{ Terminal }, { FitAddon }, { WebLinksAddon }] = await Promise.all([
        import("@xterm/xterm"),
        import("@xterm/addon-fit"),
        import("@xterm/addon-web-links"),
      ]);

      if (!mounted || !containerRef.current) return;

      const t = TERMINAL_THEMES[terminalTheme];
      const term = new Terminal({
        fontFamily: '"GeistMono", "Geist Mono", "JetBrains Mono", monospace',
        fontSize:    terminalFontSize,
        lineHeight:  1.5,
        cursorBlink: true,
        cursorStyle: terminalCursor,
        scrollback:  terminalScrollback,
        theme: {
          background: t.bg, foreground: t.fg, cursor: t.cursor,
          cursorAccent: t.bg, selectionBackground: t.selection,
          black: "#1E1E22", red: t.red, green: t.green,
          yellow: t.yellow, blue: t.blue, magenta: t.magenta,
          cyan: t.blue, white: t.fg,
          brightBlack: "#3A3A42", brightRed: t.red, brightGreen: t.green,
          brightYellow: t.yellow, brightBlue: t.blue, brightMagenta: t.magenta,
          brightCyan: t.blue, brightWhite: "#F0EDE6",
        },
      });

      const fit  = new FitAddon();
      const links = new WebLinksAddon();
      term.loadAddon(fit);
      term.loadAddon(links);
      term.open(containerRef.current!);
      fit.fit();

      termRef.current = term;
      fitRef.current  = fit;

      // Pipe user input to PTY
      const inputDispose = term.onData((data) => window.electronAPI!.ptyWrite(data));
      cleanupRef.current.push(() => inputDispose.dispose());

      // Spawn the real shell
      try {
        await window.electronAPI!.ptyCreate(term.cols, term.rows);
      } catch (e) {
        term.writeln("\r\n\x1b[31mPTY failed to spawn — falling back to mock terminal\x1b[0m");
        term.dispose();
        onPtyFail?.();
        return;
      }

      // Stream PTY output into xterm
      const offData = window.electronAPI!.onPtyData((data) => term.write(data));
      cleanupRef.current.push(offData);

      const offExit = window.electronAPI!.onPtyExit(() => {
        term.writeln("\r\n\x1b[90m[process exited — close this window]\x1b[0m");
      });
      cleanupRef.current.push(offExit);

      // Resize PTY when xterm resizes
      const resizeDispose = term.onResize(({ cols, rows }) => {
        window.electronAPI!.ptyResize(cols, rows);
      });
      cleanupRef.current.push(() => resizeDispose.dispose());

      // Keep fit in sync with container
      const ro = new ResizeObserver(() => {
        fit.fit();
      });
      ro.observe(containerRef.current!);
      cleanupRef.current.push(() => ro.disconnect());

      term.focus();
    }

    init();

    return () => {
      mounted = false;
      cleanupRef.current.forEach(fn => fn());
      cleanupRef.current = [];
      try { window.electronAPI?.ptyDestroy(); } catch {}
      termRef.current?.dispose();
      termRef.current = null;
    };
  }, []);

  const bgColor = TERMINAL_THEMES[terminalTheme].bg;
  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ background: bgColor, padding: "6px 8px" }}
    />
  );
}
