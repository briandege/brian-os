"use client";
import { create } from "zustand";
import type { WindowState, AppId } from "@/types";
import { getApp } from "@/lib/apps";
import { audit } from "@/lib/auditStore";

let nextZ = 10;
let instanceCounter = 0;

function stagger(index: number) {
  const offset = (index % 8) * 30;
  return { x: 140 + offset, y: 56 + offset }; // starts below 40px menu bar
}

interface WindowStore {
  windows: WindowState[];
  focusedId: string | null;
  // actions
  open: (appId: AppId) => void;
  close: (instanceId: string) => void;
  focus: (instanceId: string) => void;
  minimize: (instanceId: string) => void;
  restore: (instanceId: string) => void;
  maximize: (instanceId: string) => void;
  move: (instanceId: string, pos: { x: number; y: number }) => void;
  resize: (instanceId: string, size: { width: number; height: number }) => void;
  closeAll: () => void;
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  focusedId: null,

  open(appId) {
    const app = getApp(appId);
    if (!app) return;

    // Restore if already open and minimized
    const existing = get().windows.find((w) => w.appId === appId);
    if (existing) {
      set((s) => ({
        windows: s.windows.map((w) =>
          w.instanceId === existing.instanceId
            ? { ...w, isMinimized: false, zIndex: ++nextZ }
            : w
        ),
        focusedId: existing.instanceId,
      }));
      return;
    }

    const id = `${appId}-${++instanceCounter}`;
    const pos = stagger(instanceCounter);
    const win: WindowState = {
      instanceId: id,
      appId,
      title: app.label,
      isMinimized: false,
      isMaximized: false,
      position: pos,
      size: app.defaultSize,
      zIndex: ++nextZ,
    };
    set((s) => ({ windows: [...s.windows, win], focusedId: id }));
    audit({ category: "app", severity: "info", action: `Opened: ${app.label}`, module: "WindowStore", detail: `appId=${appId}` });
  },

  close(instanceId) {
    set((s) => {
      const closing = s.windows.find((w) => w.instanceId === instanceId);
      if (closing) audit({ category: "app", severity: "info", action: `Closed: ${closing.title}`, module: "WindowStore", detail: `appId=${closing.appId}` });
      const remaining = s.windows.filter((w) => w.instanceId !== instanceId);
      const newFocus = remaining.length
        ? [...remaining].sort((a, b) => b.zIndex - a.zIndex)[0].instanceId
        : null;
      return { windows: remaining, focusedId: newFocus };
    });
  },

  focus(instanceId) {
    set((s) => ({
      windows: s.windows.map((w) =>
        w.instanceId === instanceId ? { ...w, zIndex: ++nextZ } : w
      ),
      focusedId: instanceId,
    }));
  },

  minimize(instanceId) {
    set((s) => {
      const remaining = s.windows.filter(
        (w) => w.instanceId !== instanceId || !w.isMinimized
      );
      const newFocus =
        s.focusedId === instanceId
          ? (remaining.filter((w) => !w.isMinimized).sort((a, b) => b.zIndex - a.zIndex)[0]?.instanceId ?? null)
          : s.focusedId;
      return {
        windows: s.windows.map((w) =>
          w.instanceId === instanceId ? { ...w, isMinimized: true } : w
        ),
        focusedId: newFocus,
      };
    });
  },

  restore(instanceId) {
    set((s) => ({
      windows: s.windows.map((w) =>
        w.instanceId === instanceId
          ? { ...w, isMinimized: false, zIndex: ++nextZ }
          : w
      ),
      focusedId: instanceId,
    }));
  },

  maximize(instanceId) {
    set((s) => ({
      windows: s.windows.map((w) =>
        w.instanceId === instanceId
          ? { ...w, isMaximized: !w.isMaximized, zIndex: ++nextZ }
          : w
      ),
      focusedId: instanceId,
    }));
  },

  move(instanceId, pos) {
    set((s) => ({
      windows: s.windows.map((w) =>
        w.instanceId === instanceId ? { ...w, position: pos } : w
      ),
    }));
  },

  resize(instanceId, size) {
    set((s) => ({
      windows: s.windows.map((w) =>
        w.instanceId === instanceId ? { ...w, size } : w
      ),
    }));
  },

  closeAll() {
    set({ windows: [], focusedId: null });
  },
}));
