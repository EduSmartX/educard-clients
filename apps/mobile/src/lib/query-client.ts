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
      refetchOnWindowFocus: false,
    },
  },
});

export function getQueryClient(): QueryClient {
  return queryClient;
}

export function clearQueryCache(): void {
  queryClient.clear();
}
