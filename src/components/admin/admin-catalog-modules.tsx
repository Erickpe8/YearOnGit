"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  AdminListStates,
  AdminPagination,
  AdminSearchInput,
  AdminStatusFilters,
} from "@/components/admin/admin-list";
import { AdminToggle, SectionCard, StatusDot } from "@/components/admin/admin-ui";
import { useAdminList } from "@/lib/admin/use-admin-list";
import type {
  AdminLogListItem,
  AdminUserListItem,
  EditionListItem,
  SlideListItem,
  ToggleListItem,
} from "@/lib/admin/catalog-lists";
import type { FeatureId, StatId, WrappedAdminConfig } from "@/lib/admin/wrapped-config";
import { logActionLabel, displayLogSummary } from "@/lib/admin/config-changelog";

function ListToolbar({
  search,
  onSearch,
  status,
  onStatus,
  showStatus = true,
}: {
  search: string;
  onSearch: (value: string) => void;
  status?: string;
  onStatus?: (value: string) => void;
  showStatus?: boolean;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3">
      <AdminSearchInput value={search} onChange={onSearch} />
      {showStatus && status && onStatus ? (
        <AdminStatusFilters value={status} onChange={onStatus} />
      ) : null}
    </div>
  );
}

export function SlidesListModule({
  config,
  refreshKey,
  onToggle,
  onReorder,
  onPreview,
}: {
  config: WrappedAdminConfig;
  refreshKey: string;
  onToggle: (id: string, enabled: boolean) => void;
  onReorder: (slides: WrappedAdminConfig["slides"]) => void;
  onPreview: (slideId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [dragId, setDragId] = useState<string | null>(null);
  const [gripId, setGripId] = useState<string | null>(null);
  const draggingRef = useRef(false);
  const list = useAdminList<SlideListItem>("/api/admin/slides", {
    search,
    status,
    page,
    refreshKey,
  });

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  useEffect(() => {
    const onPointerUp = () => {
      window.setTimeout(() => {
        if (!draggingRef.current) setGripId(null);
      }, 0);
    };
    window.addEventListener("pointerup", onPointerUp);
    return () => window.removeEventListener("pointerup", onPointerUp);
  }, []);

  const canDrag = !search && status === "all";
  const data = list.data;

  function move(indexInPage: number, direction: -1 | 1) {
    const item = data?.items[indexInPage];
    if (!item) return;
    const fullIndex = config.slides.findIndex((slide) => slide.id === item.id);
    const target = fullIndex + direction;
    if (fullIndex < 0 || target < 0 || target >= config.slides.length) return;
    const next = [...config.slides];
    const current = next[fullIndex];
    const swap = next[target];
    if (!current || !swap) return;
    next[fullIndex] = swap;
    next[target] = current;
    onReorder(next);
  }

  function onDrop(targetId: string) {
    draggingRef.current = false;
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setGripId(null);
      return;
    }
    const from = config.slides.findIndex((slide) => slide.id === dragId);
    const to = config.slides.findIndex((slide) => slide.id === targetId);
    if (from < 0 || to < 0) {
      setDragId(null);
      return;
    }
    const next = [...config.slides];
    const [removed] = next.splice(from, 1);
    if (!removed) {
      setDragId(null);
      return;
    }
    next.splice(to, 0, removed);
    setDragId(null);
    onReorder(next);
  }

  return (
    <SectionCard
      title="Slides"
      description="Activa, oculta o reordena slides. Nunca se eliminan. El orden se guarda al soltar."
    >
      <ListToolbar
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
      />
      <AdminListStates
        loading={list.loading}
        error={list.error}
        empty={!data || data.total === 0}
      >
        <ul className="space-y-2">
          {data?.items.map((slide, index) => {
            const enabled =
              config.slides.find((item) => item.id === slide.id)?.enabled ??
              slide.enabled;
            return (
            <li
              key={slide.id}
              draggable={canDrag && gripId === slide.id}
              onDragStart={() => {
                draggingRef.current = true;
                setDragId(slide.id);
              }}
              onDragEnd={() => {
                draggingRef.current = false;
                setDragId(null);
                setGripId(null);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => onDrop(slide.id)}
              className="flex flex-col gap-3 rounded-xl border border-white/8 bg-white/3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <button
                  type="button"
                  aria-label="Reordenar"
                  disabled={!canDrag}
                  onPointerDown={() => {
                    if (canDrag) setGripId(slide.id);
                  }}
                  className={`mt-0.5 shrink-0 rounded-md px-1 py-1 text-on-surface-variant ${
                    canDrag
                      ? "cursor-grab active:cursor-grabbing hover:bg-white/5 hover:text-on-surface"
                      : "cursor-not-allowed opacity-30"
                  }`}
                >
                  <span aria-hidden className="block font-display text-xs leading-none">
                    ⋮⋮
                  </span>
                </button>
                <div className="min-w-0">
                  <p className="font-display text-sm font-semibold text-on-surface">
                    {String(slide.number).padStart(2, "0")} — {slide.name}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {enabled ? "Visible" : "Oculta"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  aria-label="Subir"
                  onClick={() => move(index, -1)}
                  className="glass-pill px-2 py-1 text-xs"
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Bajar"
                  onClick={() => move(index, 1)}
                  className="glass-pill px-2 py-1 text-xs"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => onPreview(slide.id)}
                  className="glass-pill px-3 py-1.5 font-display text-xs font-semibold text-on-surface-variant hover:text-primary"
                >
                  Preview
                </button>
                <div className="min-w-[7.5rem]">
                  <AdminToggle
                    title={enabled ? "ON" : "OFF"}
                    checked={enabled}
                    onChange={(next) => onToggle(slide.id, next)}
                  />
                </div>
              </div>
            </li>
            );
          })}
        </ul>
      </AdminListStates>
      {data ? (
        <AdminPagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          from={data.from}
          to={data.to}
          onPage={setPage}
        />
      ) : null}
    </SectionCard>
  );
}

export function ToggleCatalogModule({
  title,
  description,
  path,
  refreshKey,
  group,
  config,
  onToggle,
}: {
  title: string;
  description: string;
  path: "/api/admin/stats" | "/api/admin/features";
  refreshKey: string;
  group?: string;
  config: WrappedAdminConfig;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const list = useAdminList<ToggleListItem>(path, {
    search,
    status,
    page,
    refreshKey,
    extra: group ? { group } : undefined,
  });
  const data = list.data;

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  return (
    <SectionCard title={title} description={description}>
      <ListToolbar
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
      />
      <AdminListStates
        loading={list.loading}
        error={list.error}
        empty={!data || data.total === 0}
      >
        <div className="space-y-2">
          {data?.items.map((item) => {
            const enabled =
              item.group === "stat"
                ? (config.stats[item.id as StatId] ?? item.enabled)
                : (config.features[item.id as FeatureId] ?? item.enabled);
            return (
              <AdminToggle
                key={item.id}
                title={item.name}
                description={enabled ? "ON" : "OFF"}
                checked={enabled}
                onChange={(next) => onToggle(item.id, next)}
              />
            );
          })}
        </div>
      </AdminListStates>
      {data ? (
        <AdminPagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          from={data.from}
          to={data.to}
          onPage={setPage}
        />
      ) : null}
    </SectionCard>
  );
}

export function UsersListModule({ refreshKey }: { refreshKey: string }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const list = useAdminList<AdminUserListItem>("/api/admin/users", {
    search,
    page,
    refreshKey,
  });
  const data = list.data;

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <SectionCard
      title="Usuarios"
      description="Cuentas que han iniciado sesión con GitHub."
    >
      <ListToolbar search={search} onSearch={setSearch} showStatus={false} />
      <AdminListStates
        loading={list.loading}
        error={list.error}
        empty={!data || data.total === 0}
      >
        <ul className="divide-y divide-white/8">
          {data?.items.map((user) => (
            <li key={user.id} className="flex items-center gap-3 py-3">
              {user.image ? (
                <Image
                  src={user.image}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full ring-1 ring-white/10"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 font-display text-xs font-bold text-primary">
                  {(user.login ?? "?").slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-semibold text-on-surface">
                  {user.name ?? user.login ?? "Sin nombre"}
                </p>
                <p className="truncate text-xs text-on-surface-variant">
                  @{user.login ?? "unknown"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </AdminListStates>
      {data ? (
        <AdminPagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          from={data.from}
          to={data.to}
          onPage={setPage}
        />
      ) : null}
    </SectionCard>
  );
}

export function LogsListModule({ refreshKey }: { refreshKey: string }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const list = useAdminList<AdminLogListItem>("/api/admin/logs", {
    search,
    page,
    refreshKey,
  });
  const data = list.data;

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <SectionCard
      title="Logs"
      description="Cada cambio queda registrado: qué se activó, se desactivó o se reordenó."
    >
      <ListToolbar search={search} onSearch={setSearch} showStatus={false} />
      <AdminListStates
        loading={list.loading}
        error={list.error}
        empty={!data || data.total === 0}
      >
        <ul className="space-y-2">
          {data?.items.map((log) => {
            const lines = displayLogSummary(log.summary);
            return (
              <li
                key={log.id}
                className="rounded-xl border border-white/8 bg-white/3 px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wide text-primary">
                    {logActionLabel(log.action)}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {log.actorLogin ? `@${log.actorLogin}` : "sistema"} ·{" "}
                    {new Intl.DateTimeFormat("es-ES", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(log.createdAt))}
                  </span>
                </div>
                {lines.length > 1 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-on-surface">
                    {lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 font-display text-sm font-semibold text-on-surface">
                    {lines[0] ?? log.summary}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </AdminListStates>
      {data ? (
        <AdminPagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          from={data.from}
          to={data.to}
          onPage={setPage}
        />
      ) : null}
    </SectionCard>
  );
}

export function EditionsListModule({ refreshKey }: { refreshKey: string }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const list = useAdminList<EditionListItem>("/api/admin/editions", {
    search,
    status,
    page,
    refreshKey,
  });
  const data = list.data;

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  return (
    <SectionCard
      title="Ediciones"
      description="Período activo del Wrapped."
    >
      <ListToolbar
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
      />
      <AdminListStates
        loading={list.loading}
        error={list.error}
        empty={!data || data.total === 0}
      >
        <ul className="space-y-2">
          {data?.items.map((edition) => (
            <li
              key={edition.id}
              className="rounded-xl border border-white/8 bg-white/3 px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-sm font-semibold text-on-surface">
                  Wrapped {edition.year}
                </p>
                <StatusDot on={edition.enabled} />
              </div>
              <p className="mt-1 text-xs text-on-surface-variant">
                {edition.periodStart} → {edition.periodEnd} ·{" "}
                {edition.activeSlides}/{edition.totalSlides} slides activas
              </p>
            </li>
          ))}
        </ul>
      </AdminListStates>
      {data ? (
        <AdminPagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          from={data.from}
          to={data.to}
          onPage={setPage}
        />
      ) : null}
    </SectionCard>
  );
}

export type { FeatureId, StatId };
