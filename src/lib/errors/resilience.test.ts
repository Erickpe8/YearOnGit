import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  AuthenticationError,
  RateLimitError,
  ValidationError,
} from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/codes";
import { sanitizeLogValue } from "@/lib/errors/logger";
import { normalizeError, normalizeGitHubFailure } from "@/lib/errors/normalize";
import { persistWithRollback } from "@/lib/errors/optimistic";
import { createRequestId } from "@/lib/errors/request-id";
import { withRetry } from "@/lib/errors/retry";
import { isUnavailable, isZeroCount } from "@/lib/errors/unavailable";
import { githubGraphql } from "@/lib/github/client";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("error normalization", () => {
  it("keeps null unavailable distinct from a real zero", () => {
    assert.equal(isUnavailable(null), true);
    assert.equal(isUnavailable(0), false);
    assert.equal(isZeroCount(0), true);
    assert.equal(isZeroCount(null), false);
  });

  it("maps invalid GitHub tokens to authentication errors", () => {
    const error = normalizeError(new Error("Bad credentials"), {
      statusCode: 401,
      requestId: "yg_auth",
    });
    assert.equal(error.code, ERROR_CODES.AUTHENTICATION);
    assert.equal(error.retryable, false);
    assert.equal(error.statusCode, 401);
  });

  it("maps GitHub rate limits without treating them as a generic 403", () => {
    const headers = new Headers({
      "x-ratelimit-remaining": "0",
      "retry-after": "2",
    });
    const error = normalizeGitHubFailure({
      status: 403,
      headers,
      bodyText: "API rate limit exceeded",
      requestId: "yg_rate",
    });
    assert.ok(error instanceof RateLimitError);
    assert.equal(error.retryable, false);
    assert.equal(error.retryAfterMs, 2000);
  });

  it("does not retry validation or forbidden errors", () => {
    const validation = new ValidationError({
      message: "bad",
      userMessage: "invalid",
    });
    assert.equal(validation.retryable, false);
    const authz = normalizeError(new Error("Forbidden"), { statusCode: 403 });
    assert.equal(authz.retryable, false);
    assert.equal(authz.code, ERROR_CODES.AUTHORIZATION);
  });

  it("redacts tokens from logs", () => {
    const sanitized = sanitizeLogValue({
      authorization: "Bearer gho_secret",
      token: "gho_secret",
      note: "ok",
    }) as Record<string, unknown>;
    assert.equal(sanitized.authorization, "[redacted]");
    assert.equal(sanitized.token, "[redacted]");
    assert.equal(sanitized.note, "ok");
  });

  it("creates compact request ids", () => {
    const id = createRequestId();
    assert.match(id, /^yg_[a-f0-9]{8}$/);
  });
});

describe("retries", () => {
  it("retries recoverable failures then falls back", async () => {
    let attempts = 0;
    await assert.rejects(
      () =>
        withRetry(async () => {
          attempts += 1;
          throw normalizeError(new Error("bad gateway"), { statusCode: 502 });
        }),
    );
    assert.equal(attempts, 3);
  });

  it("does not retry authentication failures", async () => {
    let attempts = 0;
    await assert.rejects(
      () =>
        withRetry(async () => {
          attempts += 1;
          throw new AuthenticationError({
            message: "revoked",
            userMessage: "reconnect",
            retryAfterMs: 0,
          });
        }),
    );
    assert.equal(attempts, 1);
  });
});

describe("admin persist rollback", () => {
  it("reverts optimistic state when the API fails", async () => {
    let enabled = true;
    const result = await persistWithRollback({
      applyOptimistic: () => {
        enabled = false;
      },
      revert: () => {
        enabled = true;
      },
      persist: async () => {
        throw new Error("endpoint 500");
      },
    });
    assert.equal(result.ok, false);
    assert.equal(enabled, true);
  });
});

function jsonResponse(status: number, body: unknown, headers?: Record<string, string>) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("GitHub GraphQL client", () => {
  it("returns data when GitHub is healthy", async () => {
    globalThis.fetch = (async () =>
      jsonResponse(200, { data: { ok: true } })) as typeof fetch;
    const data = await githubGraphql<{ ok: boolean }>("token", "query");
    assert.equal(data.ok, true);
  });

  it("normalizes GraphQL errors without data", async () => {
    globalThis.fetch = (async () =>
      jsonResponse(200, {
        errors: [{ message: "Something went wrong", type: "INTERNAL" }],
      })) as typeof fetch;
    await assert.rejects(
      () => githubGraphql("token", "query", {}, "yg_gql"),
      (error: unknown) => {
        const app = normalizeError(error);
        return app.code === ERROR_CODES.GITHUB_API || app.statusCode === 502;
      },
    );
  });

  it("detects rate limits from GraphQL", async () => {
    globalThis.fetch = (async () =>
      jsonResponse(200, {
        errors: [{ message: "Wait", type: "RATE_LIMITED" }],
      })) as typeof fetch;
    await assert.rejects(
      () => githubGraphql("token", "query", {}, "yg_rl"),
      (error: unknown) => normalizeError(error) instanceof RateLimitError,
    );
  });

  it("fails once for invalid tokens", async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return jsonResponse(401, { message: "Bad credentials" });
    }) as typeof fetch;
    await assert.rejects(
      () => githubGraphql("token", "query", {}, "yg_401"),
      (error: unknown) => error instanceof AuthenticationError,
    );
    assert.equal(calls, 1);
  });

  it("retries a 503 then succeeds", async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      if (calls < 2) return jsonResponse(503, { message: "unavailable" });
      return jsonResponse(200, { data: { ok: true } });
    }) as typeof fetch;
    const data = await githubGraphql<{ ok: boolean }>(
      "token",
      "query",
      {},
      "yg_503",
    );
    assert.equal(data.ok, true);
    assert.equal(calls, 2);
  });

  it("times out instead of hanging forever", async () => {
    globalThis.fetch = ((_, init) =>
      new Promise((_, reject) => {
        const signal = (init as RequestInit).signal;
        signal?.addEventListener("abort", () => {
          reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
        });
      })) as typeof fetch;
    await assert.rejects(
      () => githubGraphql("token", "query", {}, "yg_to", 20),
      (error: unknown) => normalizeError(error).code === ERROR_CODES.TIMEOUT ||
        normalizeError(error).code === ERROR_CODES.NETWORK,
    );
  });

  it("rejects malformed JSON", async () => {
    globalThis.fetch = (async () =>
      jsonResponse(200, "not-json")) as typeof fetch;
    await assert.rejects(() => githubGraphql("token", "query", {}, "yg_bad"));
  });
});
