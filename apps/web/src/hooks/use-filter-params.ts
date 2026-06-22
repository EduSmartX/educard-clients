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

import { useCallback, useMemo } from 'react';
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
    const result = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const urlValue = searchParams.get(key);
      if (urlValue !== null) {
        result[key as keyof TDefaults] = urlValue as TDefaults[keyof TDefaults];
      }
    }
    return result;
  }, [searchParams, defaults]);

  const search = searchParams.get(SEARCH_KEY) ?? '';

  const page = useMemo(() => {
    const p = searchParams.get(pageKey);
    return p ? Math.max(1, parseInt(p, 10) || defaultPage) : defaultPage;
  }, [searchParams, pageKey, defaultPage]);

  const pageSize = useMemo(() => {
    const ps = searchParams.get(pageSizeKey);
    return ps ? Math.max(1, parseInt(ps, 10) || defaultPageSize) : defaultPageSize;
  }, [searchParams, pageSizeKey, defaultPageSize]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Build new URLSearchParams, omitting keys whose values match defaults.
   * This keeps the URL clean — only non-default values appear.
   */
  const buildParams = useCallback(
    (overrides: Record<string, string | number | undefined>) => {
      const merged: Record<string, string> = {};

      // Current filters
      for (const key of Object.keys(defaults)) {
        const val = searchParams.get(key) ?? defaults[key];
        merged[key] = val;
      }

      // Current search & pagination
      if (search) {
        merged[SEARCH_KEY] = search;
      }
      if (page !== defaultPage) {
        merged[pageKey] = String(page);
      }
      if (pageSize !== defaultPageSize) {
        merged[pageSizeKey] = String(pageSize);
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
    [
      searchParams,
      defaults,
      search,
      page,
      pageSize,
      pageKey,
      pageSizeKey,
      defaultPage,
      defaultPageSize,
    ]
  );

  // ── Setters ─────────────────────────────────────────────────────────────────

  const setFilter = useCallback(
    <K extends keyof TDefaults>(key: K, value: TDefaults[K]) => {
      const params = buildParams({
        [key as string]: value,
        [pageKey]: undefined, // Reset page on filter change
      });
      setSearchParams(params, { replace: true });
    },
    [buildParams, setSearchParams, pageKey]
  );

  const setFilters = useCallback(
    (updates: Partial<TDefaults>) => {
      const overrides: Record<string, string | undefined> = {};
      for (const [key, value] of Object.entries(updates)) {
        overrides[key] = value as string;
      }
      overrides[pageKey] = undefined; // Reset page
      const params = buildParams(overrides);
      setSearchParams(params, { replace: true });
    },
    [buildParams, setSearchParams, pageKey]
  );

  const setSearch = useCallback(
    (query: string) => {
      const params = buildParams({
        [SEARCH_KEY]: query || undefined,
        [pageKey]: undefined, // Reset page on search
      });
      setSearchParams(params, { replace: true });
    },
    [buildParams, setSearchParams, pageKey]
  );

  const setPage = useCallback(
    (newPage: number) => {
      const params = buildParams({ [pageKey]: newPage });
      setSearchParams(params, { replace: true });
    },
    [buildParams, setSearchParams, pageKey]
  );

  const setPageSize = useCallback(
    (size: number) => {
      const params = buildParams({
        [pageSizeKey]: size,
        [pageKey]: undefined, // Reset page on page-size change
      });
      setSearchParams(params, { replace: true });
    },
    [buildParams, setSearchParams, pageSizeKey, pageKey]
  );

  const resetFilters = useCallback(() => {
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
