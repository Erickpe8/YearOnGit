"use client";

import Link from "next/link";
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
    <PageShell footerCompact>
      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 py-10 max-[390px]:px-3 max-[390px]:py-8 md:px-8 md:py-14">
        <Link
          href="/"
          className="group mb-8 inline-flex items-center gap-2 font-display text-sm text-on-surface-variant transition-colors hover:text-primary"
        >
          <IconArrowLeft className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
          YearOnGit
        </Link>

        <article className="glass-card rounded-2xl p-6 max-[390px]:p-5 md:p-10">
          <header className="mb-8 border-b border-white/8 pb-6">
            <p className="i18n-label mb-3 font-display text-xs font-bold uppercase text-primary">
              {type === "privacy" ? t("privacy") : t("terms")}
            </p>
            <h1 className="i18n-text mb-3 font-display text-3xl font-extrabold text-on-surface max-[390px]:text-2xl md:text-4xl">
              {document.title}
            </h1>
            <p className="text-sm text-on-surface-variant/70">{document.updated}</p>
          </header>

          <p className="i18n-text mb-8 text-base leading-relaxed text-on-surface-variant">
            {document.intro}
          </p>

          <div className="space-y-8">
            {document.sections.map((section) => (
              <section key={section.title}>
                <h2 className="i18n-text mb-3 font-display text-xl font-bold text-on-surface">
                  {section.title}
                </h2>
                <div className="space-y-3 text-sm leading-relaxed text-on-surface-variant md:text-base">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="i18n-text">
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets && (
                    <ul className="list-disc space-y-2 pl-5">
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

          <footer className="mt-10 border-t border-white/8 pt-6">
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
