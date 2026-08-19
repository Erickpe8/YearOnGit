"use client";

import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { WrappedExperience } from "@/components/wrapped/wrapped-experience";
import type { WrappedAdminConfig } from "@/lib/admin/wrapped-config";
import type { WrappedPayload } from "@/lib/wrapped/types";

type AdminPreviewClientProps = {
  payload?: WrappedPayload;
  config?: WrappedAdminConfig;
  includeDisabled?: boolean;
  initialSlideKey?: string;
  error?: string;
};

export function AdminPreviewClient({
  payload,
  config,
  includeDisabled = false,
  initialSlideKey,
  error,
}: AdminPreviewClientProps) {
  if (error || !payload || !config) {
    return (
      <PageShell footerCompact>
        <main className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16 text-center">
          <p className="font-display text-lg font-bold text-on-surface">
            No se pudo abrir el preview
          </p>
          <p className="mt-2 text-sm text-on-surface-variant">
            {error ?? "Faltan datos para previsualizar el Wrapped."}
          </p>
          <Link
            href="/admin"
            className="btn-primary mt-6 inline-flex items-center justify-center rounded-full px-5 py-2.5 font-display text-sm font-bold text-white"
          >
            Volver al panel
          </Link>
        </main>
      </PageShell>
    );
  }

  return (
    <WrappedExperience
      mode="preview"
      initialPayload={payload}
      wrappedConfig={config}
      includeDisabledSlides={includeDisabled}
      initialSlideKey={initialSlideKey}
    />
  );
}
