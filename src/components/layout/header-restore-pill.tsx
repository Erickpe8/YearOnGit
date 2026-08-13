"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BrandLogo } from "@/components/brand/brand-logo";
import { useApp } from "@/providers/app-provider";

export function HeaderRestorePill() {
  const { headerVisible, showHeader, t } = useApp();

  return (
    <AnimatePresence>
      {!headerVisible && (
        <motion.button
          type="button"
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -16, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={showHeader}
          aria-label={t("showHeader")}
          className="glass-pill fixed top-3 right-3 z-50 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-on-surface-variant transition-colors hover:text-primary md:top-4 md:right-4"
        >
          <BrandLogo size="sm" href={null} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
