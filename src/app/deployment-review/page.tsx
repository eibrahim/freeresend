import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ExternalLink, MailCheck, Radar, ShieldCheck } from "lucide-react";
import { deploymentReview, launchKit, sesProductionGuide } from "@/config/launch-kit";

export const metadata: Metadata = {
  title: "FreeResend Deployment Review",
  description:
    "A concise manual review of one FreeResend self-hosted deployment plan covering DNS, SES, webhooks, and launch risk.",
  openGraph: {
    title: "FreeResend Deployment Review",
    description:
      "Get a narrow FreeResend self-hosting review before sending production email.",
    url: "https://www.freeresend.com/deployment-review",
    type: "website",
  },
};

const reviewAreas = [
  {
    icon: ShieldCheck,
    title: "DNS authentication",
    copy: "DKIM, SPF, DMARC, sender domains, and the common record-shape mistakes that hurt deliverability.",
  },
  {
    icon: MailCheck,
    title: "SES readiness",
    copy: "Sandbox status, region choice, suppression handling, bounce events, complaint events, and safe test sending.",
  },
  {
    icon: Radar,
    title: "Launch risk",
    copy: "Webhook gaps, smoke-test coverage, rollback steps, and the highest-priority fixes before production traffic.",
  },
];

export default function DeploymentReviewPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <nav className="mb-10 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            FreeResend
          </Link>
          <div className="flex items-center gap-4">
            <Link href={sesProductionGuide.productUrl} className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Guide
            </Link>
            <Link href={launchKit.productUrl} className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Launch Kit
            </Link>
          </div>
        </nav>

        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center rounded-full border border-emerald-100 bg-white px-3 py-1 text-sm font-medium text-emerald-700 shadow-sm">
              {deploymentReview.price} manual deployment review
            </div>
            <h1 className="text-4xl font-bold leading-tight text-gray-900 sm:text-5xl">
              Catch the SES and DNS mistakes before customers see them.
            </h1>
            <p className="mt-5 text-lg leading-8 text-gray-600">
              Send one FreeResend deployment URL, GitHub issue, or rollout note through Stripe checkout. You get a
              concise review focused on email-authentication risk, SES readiness, webhook coverage, and the next fixes to make.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={deploymentReview.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <span>Book review for {deploymentReview.price}</span>
                <ExternalLink className="h-4 w-4" />
              </a>
              <Link
                href="/tools/email-dns-checker"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:border-gray-300"
              >
                <MailCheck className="h-4 w-4" />
                <span>Run DNS check</span>
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Stripe checkout asks for a deployment URL or GitHub issue and your main concern. Do not include AWS keys,
              SMTP passwords, database credentials, or other secrets.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="border-b border-gray-100 pb-4">
              <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">Included</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">{deploymentReview.name}</h2>
            </div>
            <ul className="mt-6 space-y-4">
              {deploymentReview.bullets.map((item) => (
                <li key={item} className="flex gap-3 text-gray-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="scope" className="mt-16 grid gap-5 md:grid-cols-3">
          {reviewAreas.map((area) => {
            const Icon = area.icon;
            return (
              <div key={area.title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{area.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">{area.copy}</p>
              </div>
            );
          })}
        </section>

        <section className="mt-16 rounded-2xl border border-amber-200 bg-amber-50 p-8">
          <div className="flex gap-4">
            <AlertTriangle className="mt-1 h-6 w-6 flex-none text-amber-700" />
            <div>
              <h2 className="text-xl font-bold text-amber-950">Narrow by design</h2>
              <p className="mt-2 leading-7 text-amber-900">
                This is a one-page review of one deployment plan, not a full implementation contract, live debugging
                session, or deliverability guarantee. For custom development, use the professional support path after
                the review identifies the concrete work.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
