/**
 * Custom Hook for Leave Allocations Data Fetching and Mutations
 * Handles API calls, caching, and state management with pagination
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { ErrorMessages, SuccessMessages, QUERY_KEYS } from '@/constants';
import { leaveApi } from '@/lib/api/leave-api';
import { parseApiError } from '@/lib/utils/error-handler';

interface UseLeaveAllocationsParams {
  searchQuery?: string;
  filters?: Record<string, string>;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
  readOnly?: boolean;
}

export function useLeaveAllocations({
  searchQuery = '',
  filters = {},
  page = 1,
  pageSize = 10,
  enabled = true,
  readOnly = false,
}: UseLeaveAllocationsParams = {}) {
  return useQuery({
    queryKey: ['leave-allocations', searchQuery, filters, page, pageSize, readOnly],
    queryFn: () =>
      leaveApi.getAllocations({
        search: searchQuery,
        page,
        page_size: pageSize,
        readOnly,
        ...filters,
      }),
    enabled,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });
}

export function useDeleteLeaveAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicId: string) => leaveApi.deleteAllocation(publicId),
    onSuccess: (_, __, context: unknown) => {
      const allocationName =
        context && typeof context === 'object' && 'allocationName' in context
          ? (context as { allocationName?: string }).allocationName
          : undefined;
      toast.success(SuccessMessages.LEAVE.ALLOCATION_DELETED, {
        description: allocationName ? `${allocationName} policy has been removed` : undefined,
        icon: <CheckCircle2 className="h-4 w-4" />,
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leave.allocations() });
    },
    onError: (error: unknown) => {
      const errorMessage = parseApiError(error, ErrorMessages.LEAVE.DELETE_ALLOCATION_FAILED);
      toast.error(ErrorMessages.LEAVE.DELETE_ALLOCATION_FAILED, {
        description: errorMessage,
        icon: <AlertCircle className="h-4 w-4" />,
      });
    },
  });
}
