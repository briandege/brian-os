/**
 * JupyterManager.ts
 *
 * Manages a local Jupyter Lab server process:
 *   - Auto-discovers jupyter/jupyter-lab in PATH and common venv locations
 *   - Spawns with --no-browser --port <port>
 *   - Parses the server URL + token from stdout
 *   - Restarts on crash (up to MAX_RESTARTS)
 *   - Exposes status events (starting | ready | stopped | error)
 *
 * Used by electron/main.js via require("./jupyter/JupyterManager").
 */

import { spawn, type ChildProcess } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { EventEmitter } from "events";

const DEFAULT_PORT  = 8888;
const MAX_RESTARTS  = 3;
const READY_TIMEOUT = 30_000; // ms to wait for server URL before giving up

export type JupyterStatus = "idle" | "starting" | "ready" | "stopped" | "error";

export interface JupyterState {
  status:  JupyterStatus;
  url:     string | null;   // e.g. http://localhost:8888/lab?token=abc123
  token:   string | null;
  port:    number;
  error?:  string;
}

export class JupyterManager extends EventEmitter {
  private proc:     ChildProcess | null = null;
  private restarts  = 0;
  private _state:   JupyterState = { status: "idle", url: null, token: null, port: DEFAULT_PORT };

  get state(): Readonly<JupyterState> { return this._state; }

  // ── Discovery ───────────────────────────────────────────────────────────────

  private findExecutable(): string | null {
    const candidates = [
      "jupyter-lab",
      "jupyter",
      join(process.env.HOME ?? "", ".local/bin/jupyter-lab"),
      join(process.env.HOME ?? "", ".local/bin/jupyter"),
      "/usr/local/bin/jupyter-lab",
      "/usr/local/bin/jupyter",
      "/opt/homebrew/bin/jupyter-lab",
      "/opt/homebrew/bin/jupyter",
      // Common conda locations
      join(process.env.HOME ?? "", "anaconda3/bin/jupyter-lab"),
      join(process.env.HOME ?? "", "miniconda3/bin/jupyter-lab"),
      join(process.env.HOME ?? "", "mambaforge/bin/jupyter-lab"),
    ];
    return candidates.find((p) => {
      if (!p.startsWith("/")) return true; // PATH-relative — trust existence check by spawning
      return existsSync(p);
    }) ?? null;
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  start(port: number = DEFAULT_PORT): void {
    if (this._state.status === "starting" || this._state.status === "ready") return;

    const exe = this.findExecutable();
    if (!exe) {
      this.setState({ status: "error", url: null, token: null, port, error: "jupyter-lab not found. Install with: pip install jupyterlab" });
      return;
    }

    this.setState({ status: "starting", url: null, token: null, port });

    const args = [
      "lab",
      `--port=${port}`,
      "--no-browser",
      "--ip=127.0.0.1",
      "--NotebookApp.token=",            // empty token for localhost simplicity
    ];

    // If the exe is a PATH name like "jupyter", spawn it directly
    const isPath = !exe.startsWith("/");
    this.proc = spawn(isPath ? "jupyter" : exe, isPath ? args : ["lab", ...args.slice(1)], {
      env: { ...process.env, JUPYTER_ALLOW_INSECURE_WRITES: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    const readyTimer = setTimeout(() => {
      if (this._state.status === "starting") {
        this.setState({ status: "error", url: null, token: null, port, error: "Timed out waiting for Jupyter to start" });
      }
    }, READY_TIMEOUT);

    const parse = (chunk: Buffer) => {
      const text = chunk.toString();
      // Match URL patterns like http://localhost:8888/lab?token=... or http://127.0.0.1:...
      const urlMatch = text.match(/https?:\/\/(?:localhost|127\.0\.0\.1):\d+\/[^\s]+/);
      if (urlMatch && this._state.status === "starting") {
        clearTimeout(readyTimer);
        const url   = urlMatch[0].replace("127.0.0.1", "localhost");
        const token = new URL(url).searchParams.get("token") ?? null;
        this.setState({ status: "ready", url, token, port });
      }
    };

    this.proc.stdout?.on("data", parse);
    this.proc.stderr?.on("data", parse);   // Jupyter writes URLs to stderr

    this.proc.on("exit", (code) => {
      clearTimeout(readyTimer);
      const wasReady = this._state.status === "ready";
      if (wasReady && this.restarts < MAX_RESTARTS) {
        this.restarts++;
        setTimeout(() => this.start(port), 1_500);
      } else {
        this.setState({ status: "stopped", url: null, token: null, port, error: `Exited with code ${code}` });
        this.proc = null;
      }
    });

    this.proc.on("error", (err) => {
      clearTimeout(readyTimer);
      this.setState({ status: "error", url: null, token: null, port, error: err.message });
      this.proc = null;
    });
  }

  stop(): void {
    if (this.proc) {
      try { this.proc.kill("SIGTERM"); } catch {}
      this.proc = null;
    }
    this.restarts = 0;
    this.setState({ status: "stopped", url: null, token: null, port: this._state.port });
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  private setState(patch: Partial<JupyterState>): void {
    this._state = { ...this._state, ...patch };
    this.emit("state", this._state);
  }
}

export const jupyterManager = new JupyterManager();
