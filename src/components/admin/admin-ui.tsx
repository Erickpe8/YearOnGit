"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

export function AdminToggle({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      draggable={false}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!disabled) onChange(!checked);
      }}
      className={`flex w-full items-start justify-between gap-4 rounded-xl border border-white/8 bg-white/3 px-4 py-3 text-left ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      <span>
        <span className="block font-display text-sm font-semibold text-on-surface">
          {title}
        </span>
        {description ? (
          <span className="mt-1 block text-xs leading-relaxed text-on-surface-variant">
            {description}
          </span>
        ) : null}
      </span>
      <span
        aria-hidden
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

export function AdminConfirm({
  title,
  message,
  confirmLabel,
  tone = "danger",
  onCancel,
  onConfirm,
  busy = false,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md rounded-2xl p-5 md:p-6">
        <h3 className="font-display text-lg font-bold text-on-surface">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          {message}
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="glass-pill px-4 py-2 font-display text-sm font-semibold text-on-surface-variant"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-full px-4 py-2 font-display text-sm font-bold text-white disabled:opacity-70 ${
              tone === "danger" ? "bg-red-500 hover:bg-red-400" : "btn-primary"
            }`}
          >
            {busy ? "Ejecutando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function StatusDot({
  on,
  labelOn = "Activo",
  labelOff = "Inactivo",
}: {
  on: boolean;
  labelOn?: string;
  labelOff?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 font-display text-sm font-semibold">
      <span
        className={`h-2.5 w-2.5 rounded-full ${on ? "bg-[#39d353]" : "bg-red-500"}`}
      />
      <span className={on ? "text-[#39d353]" : "text-red-400"}>
        {on ? labelOn : labelOff}
      </span>
    </span>
  );
}

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="glass-card rounded-2xl p-5 md:p-7">
      <h2 className="font-display text-lg font-bold text-on-surface">{title}</h2>
      {description ? (
        <p className="mt-1 mb-5 text-sm text-on-surface-variant">{description}</p>
      ) : (
        <div className="mb-5" />
      )}
      {children}
    </section>
  );
}

export function useSaveStatus() {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  useEffect(() => {
    if (status !== "saved" && status !== "error") return;
    const timer = window.setTimeout(() => setStatus("idle"), 1800);
    return () => window.clearTimeout(timer);
  }, [status]);

  const label = useMemo(() => {
    if (status === "saving") return "Guardando...";
    if (status === "saved") return "✓ Actualizado";
    if (status === "error") return "⚠ No se pudo actualizar";
    return null;
  }, [status]);

  return { status, setStatus, label };
}
