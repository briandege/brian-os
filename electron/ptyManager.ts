/**
 * ptyManager.ts
 *
 * Manages multiple persistent PTY sessions with:
 * - Per-session stdout ring buffer (5 000 lines)
 * - Detached sessions (survive Terminal window close)
 * - LRU eviction when > MAX_SESSIONS background PTYs exist
 */

import type { IPty } from "node-pty";

const MAX_SESSIONS    = 6;
const BUFFER_LINES    = 5_000;
const SHELL           = process.env.SHELL ?? (process.platform === "win32" ? "powershell.exe" : "/bin/zsh");

export interface PtySession {
  id:        string;
  pty:       IPty;
  buffer:    string[];   // ring buffer of output lines
  cols:      number;
  rows:      number;
  createdAt: number;
  lastUsed:  number;
  attached:  boolean;    // is a renderer currently listening?
}

export type PtyEvent =
  | { type: "data";  id: string; data: string }
  | { type: "exit";  id: string; code: number }

type PtyEventListener = (event: PtyEvent) => void;

class PtyManager {
  private sessions = new Map<string, PtySession>();
  private listeners = new Set<PtyEventListener>();
  private nodePty: typeof import("node-pty") | null = null;

  private getPty(): typeof import("node-pty") {
    if (!this.nodePty) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      this.nodePty = require("node-pty") as typeof import("node-pty");
    }
    return this.nodePty;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  create(cols = 80, rows = 24): string {
    this.evictIfNeeded();

    const id = `pty-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const pty = this.getPty().spawn(SHELL, [], {
      name: "xterm-256color",
      cols, rows,
      cwd:  process.env.HOME ?? process.cwd(),
      env:  { ...process.env, TERM: "xterm-256color", COLORTERM: "truecolor" },
    });

    const session: PtySession = {
      id, pty, buffer: [], cols, rows,
      createdAt: Date.now(),
      lastUsed:  Date.now(),
      attached:  true,
    };

    pty.onData((data) => {
      // push to ring buffer
      const lines = data.split("\n");
      session.buffer.push(...lines);
      if (session.buffer.length > BUFFER_LINES) {
        session.buffer.splice(0, session.buffer.length - BUFFER_LINES);
      }
      this.emit({ type: "data", id, data });
    });

    pty.onExit(({ exitCode }) => {
      this.emit({ type: "exit", id, code: exitCode });
      this.sessions.delete(id);
    });

    this.sessions.set(id, session);
    return id;
  }

  /** Attach (or reattach) a renderer to a session. Returns buffered output. */
  attach(id: string): { buffer: string; cols: number; rows: number } | null {
    const s = this.sessions.get(id);
    if (!s) return null;
    s.attached  = true;
    s.lastUsed  = Date.now();
    return { buffer: s.buffer.join(""), cols: s.cols, rows: s.rows };
  }

  /** Detach renderer — PTY keeps running in background */
  detach(id: string): void {
    const s = this.sessions.get(id);
    if (s) { s.attached = false; }
  }

  write(id: string, data: string): void {
    const s = this.sessions.get(id);
    if (s) { s.lastUsed = Date.now(); s.pty.write(data); }
  }

  resize(id: string, cols: number, rows: number): void {
    const s = this.sessions.get(id);
    if (s) {
      try { s.pty.resize(cols, rows); s.cols = cols; s.rows = rows; }
      catch { /* ignore on win32 */ }
    }
  }

  destroy(id: string): void {
    const s = this.sessions.get(id);
    if (s) { try { s.pty.kill(); } catch { /* ignore */ } this.sessions.delete(id); }
  }

  list(): Array<{ id: string; cols: number; rows: number; attached: boolean; createdAt: number }> {
    return Array.from(this.sessions.values()).map(({ id, cols, rows, attached, createdAt }) => ({
      id, cols, rows, attached, createdAt,
    }));
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  subscribe(fn: PtyEventListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(event: PtyEvent): void {
    this.listeners.forEach((fn) => fn(event));
  }

  // ── LRU eviction ───────────────────────────────────────────────────────────

  private evictIfNeeded(): void {
    const detached = Array.from(this.sessions.values())
      .filter((s) => !s.attached)
      .sort((a, b) => a.lastUsed - b.lastUsed);

    while (this.sessions.size >= MAX_SESSIONS && detached.length > 0) {
      const victim = detached.shift()!;
      this.destroy(victim.id);
    }
  }
}

export const ptyManager = new PtyManager();
