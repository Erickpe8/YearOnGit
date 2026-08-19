"use client";

import { useEffect, useState } from "react";
import { SEARCH_DEBOUNCE_MS, type ListPage } from "@/lib/admin/list-query";

export function useDebouncedValue<T>(value: T, delay = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}

export function useAdminList<T>(
  path: string,
  query: {
    search: string;
    page: number;
    status?: string;
    refreshKey?: number | string;
    extra?: Record<string, string>;
  },
) {
  const debouncedSearch = useDebouncedValue(query.search);
  const extraKey = JSON.stringify(query.extra ?? {});
  const [data, setData] = useState<ListPage<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.set("page", String(query.page));
    if (query.status && query.status !== "all") {
      params.set("status", query.status);
    }
    if (query.extra) {
      for (const [key, value] of Object.entries(query.extra)) {
        if (value) params.set(key, value);
      }
    }

    const controller = new AbortController();
    setLoading(true);
    setError(false);

    void fetch(`${path}?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("list failed");
        return (await response.json()) as ListPage<T>;
      })
      .then((page) => {
        setData(page);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(true);
        setLoading(false);
        console.error(err);
      });

    return () => controller.abort();
  }, [
    debouncedSearch,
    extraKey,
    path,
    query.extra,
    query.page,
    query.refreshKey,
    query.status,
  ]);

  return { data, loading, error, searchApplied: debouncedSearch };
}
