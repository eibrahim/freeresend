import Stripe from "stripe";
import type { StatsMetric, StatsMetricDefinition } from "@/types/stats";

/**
 * Collects revenue + subscription metrics from Stripe. Fails quietly: returns []
 * when STRIPE_SECRET_KEY is unset or any API call errors.
 *
 * Metrics:
 *   stripe_mrr_cents         - monthly recurring revenue (active subs, interval-normalized)
 *   stripe_active_subs       - count of active subscriptions
 *   stripe_new_subs_30d      - subscriptions created in last 30 days (any status)
 *   stripe_revenue_cents_30d - sum of succeeded charge net amounts in last 30 days
 *   stripe_refunded_cents_30d- sum of refunded amounts in last 30 days
 *
 * Pagination: caps at 1000 items per list (10 pages of 100). Well above typical
 * nightly volumes for template-sized apps.
 */
export async function collectStripeMetrics(): Promise<StatsMetric[]> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return [];

  try {
    const stripe = new Stripe(key, { apiVersion: "2026-03-25.dahlia", typescript: true });
    const now = Math.floor(Date.now() / 1000);
    const d30 = now - 30 * 24 * 60 * 60;

    let activeSubs = 0;
    let mrrCents = 0;
    {
      let page = 0;
      for await (const sub of stripe.subscriptions.list({
        status: "active",
        limit: 100,
        expand: ["data.items.data.price"],
      })) {
        activeSubs++;
        for (const item of sub.items.data) {
          const price = item.price;
          if (!price.unit_amount || !price.recurring) continue;
          const amt = price.unit_amount * (item.quantity ?? 1);
          const { interval, interval_count } = price.recurring;
          const ic = interval_count ?? 1;
          let monthly = 0;
          if (interval === "month") monthly = amt / ic;
          else if (interval === "year") monthly = amt / (12 * ic);
          else if (interval === "week") monthly = (amt * 52) / (12 * ic);
          else if (interval === "day") monthly = (amt * 30) / ic;
          mrrCents += monthly;
        }
        if (++page >= 1000) break;
      }
    }

    let newSubs30d = 0;
    {
      let page = 0;
      for await (const _sub of stripe.subscriptions.list({
        created: { gte: d30 },
        status: "all",
        limit: 100,
      })) {
        void _sub;
        newSubs30d++;
        if (++page >= 1000) break;
      }
    }

    let revenue30dCents = 0;
    let refunded30dCents = 0;
    {
      let page = 0;
      for await (const charge of stripe.charges.list({
        created: { gte: d30 },
        limit: 100,
      })) {
        if (charge.status === "succeeded") {
          revenue30dCents += charge.amount - (charge.amount_refunded ?? 0);
          refunded30dCents += charge.amount_refunded ?? 0;
        }
        if (++page >= 1000) break;
      }
    }

    return [
      { key: "stripe_mrr_cents", value: Math.round(mrrCents) },
      { key: "stripe_active_subs", value: activeSubs },
      { key: "stripe_new_subs_30d", value: newSubs30d },
      { key: "stripe_revenue_cents_30d", value: revenue30dCents },
      { key: "stripe_refunded_cents_30d", value: refunded30dCents },
    ];
  } catch (err) {
    console.warn("[stats-stripe] fetch failed:", (err as Error).message);
    return [];
  }
}

export const STRIPE_METRIC_DEFINITIONS: StatsMetricDefinition[] = [
  { key: "stripe_mrr_cents", label: "MRR", format: "currency_cents_usd", category: "revenue", order: 0 },
  { key: "stripe_active_subs", label: "Active Subscriptions (Stripe)", unit: "subs", format: "integer", category: "revenue", order: 1 },
  { key: "stripe_new_subs_30d", label: "New Subscriptions (30d)", unit: "subs", format: "integer", category: "revenue", order: 2 },
  { key: "stripe_revenue_cents_30d", label: "Revenue (30d)", format: "currency_cents_usd", category: "revenue", order: 3 },
  { key: "stripe_refunded_cents_30d", label: "Refunded (30d)", format: "currency_cents_usd", category: "revenue", order: 4 },
];
