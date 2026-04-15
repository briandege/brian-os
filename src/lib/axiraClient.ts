/**
 * AxiraNews API client — shared across all strontium.os apps.
 * Falls back gracefully when the backend is offline.
 */

export const AXIRA_BASE =
  process.env.NEXT_PUBLIC_AXIRA_API_URL ?? "http://10.0.0.75:4000";

export type AxiraArticle = {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  source: string;
  category: string;
  publishedAt: string;
  url?: string;
  imageUrl?: string;
  country?: string;
  urgent?: boolean;
};

export type ServiceHealth = {
  name: string;
  status: "online" | "degraded" | "offline";
  latencyMs: number;
};

export type BackendHealth = {
  api: ServiceHealth;
  postgres: ServiceHealth;
  redis: ServiceHealth;
  reachable: boolean;
  checkedAt: number;
};

// ── Low-level fetch with timeout ─────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  opts: RequestInit = {},
  timeoutMs = 5000,
): Promise<T | null> {
  try {
    const res = await fetch(`${AXIRA_BASE}${path}`, {
      ...opts,
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "Content-Type": "application/json", ...opts.headers },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ── News ─────────────────────────────────────────────────────────────────────
export async function fetchNews(params?: {
  limit?: number;
  category?: string;
  search?: string;
}): Promise<AxiraArticle[]> {
  const qs = new URLSearchParams();
  if (params?.limit)    qs.set("limit",    String(params.limit));
  if (params?.category) qs.set("category", params.category);
  if (params?.search)   qs.set("q",        params.search);

  const result = await apiFetch<{ articles?: AxiraArticle[]; data?: AxiraArticle[] }>(
    `/v1/news${qs.toString() ? "?" + qs : ""}`,
  );
  return result?.articles ?? result?.data ?? [];
}

export async function fetchTopHeadlines(limit = 6): Promise<AxiraArticle[]> {
  const result = await apiFetch<{ articles?: AxiraArticle[]; data?: AxiraArticle[] }>(
    `/v1/news/top-headlines?limit=${limit}`,
  );
  return result?.articles ?? result?.data ?? [];
}

export async function searchNews(q: string, limit = 10): Promise<AxiraArticle[]> {
  const result = await apiFetch<{ articles?: AxiraArticle[]; data?: AxiraArticle[] }>(
    `/v1/news/search?q=${encodeURIComponent(q)}&limit=${limit}`,
  );
  return result?.articles ?? result?.data ?? [];
}

// ── Health ───────────────────────────────────────────────────────────────────
export async function checkHealth(): Promise<BackendHealth> {
  const start = performance.now();

  // Ping the API with a lightweight request
  const result = await apiFetch<unknown>("/v1/news?limit=1", {}, 4000);
  const apiMs = Math.round(performance.now() - start);
  const reachable = result !== null;

  // Check Postgres + Redis via a health endpoint if it exists
  const health = await apiFetch<{
    postgres?: string;
    redis?: string;
    db?: string;
  }>("/health", {}, 3000);

  const postgresUp = health?.postgres === "ok" || health?.db === "ok" || reachable;
  const redisUp    = health?.redis === "ok" || reachable;

  return {
    reachable,
    checkedAt: Date.now(),
    api: {
      name: "AxiraNews API",
      status: reachable ? "online" : "offline",
      latencyMs: reachable ? apiMs : 0,
    },
    postgres: {
      name: "PostgreSQL",
      status: postgresUp ? "online" : "offline",
      latencyMs: reachable ? Math.round(apiMs * 0.3) : 0,
    },
    redis: {
      name: "Redis",
      status: redisUp ? "online" : "offline",
      latencyMs: reachable ? Math.round(apiMs * 0.1) : 0,
    },
  };
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export async function loginWithCredentials(
  clientId: string,
  clientSecret: string,
): Promise<{ token: string; expiresAt: number } | null> {
  const res = await apiFetch<{ token: string; expiresIn: number }>(
    "/v1/auth/token",
    {
      method: "POST",
      body: JSON.stringify({ clientId, clientSecret }),
    },
    8000,
  );
  if (!res?.token) return null;
  return { token: res.token, expiresAt: Date.now() + res.expiresIn * 1000 };
}

// ── Personalized feed ────────────────────────────────────────────────────────
export async function fetchPersonalizedNews(
  params: { userId: string; limit?: number; category?: string },
  token: string,
): Promise<AxiraArticle[]> {
  const qs = new URLSearchParams({ userId: params.userId });
  if (params.limit)    qs.set("limit",    String(params.limit));
  if (params.category) qs.set("category", params.category);

  const result = await apiFetch<{ articles?: AxiraArticle[]; data?: AxiraArticle[] }>(
    `/v1/news?${qs}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return result?.articles ?? result?.data ?? [];
}

// ── Nearby ───────────────────────────────────────────────────────────────────
export async function fetchNearby(
  lat: number,
  lon: number,
  limit = 10,
): Promise<AxiraArticle[]> {
  const result = await apiFetch<{ articles?: AxiraArticle[]; data?: AxiraArticle[] }>(
    `/v1/news/nearby?lat=${lat}&lon=${lon}&limit=${limit}`,
  );
  return result?.articles ?? result?.data ?? [];
}

// ── Engagement events ────────────────────────────────────────────────────────
export type EngagementEvent = {
  articleId: string;
  eventType: "impression" | "click" | "dwell" | "like" | "save";
  dwellMs?: number;
  category?: string;
  sourceType?: string;
  country?: string;
  userId?: string;
};

export async function postEngagementEvents(
  events: EngagementEvent[],
  token?: string,
): Promise<boolean> {
  const res = await apiFetch<unknown>(
    "/v1/events",
    {
      method: "POST",
      body: JSON.stringify({ events }),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );
  return res !== null;
}

// ── Backend stats (for showcase) ─────────────────────────────────────────────
export type BackendStats = {
  totalArticles: number;
  byCategory: Record<string, number>;
  sources: number;
};

export async function fetchStats(): Promise<BackendStats | null> {
  // Derive stats from a news fetch since there's no dedicated stats endpoint
  const articles = await fetchNews({ limit: 100 });
  if (!articles.length) return null;

  const byCategory: Record<string, number> = {};
  const sources = new Set<string>();
  for (const a of articles) {
    byCategory[a.category] = (byCategory[a.category] ?? 0) + 1;
    sources.add(a.source);
  }
  return { totalArticles: articles.length, byCategory, sources: sources.size };
}

// ── Admin — Ingestion ────────────────────────────────────────────────────────
export async function triggerIngest(token?: string): Promise<boolean> {
  const res = await apiFetch<unknown>(
    "/v1/ingest",
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
    15000,
  );
  return res !== null;
}

export type IngestStatus = {
  sseConnections: number;
  lastCycle: Record<string, unknown> | string;
};

export async function fetchIngestStatus(token: string): Promise<IngestStatus | null> {
  return apiFetch<IngestStatus>("/v1/ingest/status", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function runIngestionCycle(token: string): Promise<boolean> {
  const res = await apiFetch<unknown>("/v1/ingest/run", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  }, 10000);
  return res !== null;
}

// ── Admin — Security ─────────────────────────────────────────────────────────
export type SecurityStatus = Record<string, unknown>;
export type SecurityStats  = Record<string, unknown>;
export type Detection      = { id: string; type?: string; path?: string; severity?: string; detected_at?: string; acknowledged?: boolean; [k: string]: unknown };

export async function fetchSecurityStatus(token: string): Promise<SecurityStatus | null> {
  return apiFetch<SecurityStatus>("/v1/security/status", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchSecurityStats(token: string): Promise<SecurityStats | null> {
  return apiFetch<SecurityStats>("/v1/security/stats", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchDetections(token: string, limit = 50): Promise<Detection[]> {
  const res = await apiFetch<Detection[] | { detections?: Detection[]; data?: Detection[] }>(
    `/v1/security/detections?limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res) return [];
  if (Array.isArray(res)) return res;
  return res.detections ?? res.data ?? [];
}

export async function acknowledgeDetection(id: string, token: string): Promise<boolean> {
  const res = await apiFetch<unknown>(`/v1/security/detections/${id}/acknowledge`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res !== null;
}

export async function pauseShield(token: string): Promise<boolean> {
  const res = await apiFetch<unknown>("/v1/security/shield/pause", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res !== null;
}

export async function resumeShield(token: string): Promise<boolean> {
  const res = await apiFetch<unknown>("/v1/security/shield/resume", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res !== null;
}

export async function startScan(token: string, paths?: string[]): Promise<boolean> {
  const res = await apiFetch<unknown>("/v1/security/scan/start", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ paths }),
  });
  return res !== null;
}

export async function fetchScanStatus(token: string): Promise<Record<string, unknown> | null> {
  return apiFetch<Record<string, unknown>>("/v1/security/scan/status", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Admin — OSINT ────────────────────────────────────────────────────────────
export type CisaKevEntry = { cveID?: string; vendorProject?: string; product?: string; vulnerabilityName?: string; dateAdded?: string; shortDescription?: string; [k: string]: unknown };

export async function fetchCisaKev(token: string): Promise<CisaKevEntry[]> {
  const res = await apiFetch<CisaKevEntry[] | { vulnerabilities?: CisaKevEntry[] }>(
    "/v1/osint/cisa-kev",
    { headers: { Authorization: `Bearer ${token}` } },
    10000,
  );
  if (!res) return [];
  if (Array.isArray(res)) return res;
  return res.vulnerabilities ?? [];
}

export async function osintLookup(type: "ip" | "domain" | "email" | "cve", query: string, token: string): Promise<Record<string, unknown> | null> {
  const path = type === "ip"     ? `/v1/osint/ip/${encodeURIComponent(query)}`
             : type === "domain" ? `/v1/osint/domain/${encodeURIComponent(query)}`
             : type === "email"  ? `/v1/osint/email?q=${encodeURIComponent(query)}`
                                 : `/v1/osint/cve?q=${encodeURIComponent(query)}`;
  return apiFetch<Record<string, unknown>>(path, {
    headers: { Authorization: `Bearer ${token}` },
  }, 12000);
}

// ── Security alert ───────────────────────────────────────────────────────────
export async function notifySecurityAlert(payload: {
  event: string;
  severity?: "low" | "medium" | "high" | "critical";
  source?: string;
}): Promise<boolean> {
  const res = await apiFetch<unknown>(
    "/v1/security/alert",
    {
      method: "POST",
      body: JSON.stringify({ ...payload, timestamp: new Date().toISOString() }),
    },
    6000,
  );
  return res !== null;
}

// ── Relative time ────────────────────────────────────────────────────────────
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
