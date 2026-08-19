"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  EditionsListModule,
  LogsListModule,
  SlidesListModule,
  ToggleCatalogModule,
  UsersListModule,
} from "@/components/admin/admin-catalog-modules";
import {
  AdminConfirm,
  AdminToggle,
  SectionCard,
  StatusDot,
  useSaveStatus,
} from "@/components/admin/admin-ui";
import {
  AdminSlidePreviewModal,
  type AdminPreviewTarget,
} from "@/components/admin/admin-slide-preview-modal";
import { PageShell } from "@/components/layout/page-shell";
import { IconArrowLeft, IconChevronUp } from "@/components/ui/icons";
import type { AdminOverview, AppSettings } from "@/lib/admin/settings";
import { useLiveWrappedConfig } from "@/lib/admin/use-live-config";
import {
  countSlides,
  DEFAULT_WRAPPED_CONFIG,
  wrappedQueryWindow,
  type FeatureId,
  type StatId,
  type WrappedAdminConfig,
} from "@/lib/admin/wrapped-config";

type AdminModule =
  | "dashboard"
  | "status"
  | "slides"
  | "experience"
  | "stats"
  | "year"
  | "sharing"
  | "users"
  | "editions"
  | "logs"
  | "preview"
  | "system"
  | "reset";

const MODULES: Array<{ id: AdminModule; label: string }> = [
  { id: "dashboard", label: "Resumen" },
  { id: "status", label: "Estado" },
  { id: "slides", label: "Slides" },
  { id: "experience", label: "Experiencia" },
  { id: "stats", label: "Estadísticas" },
  { id: "year", label: "Año" },
  { id: "sharing", label: "Compartir" },
  { id: "users", label: "Usuarios" },
  { id: "editions", label: "Ediciones" },
  { id: "logs", label: "Logs" },
  { id: "preview", label: "Preview" },
  { id: "system", label: "Sistema" },
  { id: "reset", label: "Mantenimiento" },
];

type HealthState = {
  githubApi: "connected" | "disconnected";
  graphql: "ok" | "error";
  githubConnected: boolean;
} | null;

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

