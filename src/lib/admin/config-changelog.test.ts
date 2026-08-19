import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  describeConfigChanges,
  summarizeConfigChanges,
} from "@/lib/admin/config-changelog";
import { DEFAULT_WRAPPED_CONFIG } from "@/lib/admin/wrapped-config";

describe("config changelog", () => {
  it("describes enabling and disabling Wrapped", () => {
    const off = { ...DEFAULT_WRAPPED_CONFIG, wrappedEnabled: false };
    assert.deepEqual(describeConfigChanges(DEFAULT_WRAPPED_CONFIG, off), [
      `Wrapped ${DEFAULT_WRAPPED_CONFIG.wrappedYear}: activo → inactivo`,
    ]);
    assert.deepEqual(describeConfigChanges(off, DEFAULT_WRAPPED_CONFIG), [
      `Wrapped ${DEFAULT_WRAPPED_CONFIG.wrappedYear}: inactivo → activo`,
    ]);
  });

  it("describes a slide toggle by name", () => {
    const next = {
      ...DEFAULT_WRAPPED_CONFIG,
      slides: DEFAULT_WRAPPED_CONFIG.slides.map((slide) =>
        slide.id === "streak" ? { ...slide, enabled: false } : slide,
      ),
    };
    assert.deepEqual(describeConfigChanges(DEFAULT_WRAPPED_CONFIG, next), [
      "Slide «Racha»: ON → OFF",
    ]);
  });

  it("returns null when nothing changed", () => {
    assert.equal(
      summarizeConfigChanges(DEFAULT_WRAPPED_CONFIG, DEFAULT_WRAPPED_CONFIG),
      null,
    );
  });
});
