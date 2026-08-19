export type ListPage<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  from: number;
  to: number;
};

export const DEFAULT_PAGE_SIZE = 10;
export const SEARCH_DEBOUNCE_MS = 300;

export function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return parsed;
}

export function parseListQuery(url: URL) {
  const search = (url.searchParams.get("search") ?? "").trim();
  const page = parsePositiveInt(url.searchParams.get("page"), 1);
  const pageSize = Math.min(
    50,
    parsePositiveInt(url.searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
  );
  const status = url.searchParams.get("status") ?? "all";
  return { search, page, pageSize, status };
}

export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
): ListPage<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  return {
    items: slice,
    total,
    page: safePage,
    pageSize,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + slice.length, total),
  };
}

export function matchesSearch(haystack: string, search: string): boolean {
  if (!search) return true;
  return haystack.toLowerCase().includes(search.toLowerCase());
}
