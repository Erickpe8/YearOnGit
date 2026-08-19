"use client";

import { GlassTooltip } from "@/components/ui/glass-tooltip";
import { IconVolume, IconVolumeOff } from "@/components/ui/icons";
import { useApp } from "@/providers/app-provider";
import { useSfx } from "@/providers/sfx-provider";

export function SoundToggle() {
  const { t } = useApp();
  const { muted, toggleMuted, unlock } = useSfx();
  const label = muted ? t("unmuteSound") : t("muteSound");

  return (
    <GlassTooltip label={label} align="end">
      <button
        type="button"
        onClick={() => {
          unlock();
          toggleMuted();
        }}
        aria-label={label}
        aria-pressed={!muted}
        className="glass-pill flex h-9 w-9 shrink-0 items-center justify-center text-on-surface-variant transition-colors hover:text-primary"
      >
        {muted ? (
          <IconVolumeOff className="h-5 w-5" />
        ) : (
          <IconVolume className="h-5 w-5" />
        )}
      </button>
    </GlassTooltip>
  );
}
