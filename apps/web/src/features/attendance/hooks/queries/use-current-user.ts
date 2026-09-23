import { useQuery } from '@tanstack/react-query';

import { authApi } from '@/lib/api/auth-api';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: () => authApi.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
