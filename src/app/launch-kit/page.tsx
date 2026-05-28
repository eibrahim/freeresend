import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ExternalLink, ServerCog, ShieldCheck, Workflow } from "lucide-react";
import { deploymentReview, launchKit, sesProductionGuide } from "@/config/launch-kit";

export const metadata: Metadata = {
  title: "FreeResend Self-Hosted Launch Kit",
  description:
    "A practical deployment checklist for launching FreeResend with Amazon SES, DNS authentication, webhooks, monitoring, and rollback steps.",
  openGraph: {
    title: "FreeResend Self-Hosted Launch Kit",
    description:
      "Deploy FreeResend with a practical SES, DNS, webhook, monitoring, and rollback checklist.",
    url: "https://www.freeresend.com/launch-kit",
    type: "website",
  },
};

const sections = [
  {
    icon: ServerCog,
    title: "Infrastructure preflight",
    copy: "Confirm the database, secrets, AWS region, sending limits, DNS ownership, and deployment target before the first production rollout.",
  },
  {
    icon: ShieldCheck,
    title: "Deliverability setup",
    copy: "Work through SES verification, DKIM, SPF, DMARC, bounce handling, webhook wiring, and safe sender-domain testing.",
  },
  {
    icon: Workflow,
    title: "Launch and rollback",
    copy: "Use smoke tests, monitoring checks, API-key rotation notes, and rollback steps before pointing production apps at FreeResend.",
  },
];

export default function LaunchKitPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <nav className="mb-10 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            FreeResend
          </Link>
          <div className="flex items-center gap-4">
            <Link href={sesProductionGuide.productUrl} className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Guide
            </Link>
            <a
              href="https://github.com/eibrahim/freeresend"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              GitHub
            </a>
          </div>
        </nav>

        <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center rounded-full border border-blue-100 bg-white px-3 py-1 text-sm font-medium text-blue-700 shadow-sm">
              Optional {launchKit.price} supporter kit
            </div>
            <h1 className="text-4xl font-bold leading-tight text-gray-900 sm:text-5xl">
              Ship FreeResend without missing the SES and DNS details.
            </h1>
            <p className="mt-5 text-lg leading-8 text-gray-600">
              The open-source FreeResend repo stays MIT-licensed and free to self-host. This launch kit gives you a
              practical checklist for the parts that usually slow down production email rollouts: authentication records,
              SES limits, webhook events, smoke tests, and rollback planning.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={launchKit.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <span>Buy for {launchKit.price}</span>
                <ExternalLink className="h-4 w-4" />
              </a>
              <Link
                href="#included-checklist"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:border-gray-300"
              >
                <span>See what is included</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Stripe checkout redirects to the printable kit after purchase.
            </p>
          </div>

          <div id="included-checklist" className="scroll-mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="border-b border-gray-100 pb-4">
              <p className="text-sm font-medium uppercase tracking-wide text-blue-700">Included checklist</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">{launchKit.name}</h2>
            </div>
            <ul className="mt-6 space-y-4">
              {launchKit.bullets.map((item) => (
                <li key={item} className="flex gap-3 text-gray-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-green-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-16 grid gap-5 md:grid-cols-3">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">{section.copy}</p>
              </div>
            );
          })}
        </section>

        <section className="mt-16 rounded-2xl bg-gray-900 p-8 text-white">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-2xl font-bold">Need implementation help instead of a checklist?</h2>
              <p className="mt-2 text-gray-300">
                Start with a narrow {deploymentReview.price} review of your FreeResend deployment plan before committing
                to custom work.
              </p>
            </div>
            <a
              href={deploymentReview.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-100"
            >
              <span>Book deployment review</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
