import { create } from "zustand";
import { persist } from "zustand/middleware";

export const CURRENT_VERSION = "0.2.0";

interface UpdateState {
  currentVersion: string;
  lastSeenVersion: string;
  updateAvailable: boolean;
  changelog: string;
  // actions
  acknowledge: () => void;
}

export const useUpdateStore = create<UpdateState>()(
  persist(
    (set) => ({
      currentVersion: CURRENT_VERSION,
      lastSeenVersion: "0.0.0",
      updateAvailable: true,
      changelog:
        "ARIA AI assistant \u00b7 Light mode \u00b7 System health monitoring \u00b7 Newsroom publisher",

      acknowledge() {
        set({
          lastSeenVersion: CURRENT_VERSION,
          updateAvailable: false,
        });
      },
    }),
    { name: "strontium-update" }
  )
);
