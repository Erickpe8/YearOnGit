"use client";

import { useEffect, useRef, useState } from "react";
import { WrappedExperience } from "@/components/wrapped/wrapped-experience";
import { IconX } from "@/components/ui/icons";
import {
  slideName,
  type SlideId,
  type WrappedAdminConfig,
} from "@/lib/admin/wrapped-config";
import type { WrappedPayload } from "@/lib/wrapped/types";

export type AdminPreviewTarget = {
  includeDisabled: boolean;
  slideKey?: string;
};

let cachedPayload: WrappedPayload | null = null;

export function AdminSlidePreviewModal({
  config,
  target,
  onClose,
}: {
  config: WrappedAdminConfig;
  target: AdminPreviewTarget;
  onClose: () => void;
}) {
  const [payload, setPayload] = useState<WrappedPayload | null>(cachedPayload);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!cachedPayload);
  const [scale, setScale] = useState(0.375);
  const viewportRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const title = target.slideKey
    ? slideName(target.slideKey as SlideId)
    : "Preview Wrapped";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (cachedPayload) {
      setPayload(cachedPayload);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    void fetch("/api/wrapped?preview=1", { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as WrappedPayload & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(body.error ?? "No se pudo cargar el preview.");
        }
        cachedPayload = body;
        setPayload(body);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : "No se pudo cargar el preview.",
        );
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const updateScale = () => {
      setScale(node.clientWidth / 1280);
    };
    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, error]);

  const previewConfig: WrappedAdminConfig = {
    ...config,
    features: {
      ...config.features,
      autoplay: false,
      ...(target.slideKey
        ? { swipeNav: false, arrowNav: false }
        : {}),
    },
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-[6px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-preview-title"
        className="admin-preview-pip"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-preview-pip__chrome">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <h2
            id="admin-preview-title"
            className="min-w-0 flex-1 truncate text-center font-display text-[11px] font-semibold text-on-surface-variant"
          >
            Preview · {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar preview"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-white/10 hover:text-on-surface"
          >
            <IconX className="h-3.5 w-3.5" />
          </button>
        </div>

        <div ref={viewportRef} className="admin-preview-pip__viewport">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <p className="font-display text-xs text-on-surface-variant">
                Cargando preview...
              </p>
            </div>
          ) : null}
          {error ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-5 text-center">
              <p className="font-display text-sm font-semibold text-on-surface">
                No pudimos abrir el preview
              </p>
              <p className="text-xs text-on-surface-variant">{error}</p>
            </div>
          ) : null}
          {!loading && !error && payload ? (
            <div
              className="admin-preview-pip__screen"
              style={{ transform: `scale(${scale})` }}
            >
              <WrappedExperience
                mode="preview"
                embedded
                initialPayload={payload}
                wrappedConfig={previewConfig}
                includeDisabledSlides={target.includeDisabled}
                initialSlideKey={target.slideKey}
                onlySlideKey={target.slideKey}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
