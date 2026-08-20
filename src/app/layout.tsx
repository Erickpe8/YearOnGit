import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import { getAppBaseUrl } from "@/lib/app-url";
import { brandAssets, brandName } from "@/lib/brand/assets";
import { SEO_PAGES } from "@/lib/seo/pages";
import { AppProvider } from "@/providers/app-provider";
import { AuthSessionProviderServer } from "@/providers/auth-session-provider-server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const gscVerification = process.env.NEXT_PUBLIC_GSC_VERIFICATION?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(getAppBaseUrl()),
  title: {
    default: `${SEO_PAGES.landing.title} | ${brandName}`,
    template: `%s | ${brandName}`,
  },
  description: SEO_PAGES.landing.description,
  applicationName: brandName,
  openGraph: {
    title: `${SEO_PAGES.landing.title} | ${brandName}`,
    description: SEO_PAGES.landing.description,
    siteName: brandName,
    type: "website",
    images: [
      {
        url: brandAssets.og,
        alt: "YearOnGit Open Graph — GitHub Wrapped preview card",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SEO_PAGES.landing.title} | ${brandName}`,
    description: SEO_PAGES.landing.description,
    images: [brandAssets.og],
  },
  verification: gscVerification
    ? { google: gscVerification }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${inter.variable} h-full dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-on-background antialiased">
        <AuthSessionProviderServer>
          <AppProvider>{children}</AppProvider>
        </AuthSessionProviderServer>
      </body>
    </html>
  );
}
