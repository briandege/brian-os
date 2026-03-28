"use client";
import { useEffect, useRef } from "react";

// Declare the electronAPI bridge injected by preload.js
declare global {
  interface Window {
    electronAPI?: {
      ptyCreate:  (cols: number, rows: number) => Promise<boolean>;
      ptyWrite:   (data: string) => void;
      ptyResize:  (cols: number, rows: number) => void;
      ptyDestroy: () => void;
      onPtyData:  (cb: (data: string) => void) => () => void;
      onPtyExit:  (cb: (code: number) => void) => () => void;
    };
  }
}

export default function RealTerminal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef      = useRef<import("@xterm/xterm").Terminal | null>(null);
  const fitRef       = useRef<import("@xterm/addon-fit").FitAddon | null>(null);
  const cleanupRef   = useRef<(() => void)[]>([]);

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

      const term = new Terminal({
        fontFamily: '"GeistMono", "Geist Mono", "JetBrains Mono", monospace',
        fontSize: 13,
        lineHeight: 1.5,
        cursorBlink: true,
        cursorStyle: "block",
        scrollback: 5000,
        theme: {
          background:      "#060607",
          foreground:      "#C8C6C0",
          cursor:          "#C8A97E",
          cursorAccent:    "#060607",
          selectionBackground: "rgba(200,169,126,0.2)",
          black:           "#1E1E22",
          red:             "#FF5F57",
          green:           "#28C840",
          yellow:          "#FEBC2E",
          blue:            "#5AC8FA",
          magenta:         "#B48EAD",
          cyan:            "#5AC8FA",
          white:           "#C8C6C0",
          brightBlack:     "#3A3A42",
          brightRed:       "#FF5F57",
          brightGreen:     "#28C840",
          brightYellow:    "#FEBC2E",
          brightBlue:      "#5AC8FA",
          brightMagenta:   "#B48EAD",
          brightCyan:      "#5AC8FA",
          brightWhite:     "#F0EDE6",
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
      await window.electronAPI!.ptyCreate(term.cols, term.rows);

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

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ background: "#060607", padding: "6px 8px" }}
    />
  );
}
