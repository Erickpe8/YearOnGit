"use client";

import { motion } from "framer-motion";
import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { AnimatedCounter } from "@/components/wrapped/animated-counter";
import type { TranslationKey } from "@/lib/i18n/translations";
import type { ContributionTypeKey } from "@/lib/wrapped/data-sources";
import {
  buildContributionInsights,
  type ContributionInsights,
  type ContributionNarrativeKey,
} from "@/lib/wrapped/contribution-insights";
import { formatNumber } from "@/lib/wrapped/format";
import type { WrappedStats } from "@/lib/wrapped/types";
import { usePrefersReducedMotion } from "@/lib/wrapped/use-prefers-reduced-motion";

type TranslationValues = Record<string, string | number>;

export type ContributionStoryHandle = {
  tryAdvance: () => boolean;
};

type ContributionCompositionSlideProps = {
  stats: WrappedStats;
  locale: string;
  t: (key: TranslationKey, values?: TranslationValues) => string;
  storyRef?: Ref<ContributionStoryHandle | null>;
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const SEGMENT_COLOR: Record<ContributionTypeKey, string> = {
  commits: "#39d353",
  pullRequests: "#58a6ff",
  issues: "#f78166",
  codeReviews: "#bc8cff",
};

const BREAKDOWN_LABEL: Record<ContributionTypeKey, TranslationKey> = {
  commits: "totalCommits",
  pullRequests: "compositionPrsLabel",
  issues: "compositionIssuesLabel",
  codeReviews: "compositionReviewsLabel",
};

const NARRATIVE_KEY: Record<ContributionNarrativeKey, TranslationKey> = {
  buildFocused: "compositionNarrativeBuild",
  balanced: "compositionNarrativeBalanced",
  collabFocused: "compositionNarrativeCollab",
};

type StageId =
  | "title"
  | "intro"
  | "hero"
  | "bar"
  | "legend"
  | "codeFocus"
  | "but"
  | "collab"
  | "collabPr"
  | "collabIssues"
  | "collabReviews"
  | "ratioHint"
  | "ratio"
  | "conclusion";

type SceneId =
  | "composition"
  | "code"
  | "collaboration"
  | "ratio"
  | "conclusion";

type Stage = { id: StageId; at: number };

function buildStages(insights: ContributionInsights): Stage[] {
  let clock = 0;
  const stages: Stage[] = [];
  const push = (id: StageId, waitMs: number) => {
    clock += waitMs;
    stages.push({ id, at: clock });
  };

  push("title", 0);
  push("intro", 1_400);
  push("hero", 2_400);
  push("bar", 2_500);
  push("legend", 1_700);
  push("codeFocus", 3_000);

  if (insights.collaborativeActions > 0) {
    push("but", 2_800);
    push("collab", 2_200);
    push("collabPr", 2_400);
    push("collabIssues", 1_200);
    push("collabReviews", 1_200);
  }

  if (insights.commitsPerPullRequest != null) {
    push("ratioHint", 2_600);
    push("ratio", 2_000);
  }

  push("conclusion", 2_800);
  return stages;
}

function sceneForStage(id: StageId): SceneId {
  switch (id) {
    case "codeFocus":
      return "code";
    case "but":
    case "collab":
    case "collabPr":
    case "collabIssues":
    case "collabReviews":
      return "collaboration";
    case "ratioHint":
    case "ratio":
      return "ratio";
    case "conclusion":
      return "conclusion";
    default:
      return "composition";
  }
}

function Reveal({
  show,
  reducedMotion,
  className = "",
  children,
  emphasize = false,
}: {
  show: boolean;
  reducedMotion: boolean;
  className?: string;
  children: ReactNode;
  emphasize?: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial={false}
      animate={{
        opacity: show ? 1 : 0,
        y: show || reducedMotion ? 0 : emphasize ? 12 : 8,
        scale: show || reducedMotion ? 1 : emphasize ? 0.97 : 1,
      }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: emphasize ? 0.45 : 0.36, ease: EASE }
      }
      aria-hidden={!show}
      style={{ pointerEvents: show ? "auto" : "none" }}
    >
      {children}
    </motion.div>
  );
}

function Scene({
  active,
  reducedMotion,
  className = "",
  children,
}: {
  active: boolean;
  reducedMotion: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={`composition-slide__scene ${className}`.trim()}
      initial={false}
      animate={{
        opacity: active ? 1 : 0,
        y: active || reducedMotion ? 0 : 14,
      }}
      transition={
        reducedMotion ? { duration: 0 } : { duration: 0.4, ease: EASE }
      }
      aria-hidden={!active}
      style={{ pointerEvents: active ? "auto" : "none" }}
    >
      {children}
    </motion.div>
  );
}

