"use client";

import { useEffect, useState } from "react";
import { useWrappedUi } from "@/lib/wrapped/wrapped-ui";

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  const { features } = useWrappedUi();

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced || !features.animations;
}
