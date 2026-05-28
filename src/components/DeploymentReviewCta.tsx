import Link from "next/link";
import { ArrowRight, CheckCircle2, ExternalLink, Radar } from "lucide-react";
import { deploymentReview } from "@/config/launch-kit";

type DeploymentReviewCtaProps = {
  compact?: boolean;
};

export default function DeploymentReviewCta({ compact = false }: DeploymentReviewCtaProps) {
  return (
    <section className={compact ? "rounded-lg border border-emerald-100 bg-white p-6 shadow-sm" : "rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm"}>
      <div className={compact ? "space-y-5" : "grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center"}>
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            <Radar className="h-4 w-4" />
            Deployment review
          </div>
          <h2 className={compact ? "text-2xl font-bold text-gray-900" : "text-3xl font-bold text-gray-900"}>
            Want a second set of eyes before you send production email?
          </h2>
          <p className="mt-3 text-gray-600">
            Buy a {deploymentReview.price} manual review for one FreeResend deployment plan. Stripe collects your
            deployment URL or GitHub issue and the main SES/DNS concern; do not send credentials.
          </p>
        </div>

        <div className="space-y-4">
          <ul className="space-y-2 text-sm text-gray-700">
            {deploymentReview.bullets.slice(0, compact ? 3 : deploymentReview.bullets.length).map((item) => (
              <li key={item} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={deploymentReview.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <span>Book review for {deploymentReview.price}</span>
              <ExternalLink className="h-4 w-4" />
            </a>
            <Link
              href={deploymentReview.productUrl}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-5 py-3 font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <span>See scope</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
