"use client";

import { ErrorScreen } from "@/components/error/error-screen";
import { AuthSessionProvider } from "@/providers/auth-session-provider";
import { AppProvider } from "@/providers/app-provider";
import "./globals.css";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="h-full dark">
      <body className="min-h-full bg-background text-on-background antialiased">
        <AuthSessionProvider>
          <AppProvider>
            <ErrorScreen code={500} onRetry={reset} />
          </AppProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
