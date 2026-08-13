"use client";

import { WrappedExperience } from "@/components/wrapped/wrapped-experience";
import type { WrappedPayload } from "@/lib/wrapped/types";

type SharedWrappedExperienceProps = {
  payload: WrappedPayload;
};

export function SharedWrappedExperience({
  payload,
}: SharedWrappedExperienceProps) {
  return <WrappedExperience mode="shared" initialPayload={payload} />;
}
