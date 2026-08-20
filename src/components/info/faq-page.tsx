"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { PageShell } from "@/components/layout/page-shell";
import { IconArrowLeft } from "@/components/ui/icons";
import type { TranslationKey } from "@/lib/i18n/translations";
import { useViewI18n } from "@/lib/i18n/use-view-i18n";
import { useApp } from "@/providers/app-provider";

const FAQ_ITEMS: Array<{ q: TranslationKey; a: TranslationKey }> = [
  { q: "landingFaq1Q", a: "landingFaq1A" },
  { q: "landingFaq2Q", a: "landingFaq2A" },
  { q: "landingFaq3Q", a: "landingFaq3A" },
  { q: "landingFaq4Q", a: "landingFaq4A" },
  { q: "landingFaq5Q", a: "landingFaq5A" },
];

const DISCUSSIONS_QA_URL =
  "https://github.com/Erickpe8/YearOnGit/discussions/categories/q-a-preguntas";

export function FaqPage() {
  useViewI18n("info");
  const { t } = useApp();

  return (
    <PageShell footerCompact fitContent>
      <main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-6 max-[390px]:px-3 max-[390px]:py-5 md:px-8 md:py-8">
        <Link
          href="/"
          className="group mb-5 inline-flex items-center gap-3 font-display text-sm text-on-surface-variant transition-colors hover:text-primary"
        >
          <IconArrowLeft className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
          <BrandLogo href={null} className="opacity-90 transition-opacity group-hover:opacity-100" />
        </Link>

        <header className="mb-5 border-b border-white/8 pb-4">
          <h1 className="i18n-text font-display text-2xl font-extrabold text-on-surface max-[390px]:text-xl md:text-3xl">
            {t("landingFaqTitle")}
          </h1>
        </header>

        <div className="space-y-2.5">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3.5 open:bg-white/[0.05]"
            >
              <summary className="i18n-text cursor-pointer list-none font-display text-sm font-bold text-on-surface marker:content-none md:text-[15px] [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-3">
                  {t(item.q)}
                  <span
                    aria-hidden
                    className="text-on-surface-variant transition group-open:rotate-45"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="i18n-text mt-2.5 text-sm leading-relaxed text-on-surface-variant">
                {t(item.a)}
              </p>
              {item.q === "landingFaq5Q" ? (
                <p className="mt-2.5">
                  <Link
                    href="/privacy"
                    className="i18n-label font-display text-xs font-bold uppercase text-primary hover:underline"
                  >
                    {t("privacy")}
                  </Link>
                </p>
              ) : null}
            </details>
          ))}

          <aside className="rounded-2xl border border-primary/25 bg-primary/5 px-4 py-4">
            <h2 className="i18n-text font-display text-sm font-bold text-on-surface md:text-[15px]">
              {t("landingFaqMoreTitle")}
            </h2>
            <p className="i18n-text mt-2 text-sm leading-relaxed text-on-surface-variant">
              {t("landingFaqMoreBody")}
            </p>
            <a
              href={DISCUSSIONS_QA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-3 inline-flex items-center justify-center rounded-full px-4 py-2 font-display text-xs font-bold text-white"
            >
              {t("landingFaqMoreCta")}
            </a>
          </aside>
        </div>
      </main>
    </PageShell>
  );
}
