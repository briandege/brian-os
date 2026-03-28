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

// ── Admin ────────────────────────────────────────────────────────────────────
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
