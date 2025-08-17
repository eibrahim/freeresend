import { Metadata } from 'next';
import Link from 'next/link';
import PricingCalculator from '../../components/PricingCalculator';

export const metadata: Metadata = {
  title: 'Pricing Calculator - FreeResend',
  description: 'Compare Resend vs FreeResend pricing for your email volume. See how much you can save with self-hosted email infrastructure.',
  openGraph: {
    title: 'Pricing Calculator - FreeResend',
    description: 'Compare Resend vs FreeResend pricing for your email volume. See how much you can save with self-hosted email infrastructure.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing Calculator - FreeResend',
    description: 'Compare Resend vs FreeResend pricing for your email volume. See how much you can save with self-hosted email infrastructure.',
  },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Pricing <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Calculator</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Compare Resend vs FreeResend costs for your email volume. 
            See exactly how much you can save with self-hosted email infrastructure.
          </p>
        </div>

        {/* Pricing Calculator */}
        <PricingCalculator />

        {/* Key Benefits */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Up to 85% Savings
            </h3>
            <p className="text-gray-600">
              Pay Amazon SES rates instead of premium pricing. Save hundreds annually.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              One-Line Migration
            </h3>
            <p className="text-gray-600">
              Just update your environment variable. Zero code changes required.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏠</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Complete Control
            </h3>
            <p className="text-gray-600">
              Self-hosted solution with your own AWS infrastructure and domain.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Saving?
          </h2>
          <p className="text-xl text-blue-100 mb-6">
            Get started with FreeResend in under 5 minutes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
            >
              Try FreeResend Free
            </Link>
            <a
              href="https://github.com/eibrahim/freeresend"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-semibold"
            >
              View Documentation
            </a>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-16 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Resend Pricing Tiers
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>0 - 3,000 emails</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="flex justify-between">
                  <span>3,001 - 50,000 emails</span>
                  <span className="font-medium">$20/month</span>
                </div>
                <div className="flex justify-between">
                  <span>50,001 - 100,000 emails</span>
                  <span className="font-medium">$35/month</span>
                </div>
                <div className="flex justify-between">
                  <span>100,001 - 200,000 emails</span>
                  <span className="font-medium">$160/month</span>
                </div>
                <div className="flex justify-between">
                  <span>200,001+ emails</span>
                  <span className="font-medium">$350+ /month</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                FreeResend Formula
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <code className="text-sm text-gray-800 block mb-2">
                  Total Cost = Flat Fee + (Volume ÷ 1,000) × SES Rate
                </code>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>• Flat Fee: $5/month (hosting & features)</div>
                  <div>• SES Rate: $0.10 per 1,000 emails</div>
                  <div>• Linear pricing (no tier jumps)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Why is FreeResend cheaper?
                </h3>
                <p className="text-gray-600 text-sm">
                  FreeResend uses your own Amazon SES account, eliminating markup. 
                  You pay AWS rates directly plus a small flat fee for the service.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Is it really 100% compatible?
                </h3>
                <p className="text-gray-600 text-sm">
                  Yes! Just change your RESEND_BASE_URL environment variable. 
                  Your existing Resend SDK code works unchanged.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What about deliverability?
                </h3>
                <p className="text-gray-600 text-sm">
                  FreeResend uses Amazon SES, which has excellent deliverability. 
                  You get the same infrastructure as major email services.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Do I need AWS experience?
                </h3>
                <p className="text-gray-600 text-sm">
                  No! FreeResend handles SES setup automatically, including 
                  domain verification and DKIM configuration.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What about support?
                </h3>
                <p className="text-gray-600 text-sm">
                  FreeResend is open source with community support. 
                  Enterprise support available through EliteCoders.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can I self-host it?
                </h3>
                <p className="text-gray-600 text-small">
                  Absolutely! FreeResend is designed for self-hosting with Docker, 
                  Vercel, or any Node.js hosting platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}