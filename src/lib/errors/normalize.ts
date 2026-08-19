import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  DataUnavailableError,
  GitHubApiError,
  GitHubGraphQLError,
  NetworkError,
  RateLimitError,
  UnknownApplicationError,
  ValidationError,
} from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/codes";

const RATE_LIMIT_RE = /rate limit|RATE_LIMITED|secondary rate|abuse detection/i;
const AUTH_RE = /bad credentials|requires authentication|invalid.*token|expired.*token|revoked/i;
const FORBIDDEN_RE = /forbidden|insufficient.?scope|not allowed|access denied/i;

type GraphQLErrorShape = {
  message?: string;
  type?: string;
};

export function parseRetryAfterMs(headers: Headers | null | undefined): number | undefined {
  if (!headers) return undefined;
  const retryAfter = headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  }
  const reset = headers.get("x-ratelimit-reset");
  if (reset) {
    const resetAt = Number(reset) * 1000;
    if (Number.isFinite(resetAt)) return Math.max(0, resetAt - Date.now());
  }
  return undefined;
}

export function isRateLimitResponse(status: number, headers?: Headers | null, bodyText = "") {
  if (status === 429) return true;
  if (status !== 403) return false;
  const remaining = headers?.get("x-ratelimit-remaining");
  if (remaining === "0") return true;
  return RATE_LIMIT_RE.test(bodyText);
}

export function normalizeError(
  error: unknown,
  extras?: { statusCode?: number; requestId?: string; headers?: Headers; bodyText?: string },
): AppError {
  if (error instanceof AppError) {
    if (extras?.requestId && !error.requestId) {
      return new AppError({
        code: error.code,
        message: error.message,
        userMessage: error.userMessage,
        retryable: error.retryable,
        statusCode: error.statusCode ?? extras.statusCode,
        requestId: extras.requestId,
        retryAfterMs: error.retryAfterMs,
        cause: error,
      });
    }
    return error;
  }

  const requestId = extras?.requestId;
  const status = extras?.statusCode;
  const text = extras?.bodyText ?? (error instanceof Error ? error.message : "");

  if (
    (typeof DOMException !== "undefined" &&
      error instanceof DOMException &&
      error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  ) {
    return new NetworkError({
      message: "Request timed out",
      userMessage: "Couldn't connect. Check your connection and try again.",
      statusCode: 504,
      requestId,
      retryable: true,
      cause: error,
    });
  }

  if (typeof status === "number") {
    if (status === 401 || AUTH_RE.test(text)) {
      return new AuthenticationError({
        message: text || "Authentication required",
        userMessage: "Your GitHub connection needs attention.",
        statusCode: 401,
        requestId,
      });
    }
    if (isRateLimitResponse(status, extras?.headers, text)) {
      return new RateLimitError({
        message: text || "GitHub rate limit",
        userMessage: "GitHub needs a moment.",
        requestId,
        retryAfterMs: parseRetryAfterMs(extras?.headers),
      });
    }
    if (status === 403 || FORBIDDEN_RE.test(text)) {
      return new AuthorizationError({
        message: text || "Forbidden",
        userMessage: "You don't have permission to do that.",
        statusCode: 403,
        requestId,
      });
    }
    if (status === 404) {
      return new DataUnavailableError({
        message: text || "Not found",
        userMessage: "We couldn't find that.",
        statusCode: 404,
        retryable: false,
        requestId,
      });
    }
    if (status === 400 || status === 422) {
      return new ValidationError({
        message: text || "Invalid request",
        userMessage: "That request didn't look valid.",
        statusCode: status,
        requestId,
      });
    }
    if ([408, 502, 503, 504].includes(status)) {
      return new NetworkError({
        message: text || `HTTP ${status}`,
        userMessage: "Couldn't connect. Check your connection and try again.",
        statusCode: status,
        requestId,
        retryable: true,
      });
    }
    if (status >= 500) {
      return new GitHubApiError({
        message: text || `HTTP ${status}`,
        userMessage: "Something broke. Try again shortly.",
        statusCode: status,
        requestId,
        retryable: true,
      });
    }
  }

  if (error instanceof TypeError && /fetch|network|failed/i.test(error.message)) {
    return new NetworkError({
      message: error.message,
      userMessage: "Couldn't connect. Check your connection and try again.",
      requestId,
      cause: error,
    });
  }

  const message = error instanceof Error ? error.message : "Unexpected error";
  return new UnknownApplicationError({
    message,
    userMessage: "Something went wrong. Try again.",
    requestId,
    statusCode: status,
    cause: error,
  });
}

export function normalizeGitHubFailure(input: {
  status: number;
  headers?: Headers;
  bodyText?: string;
  graphqlErrors?: GraphQLErrorShape[];
  requestId?: string;
}): AppError {
  const joined = [
    input.bodyText,
    ...(input.graphqlErrors ?? []).map((item) => item.message ?? ""),
    ...(input.graphqlErrors ?? []).map((item) => item.type ?? ""),
  ]
    .filter(Boolean)
    .join(" ");

  const graphqlType = input.graphqlErrors?.[0]?.type;
  if (graphqlType === "RATE_LIMITED" || isRateLimitResponse(input.status, input.headers, joined)) {
    return new RateLimitError({
      message: joined || "GitHub rate limit",
      userMessage: "GitHub needs a moment.",
      requestId: input.requestId,
      retryAfterMs: parseRetryAfterMs(input.headers),
    });
  }
  if (graphqlType === "INSUFFICIENT_SCOPES" || graphqlType === "FORBIDDEN") {
    return new AuthorizationError({
      message: joined || "GitHub access denied",
      userMessage: "Your GitHub connection needs attention.",
      statusCode: 403,
      requestId: input.requestId,
    });
  }
  return normalizeError(new GitHubGraphQLError(joined || "GitHub API request failed", input.status), {
    statusCode: input.status,
    headers: input.headers,
    bodyText: joined,
    requestId: input.requestId,
  });
}

export function isRetryableStatus(status: number): boolean {
  return [408, 502, 503, 504].includes(status);
}

export { ERROR_CODES };
