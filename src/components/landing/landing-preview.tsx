"use client";

import { motion } from "framer-motion";
import { IconChart } from "@/components/ui/icons";
import { useApp } from "@/providers/app-provider";

const CONTRIBUTION_LEVELS = [
  0, 1, 2, 3, 1, 2, 0, 3, 2, 1, 0, 2, 3, 3, 1, 0, 2, 1, 3, 0, 1, 2, 3, 1, 0, 2,
  3, 1, 0, 2, 3, 2, 1, 0, 3, 2, 1, 3, 0, 2, 1, 3,
];

const LEVEL_CLASSES = [
  "bg-surface-variant opacity-20",
  "bg-on-tertiary-fixed-variant opacity-40",
  "bg-tertiary-fixed-dim opacity-60",
  "bg-primary opacity-80",
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.2 + i * 0.1,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export function LandingPreview() {
  const { t } = useApp();

  return (
    <section className="relative z-10 mt-16 w-full max-w-7xl px-4 pb-8 max-[390px]:mt-12 max-[390px]:px-3 md:px-16">
      <div className="grid grid-cols-1 gap-4 max-[390px]:gap-3 md:grid-cols-2 md:gap-6">
        <motion.div
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={cardVariants}
          className="glass-card flex min-h-[180px] flex-col justify-between rounded-xl p-5 max-[390px]:min-h-[160px] max-[390px]:p-4"
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-primary max-[390px]:text-base">
                {t("globalImpact")}
              </h3>
              <p className="text-xs text-on-surface-variant max-[390px]:text-[11px]">
                {t("contributions2026", { count: 847 })}
              </p>
            </div>
            <IconChart className="h-5 w-5 text-primary/40" />
          </div>
          <div className="flex flex-wrap gap-1 max-[390px]:gap-0.5">
            {CONTRIBUTION_LEVELS.map((level, index) => (
              <div
                key={index}
                className={`contribution-cell max-[390px]:h-2 max-[390px]:w-2 ${LEVEL_CLASSES[level]}`}
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={cardVariants}
          className="glass-card rounded-xl p-5 max-[390px]:p-4"
        >
          <h3 className="mb-4 font-display text-lg font-bold max-[390px]:text-base">
            {t("languages")}
          </h3>
          <div className="space-y-3">
            <div>
              <div className="mb-1.5 flex justify-between text-xs max-[390px]:text-[11px]">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#3178c6]" />
                  TypeScript
                </span>
                <span className="font-display text-primary">64%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-variant">
                <div className="h-full w-[64%] rounded-full bg-[#3178c6]" />
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-xs max-[390px]:text-[11px]">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#f1e05a]" />
                  JavaScript
                </span>
                <span className="font-display text-primary">22%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-variant">
                <div className="h-full w-[22%] rounded-full bg-[#f1e05a]" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