function formatDateTime(value: Date | string | null) {
  if (!value) return "Nunca";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Nunca";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

type AdminPanelProps = {
  settings: AppSettings;
  overview: AdminOverview;
  runtime: {
    appUrl: string;
    nodeEnv: string;
  };
};

export function AdminPanel({ settings, overview, runtime }: AdminPanelProps) {
  const [module, setModule] = useState<AdminModule>("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const configRef = useRef(settings.config);
  const [config, setConfig] = useState<WrappedAdminConfig>(settings.config);
  const [updatedAt, setUpdatedAt] = useState<Date | string | null>(
    settings.updatedAt,
  );
  const [health, setHealth] = useState<HealthState>(null);
  const [confirm, setConfirm] = useState<
    null | "reset" | "clear-cache" | "regenerate"
  >(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [preview, setPreview] = useState<AdminPreviewTarget | null>(null);
  const { status, setStatus, label } = useSaveStatus();
  const savingRef = useRef(false);
  const queuedRef = useRef(false);
  const baselineRef = useRef<WrappedAdminConfig | null>(null);

  const applyServer = useCallback(
    (next: WrappedAdminConfig, at: Date | string | null) => {
      configRef.current = next;
      setConfig(next);
      setUpdatedAt(at);
    },
    [],
  );

  const flush = useCallback(async () => {
    if (savingRef.current) {
      queuedRef.current = true;
      return;
    }
    savingRef.current = true;
    setStatus("saving");
    try {
      while (true) {
        const toSave = configRef.current;
        const previous = baselineRef.current ?? toSave;
        const response = await fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config: toSave, previous }),
        });
        if (!response.ok) throw new Error("save failed");
        const body = (await response.json()) as {
          config: WrappedAdminConfig;
          updatedAt: string | null;
        };
        if (configRef.current === toSave) {
          baselineRef.current = null;
          applyServer(body.config, body.updatedAt);
          break;
        }
        baselineRef.current = toSave;
      }
      setStatus("saved");
    } catch {
      try {
        const response = await fetch("/api/admin/settings");
        if (response.ok) {
          const body = (await response.json()) as {
            config: WrappedAdminConfig;
            updatedAt: string | null;
          };
          applyServer(body.config, body.updatedAt);
        }
      } catch {
      }
      setStatus("error");
    } finally {
      savingRef.current = false;
      if (queuedRef.current) {
        queuedRef.current = false;
        void flush();
      }
    }
  }, [applyServer, setStatus]);

  const persist = useCallback(
    (mutator: (current: WrappedAdminConfig) => WrappedAdminConfig) => {
      if (!baselineRef.current) {
        baselineRef.current = configRef.current;
      }
      const next = mutator(configRef.current);
      configRef.current = next;
      setConfig(next);
      void flush();
    },
    [flush],
  );

  const persistYear = useCallback(
    (next: {
      wrappedYear: number;
      periodStart: string;
      periodEnd: string;
    }) => {
      persist((current) => ({ ...current, ...next }));
    },
    [persist],
  );

  useLiveWrappedConfig((payload) => {
    if (savingRef.current) return;
    if (!payload.updatedAt) return;
    applyServer(payload.config, payload.updatedAt);
  });

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/health")
      .then((response) => (response.ok ? response.json() : null))
      .then((body: HealthState) => {
        if (!cancelled && body) setHealth(body);
      })
      .catch(() => {
        if (!cancelled) {
          setHealth({
            githubApi: "disconnected",
            graphql: "error",
            githubConnected: false,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const slideCounts = countSlides(config);
  const window = wrappedQueryWindow(config);
  const listKey = `${updatedAt ?? ""}-${config.cacheEpoch}`;

  async function runAction(action: "reset" | "clear-cache" | "regenerate") {
    setActionBusy(true);
    setStatus("saving");
    try {
      const response = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = (await response.json()) as {
        config?: WrappedAdminConfig;
        updatedAt?: string | null;
        error?: string;
      };
      if (!response.ok) throw new Error(body.error ?? "action failed");
      if (body.config) applyServer(body.config, body.updatedAt ?? null);
      setConfirm(null);
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      setActionBusy(false);
    }
  }

  const currentLabel = MODULES.find((item) => item.id === module)?.label;

  return (
    <PageShell footerCompact>
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-6 max-[390px]:px-3 md:px-8 md:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 font-display text-sm text-on-surface-variant transition-colors hover:text-primary"
          >
            <IconArrowLeft className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
            Volver
          </Link>
          {label ? (
            <p
              className={`font-display text-xs font-bold ${
                status === "error" ? "text-red-400" : "text-primary"
              }`}
            >
              {label}
            </p>
          ) : null}
        </div>

        <header className="mb-6">
          <p className="mb-2 font-display text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Year on Git
          </p>
          <h1 className="font-display text-3xl font-extrabold text-on-surface md:text-4xl">
            Panel de administración
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
            Controla el Wrapped {config.wrappedYear}.
          </p>
        </header>

        <div className="mb-4 md:hidden">
          <button
            type="button"
            onClick={() => setNavOpen((open) => !open)}
            className="glass-card flex w-full items-center justify-between rounded-2xl px-4 py-3 font-display text-sm font-semibold text-on-surface"
          >
            {currentLabel}
            <IconChevronUp
              className={`h-4 w-4 transition-transform ${navOpen ? "" : "rotate-180"}`}
            />
          </button>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <nav
            className={`${
              navOpen ? "flex" : "hidden"
            } w-full flex-wrap gap-2 md:flex md:w-52 md:shrink-0 md:flex-col`}
          >
            {MODULES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setModule(item.id);
                  setNavOpen(false);
                }}
                className={`rounded-full px-3 py-2 text-left font-display text-xs font-semibold transition-colors md:rounded-xl md:px-4 md:text-sm ${
                  module === item.id
                    ? "bg-primary/15 text-primary"
                    : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="min-w-0 flex-1 space-y-5">
            {module === "dashboard" ? (
              <DashboardModule
                config={config}
                slideCounts={slideCounts}
                health={health}
                overview={overview}
              />
            ) : null}
            {module === "status" ? (
              <StatusModule
                config={config}
                slideCounts={slideCounts}
                window={window}
                onToggle={(wrappedEnabled) =>
                  persist((current) => ({ ...current, wrappedEnabled }))
                }
              />
            ) : null}
            {module === "slides" ? (
              <SlidesListModule
                config={config}
                refreshKey={listKey}
                onToggle={(id, enabled) =>
                  persist((current) => ({
                    ...current,
                    slides: current.slides.map((slide) =>
                      slide.id === id ? { ...slide, enabled } : slide,
                    ),
                  }))
                }
                onReorder={(slides) => persist((current) => ({ ...current, slides }))}
                onPreview={(slideKey) =>
                  setPreview({ includeDisabled: true, slideKey })
                }
              />
            ) : null}
            {module === "experience" ? (
              <ToggleCatalogModule
                title="Configuración de la experiencia"
                description="Estas opciones solo afectan al Wrapped."
                path="/api/admin/features"
                group="experience"
                refreshKey={listKey}
                config={config}
                onToggle={(id, enabled) =>
                  persist((current) => ({
                    ...current,
                    features: {
                      ...current.features,
                      [id as FeatureId]: enabled,
                    },
                  }))
                }
              />
            ) : null}
            {module === "stats" ? (
              <ToggleCatalogModule
                title="Estadísticas"
                description="Si una métrica está apagada, las slides que dependen de ella no muestran datos vacíos."
                path="/api/admin/stats"
                refreshKey={listKey}
                config={config}
                onToggle={(id, enabled) =>
                  persist((current) => ({
                    ...current,
                    stats: { ...current.stats, [id as StatId]: enabled },
                  }))
                }
              />
            ) : null}
            {module === "year" ? (
              <YearModule config={config} onChange={persistYear} />
            ) : null}
            {module === "sharing" ? (
              <ToggleCatalogModule
                title="Compartir"
                description="Estado actual de cada función."
                path="/api/admin/features"
                group="sharing"
                refreshKey={listKey}
                config={config}
                onToggle={(id, enabled) =>
                  persist((current) => ({
                    ...current,
                    features: {
                      ...current.features,
                      [id as FeatureId]: enabled,
                    },
                  }))
                }
              />
            ) : null}
            {module === "users" ? <UsersListModule refreshKey={listKey} /> : null}
            {module === "editions" ? (
              <EditionsListModule refreshKey={listKey} />
            ) : null}
            {module === "logs" ? <LogsListModule refreshKey={listKey} /> : null}
            {module === "preview" ? (
              <PreviewModule
                onPreview={(includeDisabled) =>
                  setPreview({ includeDisabled })
                }
              />
            ) : null}
            {module === "system" ? (
              <SystemModule
                config={config}
                slideCounts={slideCounts}
                health={health}
                updatedAt={updatedAt}
                runtime={runtime}
              />
            ) : null}
            {module === "reset" ? <ResetModule onAsk={setConfirm} /> : null}
          </div>
        </div>
      </main>

      {confirm ? (
        <AdminConfirm
          title={
            confirm === "reset"
              ? "Restablecer configuración"
              : confirm === "clear-cache"
                ? "Limpiar cache"
                : "Regenerar estadísticas"
          }
          message={
            confirm === "reset"
              ? "¿Estás seguro de que quieres restablecer la configuración?"
              : confirm === "clear-cache"
                ? "¿Quieres invalidar la cache de configuración del Wrapped?"
                : "Esto vuelve a consultar GitHub con tu cuenta de administrador. No modifica los Wrapped de otros usuarios."
          }
          confirmLabel={
            confirm === "reset"
              ? "Restablecer"
              : confirm === "clear-cache"
                ? "Limpiar cache"
                : "Regenerar"
          }
          tone={confirm === "reset" ? "danger" : "primary"}
          busy={actionBusy}
          onCancel={() => setConfirm(null)}
          onConfirm={() => void runAction(confirm)}
        />
      ) : null}
      {preview ? (
        <AdminSlidePreviewModal
          config={config}
          target={preview}
          onClose={() => setPreview(null)}
        />
      ) : null}
    </PageShell>
  );
}

function DashboardModule({
  config,
  slideCounts,
  health,
  overview,
}: {
  config: WrappedAdminConfig;
  slideCounts: { total: number; enabled: number; disabled: number };
  health: HealthState;
  overview: AdminOverview;
}) {
  return (
    <>
      <section className="glass-card rounded-2xl p-5 md:p-7">
        <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-primary">
          Wrapped {config.wrappedYear}
        </p>
        <div className="mt-3">
          <StatusDot
            on={config.wrappedEnabled}
            labelOn="ACTIVO"
            labelOff="INACTIVO"
          />
        </div>
        <p className="mt-4 font-display text-sm text-on-surface-variant">
          {slideCounts.total} slides · {slideCounts.enabled} activas ·{" "}
          {slideCounts.disabled} desactivadas
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <DashFlag label="Autoplay" on={config.features.autoplay} />
          <DashFlag label="Confetti" on={config.features.confetti} />
          <DashFlag label="Sharing" on={config.features.shareWrapped} />
          <DashFlag label="Music" on={config.features.music} />
        </dl>
        <p className="mt-5 inline-flex items-center gap-2 text-sm text-on-surface">
          <span
            className={`h-2 w-2 rounded-full ${
              health?.githubConnected ? "bg-[#39d353]" : "bg-red-500"
            }`}
          />
          GitHub API {health?.githubConnected ? "Connected" : "Disconnected"}
        </p>
      </section>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniStat label="Usuarios" value={overview.users} />
        <MiniStat label="Shares activos" value={overview.shares} />
        <MiniStat label="Profile cards" value={overview.profileCards} />
      </div>
    </>
  );
}

function StatusModule({
  config,
  slideCounts,
  window,
  onToggle,
}: {
  config: WrappedAdminConfig;
  slideCounts: { total: number; enabled: number; disabled: number };
  window: ReturnType<typeof wrappedQueryWindow>;
  onToggle: (enabled: boolean) => void;
}) {
  return (
    <SectionCard
      title={`Wrapped ${config.wrappedYear}`}
      description="Cuando está inactivo, los usuarios normales no pueden iniciar ni ver la experiencia."
    >
      <AdminToggle
        title={config.wrappedEnabled ? "Wrapped activo" : "Wrapped inactivo"}
        description="Si está apagado, los visitantes ven que pronto llega una sorpresa. El cambio se guarda al instante."
        checked={config.wrappedEnabled}
        onChange={onToggle}
      />
      <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoItem label="Año del Wrapped" value={String(config.wrappedYear)} />
        <InfoItem label="Fecha de inicio" value={formatDate(window.periodStart)} />
        <InfoItem
          label="Fecha de finalización"
          value={formatDate(window.periodEnd)}
        />
        <InfoItem
          label="Slides activas"
          value={`${slideCounts.enabled} / ${slideCounts.total}`}
        />
      </dl>
    </SectionCard>
  );
}

function YearModule({
  config,
  onChange,
}: {
  config: WrappedAdminConfig;
  onChange: (next: {
    wrappedYear: number;
    periodStart: string;
    periodEnd: string;
  }) => void;
}) {
  const [year, setYear] = useState(String(config.wrappedYear));
  const [start, setStart] = useState(config.periodStart);
  const [end, setEnd] = useState(config.periodEnd);

  useEffect(() => {
    setYear(String(config.wrappedYear));
    setStart(config.periodStart);
    setEnd(config.periodEnd);
  }, [config.periodEnd, config.periodStart, config.wrappedYear]);

  useEffect(() => {
    const wrappedYear = Number(year);
    if (!Number.isInteger(wrappedYear)) return;
    if (
      wrappedYear === config.wrappedYear &&
      start === config.periodStart &&
      end === config.periodEnd
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      onChange({ wrappedYear, periodStart: start, periodEnd: end });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [
    config.periodEnd,
    config.periodStart,
    config.wrappedYear,
    end,
    onChange,
    start,
    year,
  ]);

  return (
    <SectionCard
      title="Configuración del año"
      description="Este período se usa en las consultas reales a GitHub. Se guarda solo al dejar de escribir."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block font-display text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
            Wrapped Year
          </span>
          <input
            type="number"
            min={2008}
            max={2100}
            value={year}
            onChange={(event) => setYear(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-display text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
            Inicio
          </span>
          <input
            type="date"
            value={start}
            onChange={(event) => setStart(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-display text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
            Fin
          </span>
          <input
            type="date"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50"
          />
        </label>
      </div>
    </SectionCard>
  );
}

function PreviewModule({
  onPreview,
}: {
  onPreview: (includeDisabled: boolean) => void;
}) {
  return (
    <SectionCard
      title="Modo preview"
      description="Visualiza el Wrapped como un usuario, sin modificar datos reales."
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => onPreview(false)}
          className="btn-primary inline-flex items-center justify-center rounded-full px-5 py-2.5 text-center font-display text-sm font-bold text-white"
        >
          Preview Wrapped
        </button>
        <button
          type="button"
          onClick={() => onPreview(true)}
          className="glass-pill inline-flex items-center justify-center px-5 py-2.5 text-center font-display text-sm font-semibold text-on-surface"
        >
          Todas las slides
        </button>
        <button
          type="button"
          onClick={() => onPreview(false)}
          className="glass-pill inline-flex items-center justify-center px-5 py-2.5 text-center font-display text-sm font-semibold text-on-surface"
        >
          Solo slides activas
        </button>
      </div>
    </SectionCard>
  );
}

function SystemModule({
  config,
  slideCounts,
  health,
  updatedAt,
  runtime,
}: {
  config: WrappedAdminConfig;
  slideCounts: { total: number; enabled: number; disabled: number };
  health: HealthState;
  updatedAt: Date | string | null;
  runtime: { appUrl: string; nodeEnv: string };
}) {
  return (
    <SectionCard
      title="Información del sistema"
      description="Sin tokens OAuth ni secretos."
    >
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoItem
          label="GitHub API"
          value={health?.githubApi === "connected" ? "Conectado" : "Desconectado"}
        />
        <InfoItem
          label="GraphQL"
          value={health?.graphql === "ok" ? "Funcionando" : "Error"}
        />
        <InfoItem
          label="Wrapped"
          value={config.wrappedEnabled ? "Activo" : "Inactivo"}
        />
        <InfoItem label="Año actual" value={String(config.wrappedYear)} />
        <InfoItem
          label="Slides activas"
          value={`${slideCounts.enabled} / ${slideCounts.total}`}
        />
        <InfoItem label="Última actualización" value={formatDateTime(updatedAt)} />
        <InfoItem label="Entorno" value={runtime.nodeEnv} />
        <InfoItem label="URL" value={runtime.appUrl} />
      </dl>
    </SectionCard>
  );
}

function ResetModule({
  onAsk,
}: {
  onAsk: (action: "reset" | "clear-cache" | "regenerate") => void;
}) {
  return (
    <SectionCard
      title="Reset / mantenimiento"
      description="Acciones peligrosas."
    >
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => onAsk("regenerate")}
          className="glass-pill px-4 py-3 text-left font-display text-sm font-semibold text-on-surface"
        >
          Regenerar estadísticas
        </button>
        <button
          type="button"
          onClick={() => onAsk("clear-cache")}
          className="glass-pill px-4 py-3 text-left font-display text-sm font-semibold text-on-surface"
        >
          Limpiar cache
        </button>
        <button
          type="button"
          onClick={() => onAsk("reset")}
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-left font-display text-sm font-semibold text-red-300"
        >
          Restablecer configuración
        </button>
        <p className="text-xs text-on-surface-variant">
          Restablecer vuelve a {DEFAULT_WRAPPED_CONFIG.wrappedYear} con todas las
          slides y funciones activas.
        </p>
      </div>
    </SectionCard>
  );
}

function DashFlag({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/3 px-3 py-2">
      <p className="font-display text-[11px] uppercase tracking-[0.12em] text-on-surface-variant">
        {label}
      </p>
      <p className="mt-1 font-display text-sm font-bold text-on-surface">
        {on ? "ON" : "OFF"}
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <p className="font-display text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-extrabold text-primary">
        {value.toLocaleString("es-ES")}
      </p>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-display text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
        {label}
      </dt>
      <dd className="mt-1 break-all text-sm text-on-surface">{value}</dd>
    </div>
  );
}
