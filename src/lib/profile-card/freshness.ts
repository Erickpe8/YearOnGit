import {
  PROFILE_CARD_TTL_MS,
} from "@/lib/profile-card/constants";

export function isProfileCardStale(
  refreshedAt: Date,
  now = new Date(),
): boolean {
  return now.getTime() - refreshedAt.getTime() >= PROFILE_CARD_TTL_MS;
}

export function isProfileCardRefreshLocked(
  refreshLockUntil: Date | null,
  now = new Date(),
): boolean {
  return Boolean(refreshLockUntil && refreshLockUntil.getTime() > now.getTime());
}
