/**
 * Leave Management Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  handleMutationError,
  type MutationOptions,
} from '@/lib/mutation-utils';
import { showToast } from '@/utils/toast';

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
  getTeacherManagementContext,
  getUserLeaveBalances,
  getUserLeaveAllocations,
  createLeaveBalance,
  updateLeaveBalance,
  deleteLeaveBalance,
  type LeaveAllocationQueryParams,
  type LeaveReviewQueryParams,
  type CreateLeaveRequestPayload,
} from '../api/leave-api';

// Query Keys

export const leaveKeys = {
  all: ['leave'] as const,
  allocations: () => [...leaveKeys.all, 'allocations'] as const,
  allocationsList: (params?: LeaveAllocationQueryParams) =>
    [...leaveKeys.allocations(), 'list', params] as const,
  employeeAllocationsList: (params?: LeaveAllocationQueryParams) =>
    [...leaveKeys.allocations(), 'employee-list', params] as const,
  allocationDetail: (id: string) =>
    [...leaveKeys.allocations(), 'detail', id] as const,
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
export function useEmployeeLeaveAllocations(
  params?: LeaveAllocationQueryParams,
) {
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

export function useCreateLeaveAllocation(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLeaveAllocation,
    onSuccess: () => {
      showToast('success', 'Leave allocation created successfully');
      void qc.invalidateQueries({ queryKey: leaveKeys.allocations() });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to create leave allocation',
        options?.onError,
      );
    },
  });
}

export function useUpdateLeaveAllocation(options?: MutationOptions) {
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
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to update leave allocation',
        options?.onError,
      );
    },
  });
}

export function useDeleteLeaveAllocation(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLeaveAllocation,
    onSuccess: () => {
      showToast('success', 'Leave allocation deleted successfully');
      void qc.invalidateQueries({ queryKey: leaveKeys.allocations() });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to delete leave allocation',
        options?.onError,
      );
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

export function useApproveLeave(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      publicId,
      data,
    }: {
      publicId: string;
      data?: { review_comments?: string };
    }) => approveLeaveRequest(publicId, data),
    onSuccess: () => {
      showToast('success', 'Leave request approved successfully');
      void qc.invalidateQueries({ queryKey: leaveKeys.reviews() });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to approve leave request',
        options?.onError,
      );
    },
  });
}

export function useRejectLeave(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      publicId,
      data,
    }: {
      publicId: string;
      data?: { review_comments?: string };
    }) => rejectLeaveRequest(publicId, data),
    onSuccess: () => {
      showToast('success', 'Leave request rejected');
      void qc.invalidateQueries({ queryKey: leaveKeys.reviews() });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to reject leave request',
        options?.onError,
      );
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

export function useCreateLeaveRequest(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLeaveRequestPayload) => createLeaveRequest(data),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: [...leaveKeys.all, 'my-requests'],
      });
      void qc.invalidateQueries({
        queryKey: [...leaveKeys.all, 'my-balances'],
      });
      showToast('success', 'Leave request submitted successfully');
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to submit leave request',
        options?.onError,
      );
    },
  });
}

export function useCancelLeaveRequest(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => cancelMyLeaveRequest(publicId),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: [...leaveKeys.all, 'my-requests'],
      });
      void qc.invalidateQueries({
        queryKey: [...leaveKeys.all, 'my-balances'],
      });
      showToast('success', 'Leave request cancelled');
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to cancel leave request',
        options?.onError,
      );
    },
  });
}

export function useCalculateWorkingDays() {
  return useMutation({
    mutationFn: ({
      startDate,
      endDate,
    }: {
      startDate: string;
      endDate: string;
    }) => calculateWorkingDays(startDate, endDate),
  });
}

// Leave Balance Management Hooks (admin / class-teacher / supervisor)

export function useTeacherManagementContext(enabled = true) {
  return useQuery({
    queryKey: [...leaveKeys.all, 'management-context'],
    queryFn: getTeacherManagementContext,
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useUserLeaveBalances(userId?: string) {
  return useQuery({
    queryKey: [...leaveKeys.all, 'user-balances', userId],
    queryFn: () => getUserLeaveBalances(userId as string),
    enabled: !!userId,
  });
}

export function useUserLeaveAllocations(userId?: string) {
  return useQuery({
    queryKey: [...leaveKeys.all, 'user-allocations', userId],
    queryFn: () => getUserLeaveAllocations(userId as string),
    enabled: !!userId,
  });
}

export function useCreateLeaveBalance(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLeaveBalance,
    onSuccess: () => {
      showToast('success', 'Leave balance added successfully');
      void qc.invalidateQueries({
        queryKey: [...leaveKeys.all, 'user-balances'],
      });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to add leave balance',
        options?.onError,
      );
    },
  });
}

export function useUpdateLeaveBalance(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateLeaveBalance,
    onSuccess: () => {
      showToast('success', 'Leave balance updated successfully');
      void qc.invalidateQueries({
        queryKey: [...leaveKeys.all, 'user-balances'],
      });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to update leave balance',
        options?.onError,
      );
    },
  });
}

export function useDeleteLeaveBalance(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLeaveBalance,
    onSuccess: () => {
      showToast('success', 'Leave balance deleted successfully');
      void qc.invalidateQueries({
        queryKey: [...leaveKeys.all, 'user-balances'],
      });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to delete leave balance',
        options?.onError,
      );
    },
  });
}
