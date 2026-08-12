import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
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

export const metadata: Metadata = {
  title: "YearOnGit | Your GitHub Wrapped",
  description:
    "Discover your commits, top repos, languages and more. Your year on GitHub, wrapped.",
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
