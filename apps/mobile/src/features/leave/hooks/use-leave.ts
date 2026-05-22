/**
 * Leave Management Hooks
 */

import { extractApiError } from '@educard/shared';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getLeaveAllocations,
  getEmployeeLeaveAllocations,
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
  cancelMyLeaveRequest,
  calculateWorkingDays,
  type LeaveAllocationQueryParams,
  type LeaveReviewQueryParams,
  type CreateLeaveRequestPayload,
} from '../api/leave-api';
import { showToast } from '@/utils/toast';

// Query Keys

export const leaveKeys = {
  all: ['leave'] as const,
  allocations: () => [...leaveKeys.all, 'allocations'] as const,
  allocationsList: (params?: LeaveAllocationQueryParams) =>
    [...leaveKeys.allocations(), 'list', params] as const,
  employeeAllocationsList: (params?: LeaveAllocationQueryParams) =>
    [...leaveKeys.allocations(), 'employee-list', params] as const,
  allocationDetail: (id: string) => [...leaveKeys.allocations(), 'detail', id] as const,
  leaveTypes: () => [...leaveKeys.all, 'leave-types'] as const,
  orgRoles: () => [...leaveKeys.all, 'org-roles'] as const,
  reviews: () => [...leaveKeys.all, 'reviews'] as const,
  reviewsList: (params?: LeaveReviewQueryParams) =>
    [...leaveKeys.reviews(), 'list', params] as const,
  reviewDetail: (id: string) => [...leaveKeys.reviews(), 'detail', id] as const,
};

// Leave Allocations Hooks

/**
 * Admin hook - full CRUD access to allocations
 */
export function useLeaveAllocations(params?: LeaveAllocationQueryParams) {
  return useQuery({
    queryKey: leaveKeys.allocationsList(params),
    queryFn: () => getLeaveAllocations(params),
    staleTime: 30_000,
  });
}

/**
 * Employee hook - read-only access to allocations
 */
export function useEmployeeLeaveAllocations(params?: LeaveAllocationQueryParams) {
  return useQuery({
    queryKey: leaveKeys.employeeAllocationsList(params),
    queryFn: () => getEmployeeLeaveAllocations(params),
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
      showToast('success', 'Leave allocation created successfully');
      void qc.invalidateQueries({ queryKey: leaveKeys.allocations() });
    },
  });
}

export function useUpdateLeaveAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      publicId,
      data,
    }: {
      publicId: string;
      data: Parameters<typeof updateLeaveAllocation>[1];
    }) => updateLeaveAllocation(publicId, data),
    onSuccess: () => {
      showToast('success', 'Leave allocation updated successfully');
      void qc.invalidateQueries({ queryKey: leaveKeys.allocations() });
    },
  });
}

export function useDeleteLeaveAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLeaveAllocation,
    onSuccess: () => {
      showToast('success', 'Leave allocation deleted successfully');
      void qc.invalidateQueries({ queryKey: leaveKeys.allocations() });
    },
  });
}

// Leave Approvals Hooks

export function useLeaveReviews(params?: LeaveReviewQueryParams) {
  return useQuery({
    queryKey: leaveKeys.reviewsList(params),
    queryFn: () => getLeaveReviews(params),
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
      showToast('success', 'Leave request approved successfully');
      void qc.invalidateQueries({ queryKey: leaveKeys.reviews() });
    },
  });
}

export function useRejectLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, data }: { publicId: string; data?: { review_comments?: string } }) =>
      rejectLeaveRequest(publicId, data),
    onSuccess: () => {
      showToast('success', 'Leave request rejected');
      void qc.invalidateQueries({ queryKey: leaveKeys.reviews() });
    },
  });
}

// My Leave Balances & Requests Hooks

export function useMyLeaveBalances() {
  return useQuery({
    queryKey: [...leaveKeys.all, 'my-balances'],
    queryFn: getMyLeaveBalances,
    staleTime: 60_000,
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
    mutationFn: (data: CreateLeaveRequestPayload) => createLeaveRequest(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...leaveKeys.all, 'my-requests'] });
      void qc.invalidateQueries({ queryKey: [...leaveKeys.all, 'my-balances'] });
      showToast('success', 'Leave request submitted successfully');
    },
    onError: (error: unknown) => {
      const message = extractApiError(error, 'Failed to submit leave request');
      showToast('error', message);
    },
  });
}

export function useCancelLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => cancelMyLeaveRequest(publicId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...leaveKeys.all, 'my-requests'] });
      void qc.invalidateQueries({ queryKey: [...leaveKeys.all, 'my-balances'] });
      showToast('success', 'Leave request cancelled');
    },
    onError: (error: unknown) => {
      const message = extractApiError(error, 'Failed to cancel leave request');
      showToast('error', message);
    },
  });
}

export function useCalculateWorkingDays() {
  return useMutation({
    mutationFn: ({ startDate, endDate }: { startDate: string; endDate: string }) =>
      calculateWorkingDays(startDate, endDate),
  });
}
