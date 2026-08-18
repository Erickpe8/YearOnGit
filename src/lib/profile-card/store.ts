import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  PROFILE_CARD_REFRESH_LOCK_MS,
  PROFILE_CARD_TTL_MS,
} from "@/lib/profile-card/constants";
import { canRefreshProfileCardYear } from "@/lib/profile-card/year-scope";
import {
  isValidProfileUsername,
  normalizeProfileUsername,
  toProfileUsernameKey,
} from "@/lib/profile-card/urls";
import { isWrappedStats } from "@/lib/wrapped/share";
import type { WrappedStats } from "@/lib/wrapped/types";
import { WRAPPED_YEAR } from "@/lib/wrapped/year";

export type ProfileCardRecord = {
  id: string;
  userId: string;
  username: string;
  usernameKey: string;
  year: number;
  stats: WrappedStats;
  refreshedAt: Date;
  refreshLockUntil: Date | null;
};

export {
  isProfileCardRefreshLocked,
  isProfileCardStale,
} from "@/lib/profile-card/freshness";

type ProfileCardRow = {
  id: string;
  userId: string;
  username: string;
  usernameKey: string;
  year: number;
  stats: unknown;
  refreshedAt: Date;
  refreshLockUntil: Date | null;
};

function newProfileCardId(): string {
  return `c${Date.now().toString(36)}${randomBytes(8).toString("hex")}`;
}

function toRecord(row: ProfileCardRow): ProfileCardRecord | null {
  if (!isWrappedStats(row.stats)) return null;
  return {
    id: row.id,
    userId: row.userId,
    username: row.username,
    usernameKey: row.usernameKey,
    year: row.year,
    stats: row.stats,
    refreshedAt: row.refreshedAt,
    refreshLockUntil: row.refreshLockUntil,
  };
}

export async function loadProfileCard(
  username: string,
  year: number,
): Promise<ProfileCardRecord | null> {
  if (!isValidProfileUsername(username)) return null;

  const rows = await prisma.$queryRawUnsafe<ProfileCardRow[]>(
    `SELECT
      id,
      "userId",
      username,
      "usernameKey",
      year,
      stats,
      "refreshedAt",
      "refreshLockUntil"
    FROM "ProfileCard"
    WHERE "usernameKey" = $1
      AND year = $2
    LIMIT 1`,
    toProfileUsernameKey(username),
    year,
  );

  const row = rows[0];
  return row ? toRecord(row) : null;
}

export async function upsertProfileCard(input: {
  userId: string;
  username: string;
  year?: number;
  stats: WrappedStats;
  markRefreshed?: boolean;
}): Promise<ProfileCardRecord> {
  const username = normalizeProfileUsername(input.username);
  const usernameKey = toProfileUsernameKey(username);
  const year = input.year ?? WRAPPED_YEAR;
  const now = new Date();
  const markRefreshed = input.markRefreshed !== false;
  const statsJson = JSON.stringify(input.stats);

  const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM "ProfileCard"
     WHERE "userId" = $1 AND year = $2
     LIMIT 1`,
    input.userId,
    year,
  );

  if (existing[0]) {
    if (markRefreshed) {
      await prisma.$executeRawUnsafe(
        `UPDATE "ProfileCard"
         SET
           username = $1,
           "usernameKey" = $2,
           stats = $3::jsonb,
           "refreshedAt" = $4,
           "refreshLockUntil" = NULL,
           "updatedAt" = $4
         WHERE id = $5`,
        username,
        usernameKey,
        statsJson,
        now,
        existing[0].id,
      );
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE "ProfileCard"
         SET
           username = $1,
           "usernameKey" = $2,
           stats = $3::jsonb,
           "updatedAt" = $4
         WHERE id = $5`,
        username,
        usernameKey,
        statsJson,
        now,
        existing[0].id,
      );
    }
  } else {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "ProfileCard" (
        id,
        "userId",
        username,
        "usernameKey",
        year,
        stats,
        "refreshedAt",
        "refreshLockUntil",
        "createdAt",
        "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6::jsonb, $7, NULL, $7, $7
      )`,
      newProfileCardId(),
      input.userId,
      username,
      usernameKey,
      year,
      statsJson,
      now,
    );
  }

  const saved = await loadProfileCard(usernameKey, year);
  if (!saved) {
    throw new Error("Saved profile card stats failed validation");
  }
  return saved;
}

export async function tryClaimProfileCardRefresh(
  usernameKey: string,
  year: number,
): Promise<boolean> {
  if (!canRefreshProfileCardYear(year)) return false;

  const now = new Date();
  const staleBefore = new Date(now.getTime() - PROFILE_CARD_TTL_MS);
  const lockUntil = new Date(now.getTime() + PROFILE_CARD_REFRESH_LOCK_MS);

  const result = await prisma.$executeRawUnsafe(
    `UPDATE "ProfileCard"
     SET "refreshLockUntil" = $1, "updatedAt" = $2
     WHERE "usernameKey" = $3
       AND year = $4
       AND "refreshedAt" < $5
       AND (
         "refreshLockUntil" IS NULL
         OR "refreshLockUntil" < $2
       )`,
    lockUntil,
    now,
    usernameKey,
    year,
    staleBefore,
  );

  return Number(result) > 0;
}

export async function listStaleProfileCards(limit = 50): Promise<
  Array<{ id: string; usernameKey: string; userId: string; year: number }>
> {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - PROFILE_CARD_TTL_MS);
  const openYear = now.getUTCFullYear();

  if (!canRefreshProfileCardYear(openYear, now)) {
    return [];
  }

  return prisma.$queryRawUnsafe<
    Array<{ id: string; usernameKey: string; userId: string; year: number }>
  >(
    `SELECT id, "usernameKey", "userId", year
     FROM "ProfileCard"
     WHERE year = $1
       AND "refreshedAt" < $2
     ORDER BY "refreshedAt" ASC
     LIMIT $3`,
    openYear,
    staleBefore,
    limit,
  );
}

export async function clearProfileCardRefreshLock(id: string): Promise<void> {
  const now = new Date();
  await prisma.$executeRawUnsafe(
    `UPDATE "ProfileCard"
     SET "refreshLockUntil" = NULL, "updatedAt" = $1
     WHERE id = $2`,
    now,
    id,
  );
}
