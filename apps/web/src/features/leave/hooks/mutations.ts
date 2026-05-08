/**
 * Mutation Hooks for Leave Management
 */
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type {
  ApiSingleResponse,
  CalculateWorkingDaysPayload,
  CancelLeaveRequestPayload,
  CreateLeaveRequestPayload,
  LeaveRequest,
  UpdateLeaveRequestPayload,
  WorkingDaysCalculation,
} from '../types';
import {
  calculateWorkingDays,
  cancelLeaveRequest,
  createLeaveRequest,
  deleteLeaveRequest,
  reactivateLeaveRequest,
  updateLeaveRequest,
} from '../api';

/**
 * Create a new leave request
 */
export function useCreateLeaveRequest(): UseMutationResult<
  ApiSingleResponse<LeaveRequest>,
  Error,
  CreateLeaveRequestPayload
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLeaveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
    },
  });
}

/**
 * Update an existing leave request
 */
export function useUpdateLeaveRequest(): UseMutationResult<
  ApiSingleResponse<LeaveRequest>,
  Error,
  { publicId: string; data: UpdateLeaveRequestPayload }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ publicId, data }) => updateLeaveRequest(publicId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-request', variables.publicId] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
    },
  });
}

/**
 * Cancel a leave request
 */
export function useCancelLeaveRequest(): UseMutationResult<
  ApiSingleResponse<LeaveRequest>,
  Error,
  { publicId: string; data?: CancelLeaveRequestPayload }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ publicId, data }) => cancelLeaveRequest(publicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
    },
  });
}

/**
 * Delete a leave request (soft delete)
 */
export function useDeleteLeaveRequest(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLeaveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
    },
  });
}

/**
 * Reactivate a deleted leave request
 */
export function useReactivateLeaveRequest(): UseMutationResult<
  ApiSingleResponse<LeaveRequest>,
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reactivateLeaveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
    },
  });
}

/**
 * Calculate working days for a date range
 */
export function useCalculateWorkingDays(): UseMutationResult<
  ApiSingleResponse<WorkingDaysCalculation>,
  Error,
  CalculateWorkingDaysPayload
> {
  return useMutation({
    mutationFn: calculateWorkingDays,
  });
}

/**
 * Approve a leave request (for reviewers)
 */
export function useApproveLeaveRequest(): UseMutationResult<
  void,
  Error,
  { publicId: string; comments: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ publicId, comments }) => {
      const api = (await import('@/lib/api')).default;
      await api.post(`/leave/employee/reviews/${publicId}/approve/`, { comments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-request-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });
}

/**
 * Reject a leave request (for reviewers)
 */
export function useRejectLeaveRequest(): UseMutationResult<
  void,
  Error,
  { publicId: string; comments: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ publicId, comments }) => {
      const api = (await import('@/lib/api')).default;
      await api.post(`/leave/employee/reviews/${publicId}/reject/`, { comments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-request-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });
}

/**
 * Delete a leave balance
 */
export function useDeleteLeaveBalance(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (balanceId: string) => {
      const api = (await import('@/lib/api')).default;
      await api.delete(`/leave/employee/balances/${balanceId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      queryClient.invalidateQueries({ queryKey: ['user-leave-balances'] });
    },
  });
}

/**
 * Create a leave balance
 */
export function useCreateLeaveBalance(): UseMutationResult<
  unknown,
  Error,
  { leave_allocation: string; total_allocated: number; user: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const api = (await import('@/lib/api')).default;
      const response = await api.post('/leave/employee/balances/', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      queryClient.invalidateQueries({ queryKey: ['user-leave-balances'] });
    },
  });
}

/**
 * Update a leave balance
 */
export function useUpdateLeaveBalance(): UseMutationResult<
  unknown,
  Error,
  { public_id: string; total_allocated: number; carried_forward: number }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const api = (await import('@/lib/api')).default;
      const response = await api.patch(`/leave/employee/balances/${payload.public_id}/`, {
        total_allocated: payload.total_allocated,
        carried_forward: payload.carried_forward,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      queryClient.invalidateQueries({ queryKey: ['user-leave-balances'] });
    },
  });
}
