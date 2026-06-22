/**
 * useScreenFilters - Persists filter/search/pagination state per screen.
 *
 * Uses Zustand to keep filter state in memory so that navigating back to a
 * list screen restores the exact filters, search query, page, and scroll
 * position the user had before drilling into a detail view.
 *
 * Usage:
 *   const { filters, search, setFilter, setSearch, resetFilters } =
 *     useScreenFilters('LeaveApprovals', {
 *       status: 'pending',
 *       dateFrom: '',
 *       dateTo: '',
 *     });
 */

import { useCallback, useMemo } from 'react';
import { create } from 'zustand';

// ── Types ───────────────────────────────────────────────────────────────────────

interface ScreenState {
  filters: Record<string, string>;
  search: string;
  page: number;
  pageSize: number;
  scrollY: number;
}

interface FilterStoreState {
  screens: Record<string, ScreenState>;
  setScreenState: (screenKey: string, state: Partial<ScreenState>) => void;
  clearScreen: (screenKey: string) => void;
  clearAll: () => void;
}

interface UseScreenFiltersReturn<TDefaults extends Record<string, string>> {
  /** Current filter values */
  filters: TDefaults;
  /** Current search query */
  search: string;
  /** Current page number */
  page: number;
  /** Current page size */
  pageSize: number;
  /** Saved scroll offset */
  scrollY: number;
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
  /** Save the scroll position */
  setScrollY: (y: number) => void;
  /** Reset all filters, search, and pagination to defaults */
  resetFilters: () => void;
}

// ── Zustand Store ───────────────────────────────────────────────────────────────

export const useFilterStore = create<FilterStoreState>((set) => ({
  screens: {},

  setScreenState: (screenKey, partial) =>
    set((state) => ({
      screens: {
        ...state.screens,
        [screenKey]: {
          ...getDefaultScreenState(),
          ...state.screens[screenKey],
          ...partial,
          // Merge filters if provided
          filters: {
            ...(state.screens[screenKey]?.filters ?? {}),
            ...(partial.filters ?? {}),
          },
        },
      },
    })),

  clearScreen: (screenKey) =>
    set((state) => {
      const { [screenKey]: _, ...rest } = state.screens;
      return { screens: rest };
    }),

  clearAll: () => set({ screens: {} }),
}));

function getDefaultScreenState(): ScreenState {
  return {
    filters: {},
    search: '',
    page: 1,
    pageSize: 20,
    scrollY: 0,
  };
}

// ── Hook ────────────────────────────────────────────────────────────────────────

export function useScreenFilters<TDefaults extends Record<string, string>>(
  screenKey: string,
  defaults: TDefaults,
  options?: { defaultPageSize?: number }
): UseScreenFiltersReturn<TDefaults> {
  const store = useFilterStore();
  const screenState = store.screens[screenKey];
  const defaultPageSize = options?.defaultPageSize ?? 20;

  // Merge stored filters with defaults (stored values take precedence)
  const filters = useMemo(() => {
    const result = { ...defaults };
    if (screenState?.filters) {
      for (const key of Object.keys(defaults)) {
        if (key in screenState.filters) {
          result[key as keyof TDefaults] = screenState.filters[key] as TDefaults[keyof TDefaults];
        }
      }
    }
    return result;
  }, [defaults, screenState?.filters]);

  const search = screenState?.search ?? '';
  const page = screenState?.page ?? 1;
  const pageSize = screenState?.pageSize ?? defaultPageSize;
  const scrollY = screenState?.scrollY ?? 0;

  const setFilter = useCallback(
    <K extends keyof TDefaults>(key: K, value: TDefaults[K]) => {
      store.setScreenState(screenKey, {
        filters: { [key as string]: value },
        page: 1,
      });
    },
    [store, screenKey]
  );

  const setFilters = useCallback(
    (updates: Partial<TDefaults>) => {
      store.setScreenState(screenKey, {
        filters: updates as Record<string, string>,
        page: 1,
      });
    },
    [store, screenKey]
  );

  const setSearch = useCallback(
    (query: string) => {
      store.setScreenState(screenKey, { search: query, page: 1 });
    },
    [store, screenKey]
  );

  const setPage = useCallback(
    (newPage: number) => {
      store.setScreenState(screenKey, { page: newPage });
    },
    [store, screenKey]
  );

  const setPageSize = useCallback(
    (size: number) => {
      store.setScreenState(screenKey, { pageSize: size, page: 1 });
    },
    [store, screenKey]
  );

  const setScrollY = useCallback(
    (y: number) => {
      store.setScreenState(screenKey, { scrollY: y });
    },
    [store, screenKey]
  );

  const resetFilters = useCallback(() => {
    store.clearScreen(screenKey);
  }, [store, screenKey]);

  return {
    filters,
    search,
    page,
    pageSize,
    scrollY,
    setFilter,
    setFilters,
    setSearch,
    setPage,
    setPageSize,
    setScrollY,
    resetFilters,
  };
}
