import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, ExternalLink } from "lucide-react";
import { launchKit } from "@/config/launch-kit";

type LaunchKitCtaProps = {
  compact?: boolean;
};

export default function LaunchKitCta({ compact = false }: LaunchKitCtaProps) {
  return (
    <section className={compact ? "rounded-lg border border-blue-100 bg-white p-6 shadow-sm" : "rounded-2xl border border-blue-100 bg-white p-8 shadow-sm"}>
      <div className={compact ? "space-y-5" : "grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center"}>
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            <ClipboardCheck className="h-4 w-4" />
            Optional supporter kit
          </div>
          <h2 className={compact ? "text-2xl font-bold text-gray-900" : "text-3xl font-bold text-gray-900"}>
            Deploy FreeResend with fewer missed setup steps.
          </h2>
          <p className="mt-3 text-gray-600">
            The MIT project remains free. The {launchKit.price} launch kit is an optional checklist for teams that want a tighter
            SES, DNS, webhook, and production rollout path while supporting the project.
          </p>
        </div>

        <div className="space-y-4">
          <ul className="space-y-2 text-sm text-gray-700">
            {launchKit.bullets.slice(0, compact ? 3 : launchKit.bullets.length).map((item) => (
              <li key={item} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-green-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={launchKit.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <span>Buy for {launchKit.price}</span>
              <ExternalLink className="h-4 w-4" />
            </a>
            <Link
              href={launchKit.productUrl}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-5 py-3 font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <span>Preview kit</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
