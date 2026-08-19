import { AuthenticationError, GitHubGraphQLError } from "@/lib/errors/app-error";
import { logAppEvent } from "@/lib/errors/logger";
import { normalizeError, normalizeGitHubFailure } from "@/lib/errors/normalize";
import { createRequestId } from "@/lib/errors/request-id";
import { withRetry } from "@/lib/errors/retry";

export { GitHubGraphQLError };

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";
const GITHUB_TIMEOUT_MS = 20_000;

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string; type?: string }>;
};

async function githubGraphqlOnce<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
  requestId: string,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(GITHUB_GRAPHQL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    const bodyText = await response.text();
    let body: GraphQLResponse<T> | null = null;
    try {
      body = bodyText ? (JSON.parse(bodyText) as GraphQLResponse<T>) : null;
    } catch {
      throw normalizeGitHubFailure({
        status: response.status || 502,
        headers: response.headers,
        bodyText: "Malformed GitHub response",
        requestId,
      });
    }

    if (response.status === 401) {
      throw new AuthenticationError({
        message: "GitHub token is invalid or expired",
        userMessage: "Your GitHub connection needs attention.",
        statusCode: 401,
        requestId,
      });
    }

    if (!response.ok) {
      throw normalizeGitHubFailure({
        status: response.status,
        headers: response.headers,
        bodyText,
        graphqlErrors: body?.errors,
        requestId,
      });
    }

    if (!body?.data) {
      throw normalizeGitHubFailure({
        status: 502,
        headers: response.headers,
        graphqlErrors: body?.errors,
        bodyText: body?.errors?.[0]?.message ?? "Empty GraphQL response",
        requestId,
      });
    }

    if (body.errors && body.errors.length > 0) {
      logAppEvent("warn", "GitHub GraphQL returned partial errors", {
        requestId,
        endpoint: "github.graphql",
        errorCount: body.errors.length,
      });
    }

    return body.data;
  } catch (error) {
    throw normalizeError(error, { requestId });
  } finally {
    clearTimeout(timer);
  }
}

export async function githubGraphql<T>(
  token: string,
  query: string,
  variables: Record<string, unknown> = {},
  requestId = createRequestId(),
  timeoutMs = GITHUB_TIMEOUT_MS,
): Promise<T> {
  return withRetry(
    () => githubGraphqlOnce<T>(token, query, variables, requestId, timeoutMs),
    { requestId, attempts: 3 },
  );
}
