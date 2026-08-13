import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { interpolate } from "@/lib/i18n/interpolate";
import { translations } from "@/lib/i18n/translations";

describe("i18n interpolate", () => {
  it("replaces placeholders in English templates", () => {
    assert.equal(
      interpolate(translations.en.activeRepositoriesCount, { count: 10 }),
      "10 active repositories",
    );
    assert.equal(
      interpolate(translations.en.languageCount, { count: 7 }),
      "7 languages detected",
    );
    assert.equal(
      interpolate(translations.en.streakDaysLabel, { count: 31 }),
      "31-day streak",
    );
    assert.equal(
      interpolate(translations.en.contributions2026, { count: 1842 }),
      "1842 contributions in 2026",
    );
    assert.equal(
      interpolate(translations.en.welcomeBack, { name: "octocat" }),
      "Welcome back, @octocat",
    );
  });

  it("replaces placeholders in Spanish templates", () => {
    assert.equal(
      interpolate(translations.es.activeRepositoriesCount, { count: 10 }),
      "10 repositorios activos",
    );
    assert.equal(
      interpolate(translations.es.languageCount, { count: 7 }),
      "7 lenguajes detectados",
    );
    assert.equal(
      interpolate(translations.es.streakDaysLabel, { count: 31 }),
      "Racha de 31 días",
    );
    assert.equal(
      interpolate(translations.es.privateRepositories, { count: 3 }),
      "3 repositorios privados",
    );
    assert.equal(
      interpolate(translations.es.weekdayActivity, { percent: 82 }),
      "El 82% de tus contribuciones fue entre semana",
    );
  });

  it("never leaves {count} behind when count is provided", () => {
    for (const locale of ["en", "es"] as const) {
      const keys = Object.entries(translations[locale]).filter(([, value]) =>
        value.includes("{count}"),
      );

      for (const [key, template] of keys) {
        const result = interpolate(template, { count: 42 });
        assert.equal(
          result.includes("{count}"),
          false,
          `${locale}.${key} still contains {count}: ${result}`,
        );
        assert.equal(result.includes("42"), true, `${locale}.${key}: ${result}`);
      }
    }
  });

  it("uses label form for activeRepositories without placeholders", () => {
    assert.equal(translations.en.activeRepositories.includes("{"), false);
    assert.equal(translations.es.activeRepositories.includes("{"), false);
    assert.equal(translations.es.activeRepositories, "Repositorios activos");
  });
});
