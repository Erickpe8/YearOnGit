import { prisma } from "@/lib/db";
import { getAppBaseUrl } from "@/lib/app-url";
import { recordAdminLog } from "@/lib/admin/audit";
import { summarizeConfigChanges } from "@/lib/admin/config-changelog";
import { broadcastRealtime } from "@/lib/admin/realtime-hub";
import {
  DEFAULT_WRAPPED_CONFIG,
  mergeWrappedConfig,
  type WrappedAdminConfig,
} from "@/lib/admin/wrapped-config";

export type AppSettings = {
  config: WrappedAdminConfig;
  updatedAt: Date | null;
  updatedByLogin: string | null;
};

export type AdminOverview = {
  users: number;
  shares: number;
  profileCards: number;
};

export type PublicSiteConfig = {
  wrappedEnabled: boolean;
  wrappedYear: number;
};

export type AdminUserRow = {
  id: string;
  login: string | null;
  name: string | null;
  image: string | null;
};

const DEFAULT_SETTINGS: AppSettings = {
  config: DEFAULT_WRAPPED_CONFIG,
  updatedAt: null,
  updatedByLogin: null,
};

export function publicSiteConfig(settings: AppSettings): PublicSiteConfig {
  return {
    wrappedEnabled: settings.config.wrappedEnabled,
    wrappedYear: settings.config.wrappedYear,
  };
}

export async function loadAppSettings(): Promise<AppSettings> {
  try {
    const row = await prisma.appSettings.findUnique({
      where: { id: "default" },
      select: {
        config: true,
        updatedAt: true,
        updatedByLogin: true,
        maintenanceMode: true,
      },
    });
    if (!row) return DEFAULT_SETTINGS;
    const config = mergeWrappedConfig(row.config);
    const rawConfig =
      row.config && typeof row.config === "object" && !Array.isArray(row.config)
        ? (row.config as Record<string, unknown>)
        : {};
    if (typeof rawConfig.wrappedEnabled !== "boolean" && row.maintenanceMode) {
      config.wrappedEnabled = false;
    }
    return {
      config,
      updatedAt: row.updatedAt,
      updatedByLogin: row.updatedByLogin,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function loadWrappedConfig(): Promise<WrappedAdminConfig> {
  const settings = await loadAppSettings();
  return settings.config;
}

export async function saveWrappedConfig(input: {
  config: WrappedAdminConfig;
  updatedByLogin: string;
  previous?: unknown;
  logAction?: string;
  logSummary?: string;
}): Promise<AppSettings> {
  const previous = mergeWrappedConfig(
    input.previous ?? (await loadWrappedConfig()),
  );
  const config = mergeWrappedConfig(input.config);
  const summary =
    input.logSummary ?? summarizeConfigChanges(previous, config);
  const action = input.logAction ?? "config.update";
  const now = new Date();
  const payload = {
    maintenanceMode: !config.wrappedEnabled,
    signInsEnabled: true,
    config,
    updatedAt: now,
    updatedByLogin: input.updatedByLogin,
  };

  try {
    const row = await prisma.appSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...payload },
      update: payload,
      select: { config: true, updatedAt: true, updatedByLogin: true },
    });
    const settings: AppSettings = {
      config: mergeWrappedConfig(row.config),
      updatedAt: row.updatedAt,
      updatedByLogin: row.updatedByLogin,
    };
    broadcastRealtime({
      type: "wrapped-config",
      config: settings.config,
      updatedAt: settings.updatedAt ? settings.updatedAt.toISOString() : null,
      updatedByLogin: settings.updatedByLogin,
    });
    if (summary) {
      await recordAdminLog({
        action,
        summary,
        actorLogin: input.updatedByLogin,
      });
    }
    return settings;
  } catch {
    const settings: AppSettings = {
      config,
      updatedAt: now,
      updatedByLogin: input.updatedByLogin,
    };
    broadcastRealtime({
      type: "wrapped-config",
      config: settings.config,
      updatedAt: now.toISOString(),
      updatedByLogin: settings.updatedByLogin,
    });
    if (summary) {
      await recordAdminLog({
        action,
        summary,
        actorLogin: input.updatedByLogin,
      });
    }
    return settings;
  }
}

export async function loadAdminOverview(): Promise<AdminOverview> {
  try {
    const [users, shares, cards] = await Promise.all([
      prisma.user.count(),
      prisma.wrappedShare.count({ where: { isActive: true } }),
      prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*)::bigint AS count FROM "ProfileCard"`,
      ),
    ]);
    return {
      users,
      shares,
      profileCards: Number(cards[0]?.count ?? 0),
    };
  } catch {
    return { users: 0, shares: 0, profileCards: 0 };
  }
}

export async function loadRecentAdminUsers(limit = 20): Promise<AdminUserRow[]> {
  try {
    return prisma.user.findMany({
      orderBy: { id: "desc" },
      take: limit,
      select: { id: true, login: true, name: true, image: true },
    });
  } catch {
    return [];
  }
}

export function adminRuntimeInfo() {
  return {
    appUrl: getAppBaseUrl(),
    nodeEnv: process.env.NODE_ENV ?? "development",
  };
}
