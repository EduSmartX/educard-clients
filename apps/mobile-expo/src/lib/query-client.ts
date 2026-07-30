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
      retry: 2,
      refetchOnWindowFocus: false, // Disable auto-refetch to avoid state update issues
    },
  },
});

// Helper to get the query client instance
export function getQueryClient(): QueryClient {
  return queryClient;
}

// Helper to clear all query cache (used on logout)
export function clearQueryCache(): void {
  queryClient.clear();
}
