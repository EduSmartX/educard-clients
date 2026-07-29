/**
 * useListScroll — Shared scroll-direction tracking + refresh cooldown + load-more logic
 * Eliminates ~30 lines of boilerplate duplicated in every list screen.
 */

import { useRef, useCallback } from 'react';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

interface UseListScrollOptions {
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isRefetching?: boolean;
  fetchNextPage?: () => void;
  refetch?: () => void;
  /** Minimum milliseconds between refreshes (default 3000) */
  refreshCooldown?: number;
}

export function useListScroll({
  hasNextPage,
  isFetchingNextPage,
  isRefetching,
  fetchNextPage,
  refetch,
  refreshCooldown = 3000,
}: UseListScrollOptions) {
  const scrollOffsetRef = useRef(0);
  const isScrollingDownRef = useRef(false);
  const lastRefreshRef = useRef(0);

  /** Attach to FlatList `onScroll` */
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    isScrollingDownRef.current = y > scrollOffsetRef.current;
    scrollOffsetRef.current = y;
  }, []);

  /** Attach to FlatList `onEndReached` */
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isRefetching && isScrollingDownRef.current) {
      fetchNextPage?.();
    }
  }, [hasNextPage, isFetchingNextPage, isRefetching, fetchNextPage]);

  /** Attach to RefreshControl `onRefresh` */
  const onRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshRef.current < refreshCooldown) return;
    lastRefreshRef.current = now;
    refetch?.();
  }, [refetch, refreshCooldown]);

  return { handleScroll, loadMore, onRefresh };
}
