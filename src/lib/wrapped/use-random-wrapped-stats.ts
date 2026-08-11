"use client";

import { useCallback, useEffect, useState } from "react";
import {
  generateRandomWrappedStats,
  type WrappedStats,
} from "@/lib/wrapped/random-stats";

export function useRandomWrappedStats() {
  const [stats, setStats] = useState<WrappedStats | null>(null);

  const regenerate = useCallback(() => {
    setStats(generateRandomWrappedStats());
  }, []);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  return { stats, regenerate };
}
