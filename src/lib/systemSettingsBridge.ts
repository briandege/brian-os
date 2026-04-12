/**
 * systemSettingsBridge.ts
 *
 * Intercepts Zustand setting changes and pipes them to the Electron main
 * process via IPC. Returns a typed hook for per-setting apply status.
 *
 * Pattern: call bridgeSetting() inside a Zustand action, not in React.
 */

export type ApplyStatus = "idle" | "pending" | "applied" | "error";

type StatusListener = (key: string, status: ApplyStatus, error?: string) => void;
const listeners: StatusListener[] = [];

export function onStatusChange(fn: StatusListener) {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i !== -1) listeners.splice(i, 1);
  };
}

function emit(key: string, status: ApplyStatus, error?: string) {
  listeners.forEach((fn) => fn(key, status, error));
}

/**
 * Call from inside a Zustand action after updating state.
 * Sends the IPC command and emits apply status events.
 */
export async function bridgeSetting(
  key: string,
  ipcChannel: string,
  value: unknown
): Promise<void> {
  if (typeof window === "undefined" || !window.electronAPI) return;

  const ipc = window.electronAPI as unknown as Record<string, ((v: unknown) => Promise<{ ok: boolean; error?: string }>) | undefined>;
  const handler = ipc[ipcChannel];
  if (typeof handler !== "function") return;

  emit(key, "pending");
  try {
    const result = await handler(value);
    if (result?.ok === false) {
      emit(key, "error", result.error ?? "Unknown error");
    } else {
      emit(key, "applied");
    }
  } catch (e) {
    emit(key, "error", e instanceof Error ? e.message : String(e));
  }
}
