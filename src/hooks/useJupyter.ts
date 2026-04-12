"use client";
/**
 * useJupyter.ts
 *
 * React hook for Jupyter Lab integration (Module 5).
 *
 * Provides:
 *   - status  : current JupyterState
 *   - start() : launch the Jupyter server
 *   - stop()  : stop the Jupyter server
 *
 * Usage:
 *   const { status, start, stop } = useJupyter();
 *   if (status.status === "ready") window.open(status.url);
 */

import { useCallback, useEffect, useState } from "react";
import type { JupyterState } from "@/types/electron";

const INITIAL: JupyterState = { status: "idle", url: null, token: null, port: 8888 };

export function useJupyter() {
  const [state, setState] = useState<JupyterState>(INITIAL);

  // Subscribe to push updates from main process
  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI) return;

    // Fetch current state on mount
    window.electronAPI.jupyterState().then(setState).catch(() => {});

    const unsub = window.electronAPI.onJupyterState(setState);
    return unsub;
  }, []);

  const start = useCallback(async () => {
    if (!window.electronAPI) return;
    const s = await window.electronAPI.jupyterStart();
    setState(s);
  }, []);

  const stop = useCallback(async () => {
    if (!window.electronAPI) return;
    await window.electronAPI.jupyterStop();
  }, []);

  return { state, start, stop };
}
