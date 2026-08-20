"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { PageShell } from "@/components/layout/page-shell";
import { IconArrowLeft } from "@/components/ui/icons";
import type { TranslationKey } from "@/lib/i18n/translations";
import { useViewI18n } from "@/lib/i18n/use-view-i18n";
import { useApp } from "@/providers/app-provider";

const HOW_STEPS: Array<{
  title: TranslationKey;
  body: TranslationKey;
}> = [
  { title: "landingHowStep1Title", body: "landingHowStep1Body" },
  { title: "landingHowStep2Title", body: "landingHowStep2Body" },
  { title: "landingHowStep3Title", body: "landingHowStep3Body" },
];

export function HowItWorksPage() {
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
          <h1 className="i18n-text mb-2 font-display text-2xl font-extrabold text-on-surface max-[390px]:text-xl md:text-3xl">
            {t("landingHowTitle")}
          </h1>
          <p className="i18n-text max-w-2xl text-sm leading-relaxed text-on-surface-variant">
            {t("landingHowIntro")}
          </p>
        </header>

        <ol className="grid gap-3 md:grid-cols-3">
          {HOW_STEPS.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
            >
              <p className="mb-1.5 font-display text-xs font-bold uppercase tracking-wide text-primary">
                {t("landingHowStepLabel", { step: index + 1 })}
              </p>
              <h2 className="i18n-text mb-1.5 font-display text-base font-bold text-on-surface md:text-lg">
                {t(step.title)}
              </h2>
              <p className="i18n-text text-sm leading-relaxed text-on-surface-variant">
                {t(step.body)}
              </p>
            </li>
          ))}
        </ol>
      </main>
    </PageShell>
  );
}
