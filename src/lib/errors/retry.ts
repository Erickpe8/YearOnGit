import { isAppError } from "@/lib/errors/app-error";
import { normalizeError } from "@/lib/errors/normalize";

const MAX_ATTEMPTS = 3;

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function withRetry<T>(
  run: () => Promise<T>,
  options?: {
    attempts?: number;
    requestId?: string;
  },
): Promise<T> {
  const attempts = Math.min(options?.attempts ?? MAX_ATTEMPTS, MAX_ATTEMPTS);
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      const appError = isAppError(error)
        ? error
        : normalizeError(error, { requestId: options?.requestId });
      const canRetry = appError.retryable && attempt < attempts;
      if (!canRetry) throw appError;
      const backoff = appError.retryAfterMs ?? 250 * 2 ** (attempt - 1);
      await wait(Math.min(backoff, 4_000));
    }
  }

  throw normalizeError(lastError, { requestId: options?.requestId });
}

export function isRetryableError(error: unknown): boolean {
  const appError = isAppError(error) ? error : normalizeError(error);
  return appError.retryable;
}
