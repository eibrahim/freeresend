import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  MailCheck,
  Radar,
  ShieldCheck,
  Siren,
  Workflow,
} from "lucide-react";
import { deploymentReview, launchKit, sesProductionGuide } from "@/config/launch-kit";

export const metadata: Metadata = {
  title: "FreeResend SES Production Readiness Guide",
  description:
    "A practical SES, DNS, webhook, monitoring, and rollback checklist for teams preparing a FreeResend deployment for production email.",
  alternates: {
    canonical: sesProductionGuide.canonicalUrl,
  },
  openGraph: {
    title: "FreeResend SES Production Readiness Guide",
    description:
      "Check SES sandbox status, DNS authentication, bounce handling, webhooks, and launch risk before sending production email.",
    url: sesProductionGuide.canonicalUrl,
    type: "article",
  },
};

const readinessSteps = [
  {
    icon: ShieldCheck,
    title: "Authenticate the sending domain",
    copy: "Verify the domain in SES, publish DKIM records, keep SPF aligned with the real sender, and set a DMARC policy that reports failures before it rejects mail.",
    checks: ["DKIM records resolve", "SPF includes the sending path", "DMARC reporting address works"],
  },
  {
    icon: MailCheck,
    title: "Move SES out of sandbox deliberately",
    copy: "Confirm the production region, requested daily quota, expected peak send rate, suppression list behavior, and the account identity that will own the launch.",
    checks: ["Production access approved", "Quota matches first-week traffic", "Region matches app config"],
  },
  {
    icon: Workflow,
    title: "Wire bounce and complaint events",
    copy: "Use SNS or EventBridge to feed FreeResend webhook handling, then test the path before any customer-facing transactional mail depends on it.",
    checks: ["Bounce path tested", "Complaint path tested", "Suppression updates observable"],
  },
  {
    icon: Radar,
    title: "Run a production smoke test",
    copy: "Send a low-volume test from the production app path, inspect headers, confirm logs, and make sure rollback does not require editing secrets in a hurry.",
    checks: ["Headers show aligned domain", "App logs preserve message IDs", "Rollback owner is named"],
  },
];

const launchRisks = [
  "SES remains in sandbox while the app is already configured for production traffic.",
  "A DMARC record exists, but reports go nowhere or the policy hides DKIM alignment failures.",
  "Bounce and complaint webhooks are configured after launch instead of before the first real send.",
  "The team has no low-risk rollback path if DNS, secrets, or SES quotas are wrong.",
];

const handoffQuestions = [
  "Which domain and subdomain will send transactional mail?",
  "Which AWS account, SES region, and quota request own this launch?",
  "Where do bounces, complaints, and delivery events appear after a send?",
  "Who can roll back the sender configuration during the first production hour?",
];

export default function SesProductionReadinessPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <nav className="mb-10 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            FreeResend
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/tools/email-dns-checker" className="text-gray-600 hover:text-gray-900">
              DNS checker
            </Link>
            <Link href={deploymentReview.productUrl} className="text-gray-600 hover:text-gray-900">
              Review
            </Link>
          </div>
        </nav>

        <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center rounded-full border border-emerald-100 bg-white px-3 py-1 text-sm font-medium text-emerald-700 shadow-sm">
              Free production checklist
            </div>
            <h1 className="text-4xl font-bold leading-tight text-gray-900 sm:text-5xl">
              Get FreeResend ready for production SES traffic.
            </h1>
            <p className="mt-5 text-lg leading-8 text-gray-600">
              Use this guide before pointing a real application at FreeResend. It focuses on the launch details that
              usually create the first production incident: SES sandbox access, DNS authentication, webhook coverage,
              smoke tests, monitoring, and rollback ownership.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/tools/email-dns-checker"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <MailCheck className="h-4 w-4" />
                <span>Run DNS checker</span>
              </Link>
              <a
                href={deploymentReview.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:border-gray-300"
              >
                <span>Book review for {deploymentReview.price}</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">Preflight order</p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">Do not launch by DNS alone</h2>
                <p className="mt-3 leading-7 text-gray-600">
                  Passing SPF, DKIM, and DMARC is necessary, but production readiness also depends on SES account state,
                  event handling, send-rate limits, and the human rollback path.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="checklist" className="mt-16 grid gap-5 md:grid-cols-2">
          {readinessSteps.map((step) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{step.title}</h2>
                <p className="mt-3 text-sm leading-6 text-gray-600">{step.copy}</p>
                <ul className="mt-5 space-y-3">
                  {step.checks.map((check) => (
                    <li key={check} className="flex gap-3 text-sm text-gray-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-600" />
                      <span>{check}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-white text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold text-amber-950">Common launch risks</h2>
            <ul className="mt-5 space-y-4">
              {launchRisks.map((risk) => (
                <li key={risk} className="flex gap-3 text-sm leading-6 text-amber-900">
                  <Siren className="mt-0.5 h-4 w-4 flex-none text-amber-700" />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">Handoff questions</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">What a reviewer needs before launch</h2>
            <p className="mt-3 leading-7 text-gray-600">
              A useful deployment review does not need secrets. It needs the public sending domain, the intended SES
              region, the deployment notes, and the specific risk you want checked before production traffic.
            </p>
            <ul className="mt-6 space-y-3">
              {handoffQuestions.map((question) => (
                <li key={question} className="flex gap-3 text-gray-700">
                  <ArrowRight className="mt-1 h-4 w-4 flex-none text-emerald-600" />
                  <span>{question}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-16 rounded-lg bg-gray-900 p-8 text-white">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-emerald-300">Need a second set of eyes?</p>
              <h2 className="mt-2 text-2xl font-bold">Turn the checklist into a paid deployment review.</h2>
              <p className="mt-3 max-w-2xl text-gray-300">
                The {deploymentReview.price} review covers one FreeResend deployment plan and returns a concise
                priority report across DNS, SES state, webhook handling, smoke tests, and rollback risk.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a
                href={deploymentReview.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-100"
              >
                <span>Book review</span>
                <ExternalLink className="h-4 w-4" />
              </a>
              <Link
                href={launchKit.productUrl}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-700 px-5 py-3 font-semibold text-white transition-colors hover:border-gray-500"
              >
                <span>View launch kit</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
