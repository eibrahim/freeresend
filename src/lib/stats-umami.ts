import type { StatsMetric, StatsMetricDefinition } from "@/types/stats";

/**
 * Collects pageview/visitor metrics from Umami. Fails quietly: returns []
 * when any required config is missing or any HTTP call errors.
 *
 * Config sources (freeresend has no siteConfig; everything comes from env):
 *   UMAMI_WEBSITE_ID                 - per-app website UUID (see layout.tsx data-website-id)
 *   UMAMI_API_URL                    - API base, e.g. https://analytics.hub.elitecoders.ai
 *   UMAMI_USERNAME / UMAMI_PASSWORD  - read-only stats-user creds (shared across apps)
 *
 * Flow:
 *   1. POST /api/auth/login  -> {token}
 *   2. GET  /api/websites/:id/stats?startAt=&endAt=  with Authorization: Bearer <token>
 */
export async function collectUmamiMetrics(): Promise<StatsMetric[]> {
  const websiteId = process.env.UMAMI_WEBSITE_ID;
  const username = process.env.UMAMI_USERNAME;
  const password = process.env.UMAMI_PASSWORD;

  if (!websiteId || !username || !password) return [];

  const apiUrl = process.env.UMAMI_API_URL ?? "";

  if (!apiUrl) return [];
  const base = apiUrl.replace(/\/$/, "");

  try {
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      signal: AbortSignal.timeout(8000),
    });
    if (!loginRes.ok) return [];
    const { token } = (await loginRes.json()) as { token?: string };
    if (!token) return [];

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const fetchStats = async (startAt: number): Promise<Record<string, number> | null> => {
      const url = `${base}/api/websites/${encodeURIComponent(websiteId)}/stats?startAt=${startAt}&endAt=${now}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return null;
      // Umami v3 returns raw numbers: {pageviews: 301, visitors: 123, visits: 239, bounces: 206, totaltime: 23974, comparison: {...}}
      return (await res.json()) as Record<string, number>;
    };

    const [d30, d1] = await Promise.all([fetchStats(now - 30 * day), fetchStats(now - day)]);

    const out: StatsMetric[] = [];
    if (d30) {
      if (typeof d30.pageviews === "number") out.push({ key: "pageviews_30d", value: d30.pageviews });
      if (typeof d30.visitors === "number") out.push({ key: "visitors_30d", value: d30.visitors });
      if (typeof d30.visits === "number") out.push({ key: "visits_30d", value: d30.visits });
    }
    if (d1) {
      if (typeof d1.pageviews === "number") out.push({ key: "pageviews_24h", value: d1.pageviews });
      if (typeof d1.visitors === "number") out.push({ key: "visitors_24h", value: d1.visitors });
    }
    return out;
  } catch (err) {
    console.warn("[stats-umami] fetch failed:", (err as Error).message);
    return [];
  }
}

export const UMAMI_METRIC_DEFINITIONS: StatsMetricDefinition[] = [
  { key: "pageviews_30d", label: "Pageviews (30d)", unit: "pageviews", format: "integer", category: "audience", order: 0 },
  { key: "visitors_30d", label: "Visitors (30d)", unit: "visitors", format: "integer", category: "audience", order: 1 },
  { key: "visits_30d", label: "Visits (30d)", unit: "visits", format: "integer", category: "audience", order: 2 },
  { key: "pageviews_24h", label: "Pageviews (24h)", unit: "pageviews", format: "integer", category: "audience", order: 3 },
  { key: "visitors_24h", label: "Visitors (24h)", unit: "visitors", format: "integer", category: "audience", order: 4 },
];
