import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildLanguagesModule } from "@/lib/wrapped/modules/compose";
import type { GitHubCommitRepoEntry } from "@/lib/wrapped/types";

function repo(
  languages: GitHubCommitRepoEntry["repository"]["languages"],
): GitHubCommitRepoEntry {
  return {
    contributions: { totalCount: 1 },
    repository: {
      name: "app",
      nameWithOwner: "acme/app",
      isPrivate: false,
      owner: { __typename: "User", login: "acme" },
      languages,
    },
  };
}

describe("language availability", () => {
  it("treats an empty language list as a real zero, not unavailable", () => {
    const module = buildLanguagesModule([
      repo({ edges: [] }),
    ]);
    assert.equal(module.available, true);
    assert.equal(module.languageCount, 0);
  });

  it("marks languages unavailable when every repo payload is null", () => {
    const module = buildLanguagesModule([repo(null), repo(null)]);
    assert.equal(module.available, false);
    assert.equal(module.languageCount, 0);
    assert.deepEqual(module.languages, []);
  });
});
