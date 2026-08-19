import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/codes";
import { normalizeError } from "@/lib/errors/normalize";
import { createRequestId } from "@/lib/errors/request-id";
import { withRetry } from "@/lib/errors/retry";

const DEFAULT_TIMEOUT_MS = 15_000;

type ApiFailure = {
  success?: false;
  error?:
    | string
    | {
        code?: string;
        message?: string;
        requestId?: string;
        retryable?: boolean;
      };
};

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number; retries?: number },
): Promise<T> {
  const requestId =
    (init?.headers instanceof Headers
      ? init.headers.get("x-request-id")
      : undefined) ?? createRequestId();
  const timeoutMs = init?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return withRetry(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const headers = new Headers(init?.headers);
      headers.set("x-request-id", requestId);
      const response = await fetch(input, {
        ...init,
        headers,
        signal: init?.signal ?? controller.signal,
      });
      const json = (await response.json().catch(() => null)) as
        | (T & ApiFailure)
        | ApiFailure
        | null;
      if (!response.ok || json?.success === false) {
        const envelope = json && typeof json === "object" ? json.error : null;
        const message =
          typeof envelope === "string"
            ? envelope
            : envelope?.message || `Request failed (${response.status})`;
        const code =
          typeof envelope === "object" && envelope?.code
            ? envelope.code
            : undefined;
        throw new AppError({
          code:
            code === "GITHUB_RATE_LIMIT"
              ? ERROR_CODES.RATE_LIMIT
              : response.status === 401
                ? ERROR_CODES.AUTHENTICATION
                : ERROR_CODES.UNKNOWN,
          message,
          userMessage: message,
          statusCode: response.status,
          retryable:
            (typeof envelope === "object" && envelope?.retryable) ||
            [408, 502, 503, 504].includes(response.status),
          requestId:
            (typeof envelope === "object" && envelope?.requestId) || requestId,
        });
      }
      return json as T;
    } catch (error) {
      throw normalizeError(error, {
        requestId,
      });
    } finally {
      clearTimeout(timer);
    }
  }, { requestId, attempts: (init?.retries ?? 0) + 1 });
}
