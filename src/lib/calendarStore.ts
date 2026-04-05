"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  text: string;
}

interface CalendarState {
  events: CalendarEvent[];
  addEvent: (date: string, time: string, text: string) => void;
  deleteEvent: (id: string) => void;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      events: [],

      addEvent: (date, time, text) => {
        const ev: CalendarEvent = {
          id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          date,
          time,
          text,
        };
        set((s) => ({ events: [...s.events, ev] }));
      },

      deleteEvent: (id) =>
        set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
    }),
    { name: "strontium-calendar" }
  )
);
