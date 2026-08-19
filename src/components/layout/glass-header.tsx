"use client";

import { AnimatePresence, motion } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { GlassTooltip } from "@/components/ui/glass-tooltip";
import { IconChevronUp, IconLogOut } from "@/components/ui/icons";
import { useApp } from "@/providers/app-provider";
import { LanguageToggle } from "./language-toggle";
import { SoundToggle } from "./sound-toggle";

export function GlassHeader() {
  const { headerVisible, toggleHeader, t } = useApp();
  const { data: session, status } = useSession();
  const user = session?.user;
  const displayName = user?.login ?? user?.name ?? null;
  const isAuthenticated = status === "authenticated" && Boolean(user);
  const isAdmin = Boolean(user?.isAdmin);
  const accountLabel = displayName ? `@${displayName}` : t("headerGreeting");

  return (
    <AnimatePresence>
      {headerVisible && (
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="glass-header sticky top-0 z-50 w-full"
        >
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-3 max-[390px]:gap-2 md:h-16 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <GlassTooltip label={t("goHome")} align="start">
                <BrandLogo size="sm" />
              </GlassTooltip>
              {isAuthenticated && displayName ? (
                <p className="hidden min-w-0 truncate font-display text-xs font-semibold text-on-surface-variant sm:block md:text-sm">
                  {t("headerGreeting", { name: displayName })}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <GlassTooltip label={t("adminPanel")} align="end">
                      <Link
                        href="/admin"
                        className="glass-pill inline-flex h-9 items-center px-3 font-display text-xs font-bold text-primary transition-colors hover:bg-primary/10"
                      >
                        {t("adminPanel")}
                      </Link>
                    </GlassTooltip>
                  ) : null}
                  <GlassTooltip label={accountLabel} align="end">
                    {user?.image ? (
                      <Image
                        src={user.image}
                        alt={accountLabel}
                        width={28}
                        height={28}
                        className="h-7 w-7 rounded-full ring-1 ring-primary/40"
                      />
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 font-display text-[10px] font-bold text-primary">
                        {(displayName ?? "?").slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </GlassTooltip>
                  <GlassTooltip label={t("signOut")} align="end">
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      aria-label={t("signOut")}
                      className="glass-pill flex h-9 w-9 shrink-0 items-center justify-center text-on-surface-variant transition-colors hover:text-primary"
                    >
                      <IconLogOut className="h-5 w-5" />
                    </button>
                  </GlassTooltip>
                </div>
              ) : null}
              <SoundToggle />
              <LanguageToggle />
              <GlassTooltip label={t("hideHeader")} align="end">
                <button
                  type="button"
                  onClick={toggleHeader}
                  aria-label={t("hideHeader")}
                  className="glass-pill flex h-9 w-9 shrink-0 items-center justify-center text-on-surface-variant transition-colors hover:text-primary"
                >
                  <IconChevronUp className="h-5 w-5" />
                </button>
              </GlassTooltip>
            </div>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
}
