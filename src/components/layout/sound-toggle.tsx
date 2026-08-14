"use client";

import { IconVolume, IconVolumeOff } from "@/components/ui/icons";
import { useApp } from "@/providers/app-provider";
import { useSfx } from "@/providers/sfx-provider";

export function SoundToggle() {
  const { t } = useApp();
  const { muted, toggleMuted, unlock } = useSfx();

  return (
    <button
      type="button"
      onClick={() => {
        unlock();
        toggleMuted();
      }}
      aria-label={muted ? t("unmuteSound") : t("muteSound")}
      aria-pressed={!muted}
      className="glass-pill flex h-9 w-9 shrink-0 items-center justify-center text-on-surface-variant transition-colors hover:text-primary"
    >
      {muted ? (
        <IconVolumeOff className="h-5 w-5" />
      ) : (
        <IconVolume className="h-5 w-5" />
      )}
    </button>
  );
}
