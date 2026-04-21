import { query } from "@/lib/database";
import type { StatsMetric, StatsMetricDefinition, StatsPayload } from "@/types/stats";

/**
 * Non-Prisma (raw pg) variant of the stats reporter.
 *
 * Collects three standard metrics:
 *   - users_total:       COUNT(users)
 *   - users_active_30d:  COUNT(users WHERE updated_at >= now - 30d)  (activity proxy)
 *   - subs_active:       skipped when no subscriptions table exists
 *
 * Each collector is best-effort: failures are swallowed and the metric is
 * omitted from the payload.
 */
export async function collectStandardMetrics(): Promise<StatsMetric[]> {
  const out: StatsMetric[] = [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  try {
    const r = await query("SELECT COUNT(*)::bigint AS count FROM users");
    out.push({ key: "users_total", value: Number(r.rows[0]?.count ?? 0) });
  } catch (err) {
    console.warn("[stats-reporter] users_total failed:", (err as Error).message);
  }

  try {
    const r = await query(
      "SELECT COUNT(*)::bigint AS count FROM users WHERE updated_at >= $1",
      [thirtyDaysAgo]
    );
    out.push({ key: "users_active_30d", value: Number(r.rows[0]?.count ?? 0) });
  } catch (err) {
    console.warn("[stats-reporter] users_active_30d failed:", (err as Error).message);
  }

  // freeresend has no subscriptions table; skip subs_active entirely.

  return out;
}

/**
 * Minimal default metric definitions for the standard keys. Apps can override
 * by returning entries with the same keys from src/config/stats.ts.
 */
export const STANDARD_METRIC_DEFINITIONS: StatsMetricDefinition[] = [
  { key: "users_total", label: "Total Users", unit: "users", format: "integer", category: "users", order: 0 },
  { key: "users_active_30d", label: "Active Users (30d)", unit: "users", format: "integer", category: "users", order: 1 },
  { key: "subs_active", label: "Active Subscriptions", unit: "subs", format: "integer", category: "revenue", order: 0 },
];

type ReporterResult =
  | { ok: true; sent: number; dry_run?: boolean; payload?: StatsPayload }
  | { ok: false; error: string; status?: number; dry_run?: boolean };

/**
 * Send a stats report to the dashboard. Never throws - all errors are caught
 * and returned as `{ok: false, error}` so the cron endpoint can return 200
 * with a diagnostic instead of propagating the failure.
 */
export async function reportStats(opts: {
  dashboardUrl: string;
  slug: string;
  secret: string;
  standardMetrics: StatsMetric[];
  customMetrics: StatsMetric[];
  definitions: StatsMetricDefinition[];
  dryRun?: boolean;
}): Promise<ReporterResult> {
  const mergedMap = new Map<string, StatsMetric>();
  for (const m of opts.standardMetrics) mergedMap.set(m.key, m);
  for (const m of opts.customMetrics) mergedMap.set(m.key, m);
  const metrics = [...mergedMap.values()];

  const defMap = new Map<string, StatsMetricDefinition>();
  for (const d of STANDARD_METRIC_DEFINITIONS) defMap.set(d.key, d);
  for (const d of opts.definitions) defMap.set(d.key, d);
  const definitions = [...defMap.values()];

  const payload: StatsPayload = {
    recorded_at: new Date().toISOString(),
    metrics,
    definitions,
  };

  if (opts.dryRun) {
    return { ok: true, sent: 0, dry_run: true, payload };
  }

  const url = `${opts.dashboardUrl.replace(/\/$/, "")}/api/v1/push/${encodeURIComponent(opts.slug)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Push-Secret": opts.secret,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, status: res.status, error: `dashboard responded ${res.status}: ${text.slice(0, 200)}` };
    }

    return { ok: true, sent: metrics.length };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
