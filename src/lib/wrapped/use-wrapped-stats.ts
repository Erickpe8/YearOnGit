"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { readWrappedPayload } from "@/lib/wrapped/storage";
import type { WrappedPayload, WrappedStats } from "@/lib/wrapped/types";

type UseWrappedStatsOptions = {
  initialPayload?: WrappedPayload | null;
  shared?: boolean;
};

type UseWrappedStatsResult = {
  stats: WrappedStats | null;
  username: string | null;
  year: number | null;
  payload: WrappedPayload | null;
  ready: boolean;
  reload: () => void;
};

export function useWrappedStats(
  options: UseWrappedStatsOptions = {},
): UseWrappedStatsResult {
  const { initialPayload = null, shared = false } = options;
  const router = useRouter();
  const [payload, setPayload] = useState<WrappedPayload | null>(
    initialPayload,
  );
  const [ready, setReady] = useState(Boolean(initialPayload));

  const load = useCallback(() => {
    if (shared) {
      setPayload(initialPayload);
      setReady(true);
      return initialPayload;
    }

    const stored = readWrappedPayload();
    setPayload(stored);
    setReady(true);
    return stored;
  }, [shared, initialPayload]);

  useEffect(() => {
    if (shared) {
      setPayload(initialPayload);
      setReady(true);
      return;
    }

    const stored = load();
    if (!stored) {
      router.replace("/loading");
    }
  }, [shared, initialPayload, load, router]);

  return {
    stats: payload?.stats ?? null,
    username: payload?.username ?? null,
    year: payload?.year ?? null,
    payload,
    ready,
    reload: load,
  };
}
