import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FreeResend - Self-hosted Email Service | 85% Cost Savings",
  description:
    "Open-source, self-hosted alternative to Resend. 100% API compatible with 85% cost savings using Amazon SES. Drop-in replacement with auto DNS setup.",
  keywords: "resend alternative, self-hosted email, amazon ses, transactional email, email api, open source",
  authors: [{ name: "Emad Ibrahim", url: "https://x.com/eibrahim" }],
  creator: "Emad Ibrahim",
  openGraph: {
    title: "FreeResend - Self-hosted Alternative to Resend",
    description: "100% API compatible • 85% cost savings • Complete control over your email infrastructure",
    url: "https://freeresend.com",
    siteName: "FreeResend",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FreeResend - Self-hosted Alternative to Resend",
    description: "100% API compatible • 85% cost savings • Complete control over your email infrastructure",
    creator: "@eibrahim",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
