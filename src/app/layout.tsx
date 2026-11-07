import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Minal AI — Design Packaging with a Real AI Designer",
    template: "%s — Minal AI",
  },
  description:
    "Minal AI is a cloud-based conversational designer for packaging, branding, and product mockups. Four modes: Plan, Sketch, Voice Agent, and Studio. Built by Minal Enterprises.",
  keywords: [
    "Minal AI",
    "AI packaging designer",
    "3D box generator",
    "brand design AI",
    "packaging mockup",
    "Minal Enterprises",
    "voice AI designer",
    "packaging studio",
  ],
  authors: [{ name: "Minal Enterprises" }],
  metadataBase: new URL("https://minalenterprises.org"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Minal AI — Design Packaging with a Real AI Designer",
    description: "Cloud-based AI design harness for packaging & branding. Plan, Sketch, Voice Agent, and Studio modes.",
    url: "https://minalenterprises.org",
    siteName: "Minal AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Minal AI",
    description: "Cloud-based AI design harness for packaging & branding.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
