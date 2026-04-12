"use client";
import { useEffect, useState } from "react";
import { onStatusChange, type ApplyStatus } from "@/lib/systemSettingsBridge";

/**
 * useSystemSetting
 *
 * Returns the apply status for a given setting key so the UI can show
 * pending spinners, success ticks, or error states.
 *
 * Usage:
 *   const { status } = useSystemSetting("brightness");
 */
export function useSystemSetting(key: string) {
  const [status, setStatus] = useState<ApplyStatus>("idle");
  const [error, setError]   = useState<string | undefined>();

  useEffect(() => {
    const unsub = onStatusChange((k, s, err) => {
      if (k !== key) return;
      setStatus(s);
      setError(err);
      if (s === "applied") setTimeout(() => setStatus("idle"), 1800);
    });
    return unsub;
  }, [key]);

  return { status, error };
}
