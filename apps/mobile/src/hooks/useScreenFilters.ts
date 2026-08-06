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

import { useAuthStore } from '@/lib/auth-store';

// ── Types ───────────────────────────────────────────────────────────────────────

interface ScreenState {
  filters: Record<string, unknown>;
  search: string;
  page: number;
  pageSize: number;
  scrollY: number;
}

interface FilterStoreState {
  screens: Record<string, ScreenState>;
  setScreenState: (screenKey: string, state: Partial<ScreenState>) => void;
  replaceScreenFilters: (
    screenKey: string,
    filters: Record<string, unknown>,
  ) => void;
  clearScreen: (screenKey: string) => void;
  clearAll: () => void;
}

interface UseScreenFiltersReturn<TDefaults extends Record<string, unknown>> {
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
  /** Set multiple filter values at once (merged). Resets page to 1. */
  setFilters: (updates: Partial<TDefaults>) => void;
  /** Replace the entire filter object (e.g. from a filter modal). Resets page to 1. */
  setAllFilters: (filters: TDefaults) => void;
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

export const useFilterStore = create<FilterStoreState>(set => ({
  screens: {},

  setScreenState: (screenKey, partial) =>
    set(state => ({
      screens: {
        ...state.screens,
        [screenKey]: {
          ...getDefaultScreenState(),
          ...state.screens[screenKey],
          ...partial,
          // Merge filters if provided
          filters: {
            ...state.screens[screenKey]?.filters,
            ...partial.filters,
          },
        },
      },
    })),

  clearScreen: screenKey =>
    set(state => {
      const rest = { ...state.screens };
      delete rest[screenKey];
      return { screens: rest };
    }),

  replaceScreenFilters: (screenKey, filters) =>
    set(state => ({
      screens: {
        ...state.screens,
        [screenKey]: {
          ...getDefaultScreenState(),
          ...state.screens[screenKey],
          filters,
          page: 1,
        },
      },
    })),

  clearAll: () => set({ screens: {} }),
}));

export function clearScreenFilters(): void {
  useFilterStore.getState().clearAll();
}

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

export function useScreenFilters<TDefaults extends Record<string, unknown>>(
  screenKey: string,
  defaults: TDefaults,
  options?: { defaultPageSize?: number },
): UseScreenFiltersReturn<TDefaults> {
  const currentUserId = useAuthStore(s => s.user?.public_id ?? 'guest');
  const scopedScreenKey = `${currentUserId}:${screenKey}`;
  const store = useFilterStore();
  const screenState = store.screens[scopedScreenKey];
  const defaultPageSize = options?.defaultPageSize ?? 20;

  // Merge stored filters over defaults (stored values take precedence). Spreading
  // both keeps dynamic filter keys (e.g. filter-modal screens with empty defaults).
  const filters = useMemo(
    () => ({ ...defaults, ...(screenState?.filters ?? {}) }) as TDefaults,
    [defaults, screenState?.filters],
  );

  const search = screenState?.search ?? '';
  const page = screenState?.page ?? 1;
  const pageSize = screenState?.pageSize ?? defaultPageSize;
  const scrollY = screenState?.scrollY ?? 0;

  const setFilter = useCallback(
    <K extends keyof TDefaults>(key: K, value: TDefaults[K]) => {
      store.setScreenState(scopedScreenKey, {
        filters: { [key as string]: value },
        page: 1,
      });
    },
    [store, scopedScreenKey],
  );

  const setFilters = useCallback(
    (updates: Partial<TDefaults>) => {
      store.setScreenState(scopedScreenKey, {
        filters: updates as Record<string, unknown>,
        page: 1,
      });
    },
    [store, scopedScreenKey],
  );

  const setAllFilters = useCallback(
    (newFilters: TDefaults) => {
      store.replaceScreenFilters(scopedScreenKey, newFilters);
    },
    [store, scopedScreenKey],
  );

  const setSearch = useCallback(
    (query: string) => {
      store.setScreenState(scopedScreenKey, { search: query, page: 1 });
    },
    [store, scopedScreenKey],
  );

  const setPage = useCallback(
    (newPage: number) => {
      store.setScreenState(scopedScreenKey, { page: newPage });
    },
    [store, scopedScreenKey],
  );

  const setPageSize = useCallback(
    (size: number) => {
      store.setScreenState(scopedScreenKey, { pageSize: size, page: 1 });
    },
    [store, scopedScreenKey],
  );

  const setScrollY = useCallback(
    (y: number) => {
      store.setScreenState(scopedScreenKey, { scrollY: y });
    },
    [store, scopedScreenKey],
  );

  const resetFilters = useCallback(() => {
    store.clearScreen(scopedScreenKey);
  }, [store, scopedScreenKey]);

  return {
    filters,
    search,
    page,
    pageSize,
    scrollY,
    setFilter,
    setFilters,
    setAllFilters,
    setSearch,
    setPage,
    setPageSize,
    setScrollY,
    resetFilters,
  };
}
