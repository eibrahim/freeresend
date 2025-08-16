"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Code, 
  DollarSign, 
  Globe, 
  Shield, 
  Star, 
  Zap,
  Github,
  Copy,
  CheckCircle
} from "lucide-react";
import EnvelopeIcon from "./EnvelopeIcon";

export default function LandingPage() {
  const [copiedCode, setCopiedCode] = useState(false);

  const copyCodeSnippet = () => {
    navigator.clipboard.writeText(`RESEND_BASE_URL="https://freeresend.com/api"`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <EnvelopeIcon className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FreeResend
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/eibrahim/freeresend"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Github className="h-5 w-5" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
              <Link
                href="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
              🎉 Now Open Source • MIT License
            </div>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            The <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Self-Hosted</span>
            <br />
            Alternative to Resend
          </h2>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            100% API compatible • 85% cost savings • Complete control over your email infrastructure
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/login"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 font-semibold"
            >
              <span>Start Free</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="https://github.com/eibrahim/freeresend"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-lg hover:border-gray-300 transition-colors flex items-center justify-center space-x-2 font-semibold"
            >
              <Github className="h-5 w-5" />
              <span>View on GitHub</span>
            </a>
          </div>

          {/* Migration Code Example */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-900 rounded-lg p-6 text-left">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm">Migration is literally one line:</span>
                <button
                  onClick={copyCodeSnippet}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {copiedCode ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <code className="text-green-400 font-mono text-sm block">
                RESEND_BASE_URL=&quot;https://freeresend.com/api&quot;
              </code>
              <p className="text-gray-400 text-sm mt-2">
                That&apos;s it. Your existing Resend code works unchanged.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose FreeResend?
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get all the benefits of premium email services without the premium price tag
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">85% Cost Savings</h4>
              <p className="text-gray-600 leading-relaxed">
                Pay Amazon SES rates ($0.10/1k emails) instead of premium pricing. Save hundreds annually across multiple projects.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Code className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Drop-in Compatible</h4>
              <p className="text-gray-600 leading-relaxed">
                100% API compatibility with Resend. Zero code changes required - just update your environment variable.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Lightning Setup</h4>
              <p className="text-gray-600 leading-relaxed">
                Auto-creates DNS records with Digital Ocean. From domain to sending emails in under 60 seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h3>
            <p className="text-lg text-gray-600">
              Production-ready features for modern email infrastructure
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Enterprise Security",
                description: "DKIM signing, SPF, DMARC, and full AWS security compliance"
              },
              {
                icon: <Globe className="h-6 w-6" />,
                title: "Multi-Domain Support",
                description: "Manage unlimited domains with automatic verification and setup"
              },
              {
                icon: <Star className="h-6 w-6" />,
                title: "Email Analytics",
                description: "Comprehensive logging, delivery tracking, and performance metrics"
              },
              {
                icon: <Code className="h-6 w-6" />,
                title: "API-First Design",
                description: "RESTful APIs with comprehensive documentation and SDK compatibility"
              },
              {
                icon: <Zap className="h-6 w-6" />,
                title: "Webhook Support",
                description: "Real-time event notifications for bounces, complaints, and delivery"
              },
              {
                icon: <Github className="h-6 w-6" />,
                title: "Open Source",
                description: "MIT licensed, community-driven, and fully customizable"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-blue-600">{feature.icon}</div>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              FreeResend vs. Premium Services
            </h3>
            <p className="text-lg text-gray-600">
              Get the same features at a fraction of the cost
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">FreeResend</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Premium Services</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    {
                      feature: "Cost per 1,000 emails",
                      freeresend: "$0.10 (SES rates)",
                      premium: "$1.00 - $2.00+"
                    },
                    {
                      feature: "API Compatibility",
                      freeresend: "100% Resend compatible",
                      premium: "Proprietary APIs"
                    },
                    {
                      feature: "Domain Setup Time",
                      freeresend: "< 60 seconds (auto)",
                      premium: "15+ minutes (manual)"
                    },
                    {
                      feature: "Self-Hosted",
                      freeresend: "✓ Full control",
                      premium: "✗ Vendor lock-in"
                    },
                    {
                      feature: "Open Source",
                      freeresend: "✓ MIT License",
                      premium: "✗ Proprietary"
                    },
                    {
                      feature: "Custom Modifications",
                      freeresend: "✓ Unlimited",
                      premium: "✗ Limited"
                    }
                  ].map((row, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.feature}</td>
                      <td className="px-6 py-4 text-sm text-center text-green-600 font-semibold">{row.freeresend}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-500">{row.premium}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Take Control of Your Email Infrastructure?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Join developers already saving money with FreeResend
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2 font-semibold"
            >
              <span>Start Free Today</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="https://github.com/eibrahim/freeresend"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-blue-600 transition-colors flex items-center justify-center space-x-2 font-semibold"
            >
              <Github className="h-5 w-5" />
              <span>View Documentation</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <EnvelopeIcon className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-xl font-bold">FreeResend</h4>
              </div>
              <p className="text-gray-400">
                Open-source, self-hosted email service compatible with Resend.
              </p>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Resources</h5>
              <ul className="space-y-2">
                <li><a href="https://github.com/eibrahim/freeresend" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="https://github.com/eibrahim/freeresend" className="text-gray-400 hover:text-white transition-colors">GitHub</a></li>
                <li><a href="https://github.com/eibrahim/freeresend/issues" className="text-gray-400 hover:text-white transition-colors">Issues</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Community</h5>
              <ul className="space-y-2">
                <li><a href="https://github.com/eibrahim/freeresend/discussions" className="text-gray-400 hover:text-white transition-colors">Discussions</a></li>
                <li><a href="https://github.com/eibrahim/freeresend/blob/main/CONTRIBUTING.md" className="text-gray-400 hover:text-white transition-colors">Contributing</a></li>
                <li><a href="https://x.com/eibrahim" className="text-gray-400 hover:text-white transition-colors">Twitter</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Legal</h5>
              <ul className="space-y-2">
                <li><a href="https://github.com/eibrahim/freeresend/blob/main/LICENSE" className="text-gray-400 hover:text-white transition-colors">MIT License</a></li>
                <li><a href="https://x.com/eibrahim" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              Built by <a href="https://x.com/eibrahim" className="text-blue-400 hover:text-blue-300">@eibrahim</a> • MIT Licensed • Made with ❤️ for developers
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}