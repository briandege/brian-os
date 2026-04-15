/**
 * authStore.ts
 * Zustand store for AxiraNews authentication state in Strontium OS.
 * Persists the JWT token to localStorage so sessions survive page reloads.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Stable anonymous session ID — generated once, survives across page loads
function makeSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  const key = "axira-session-id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

interface AuthState {
  token: string | null;
  expiresAt: number | null;
  sessionId: string;
  signIn: (token: string, expiresAt: number) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      expiresAt: null,
      sessionId: makeSessionId(),
      signIn: (token, expiresAt) => set({ token, expiresAt }),
      signOut: () => set({ token: null, expiresAt: null }),
    }),
    { name: "axira-auth" },
  ),
);

/** True when a non-expired token is stored. */
export function isAuthed(): boolean {
  const { token, expiresAt } = useAuthStore.getState();
  return !!token && (!expiresAt || expiresAt > Date.now());
}

/** Returns the stored bearer token if valid, otherwise null. */
export function getToken(): string | null {
  return isAuthed() ? useAuthStore.getState().token : null;
}

/** Returns a stable anonymous session ID. */
export function getSessionId(): string {
  return useAuthStore.getState().sessionId;
}
