/**
 * Leave Management — React Query Hooks
 */

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getLeaveAllocations,
  getLeaveAllocationById,
  createLeaveAllocation,
  updateLeaveAllocation,
  deleteLeaveAllocation,
  getLeaveReviews,
  getLeaveReviewById,
  approveLeaveRequest,
  rejectLeaveRequest,
  getMyLeaveBalances,
  getMyLeaveRequests,
  createLeaveRequest,
  cancelLeaveRequest,
  calculateWorkingDays,
  type LeaveAllocationQueryParams,
  type LeaveReviewQueryParams,
  type LeaveRequestCreatePayload,
} from '../api/leave-api';

// ============================================================================
// Query Keys
// ============================================================================

export const leaveKeys = {
  all: ['leave'] as const,
  allocations: () => [...leaveKeys.all, 'allocations'] as const,
  allocationsList: (params?: LeaveAllocationQueryParams) =>
    [...leaveKeys.allocations(), 'list', params] as const,
  allocationDetail: (id: string) => [...leaveKeys.allocations(), 'detail', id] as const,
  leaveTypes: () => [...leaveKeys.all, 'leave-types'] as const,
  orgRoles: () => [...leaveKeys.all, 'org-roles'] as const,
  reviews: () => [...leaveKeys.all, 'reviews'] as const,
  reviewsList: (params?: LeaveReviewQueryParams) =>
    [...leaveKeys.reviews(), 'list', params] as const,
  reviewDetail: (id: string) => [...leaveKeys.reviews(), 'detail', id] as const,
};

// ============================================================================
// Leave Allocations Hooks
// ============================================================================

export function useLeaveAllocations(params?: LeaveAllocationQueryParams) {
  return useQuery({
    queryKey: leaveKeys.allocationsList(params),
    queryFn: () => getLeaveAllocations(params),
    staleTime: 30_000,
  });
}

export function useLeaveAllocationDetail(publicId: string) {
  return useQuery({
    queryKey: leaveKeys.allocationDetail(publicId),
    queryFn: () => getLeaveAllocationById(publicId),
    enabled: !!publicId,
  });
}

export function useCreateLeaveAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLeaveAllocation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leaveKeys.allocations() });
    },
  });
}

export function useUpdateLeaveAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, data }: { publicId: string; data: any }) =>
      updateLeaveAllocation(publicId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leaveKeys.allocations() });
    },
  });
}

export function useDeleteLeaveAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLeaveAllocation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leaveKeys.allocations() });
    },
  });
}

// ============================================================================
// Leave Approvals Hooks
// ============================================================================

export function useLeaveReviews(params?: LeaveReviewQueryParams) {
  const pageSize = params?.page_size || 20;
  return useInfiniteQuery({
    queryKey: leaveKeys.reviewsList(params),
    queryFn: ({ pageParam = 1 }) =>
      getLeaveReviews({ ...params, page: pageParam, page_size: pageSize }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.pagination;
      if (pagination?.next) {
        return (pagination.page || 1) + 1;
      }
      return undefined;
    },
    staleTime: 30_000,
  });
}

export function useLeaveReviewDetail(publicId: string) {
  return useQuery({
    queryKey: leaveKeys.reviewDetail(publicId),
    queryFn: () => getLeaveReviewById(publicId),
    enabled: !!publicId,
  });
}

export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, data }: { publicId: string; data?: { review_comments?: string } }) =>
      approveLeaveRequest(publicId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leaveKeys.reviews() });
    },
  });
}

export function useRejectLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, data }: { publicId: string; data?: { review_comments?: string } }) =>
      rejectLeaveRequest(publicId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leaveKeys.reviews() });
    },
  });
}

// ============================================================================
// Employee Leave Balances & User Leave Requests
// ============================================================================

export function useMyLeaveBalances() {
  return useQuery({
    queryKey: [...leaveKeys.all, 'my-balances'],
    queryFn: getMyLeaveBalances,
    staleTime: 30_000,
  });
}

export function useMyLeaveRequests(params?: {
  page?: number;
  page_size?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: [...leaveKeys.all, 'my-requests', params],
    queryFn: () => getMyLeaveRequests(params),
    staleTime: 30_000,
  });
}

export function useCreateLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LeaveRequestCreatePayload) => createLeaveRequest(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leaveKeys.all });
    },
  });
}

export function useCancelLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => cancelLeaveRequest(publicId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leaveKeys.all });
    },
  });
}

export function useCalculateWorkingDays() {
  return useMutation({
    mutationFn: ({ startDate, endDate }: { startDate: string; endDate: string }) =>
      calculateWorkingDays(startDate, endDate),
  });
}
