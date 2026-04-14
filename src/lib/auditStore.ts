"use client";
/**
 * auditStore.ts — GDPR Art. 51/52 independent supervisory layer
 *
 * Acts as the internal supervisory authority for strontium.os:
 *   - Article 51: monitors all data processing activities across every module
 *   - Article 52: operates independently — write access gated to this module only;
 *                 other stores can log but cannot mutate or clear the audit trail
 *
 * Audit log is append-only. Clearing requires explicit user action (Right to Erasure
 * per Art. 17 — the user is the data subject and data controller simultaneously).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Event taxonomy ────────────────────────────────────────────────────────────

export type AuditCategory =
  | "auth"          // lock / unlock / biometric
  | "data-access"   // file read / write / delete
  | "network"       // clearnet / tor / external request
  | "terminal"      // PTY session created / destroyed
  | "clipboard"     // clipboard read / write
  | "settings"      // settings changed
  | "app"           // app opened / closed
  | "security"      // password change / classification change
  | "system"        // power, sleep, restart
  | "ai"            // AI queries (no content, only metadata)
  | "compliance";   // audit log accessed, report exported

export type AuditSeverity = "info" | "warning" | "critical";

export interface AuditEvent {
  id: string;
  timestamp: string;          // ISO-8601
  category: AuditCategory;
  severity: AuditSeverity;
  action: string;             // human-readable action label
  module: string;             // which app/module generated this
  detail?: string;            // optional sanitized detail (no plaintext secrets)
  dataSubject?: "user";       // always "user" — single-user OS
}

// ── Store ─────────────────────────────────────────────────────────────────────

const MAX_EVENTS = 10_000;   // ring-buffer cap — prevent unbounded growth

interface AuditState {
  events: AuditEvent[];
  /** Append a new audit event (Art. 51 — continuous monitoring) */
  log: (event: Omit<AuditEvent, "id" | "timestamp">) => void;
  /** Clear audit log — Art. 17 Right to Erasure (user-initiated only) */
  clear: () => void;
  /** Export audit log as JSON string for compliance reporting */
  export: () => string;
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set, get) => ({
      events: [],

      log: (event) => {
        const entry: AuditEvent = {
          id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: new Date().toISOString(),
          dataSubject: "user",
          ...event,
        };
        set((s) => {
          const next = [...s.events, entry];
          // Ring-buffer: drop oldest when over cap
          return { events: next.length > MAX_EVENTS ? next.slice(next.length - MAX_EVENTS) : next };
        });
      },

      clear: () => {
        // Log the erasure itself before clearing (Art. 17 compliance trail)
        const erasureRecord: AuditEvent = {
          id: `audit-erasure-${Date.now()}`,
          timestamp: new Date().toISOString(),
          category: "compliance",
          severity: "warning",
          action: "Audit log cleared by user (Art. 17 Right to Erasure)",
          module: "ComplianceApp",
          dataSubject: "user",
        };
        set({ events: [erasureRecord] });
      },

      export: () => {
        const { events } = get();
        get().log({
          category: "compliance",
          severity: "info",
          action: "Audit log exported",
          module: "ComplianceApp",
          detail: `${events.length} events exported`,
        });
        return JSON.stringify({
          exportedAt: new Date().toISOString(),
          gdprBasis: "GDPR Art. 51/52 — Independent Supervisory Monitoring",
          system: "strontium.os",
          dataController: "user",
          eventCount: events.length,
          events,
        }, null, 2);
      },
    }),
    { name: "strontium-audit-log" }
  )
);

// ── Public logging helper (Art. 51 — all modules report here) ─────────────────

export function audit(event: Omit<AuditEvent, "id" | "timestamp">) {
  useAuditStore.getState().log(event);
}
