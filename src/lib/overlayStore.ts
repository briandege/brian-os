// src/lib/overlayStore.ts
import { create } from "zustand";

export type OverlayState =
  | "idle"
  | "start-screen"
  | "locking"
  | "locked"
  | "shutting-down"
  | "restarting"
  | "sleeping";

export type PowerAction = "lock" | "sleep" | "restart" | "shutdown" | "logout";

interface OverlayStore {
  state: OverlayState;
  openStartScreen: () => void;
  dismiss: () => void;
  executePowerAction: (action: PowerAction) => void;
  unlock: () => void;
  lock: () => void;
}

export const useOverlayStore = create<OverlayStore>((set, get) => ({
  // Start locked — every boot requires authentication
  state: "locked",

  openStartScreen() {
    if (get().state === "idle") set({ state: "start-screen" });
  },

  dismiss() {
    if (get().state === "start-screen") set({ state: "idle" });
  },

  unlock() {
    if (get().state === "locked") set({ state: "idle" });
  },

  lock() {
    set({ state: "locking" });
    setTimeout(() => set({ state: "locked" }), 500);
  },

  executePowerAction(action: PowerAction) {
    const s = get().state;
    if (s !== "start-screen" && s !== "idle") return;

    switch (action) {
      case "lock":
        set({ state: "locking" });
        setTimeout(() => set({ state: "locked" }), 600);
        break;
      case "sleep":
        set({ state: "sleeping" });
        setTimeout(() => {
          window.electronAPI?.powerAction?.("sleep");
        }, 800);
        break;
      case "restart":
        set({ state: "restarting" });
        setTimeout(() => window.electronAPI?.powerAction?.("restart"), 1200);
        break;
      case "shutdown":
        set({ state: "shutting-down" });
        setTimeout(() => window.electronAPI?.powerAction?.("shutdown"), 1200);
        break;
      case "logout":
        set({ state: "shutting-down" });
        setTimeout(() => window.electronAPI?.powerAction?.("logout"), 800);
        break;
    }
  },
}));
