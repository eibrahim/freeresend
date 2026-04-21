import { NextResponse } from "next/server";
import { collectStandardMetrics, reportStats } from "@/lib/stats-reporter";
import { customMetrics, metricDefinitions } from "@/config/stats";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function checkCron(req: Request): boolean {
  const header = req.headers.get("x-cron-secret") ?? "";
  const expected = process.env.CRON_SECRET ?? "";
  return !!expected && header === expected;
}

export async function POST(req: Request) {
  if (!checkCron(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = new URL(req.url).searchParams.get("dry") === "1";

  const dashboardUrl = process.env.STATS_DASHBOARD_URL;
  const slug = process.env.STATS_APP_SLUG;
  const secret = process.env.STATS_PUSH_SECRET;

  if (!dashboardUrl || !slug || !secret) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "STATS_DASHBOARD_URL / STATS_APP_SLUG / STATS_PUSH_SECRET not all set",
    });
  }

  let standardMetrics, custom;
  try {
    [standardMetrics, custom] = await Promise.all([
      collectStandardMetrics(),
      customMetrics().catch((e) => {
        console.warn("[stats-reporter] customMetrics threw:", (e as Error).message);
        return [];
      }),
    ]);
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: `metric collection failed: ${(err as Error).message}`,
    });
  }

  const result = await reportStats({
    dashboardUrl,
    slug,
    secret,
    standardMetrics,
    customMetrics: custom,
    definitions: metricDefinitions,
    dryRun,
  });

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dry_run: true,
      payload: "payload" in result ? result.payload : undefined,
    });
  }

  if (!result.ok) {
    console.warn("[stats-reporter] push failed:", result.error);
    return NextResponse.json({ ok: false, error: result.error, status: result.status });
  }

  return NextResponse.json({ ok: true, sent: result.sent });
}
