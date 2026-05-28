import type { Metadata } from "next";
import Link from "next/link";
import EmailDnsChecker from "@/components/EmailDnsChecker";
import { deploymentReview, launchKit, sesProductionGuide } from "@/config/launch-kit";

export const metadata: Metadata = {
  title: "Email DNS Readiness Checker",
  description:
    "Check SPF, DMARC, DKIM, and MX records before launching a FreeResend or Amazon SES sending domain.",
  openGraph: {
    title: "Email DNS Readiness Checker",
    description: "Run a quick public DNS check before moving an SES sending domain into production.",
    url: "https://www.freeresend.com/tools/email-dns-checker",
    type: "website",
  },
};

export default function EmailDnsCheckerPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm font-semibold text-gray-700 hover:text-gray-950">
            FreeResend
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href={launchKit.productUrl} className="text-gray-600 hover:text-gray-950">
              Launch Kit
            </Link>
            <Link href={sesProductionGuide.productUrl} className="text-gray-600 hover:text-gray-950">
              Guide
            </Link>
            <Link href={deploymentReview.productUrl} className="text-gray-600 hover:text-gray-950">
              Review
            </Link>
          </div>
        </nav>
      </div>
      <EmailDnsChecker />
    </main>
  );
}
