"use client";
/**
 * terminalStore.ts
 *
 * Zustand store for multi-tab terminal state.
 * Each tab maps to a pty:mgr session in the Electron main process.
 *
 * Tab lifecycle:
 *   newTab() → creates PTY session → tab in "connecting" state
 *   When pty:mgr:data arrives → tab becomes "ready"
 *   closeTab() → destroys PTY session → removes tab
 *   setActiveTab() → ptyMgrAttach to replay buffer; old tab gets ptyMgrDetach
 */

import { create } from "zustand";

export type TabStatus = "connecting" | "ready" | "exited";

export interface TerminalTab {
  id:        string;   // unique tab ID (same as PTY session ID)
  title:     string;
  status:    TabStatus;
  createdAt: number;
}

interface TerminalStore {
  tabs:       TerminalTab[];
  activeId:   string | null;

  // Actions
  addTab:       (tab: TerminalTab) => void;
  removeTab:    (id: string)       => void;
  setActiveTab: (id: string)       => void;
  updateTab:    (id: string, patch: Partial<Pick<TerminalTab, "title" | "status">>) => void;
}

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  tabs:     [],
  activeId: null,

  addTab(tab) {
    set((s) => ({
      tabs:     [...s.tabs, tab],
      activeId: tab.id,
    }));
  },

  removeTab(id) {
    set((s) => {
      const tabs = s.tabs.filter((t) => t.id !== id);
      let activeId = s.activeId;
      if (activeId === id) {
        // Switch to the next available tab (prefer right, fallback left)
        const idx = s.tabs.findIndex((t) => t.id === id);
        const next = tabs[idx] ?? tabs[idx - 1] ?? null;
        activeId = next?.id ?? null;
      }
      return { tabs, activeId };
    });
  },

  setActiveTab(id) {
    if (get().tabs.some((t) => t.id === id)) {
      set({ activeId: id });
    }
  },

  updateTab(id, patch) {
    set((s) => ({
      tabs: s.tabs.map((t) => t.id === id ? { ...t, ...patch } : t),
    }));
  },
}));
