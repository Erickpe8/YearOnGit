"use client";

import { WrappedExperience } from "@/components/wrapped/wrapped-experience";
import type { WrappedAdminConfig } from "@/lib/admin/wrapped-config";
import type { WrappedPayload } from "@/lib/wrapped/types";

type SharedWrappedExperienceProps = {
  payload: WrappedPayload;
  wrappedConfig?: WrappedAdminConfig;
};

export function SharedWrappedExperience({
  payload,
  wrappedConfig,
}: SharedWrappedExperienceProps) {
  return (
    <WrappedExperience
      mode="shared"
      initialPayload={payload}
      wrappedConfig={wrappedConfig}
    />
  );
}
