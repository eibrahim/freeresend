import { query } from "@/lib/database";
import type { StatsMetric, StatsMetricDefinition } from "@/types/stats";

/**
 * FreeResend custom metrics.
 *
 * A transactional email relay (Resend-compatible API backed by AWS SES):
 *   - email volume: emails_sent_total + emails_sent_30d (core product usage)
 *   - domain health: domains_total + domains_verified (onboarding funnel)
 *   - api integration: api_keys_total (how many integrations are wired up)
 *   - top of funnel: waitlist_total
 */
export async function customMetrics(): Promise<StatsMetric[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    emailsSentTotalRes,
    emailsSent30dRes,
    domainsTotalRes,
    domainsVerifiedRes,
    apiKeysTotalRes,
    waitlistTotalRes,
  ] = await Promise.all([
    query("SELECT COUNT(*)::bigint AS count FROM email_logs"),
    query("SELECT COUNT(*)::bigint AS count FROM email_logs WHERE created_at >= $1", [thirtyDaysAgo]),
    query("SELECT COUNT(*)::bigint AS count FROM domains"),
    query("SELECT COUNT(*)::bigint AS count FROM domains WHERE status = 'verified'"),
    query("SELECT COUNT(*)::bigint AS count FROM api_keys"),
    query("SELECT COUNT(*)::bigint AS count FROM waitlist_signups"),
  ]);

  return [
    { key: "emails_sent_total", value: Number(emailsSentTotalRes.rows[0]?.count ?? 0) },
    { key: "emails_sent_30d", value: Number(emailsSent30dRes.rows[0]?.count ?? 0) },
    { key: "domains_total", value: Number(domainsTotalRes.rows[0]?.count ?? 0) },
    { key: "domains_verified", value: Number(domainsVerifiedRes.rows[0]?.count ?? 0) },
    { key: "api_keys_total", value: Number(apiKeysTotalRes.rows[0]?.count ?? 0) },
    { key: "waitlist_total", value: Number(waitlistTotalRes.rows[0]?.count ?? 0) },
  ];
}

export const metricDefinitions: StatsMetricDefinition[] = [
  { key: "emails_sent_total", label: "Emails Sent (total)", unit: "emails", format: "integer", category: "activity", order: 0 },
  { key: "emails_sent_30d", label: "Emails Sent (30d)", unit: "emails", format: "integer", category: "activity", order: 1 },
  { key: "domains_total", label: "Domains (total)", unit: "domains", format: "integer", category: "domains", order: 0 },
  { key: "domains_verified", label: "Domains (verified)", unit: "domains", format: "integer", category: "domains", order: 1 },
  { key: "api_keys_total", label: "API Keys", unit: "keys", format: "integer", category: "integration", order: 0 },
  { key: "waitlist_total", label: "Waitlist Signups", unit: "signups", format: "integer", category: "funnel", order: 0 },
];
