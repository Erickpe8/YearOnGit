const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

export class GitHubGraphQLError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "GitHubGraphQLError";
    this.status = status;
  }
}

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string; type?: string }>;
};

export async function githubGraphql<T>(
  token: string,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 401) {
    throw new GitHubGraphQLError("GitHub token is invalid or expired", 401);
  }

  if (response.status === 403) {
    throw new GitHubGraphQLError("GitHub rate limit or access denied", 429);
  }

  if (!response.ok) {
    throw new GitHubGraphQLError("GitHub API request failed", 502);
  }

  const body = (await response.json()) as GraphQLResponse<T>;
  const messages = (body.errors ?? [])
    .map((error) => error.message)
    .filter(Boolean);

  if (!body.data) {
    throw new GitHubGraphQLError(
      messages[0] ?? "Empty GraphQL response",
      502,
    );
  }

  if (messages.length > 0) {
    console.warn("[githubGraphql] partial errors:", messages.join(" | "));
  }

  return body.data;
}
