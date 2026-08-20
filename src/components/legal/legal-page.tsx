"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { PageShell } from "@/components/layout/page-shell";
import { IconArrowLeft } from "@/components/ui/icons";
import {
  getLegalDocument,
  type LegalPageType,
} from "@/lib/legal/content";
import { useApp } from "@/providers/app-provider";

type LegalPageProps = {
  type: LegalPageType;
};

export function LegalPage({ type }: LegalPageProps) {
  const { locale, t } = useApp();
  const document = getLegalDocument(locale, type);
  const otherType = type === "privacy" ? "terms" : "privacy";

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

        <article className="glass-card rounded-2xl p-5 max-[390px]:p-4 md:p-8">
          <header className="mb-5 border-b border-white/8 pb-4">
            <p className="i18n-label mb-2 font-display text-xs font-bold uppercase text-primary">
              {type === "privacy" ? t("privacy") : t("terms")}
            </p>
            <h1 className="i18n-text mb-2 font-display text-2xl font-extrabold text-on-surface max-[390px]:text-xl md:text-3xl">
              {document.title}
            </h1>
            <p className="text-sm text-on-surface-variant/70">{document.updated}</p>
          </header>

          <p className="i18n-text mb-5 text-sm leading-relaxed text-on-surface-variant md:text-base">
            {document.intro}
          </p>

          <div className="space-y-6">
            {document.sections.map((section) => (
              <section key={section.title}>
                <h2 className="i18n-text mb-2.5 font-display text-lg font-bold text-on-surface md:text-xl">
                  {section.title}
                </h2>
                <div className="space-y-2.5 text-sm leading-relaxed text-on-surface-variant md:text-[15px]">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="i18n-text">
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets && (
                    <ul className="list-disc space-y-1.5 pl-5">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="i18n-text">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>

          <footer className="mt-7 border-t border-white/8 pt-4">
            <Link
              href={otherType === "privacy" ? "/privacy" : "/terms"}
              className="i18n-label font-display text-xs font-bold uppercase text-on-surface-variant transition-colors hover:text-primary"
            >
              {otherType === "privacy" ? t("privacy") : t("terms")}
            </Link>
          </footer>
        </article>
      </main>
    </PageShell>
  );
}
