import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getErrorPage,
  isErrorStatusCode,
  parseErrorStatusCode,
} from "@/lib/errors/catalog";

describe("error catalog", () => {
  it("maps known codes without duplicating pages", () => {
    const page = getErrorPage(404);
    assert.equal(page.statusCode, 404);
    assert.equal(page.mood, "search");
    assert.equal(page.primaryAction, "home");
    assert.equal(page.secondaryAction, "back");
  });

  it("keeps unknown 5xx codes on the shared unknown template", () => {
    const page = getErrorPage(567);
    assert.equal(page.statusCode, 567);
    assert.equal(page.titleKey, "errorUnknownTitle");
  });

  it("falls back to 404 for invalid codes", () => {
    assert.equal(parseErrorStatusCode("nope"), 404);
    assert.equal(isErrorStatusCode(404), true);
    assert.equal(isErrorStatusCode(399), false);
  });
});
