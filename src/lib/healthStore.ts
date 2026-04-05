import { create } from "zustand";

export interface ErrorEntry {
  id: string;
  message: string;
  stack?: string;
  timestamp: number;
  source: "react" | "unhandled" | "stream";
}

interface HealthState {
  startedAt: number;
  uptimeSeconds: number;
  errors: ErrorEntry[];
  errorCount: number;
  showUptimeBadge: boolean;
  // actions
  tick: () => void;
  recordError: (message: string, source: ErrorEntry["source"], stack?: string) => void;
  clearErrors: () => void;
}

export const useHealthStore = create<HealthState>((set, get) => ({
  startedAt: Date.now(),
  uptimeSeconds: 0,
  errors: [],
  errorCount: 0,
  showUptimeBadge: false,

  tick() {
    const s = get();
    const next = s.uptimeSeconds + 1;
    set({
      uptimeSeconds: next,
      showUptimeBadge: next > 300 && s.errors.length === 0,
    });
  },

  recordError(message, source, stack) {
    const entry: ErrorEntry = {
      id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      message,
      stack,
      timestamp: Date.now(),
      source,
    };
    set((s) => ({
      errors: [entry, ...s.errors].slice(0, 50),
      errorCount: s.errorCount + 1,
      showUptimeBadge: false,
    }));
  },

  clearErrors() {
    set({ errors: [], errorCount: 0 });
  },
}));

export function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
  if (m > 0) return `${m}m ${pad(s)}s`;
  return `${s}s`;
}
