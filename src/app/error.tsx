"use client";

import { ErrorScreen } from "@/components/error/error-screen";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorScreen code={500} onRetry={reset} />;
}
