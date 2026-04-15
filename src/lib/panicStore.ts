import { create } from "zustand";

interface PanicStore {
  isPanicking: boolean;
  initiate: () => void;
  clear: () => void;
}

export const usePanicStore = create<PanicStore>((set) => ({
  isPanicking: false,
  initiate: () => set({ isPanicking: true }),
  clear:    () => set({ isPanicking: false }),
}));
