import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildProfileCardMarkdown,
  buildProfileCardUrl,
  isValidProfileUsername,
  normalizeProfileUsername,
  toProfileUsernameKey,
} from "@/lib/profile-card/urls";
import { isProfileCardStale } from "@/lib/profile-card/freshness";
import { PROFILE_CARD_TTL_MS } from "@/lib/profile-card/constants";
import {
  canRefreshProfileCardYear,
  isWrappedYearClosed,
  normalizeCardYear,
} from "@/lib/profile-card/year-scope";

describe("profile card urls", () => {
  it("normalizes username and .png suffix", () => {
    assert.equal(normalizeProfileUsername("@Erickpe8.png"), "Erickpe8");
    assert.equal(toProfileUsernameKey("Erickpe8"), "erickpe8");
    assert.equal(isValidProfileUsername("Erickpe8"), true);
    assert.equal(isValidProfileUsername("../etc"), false);
  });

  it("builds a stable year-scoped card URL", () => {
    assert.equal(
      buildProfileCardUrl("Erickpe8", 2026, "https://yearongit.com"),
      "https://yearongit.com/cards/Erickpe8/2026.png?lang=en",
    );
    assert.equal(
      buildProfileCardUrl("Erickpe8", 2026, "https://yearongit.com", "es"),
      "https://yearongit.com/cards/Erickpe8/2026.png?lang=es",
    );
  });

  it("builds README markdown with year card + optional share link", () => {
    assert.equal(
      buildProfileCardMarkdown({
        username: "Erickpe8",
        year: 2026,
        shareSlug: "8f4b9b2e",
        baseUrl: "https://yearongit.com",
      }),
      "[![@Erickpe8's Year on Git 2026](https://yearongit.com/cards/Erickpe8/2026.png?lang=en)](https://yearongit.com/share/8f4b9b2e)",
    );
    assert.equal(
      buildProfileCardMarkdown({
        username: "Erickpe8",
        year: 2026,
        shareSlug: "8f4b9b2e",
        baseUrl: "https://yearongit.com",
        locale: "es",
      }),
      "[![Year on Git 2026 de @Erickpe8](https://yearongit.com/cards/Erickpe8/2026.png?lang=es)](https://yearongit.com/share/8f4b9b2e)",
    );
  });
});

describe("profile card year scope", () => {
  it("parses year from route segment including .png", () => {
    assert.equal(normalizeCardYear("2026.png"), 2026);
    assert.equal(normalizeCardYear("2026"), 2026);
    assert.equal(normalizeCardYear("nope"), null);
  });

  it("allows refresh only while the Wrapped year is in progress", () => {
    assert.equal(
      canRefreshProfileCardYear(2026, new Date("2026-08-16T12:00:00.000Z")),
      true,
    );
    assert.equal(
      canRefreshProfileCardYear(2026, new Date("2027-01-01T00:00:00.000Z")),
      false,
    );
    assert.equal(
      isWrappedYearClosed(2026, new Date("2027-01-01T00:00:00.000Z")),
      true,
    );
    assert.equal(
      isWrappedYearClosed(2026, new Date("2026-12-31T23:59:59.999Z")),
      false,
    );
  });
});

describe("profile card staleness", () => {
  it("marks cards older than 24h as stale", () => {
    const now = new Date("2026-08-17T12:00:00.000Z");
    const fresh = new Date(now.getTime() - PROFILE_CARD_TTL_MS + 1_000);
    const stale = new Date(now.getTime() - PROFILE_CARD_TTL_MS - 1_000);
    assert.equal(isProfileCardStale(fresh, now), false);
    assert.equal(isProfileCardStale(stale, now), true);
  });
});