export function ContributionCompositionSlide({
  stats,
  locale,
  t,
  storyRef,
}: ContributionCompositionSlideProps) {
  const reducedMotion = usePrefersReducedMotion();
  const insights = useMemo(() => buildContributionInsights(stats), [stats]);
  const stages = useMemo(() => buildStages(insights), [insights]);
  const lastIndex = stages.length - 1;
  const [stageIndex, setStageIndex] = useState(reducedMotion ? lastIndex : 0);

  useEffect(() => {
    if (reducedMotion) {
      setStageIndex(lastIndex);
      return;
    }

    setStageIndex(0);
    const timers = stages.map((stage, index) =>
      window.setTimeout(() => {
        setStageIndex((current) => Math.max(current, index));
      }, stage.at),
    );

    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [reducedMotion, stages, lastIndex]);

  useImperativeHandle(
    storyRef,
    () => ({
      tryAdvance: () => {
        if (reducedMotion) return false;
        if (stageIndex >= lastIndex) return false;
        setStageIndex((current) => Math.min(current + 1, lastIndex));
        return true;
      },
    }),
    [reducedMotion, stageIndex, lastIndex],
  );

  const reached = useMemo(() => {
    const ids = new Set<StageId>();
    for (let index = 0; index <= stageIndex && index < stages.length; index += 1) {
      ids.add(stages[index].id);
    }
    return ids;
  }, [stageIndex, stages]);

  const has = (id: StageId) => reducedMotion || reached.has(id);
  const currentStageId = stages[stageIndex]?.id ?? "title";
  const activeScene = reducedMotion
    ? "composition"
    : sceneForStage(currentStageId);
  const showCollab = insights.collaborativeActions > 0;
  const showRatio = insights.commitsPerPullRequest != null;

  return (
    <div className="composition-slide">
      <div className="composition-slide__stage">
        <Scene
          active={activeScene === "composition"}
          reducedMotion={reducedMotion}
          className="composition-slide__scene--composition"
        >
          <Reveal show={has("title")} reducedMotion={reducedMotion}>
            <h2 className="i18n-text wrapped-slide-title font-display font-bold">
              {t("howYouContributed")}
            </h2>
          </Reveal>

          <div className="composition-slide__body">
            <Reveal
              show={has("intro") && !has("hero")}
              reducedMotion={reducedMotion}
              className="composition-slide__overlay-panel"
            >
              <p className="i18n-text composition-slide__subtle text-on-surface-variant">
                {t("compositionIntroFocus")}
              </p>
            </Reveal>

            <Reveal
              show={has("hero")}
              reducedMotion={reducedMotion}
              className="composition-slide__overlay-panel composition-slide__overlay-panel--stack"
            >
              <p className="composition-slide__hero-value font-display font-extrabold leading-none text-primary">
                <AnimatedCounter
                  value={insights.commitPercentage}
                  locale={locale}
                  durationMs={1_800}
                  fractionDigits={1}
                  suffix="%"
                  play={activeScene === "composition" && has("hero")}
                />
              </p>
              <p className="composition-slide__hero-label font-display font-semibold uppercase tracking-[0.14em] text-on-surface">
                {t("compositionHeroLabel")}
              </p>

              <motion.div
                className="composition-slide__bar-wrap"
                initial={false}
                animate={{
                  opacity: has("bar") ? 1 : 0,
                  y: has("bar") || reducedMotion ? 0 : 10,
                }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { duration: 0.35, ease: EASE }
                }
                aria-hidden={!has("bar")}
              >
                <div className="composition-slide__bar" aria-hidden>
                  {insights.contributionBreakdown.map((item) => (
                    <motion.span
                      key={item.type}
                      className="composition-slide__segment"
                      style={{ backgroundColor: SEGMENT_COLOR[item.type] }}
                      initial={false}
                      animate={{
                        width:
                          activeScene === "composition" && has("bar")
                            ? `${item.percentage}%`
                            : "0%",
                      }}
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : {
                              duration: item.type === "commits" ? 1.05 : 0.7,
                              ease: EASE,
                              delay:
                                item.type === "commits"
                                  ? 0
                                  : item.type === "pullRequests"
                                    ? 0.35
                                    : item.type === "issues"
                                      ? 0.5
                                      : 0.62,
                            }
                      }
                    />
                  ))}
                </div>

                <Reveal show={has("legend")} reducedMotion={reducedMotion}>
                  <ul className="composition-slide__legend-list">
                    {insights.contributionBreakdown.map((item) => (
                      <li
                        key={item.type}
                        className="composition-slide__legend-item"
                      >
                        <span
                          className="composition-slide__swatch"
                          style={{
                            backgroundColor: SEGMENT_COLOR[item.type],
                          }}
                        />
                        <span className="composition-slide__legend-name">
                          {t(BREAKDOWN_LABEL[item.type])}
                        </span>
                        <span className="composition-slide__legend-pct text-primary">
                          {formatNumber(item.percentage, locale, {
                            maximumFractionDigits: 1,
                            minimumFractionDigits: 1,
                          })}
                          %
                        </span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </motion.div>
            </Reveal>
          </div>
        </Scene>

        <Scene
          active={activeScene === "code"}
          reducedMotion={reducedMotion}
          className="composition-slide__scene--code"
        >
          <Reveal show={has("codeFocus")} reducedMotion={reducedMotion}>
            <p className="composition-slide__commits-line font-display font-extrabold text-primary">
              <AnimatedCounter
                value={insights.totalCommits}
                locale={locale}
                durationMs={900}
                play={activeScene === "code" && has("codeFocus")}
              />{" "}
              <span className="composition-slide__commits-word font-semibold uppercase tracking-wide text-on-surface">
                {t("compositionCommitsWord")}
              </span>
            </p>
            <p className="i18n-text composition-slide__subtle text-on-surface-variant">
              {t("compositionCodeFilled")}
            </p>
          </Reveal>
        </Scene>

        <Scene
          active={activeScene === "collaboration" && showCollab}
          reducedMotion={reducedMotion}
          className="composition-slide__scene--collab"
        >
          <div className="composition-slide__collab-stack">
            <div className="composition-slide__collab-focus">
              <Reveal
                show={has("but") && !has("collab")}
                reducedMotion={reducedMotion}
                emphasize
                className="composition-slide__overlay-panel"
              >
                <p className="composition-slide__but-label font-display font-bold uppercase tracking-[0.18em] text-primary">
                  {t("compositionBut")}
                </p>
                <p className="composition-slide__subtle text-on-surface-variant">
                  {t("compositionButContinue")}
                </p>
              </Reveal>

              <Reveal
                show={has("collab")}
                reducedMotion={reducedMotion}
                className="composition-slide__overlay-panel"
              >
                <p className="composition-slide__collab-label font-display font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                  {t("compositionCollabEyebrow")}
                </p>
                <p className="composition-slide__collab-value font-display font-extrabold leading-none text-primary">
                  <AnimatedCounter
                    value={insights.collaborativeActions}
                    locale={locale}
                    durationMs={900}
                    play={activeScene === "collaboration" && has("collab")}
                  />
                </p>
                <p className="composition-slide__subtle text-on-surface-variant">
                  {t("compositionCollabLabel")}
                </p>
              </Reveal>
            </div>

            <div className="composition-slide__collab-chips">
              <Reveal
                show={has("collabPr")}
                reducedMotion={reducedMotion}
              >
                <span className="composition-slide__chip">
                  <strong>
                    {formatNumber(insights.totalPullRequests, locale)}
                  </strong>{" "}
                  {t("compositionPrsLabel")}
                </span>
              </Reveal>
              <Reveal
                show={has("collabIssues")}
                reducedMotion={reducedMotion}
              >
                <span className="composition-slide__chip">
                  <strong>{formatNumber(insights.totalIssues, locale)}</strong>{" "}
                  {t("compositionIssuesLabel")}
                </span>
              </Reveal>
              <Reveal
                show={has("collabReviews")}
                reducedMotion={reducedMotion}
              >
                <span className="composition-slide__chip">
                  <strong>
                    {formatNumber(insights.totalCodeReviews, locale)}
                  </strong>{" "}
                  {t("compositionReviewsLabel")}
                </span>
              </Reveal>
            </div>
          </div>
        </Scene>

        <Scene
          active={activeScene === "ratio" && showRatio}
          reducedMotion={reducedMotion}
          className="composition-slide__scene--ratio"
        >
          <div className="composition-slide__ratio-focus">
            <Reveal
              show={has("ratioHint") && !has("ratio")}
              reducedMotion={reducedMotion}
              className="composition-slide__overlay-panel"
            >
              <p className="i18n-text composition-slide__subtle text-on-surface-variant">
                {t("compositionRatioHint")}
              </p>
            </Reveal>
            <Reveal
              show={has("ratio")}
              reducedMotion={reducedMotion}
              emphasize
              className="composition-slide__overlay-panel"
            >
              <p className="composition-slide__ratio-value font-display font-bold text-on-surface">
                ≈
                <AnimatedCounter
                  value={insights.commitsPerPullRequest ?? 0}
                  locale={locale}
                  durationMs={750}
                  play={activeScene === "ratio" && has("ratio")}
                  className="ml-0.5"
                />{" "}
                {t("compositionRatioCommits")}
              </p>
              <p className="composition-slide__subtle text-on-surface-variant">
                {t("compositionRatioPerPr")}
              </p>
            </Reveal>
          </div>
        </Scene>

        <Scene
          active={activeScene === "conclusion"}
          reducedMotion={reducedMotion}
          className="composition-slide__scene--conclusion"
        >
          <Reveal show={has("conclusion")} reducedMotion={reducedMotion}>
            <p className="i18n-text composition-slide__conclusion font-display font-semibold text-primary">
              {t(NARRATIVE_KEY[insights.narrative])}
            </p>
          </Reveal>
        </Scene>
      </div>
    </div>
  );
}

export function contributionStorySettleMs(
  stats: WrappedStats,
  reducedMotion: boolean,
): number {
  if (reducedMotion) return 0;
  const stages = buildStages(buildContributionInsights(stats));
  const lastAt = stages[stages.length - 1]?.at ?? 0;
  return lastAt + 3_200;
}
