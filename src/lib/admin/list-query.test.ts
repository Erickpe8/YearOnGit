import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchesSearch, paginate } from "@/lib/admin/list-query";
import { DEFAULT_WRAPPED_CONFIG } from "@/lib/admin/wrapped-config";
import { listSlides } from "@/lib/admin/catalog-lists";

describe("admin list pagination", () => {
  it("pages from the server collection instead of returning everything", () => {
    const items = Array.from({ length: 25 }, (_, index) => index + 1);
    const page = paginate(items, 2, 10);
    assert.deepEqual(page.items, [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    assert.equal(page.total, 25);
    assert.equal(page.from, 11);
    assert.equal(page.to, 20);
  });

  it("filters slides by search and status before paging", () => {
    const config = {
      ...DEFAULT_WRAPPED_CONFIG,
      slides: DEFAULT_WRAPPED_CONFIG.slides.map((slide, index) => ({
        ...slide,
        enabled: index % 2 === 0,
      })),
    };
    const inactive = listSlides(config, "intro", "inactive", 1, 10);
    assert.equal(inactive.total, 0);
    const active = listSlides(config, "intro", "active", 1, 10);
    assert.equal(active.total, 1);
    assert.equal(active.items[0]?.id, "overview");
  });

  it("matches search case-insensitively", () => {
    assert.equal(matchesSearch("Year on Git", "year"), true);
    assert.equal(matchesSearch("Year on Git", "xyz"), false);
  });
});
