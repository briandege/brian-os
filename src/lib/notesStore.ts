"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface NotesState {
  notes: Note[];
  activeId: string | null;
  addNote: () => void;
  deleteNote: (id: string) => void;
  updateNote: (id: string, data: Partial<Pick<Note, "title" | "content">>) => void;
  setActive: (id: string | null) => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: [],
      activeId: null,

      addNote: () => {
        const now = new Date().toISOString();
        const note: Note = {
          id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title: "Untitled",
          content: "",
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ notes: [note, ...s.notes], activeId: note.id }));
      },

      deleteNote: (id) =>
        set((s) => {
          const filtered = s.notes.filter((n) => n.id !== id);
          return {
            notes: filtered,
            activeId: s.activeId === id ? (filtered[0]?.id ?? null) : s.activeId,
          };
        }),

      updateNote: (id, data) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id
              ? { ...n, ...data, updatedAt: new Date().toISOString() }
              : n
          ),
        })),

      setActive: (id) => set({ activeId: id }),
    }),
    { name: "strontium-notes" }
  )
);
