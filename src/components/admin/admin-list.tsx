"use client";

import type { ReactNode } from "react";

export function AdminSearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full min-w-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-on-surface outline-none placeholder:text-on-surface-variant/70 focus:border-primary/50"
    />
  );
}

export function AdminStatusFilters({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const options = [
    { id: "all", label: "Todos" },
    { id: "active", label: "Activos" },
    { id: "inactive", label: "Inactivos" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`rounded-full px-3 py-1.5 font-display text-xs font-semibold ${
            value === option.id
              ? "bg-primary/15 text-primary"
              : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function AdminListStates({
  loading,
  error,
  empty,
  children,
}: {
  loading: boolean;
  error: boolean;
  empty: boolean;
  children: ReactNode;
}) {
  if (loading && empty) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-xl bg-white/6"
          />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-6 text-center text-sm text-red-300">
        No pudimos cargar los datos.
      </p>
    );
  }
  if (empty) {
    return (
      <p className="rounded-xl border border-white/8 bg-white/3 px-4 py-6 text-center text-sm text-on-surface-variant">
        No encontramos resultados.
      </p>
    );
  }
  return <>{children}</>;
}

export function AdminPagination({
  page,
  pageSize,
  total,
  from,
  to,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  from: number;
  to: number;
  onPage: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const pages = visiblePages(page, pageCount);

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-on-surface-variant">
        {total === 0
          ? "0 resultados"
          : `Mostrando ${from}–${to} de ${total}`}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="glass-pill px-3 py-1.5 text-xs disabled:opacity-40"
        >
          ← Anterior
        </button>
        {pages.map((item, index) =>
          item === "…" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1 text-xs text-on-surface-variant"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPage(item)}
              className={`min-w-8 rounded-full px-2 py-1.5 font-display text-xs font-semibold ${
                item === page
                  ? "bg-primary/15 text-primary"
                  : "text-on-surface-variant hover:bg-white/5"
              }`}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
          className="glass-pill px-3 py-1.5 text-xs disabled:opacity-40"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}

function visiblePages(current: number, total: number): Array<number | "…"> {
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  const items: Array<number | "…"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push("…");
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < total - 1) items.push("…");
  items.push(total);
  return items;
}
