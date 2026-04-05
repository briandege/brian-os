"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ClipboardEntry {
  id: string;
  text: string;
  timestamp: string;
  pinned: boolean;
}

interface ClipboardState {
  entries: ClipboardEntry[];
  addEntry: (text: string) => void;
  deleteEntry: (id: string) => void;
  togglePin: (id: string) => void;
  clearAll: () => void;
  copyEntry: (id: string) => void;
}

const MAX_ENTRIES = 50;

export const useClipboardStore = create<ClipboardState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        // Skip if same as most recent entry
        const current = get().entries;
        if (current.length > 0 && current[0].text === trimmed) return;

        const entry: ClipboardEntry = {
          id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: trimmed,
          timestamp: new Date().toISOString(),
          pinned: false,
        };
        set((s) => ({
          entries: [entry, ...s.entries].slice(0, MAX_ENTRIES),
        }));
      },

      deleteEntry: (id) =>
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

      togglePin: (id) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id ? { ...e, pinned: !e.pinned } : e
          ),
        })),

      clearAll: () => set((s) => ({ entries: s.entries.filter((e) => e.pinned) })),

      copyEntry: (id) => {
        const entry = get().entries.find((e) => e.id === id);
        if (!entry) return;
        if (window.electronAPI?.clipboardWrite) {
          window.electronAPI.clipboardWrite(entry.text);
        } else {
          navigator.clipboard.writeText(entry.text).catch(() => {});
        }
      },
    }),
    { name: "strontium-clipboard" }
  )
);
