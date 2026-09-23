/**
 * useFilterParams - Syncs filter/pagination/search state with URL search params.
 *
 * When users navigate away from a list page and come back, the URL still
 * contains the filter state, so everything is restored automatically.
 *
 * Usage:
 *   const { filters, search, page, pageSize, setFilter, setSearch, setPage, setPageSize, resetFilters } =
 *     useFilterParams({
 *       search: '',
 *       status: 'all',
 *       class: 'all',
 *     }, { defaultPageSize: 25 });
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

// ── Types ───────────────────────────────────────────────────────────────────────

interface PaginationOptions {
  /** Key used in the URL for page number. Default: 'page' */
  pageKey?: string;
  /** Key used in the URL for page size. Default: 'page_size' */
  pageSizeKey?: string;
  /** Default page number. Default: 1 */
  defaultPage?: number;
  /** Default page size. Default: 10 */
  defaultPageSize?: number;
}

interface UseFilterParamsReturn<TDefaults extends Record<string, string>> {
  /** Current filter values (excluding search & pagination) */
  filters: TDefaults;
  /** Current search query */
  search: string;
  /** Current page number */
  page: number;
  /** Current page size */
  pageSize: number;
  /** Set a single filter value. Resets page to 1. */
  setFilter: <K extends keyof TDefaults>(key: K, value: TDefaults[K]) => void;
  /** Set multiple filter values at once. Resets page to 1. */
  setFilters: (updates: Partial<TDefaults>) => void;
  /** Set search query. Resets page to 1. */
  setSearch: (query: string) => void;
  /** Set the current page */
  setPage: (page: number) => void;
  /** Set the page size. Resets page to 1. */
  setPageSize: (size: number) => void;
  /** Reset all filters, search, and pagination to defaults */
  resetFilters: () => void;
  /** The raw URLSearchParams for custom usage */
  searchParams: URLSearchParams;
}

// ── Reserved keys ───────────────────────────────────────────────────────────────

const SEARCH_KEY = 'search';

// ── Hook ────────────────────────────────────────────────────────────────────────

export function useFilterParams<TDefaults extends Record<string, string>>(
  defaults: TDefaults,
  paginationOptions?: PaginationOptions
): UseFilterParamsReturn<TDefaults> {
  const [searchParams, setSearchParams] = useSearchParams();

  const pageKey = paginationOptions?.pageKey ?? 'page';
  const pageSizeKey = paginationOptions?.pageSizeKey ?? 'page_size';
  const defaultPage = paginationOptions?.defaultPage ?? 1;
  const defaultPageSize = paginationOptions?.defaultPageSize ?? 10;

  // ── Derive state from URL ───────────────────────────────────────────────────

  const filters = useMemo(() => {
    const result = { ...defaults } as Record<string, string>;
    // Read every non-reserved param, not just declared defaults, so pages that
    // pass no defaults still surface their filters.
    for (const [key, value] of searchParams.entries()) {
      if (key === SEARCH_KEY || key === pageKey || key === pageSizeKey) {
        continue;
      }
      result[key] = value;
    }
    return result as TDefaults;
  }, [searchParams, defaults, pageKey, pageSizeKey]);

  const search = searchParams.get(SEARCH_KEY) ?? '';

  const page = useMemo(() => {
    const p = searchParams.get(pageKey);
    return p ? Math.max(1, Number.parseInt(p, 10) || defaultPage) : defaultPage;
  }, [searchParams, pageKey, defaultPage]);

  const pageSize = useMemo(() => {
    const ps = searchParams.get(pageSizeKey);
    return ps ? Math.max(1, Number.parseInt(ps, 10) || defaultPageSize) : defaultPageSize;
  }, [searchParams, pageSizeKey, defaultPageSize]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Build new URLSearchParams from `current`, omitting keys whose values match
   * defaults. Takes `current` as an argument rather than closing over
   * `searchParams` so setters can compose via the functional updater — two
   * setters called in the same tick must not overwrite each other.
   */
  const buildParams = useCallback(
    (current: URLSearchParams, overrides: Record<string, string | number | undefined>) => {
      const merged: Record<string, string> = {};

      // Carry over everything already in the URL (filters, search, pagination).
      for (const [key, value] of current.entries()) {
        merged[key] = value;
      }

      // Seed declared defaults that aren't in the URL yet.
      for (const key of Object.keys(defaults)) {
        if (!(key in merged)) {
          merged[key] = defaults[key];
        }
      }

      // Apply overrides
      for (const [key, value] of Object.entries(overrides)) {
        if (value === undefined || value === '') {
          delete merged[key];
        } else {
          merged[key] = String(value);
        }
      }

      // Remove default-valued keys to keep URL clean
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(merged)) {
        const isDefaultFilter = key in defaults && value === defaults[key];
        const isDefaultPage = key === pageKey && value === String(defaultPage);
        const isDefaultPageSize = key === pageSizeKey && value === String(defaultPageSize);

        if (!isDefaultFilter && !isDefaultPage && !isDefaultPageSize && value) {
          params.set(key, value);
        }
      }

      return params;
    },
    [defaults, pageKey, pageSizeKey, defaultPage, defaultPageSize]
  );

  // ── Setters ─────────────────────────────────────────────────────────────────

  // React Router's functional updater receives the params captured at call
  // time, not a queued value, so two setters fired in the same tick would
  // overwrite each other. Accumulate through a ref instead.
  const paramsRef = useRef(searchParams);

  useEffect(() => {
    paramsRef.current = searchParams;
  }, [searchParams]);

  const commit = useCallback(
    (overrides: Record<string, string | number | undefined>) => {
      const next = buildParams(paramsRef.current, overrides);
      paramsRef.current = next;
      setSearchParams(next, { replace: true });
    },
    [buildParams, setSearchParams]
  );

  const setFilter = useCallback(
    <K extends keyof TDefaults>(key: K, value: TDefaults[K]) => {
      commit({
        [key as string]: value,
        [pageKey]: undefined, // Reset page on filter change
      });
    },
    [commit, pageKey]
  );

  const setFilters = useCallback(
    (updates: Partial<TDefaults>) => {
      const overrides: Record<string, string | undefined> = {};
      for (const [key, value] of Object.entries(updates)) {
        overrides[key] = value as string;
      }
      overrides[pageKey] = undefined; // Reset page
      commit(overrides);
    },
    [commit, pageKey]
  );

  const setSearch = useCallback(
    (query: string) => {
      commit({
        [SEARCH_KEY]: query || undefined,
        [pageKey]: undefined, // Reset page on search
      });
    },
    [commit, pageKey]
  );

  const setPage = useCallback(
    (newPage: number) => {
      commit({ [pageKey]: newPage });
    },
    [commit, pageKey]
  );

  const setPageSize = useCallback(
    (size: number) => {
      commit({
        [pageSizeKey]: size,
        [pageKey]: undefined, // Reset page on page-size change
      });
    },
    [commit, pageSizeKey, pageKey]
  );

  const resetFilters = useCallback(() => {
    paramsRef.current = new URLSearchParams();
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return {
    filters,
    search,
    page,
    pageSize,
    setFilter,
    setFilters,
    setSearch,
    setPage,
    setPageSize,
    resetFilters,
    searchParams,
  };
}
