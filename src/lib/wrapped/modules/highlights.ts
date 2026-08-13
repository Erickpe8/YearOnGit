import type { Highlight, WrappedModules } from "@/lib/wrapped/modules/types";

function push(
  list: Highlight[],
  id: string,
  score: number,
  templateKey: string,
  values: Record<string, string | number>,
) {
  if (score <= 0) return;
  list.push({ id, score, templateKey, values });
}

export function generateHighlights(modules: WrappedModules): Highlight[] {
  const list: Highlight[] = [];
  const { activity, calendar, community, languages, organizations, popularity, repositories } =
    modules;

  if (calendar.mostActiveMonth != null && calendar.mostActiveMonthCount > 0) {
    push(list, "best_month", 80 + calendar.mostActiveMonthCount / 10, "highlightBestMonth", {
      month: calendar.mostActiveMonth,
      count: calendar.mostActiveMonthCount,
    });
  }

  if (activity.activityRate >= 20) {
    push(list, "activity_rate", 50 + activity.activityRate, "highlightActivityRate", {
      percent: activity.activityRate,
    });
  }

  if (repositories.repositoryBreakdown.privateSharePct >= 30) {
    push(
      list,
      "private_share",
      40 + repositories.repositoryBreakdown.privateSharePct,
      "highlightPrivateShare",
      { percent: repositories.repositoryBreakdown.privateSharePct },
    );
  }

  if (organizations.activeThisYear.length > 0) {
    push(
      list,
      "orgs_active",
      45 + organizations.activeThisYear.length * 8,
      "highlightOrgsActive",
      { count: organizations.activeThisYear.length },
    );
  }

  if (popularity.mostStarred && popularity.mostStarred.value > 0) {
    push(list, "most_starred", 55 + Math.min(popularity.mostStarred.value, 200), "highlightMostStarred", {
      repo: popularity.mostStarred.nameWithOwner,
      stars: popularity.mostStarred.value,
    });
  }

  if (community.friends > 0) {
    push(list, "friends", 40 + community.friends, "highlightFriends", {
      count: community.friends,
    });
  }

  if (calendar.longestStreak >= 7) {
    push(list, "streak", 50 + calendar.longestStreak, "highlightStreak", {
      days: calendar.longestStreak,
    });
  }

  if (languages.topLanguage) {
    push(list, "top_language", 35 + languages.topLanguagePercentage, "highlightTopLanguage", {
      language: languages.topLanguage,
      percent: languages.topLanguagePercentage,
    });
  }

  if (repositories.favoriteOfYear) {
    push(list, "favorite_repo", 40 + repositories.favoriteOfYear.value, "highlightFavoriteRepo", {
      repo: repositories.favoriteOfYear.nameWithOwner,
      count: repositories.favoriteOfYear.value,
    });
  }

  return list.sort((a, b) => b.score - a.score).slice(0, 8);
}
