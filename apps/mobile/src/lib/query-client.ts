/**
 * Query Client singleton
 * Exported separately to avoid circular dependencies
 */

import { QueryClient } from '@tanstack/react-query';

// Create React Query client - singleton instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      // RN has no reliable online/focus signal; auto-refetch fires queries
      // repeatedly on every reconnect/focus flip, so disable both.
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

export function getQueryClient(): QueryClient {
  return queryClient;
}

export function clearQueryCache(): void {
  queryClient.clear();
}
