import { create } from "zustand";

export type NotifType = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  title: string;
  body?: string;
  type: NotifType;
  timestamp: number;
  read: boolean;
  appId?: string;
}

interface NotificationStore {
  notifications: Notification[];
  toastIds: string[];
  push(n: Pick<Notification, "title" | "body" | "type"> & { appId?: string }): string;
  dismissToast(id: string): void;
  markRead(id: string): void;
  markAllRead(): void;
  clearAll(): void;
}

let _seq = 0;

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  toastIds: [],

  push(n) {
    const id = `notif-${Date.now()}-${++_seq}`;
    const notif: Notification = { ...n, id, timestamp: Date.now(), read: false };
    set((s) => ({
      notifications: [notif, ...s.notifications].slice(0, 50),
      toastIds: [...s.toastIds, id],
    }));
    setTimeout(() => {
      set((s) => ({ toastIds: s.toastIds.filter((x) => x !== id) }));
    }, 4500);
    return id;
  },

  dismissToast(id) {
    set((s) => ({ toastIds: s.toastIds.filter((x) => x !== id) }));
  },

  markRead(id) {
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  markAllRead() {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  clearAll() {
    set({ notifications: [], toastIds: [] });
  },
}));

// Convenience function usable outside React components
export function notify(
  title: string,
  body?: string,
  type: NotifType = "info",
  appId?: string
): string {
  return useNotificationStore.getState().push({ title, body, type, appId });
}
