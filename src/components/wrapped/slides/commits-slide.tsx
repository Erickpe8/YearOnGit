"use client";

import { motion } from "framer-motion";
import { useApp } from "@/providers/app-provider";

type CommitsSlideProps = {
  commits: number;
};

export function CommitsSlide({ commits }: CommitsSlideProps) {
  const { t } = useApp();

  return (
    <motion.section
      key="commits"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-1 flex-col items-center justify-center px-4 text-center max-[390px]:px-3"
    >
      <p className="i18n-text mb-4 max-w-[320px] font-display text-lg leading-snug text-on-surface-variant max-[390px]:mb-3 max-[390px]:max-w-[280px] max-[390px]:text-base md:mb-6 md:max-w-md md:text-2xl">
        {t("commitsTitle")}
      </p>
      <div className="commits-gradient glow-text font-display text-[64px] font-extrabold leading-none max-[390px]:text-[56px] md:text-[120px]">
        {commits}
      </div>
      <p className="i18n-label mt-3 font-display text-sm uppercase text-primary max-[390px]:mt-2 max-[390px]:text-xs md:mt-4 md:text-lg">
        {t("commitsLabel")}
      </p>
    </motion.section>
  );
}
