import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getLanguageIcon,
  normalizeLanguageName,
} from "@/lib/wrapped/language-icons";

describe("language-icons", () => {
  it("normalizes names", () => {
    assert.equal(normalizeLanguageName("  TypeScript  "), "typescript");
    assert.equal(normalizeLanguageName("Jupyter   Notebook"), "jupyter notebook");
  });

  it("resolves common Linguist names to CDN URLs", () => {
    assert.equal(
      getLanguageIcon("JavaScript"),
      "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/javascript.svg",
    );
    assert.equal(
      getLanguageIcon("C++"),
      "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/cplusplus.svg",
    );
    assert.equal(
      getLanguageIcon("Shell"),
      "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/gnubash.svg",
    );
  });

  it("uses fallbacks for related brands", () => {
    assert.equal(
      getLanguageIcon("Blade"),
      "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/laravel.svg",
    );
  });

  it("returns null for unknown languages", () => {
    assert.equal(getLanguageIcon("TotallyFakeLang"), null);
    assert.equal(getLanguageIcon(""), null);
  });
});
