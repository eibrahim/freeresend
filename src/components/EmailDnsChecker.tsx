"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  MailCheck,
  Search,
  XCircle,
} from "lucide-react";
import { deploymentReview, launchKit } from "@/config/launch-kit";
import type { EmailDnsAssessment, EmailDnsCheck, EmailDnsStatus } from "@/lib/email-dns-readiness";

const statusStyles: Record<EmailDnsStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  pass: {
    label: "Pass",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  warn: {
    label: "Review",
    icon: AlertTriangle,
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  fail: {
    label: "Fix",
    icon: XCircle,
    className: "border-red-200 bg-red-50 text-red-800",
  },
  info: {
    label: "Info",
    icon: Info,
    className: "border-blue-200 bg-blue-50 text-blue-800",
  },
};

function StatusPill({ status }: { status: EmailDnsStatus }) {
  const style = statusStyles[status];
  const Icon = style.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${style.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {style.label}
    </span>
  );
}

function CheckCard({ check }: { check: EmailDnsCheck }) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{check.title}</h3>
          <p className="mt-1 text-sm text-gray-600">{check.summary}</p>
        </div>
        <StatusPill status={check.status} />
      </div>

      <ul className="mt-4 space-y-2 text-sm leading-6 text-gray-600">
        {check.details.map((detail) => (
          <li key={detail} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-gray-400" />
            <span>{detail}</span>
          </li>
        ))}
      </ul>

      {check.records.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-md border border-gray-100 bg-gray-50">
          {check.records.map((record) => (
            <code key={record} className="block break-words px-3 py-2 text-xs leading-5 text-gray-700">
              {record}
            </code>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default function EmailDnsChecker() {
  const [domain, setDomain] = useState("");
  const [dkimSelector, setDkimSelector] = useState("");
  const [result, setResult] = useState<EmailDnsAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resultTitle = useMemo(() => {
    if (!result) return "Check your sending domain";
    if (result.overallStatus === "fail") return "Fix these records before launch";
    if (result.overallStatus === "warn") return "Review these DNS warnings";
    return "DNS looks ready for a closer launch pass";
  }, [result]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/tools/email-dns-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, dkimSelector }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "DNS check failed.");
      }

      setResult(payload as EmailDnsAssessment);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <MailCheck className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
            Email DNS readiness checker
          </h1>
          <p className="mt-4 leading-7 text-gray-600">
            Check SPF, DMARC, MX, and one DKIM selector before moving a FreeResend or Amazon SES domain into production.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="domain" className="text-sm font-semibold text-gray-900">
                Sending domain
              </label>
              <input
                id="domain"
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                placeholder="example.com"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="dkimSelector" className="text-sm font-semibold text-gray-900">
                DKIM selector
              </label>
              <input
                id="dkimSelector"
                value={dkimSelector}
                onChange={(event) => setDkimSelector(event.target.value)}
                placeholder="optional"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span>{loading ? "Checking DNS" : "Run DNS check"}</span>
            </button>
          </form>

          {error ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
          ) : null}

          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Never paste AWS keys, SMTP passwords, database URLs, or private tokens into this checker.
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                  {result?.domain ?? "FreeResend"}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">{resultTitle}</h2>
                <p className="mt-2 leading-7 text-gray-600">
                  {result?.summary ??
                    "Run the checker to see the records that most often block SES launches, then use the launch kit or review offer for the remaining rollout work."}
                </p>
              </div>
              {result ? <StatusPill status={result.overallStatus} /> : null}
            </div>
          </div>

          {result ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {result.checks.map((check) => (
                  <CheckCard key={check.id} check={check} />
                ))}
              </div>

              {result.lookupErrors.length > 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
                  DNS lookup warnings: {result.lookupErrors.join("; ")}
                </div>
              ) : null}
            </>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {["SPF", "DMARC", "DKIM", "MX"].map((item) => (
                <div key={item} className="rounded-lg border border-dashed border-gray-200 bg-white p-5 text-gray-500">
                  <div className="h-2 w-16 rounded-full bg-gray-100" />
                  <div className="mt-4 text-lg font-semibold text-gray-700">{item}</div>
                  <div className="mt-3 h-2 w-full rounded-full bg-gray-100" />
                  <div className="mt-2 h-2 w-2/3 rounded-full bg-gray-100" />
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <h2 className="text-xl font-bold text-emerald-950">Need a production pass?</h2>
            <p className="mt-2 leading-7 text-emerald-900">
              The checker only sees public DNS. The {deploymentReview.price} Deployment Review covers SES sandbox status,
              region choice, DKIM alignment, webhook gaps, and the next launch fixes from your deployment URL.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href={deploymentReview.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <span>Book review for {deploymentReview.price}</span>
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href={launchKit.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-white px-5 py-3 font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
              >
                <span>Buy launch kit</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
