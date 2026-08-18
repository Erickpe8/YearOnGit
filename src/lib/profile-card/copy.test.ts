import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getProfileCardCopy, profileCardText } from "@/lib/profile-card/copy";
import { parseProfileCardLocale } from "@/lib/profile-card/locale";
import { STATIC_LOCALES } from "@/lib/i18n/supported-locales";

describe("profile card locale", () => {
  it("falls back to English when lang is missing or unknown", () => {
    assert.equal(parseProfileCardLocale(undefined), "en");
    assert.equal(parseProfileCardLocale(null), "en");
    assert.equal(parseProfileCardLocale(""), "en");
    assert.equal(parseProfileCardLocale("xyz"), "en");
    assert.equal(parseProfileCardLocale("ES"), "es");
  });

  it("has copy for every supported locale with English fallback", () => {
    for (const locale of STATIC_LOCALES) {
      const copy = getProfileCardCopy(locale);
      assert.equal(copy.totalContributions.length > 0, true, locale);
      assert.equal(copy.activity.length > 0, true, locale);
      assert.equal(copy.footerLive.includes("{year}"), true, locale);
    }
  });

  it("keeps English labels for English and unknown locales", () => {
    assert.equal(getProfileCardCopy("en").totalContributions, "Total contributions");
    assert.equal(getProfileCardCopy("nope").totalContributions, "Total contributions");
  });

  it("translates Spanish card labels", () => {
    const es = getProfileCardCopy("es");
    assert.equal(es.totalContributions, "Contribuciones totales");
    assert.equal(es.projectOfTheYear, "Proyecto del año");
    assert.equal(es.mostActiveMonth, "Mes más activo");
    assert.equal(es.topLanguage, "Lenguaje principal");
    assert.equal(es.activity, "Actividad");
    assert.equal(es.mostActiveDay, "Día más activo");
    assert.equal(
      profileCardText(es, "footerLive", { year: 2026 }),
      "Este fue tu 2026. ¡Sigue creando!",
    );
  });

  it("translates Portuguese card labels", () => {
    const pt = getProfileCardCopy("pt");
    assert.equal(pt.totalContributions, "Contribuições totais");
    assert.equal(pt.projectOfTheYear, "Projeto do ano");
    assert.equal(pt.activity, "Atividade");
  });
});
