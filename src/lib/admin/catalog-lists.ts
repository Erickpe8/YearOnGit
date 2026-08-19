import { prisma } from "@/lib/db";
import {
  FEATURE_CATALOG,
  SLIDE_CATALOG,
  STAT_CATALOG,
  countSlides,
  slideName,
  type WrappedAdminConfig,
} from "@/lib/admin/wrapped-config";
import {
  matchesSearch,
  paginate,
  type ListPage,
} from "@/lib/admin/list-query";

export type AdminUserListItem = {
  id: string;
  login: string | null;
  name: string | null;
  image: string | null;
};

export type AdminLogListItem = {
  id: string;
  action: string;
  summary: string;
  actorLogin: string | null;
  createdAt: string;
};

export type SlideListItem = {
  id: string;
  name: string;
  number: number;
  enabled: boolean;
};

export type ToggleListItem = {
  id: string;
  name: string;
  enabled: boolean;
  group: "feature" | "stat";
};

export type EditionListItem = {
  id: string;
  year: number;
  enabled: boolean;
  periodStart: string;
  periodEnd: string;
  activeSlides: number;
  totalSlides: number;
};

function filterStatus<T extends { enabled: boolean }>(
  items: T[],
  status: string,
): T[] {
  if (status === "active") return items.filter((item) => item.enabled);
  if (status === "inactive") return items.filter((item) => !item.enabled);
  return items;
}

export function listSlides(
  config: WrappedAdminConfig,
  search: string,
  status: string,
  page: number,
  pageSize: number,
): ListPage<SlideListItem> {
  const items = config.slides.map((slide, index) => ({
    id: slide.id,
    name: slideName(slide.id),
    number: index + 1,
    enabled: slide.enabled,
  }));
  const filtered = filterStatus(
    items.filter((item) =>
      matchesSearch(`${item.number} ${item.name} ${item.id}`, search),
    ),
    status,
  );
  return paginate(filtered, page, pageSize);
}

export function listStats(
  config: WrappedAdminConfig,
  search: string,
  status: string,
  page: number,
  pageSize: number,
): ListPage<ToggleListItem> {
  const items = STAT_CATALOG.map((stat) => ({
    id: stat.id,
    name: stat.name,
    enabled: config.stats[stat.id],
    group: "stat" as const,
  }));
  const filtered = filterStatus(
    items.filter((item) => matchesSearch(`${item.name} ${item.id}`, search)),
    status,
  );
  return paginate(filtered, page, pageSize);
}

export function listFeatures(
  config: WrappedAdminConfig,
  search: string,
  status: string,
  page: number,
  pageSize: number,
  group: string = "all",
): ListPage<ToggleListItem> {
  const sharingIds = new Set([
    "shareWrapped",
    "copyMarkdown",
    "publicLinks",
    "publicCard",
  ]);
  const items = FEATURE_CATALOG.filter((feature) => {
    if (group === "sharing") return sharingIds.has(feature.id);
    if (group === "experience") return !sharingIds.has(feature.id);
    return true;
  }).map((feature) => ({
    id: feature.id,
    name: feature.name,
    enabled: config.features[feature.id],
    group: "feature" as const,
  }));
  const filtered = filterStatus(
    items.filter((item) => matchesSearch(`${item.name} ${item.id}`, search)),
    status,
  );
  return paginate(filtered, page, pageSize);
}

export function listEditions(
  config: WrappedAdminConfig,
  search: string,
  status: string,
  page: number,
  pageSize: number,
): ListPage<EditionListItem> {
  const counts = countSlides(config);
  const items: EditionListItem[] = [
    {
      id: String(config.wrappedYear),
      year: config.wrappedYear,
      enabled: config.wrappedEnabled,
      periodStart: config.periodStart,
      periodEnd: config.periodEnd,
      activeSlides: counts.enabled,
      totalSlides: counts.total,
    },
  ];
  const haystack = `Wrapped ${config.wrappedYear} ${config.periodStart} ${config.periodEnd}`;
  const searched = items.filter((item) => matchesSearch(haystack, search));
  const filtered = filterStatus(searched, status);
  return paginate(filtered, page, pageSize);
}

export async function listUsers(
  search: string,
  page: number,
  pageSize: number,
): Promise<ListPage<AdminUserListItem>> {
  const where = search
    ? {
        OR: [
          { login: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, login: true, name: true, image: true },
    }),
  ]);

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  return {
    items: rows,
    total,
    page,
    pageSize,
    from,
    to: Math.min((page - 1) * pageSize + rows.length, total),
  };
}

export async function listLogs(
  search: string,
  page: number,
  pageSize: number,
): Promise<ListPage<AdminLogListItem>> {
  try {
    const pattern = search ? `%${search}%` : "%";
    const countRows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*)::bigint AS count
       FROM "AdminAuditLog"
       WHERE action ILIKE $1 OR summary ILIKE $1 OR COALESCE("actorLogin", '') ILIKE $1`,
      pattern,
    );
    const total = Number(countRows[0]?.count ?? 0);
    const offset = (page - 1) * pageSize;
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        action: string;
        summary: string;
        actorLogin: string | null;
        createdAt: Date;
      }>
    >(
      `SELECT id, action, summary, "actorLogin", "createdAt"
       FROM "AdminAuditLog"
       WHERE action ILIKE $1 OR summary ILIKE $1 OR COALESCE("actorLogin", '') ILIKE $1
       ORDER BY "createdAt" DESC
       OFFSET $2 LIMIT $3`,
      pattern,
      offset,
      pageSize,
    );
    const from = total === 0 ? 0 : offset + 1;
    return {
      items: rows.map((row) => ({
        ...row,
        createdAt:
          row.createdAt instanceof Date
            ? row.createdAt.toISOString()
            : String(row.createdAt),
      })),
      total,
      page,
      pageSize,
      from,
      to: Math.min(offset + rows.length, total),
    };
  } catch {
    return paginate([], page, pageSize);
  }
}

export { SLIDE_CATALOG };
