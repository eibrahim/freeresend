import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Deployment Review Received",
  description: "Confirmation page for the FreeResend Deployment Review.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DeploymentReviewThanksPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-16 sm:px-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Your deployment review is in the queue.</h1>
          <p className="mt-4 leading-7 text-gray-600">
            The review will use the deployment URL, GitHub issue, and concern you entered in Stripe checkout. Expect a
            concise written review focused on DNS authentication, SES readiness, webhook coverage, and launch risks.
          </p>
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Do not send credentials. If more context is needed, share sanitized config snippets or a public/private GitHub
            issue link through the same email used at checkout.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/deployment-review"
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-5 py-3 font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              Review scope
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Back to FreeResend
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
