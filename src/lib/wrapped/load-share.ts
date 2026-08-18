import { prisma } from "@/lib/db";
import { isValidShareSlug, isWrappedStats } from "@/lib/wrapped/share";
import type { WrappedStats } from "@/lib/wrapped/types";

export type ActiveShareRecord = {
  slug: string;
  username: string;
  year: number;
  stats: WrappedStats;
};

export async function loadActiveShare(
  slug: string,
): Promise<ActiveShareRecord | null> {
  if (!isValidShareSlug(slug)) return null;

  const share = await prisma.wrappedShare.findFirst({
    where: { slug: slug.toLowerCase(), isActive: true },
    select: { slug: true, username: true, year: true, stats: true },
  });

  if (!share || !isWrappedStats(share.stats)) return null;

  return {
    slug: share.slug,
    username: share.username,
    year: share.year,
    stats: share.stats as WrappedStats,
  };
}
