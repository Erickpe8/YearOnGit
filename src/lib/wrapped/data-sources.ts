export const REPOSITORY_QUERY_LIMIT = 100;
export const OWNED_REPO_SAMPLE = 50;
export const SOCIAL_PAGE_SIZE = 100;
export const SOCIAL_MAX_PAGES = 5;
export const BY_REPO_LIMIT = 100;
export const TOPIC_SAMPLE_LIMIT = 20;

export const CONTRIBUTION_TYPE_KEYS = [
  "commits",
  "pullRequests",
  "issues",
  "codeReviews",
] as const;

export type ContributionTypeKey = (typeof CONTRIBUTION_TYPE_KEYS)[number];
