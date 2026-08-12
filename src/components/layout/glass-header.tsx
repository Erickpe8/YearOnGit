"use client";

import { AnimatePresence, motion } from "framer-motion";
import { IconChevronUp } from "@/components/ui/icons";
import { useApp } from "@/providers/app-provider";
import { LanguageToggle } from "./language-toggle";

export function GlassHeader() {
  const {
    headerVisible,
    toggleHeader,
    t,
    headerProgress,
  } = useApp();

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
            <div className="truncate font-display text-base font-extrabold tracking-tighter text-primary max-[390px]:max-w-[100px] max-[390px]:text-sm md:text-xl">
              YearOnGit
            </div>

            {headerProgress ? (
              <div className="flex flex-1 items-center justify-center px-2">
                <div className="hidden items-center gap-1.5 sm:flex">
                  {Array.from({ length: headerProgress.total }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        i < headerProgress.current
                          ? "w-5 bg-primary"
                          : "w-2 bg-white/15"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-display text-xs font-medium text-on-surface-variant sm:ml-3">
                  {headerProgress.current}/{headerProgress.total}
                </span>
              </div>
            ) : (
              <div className="flex-1" />
            )}

            <div className="flex shrink-0 items-center gap-2">
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
