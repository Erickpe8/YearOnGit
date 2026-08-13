"use client";

import { AnimatePresence, motion } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { IconChevronUp } from "@/components/ui/icons";
import { useApp } from "@/providers/app-provider";
import { LanguageToggle } from "./language-toggle";

export function GlassHeader() {
  const { headerVisible, toggleHeader, t, headerProgress } = useApp();
  const { data: session, status } = useSession();
  const user = session?.user;
  const displayName = user?.login ?? user?.name ?? null;
  const isAuthenticated = status === "authenticated" && Boolean(user);

  return (
    <AnimatePresence>
      {headerVisible && (
        <motion.header
          initial={{ y: -72, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -72, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="glass-header fixed top-0 right-0 left-0 z-50 h-14 md:h-16"
        >
          <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-2 px-3 max-[390px]:gap-1.5 md:gap-3 md:px-6">
            <div className="truncate font-display text-base font-extrabold tracking-tighter text-primary max-[390px]:max-w-[88px] max-[390px]:text-sm md:text-xl">
              YearOnGit
            </div>

            {headerProgress ? (
              <div className="flex min-w-0 flex-1 items-center justify-center gap-2 px-1 sm:gap-3 sm:px-2">
                <div
                  className="flex max-w-[min(100%,280px)] flex-1 items-center gap-1 sm:max-w-md sm:gap-1.5"
                  aria-hidden
                >
                  {Array.from({ length: headerProgress.total }).map((_, index) => {
                    const activeIndex = headerProgress.current - 1;
                    const isPast = index < activeIndex;
                    const isActive = index === activeIndex;

                    return (
                      <div
                        key={`${headerProgress.cycleKey}-${index}`}
                        className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/15"
                      >
                        {isPast || (isActive && headerProgress.fillMode === "complete") ? (
                          <div className="h-full w-full rounded-full bg-primary" />
                        ) : isActive && headerProgress.fillMode === "animate" ? (
                          <div
                            className={`wrapped-progress-segment h-full w-full rounded-full bg-primary${
                              headerProgress.paused ? " is-paused" : ""
                            }`}
                            style={{
                              animationDuration: `${
                                headerProgress.settleMs + headerProgress.dwellMs
                              }ms`,
                              animationDelay: "0ms",
                            }}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <span className="shrink-0 font-display text-xs font-medium text-on-surface-variant">
                  {headerProgress.current}/{headerProgress.total}
                </span>
              </div>
            ) : isAuthenticated && displayName ? (
              <div className="flex min-w-0 flex-1 items-center justify-center px-2">
                <p className="truncate font-display text-xs font-semibold text-on-surface md:text-sm">
                  {t("headerGreeting", { name: displayName })}
                </p>
              </div>
            ) : (
              <div className="flex-1" />
            )}

            <div className="flex shrink-0 items-center gap-2">
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  {user?.image ? (
                    <Image
                      src={user.image}
                      alt={displayName ?? "GitHub"}
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded-full ring-1 ring-primary/40"
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 font-display text-[10px] font-bold text-primary">
                      {(displayName ?? "?").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="glass-pill hidden h-9 items-center px-3 font-display text-xs font-semibold text-on-surface-variant transition-colors hover:text-primary sm:inline-flex"
                  >
                    {t("signOut")}
                  </button>
                </div>
              ) : null}
              <LanguageToggle />
              <button
                type="button"
                onClick={toggleHeader}
                aria-label={t("hideHeader")}
                className="glass-pill flex h-9 w-9 shrink-0 items-center justify-center text-on-surface-variant transition-colors hover:text-primary"
              >
                <IconChevronUp className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
}
