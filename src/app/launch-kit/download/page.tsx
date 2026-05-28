import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import LaunchKitPrintButton from "@/components/LaunchKitPrintButton";
import { launchKit } from "@/config/launch-kit";

export const metadata: Metadata = {
  title: "FreeResend Launch Kit Checklist",
  description: "Printable FreeResend deployment checklist for SES, DNS, webhooks, monitoring, and rollout validation.",
  robots: {
    index: false,
    follow: false,
  },
};

const groups = [
  {
    title: "1. Preflight",
    items: [
      "Choose the production hostname and confirm HTTPS will terminate before users hit the app.",
      "Create a production PostgreSQL database and test a direct connection from the deployment environment.",
      "Generate strong admin and auth secrets; store them in the platform secret manager, not in the repo.",
      "Confirm the AWS SES region, account sandbox status, and expected monthly sending volume.",
      "Decide whether DNS records will be created manually or through the DigitalOcean API integration.",
    ],
  },
  {
    title: "2. DNS and SES",
    items: [
      "Verify the sender domain in SES before creating application API keys.",
      "Publish SES TXT verification, DKIM CNAME records, SPF, and DMARC records.",
      "Wait for DNS propagation, then use the FreeResend dashboard to re-check domain verification.",
      "Send test messages to at least two external inbox providers and confirm the sender authentication headers pass.",
      "Record the exact production sender addresses that applications are allowed to use.",
    ],
  },
  {
    title: "3. Application rollout",
    items: [
      "Run the production build and confirm `/api/health` returns a healthy response.",
      "Create one production API key per application or environment that will send email.",
      "Update one low-risk application first with `RESEND_BASE_URL` pointing at FreeResend.",
      "Send transactional smoke tests for plain text, HTML, and failure cases before broad rollout.",
      "Keep the prior email provider credentials available until logs show production traffic is stable.",
    ],
  },
  {
    title: "4. Monitoring and rollback",
    items: [
      "Watch SES send, bounce, complaint, and delivery metrics during the first production hour.",
      "Confirm SES webhook events are reaching FreeResend and failed deliveries appear in logs.",
      "Set alerts for elevated bounce or complaint rates before increasing traffic.",
      "Document the rollback variable changes for every application that was migrated.",
      "Rotate any test or leaked API keys after rollout validation is complete.",
    ],
  },
];

export default function LaunchKitDownloadPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900 print:bg-white print:px-0 print:py-0">
      <article className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm print:rounded-none print:p-0 print:shadow-none">
        <header className="border-b border-gray-200 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">FreeResend</p>
              <h1 className="mt-2 text-3xl font-bold">{launchKit.name}</h1>
              <p className="mt-3 max-w-2xl text-gray-600">
                A production checklist for launching the MIT-licensed FreeResend project with Amazon SES, authenticated
                sender domains, webhook events, and safe rollback coverage.
              </p>
            </div>
            <LaunchKitPrintButton />
          </div>
          <p className="mt-5 text-sm text-gray-500 print:hidden">
            Bought the kit? Save this page as a PDF for your deployment runbook. Previewing first is fine too; the paid
            checkout is an optional way to support the project.
          </p>
        </header>

        <div className="mt-8 space-y-8">
          {groups.map((group) => (
            <section key={group.title} className="break-inside-avoid">
              <h2 className="text-xl font-semibold">{group.title}</h2>
              <ul className="mt-4 space-y-3">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded border border-gray-300 print:h-4 print:w-4" />
                    <span className="leading-7">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-10 rounded-xl border border-green-200 bg-green-50 p-5 print:border-gray-300 print:bg-white">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-green-800 print:text-gray-900">
            <CheckCircle2 className="h-5 w-5" />
            Launch complete when
          </h2>
          <p className="mt-2 text-green-900 print:text-gray-800">
            Production applications can send through FreeResend, authenticated headers pass, delivery events are logged,
            and rollback steps are documented for every migrated sender.
          </p>
        </section>

        <footer className="mt-10 border-t border-gray-200 pt-6 text-sm text-gray-500 print:hidden">
          <Link href="/launch-kit" className="font-medium text-blue-700 hover:text-blue-800">
            Back to launch kit
          </Link>
          <span className="mx-2">/</span>
          <a href={launchKit.checkoutUrl} className="font-medium text-blue-700 hover:text-blue-800">
            Buy the optional supporter kit
          </a>
        </footer>
      </article>
    </main>
  );
}
