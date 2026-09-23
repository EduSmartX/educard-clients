/**
 * React Query Hooks for Leave Balances
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type {
  ApiListResponse,
  ApiSingleResponse,
  LeaveBalance,
  LeaveBalanceQueryParams,
  LeaveBalanceSummary,
} from '../types';
import {
  fetchLeaveBalance,
  fetchMyLeaveBalances,
  fetchMyLeaveBalancesSummary,
  fetchUserLeaveBalances,
  fetchUserLeaveBalancesSummary,
} from '../api';

/**
 * Fetch leave balances for current user
 */
export function useMyLeaveBalances(
  params?: LeaveBalanceQueryParams
): UseQueryResult<ApiListResponse<LeaveBalance>> {
  return useQuery({
    queryKey: ['leave-balances', 'my', params],
    queryFn: () => fetchMyLeaveBalances(params),
  });
}

/**
 * Fetch leave balance summary for current user (dashboard)
 */
export function useMyLeaveBalancesSummary(): UseQueryResult<
  ApiSingleResponse<LeaveBalanceSummary[]>
> {
  return useQuery({
    queryKey: ['leave-balances', 'my', 'summary'],
    queryFn: fetchMyLeaveBalancesSummary,
    staleTime: 30000, // 30 seconds
    refetchOnMount: 'always',
  });
}

/**
 * Fetch leave balances for a specific user
 */
export function useUserLeaveBalances(
  userPublicId: string,
  params?: LeaveBalanceQueryParams
): UseQueryResult<ApiListResponse<LeaveBalance>> {
  return useQuery({
    queryKey: ['leave-balances', 'user', userPublicId, params],
    queryFn: () => fetchUserLeaveBalances(userPublicId, params),
    enabled: !!userPublicId,
  });
}

/**
 * Fetch leave balance summary for a specific user
 */
export function useUserLeaveBalancesSummary(
  userPublicId: string
): UseQueryResult<ApiSingleResponse<LeaveBalanceSummary[]>> {
  return useQuery({
    queryKey: ['leave-balances', 'user', userPublicId, 'summary'],
    queryFn: () => fetchUserLeaveBalancesSummary(userPublicId),
    enabled: !!userPublicId,
    staleTime: 30000, // 30 seconds
    refetchOnMount: 'always',
  });
}

/**
 * Fetch single leave balance by public_id
 */
export function useLeaveBalance(
  publicId?: string
): UseQueryResult<ApiSingleResponse<LeaveBalance>> {
  return useQuery({
    queryKey: ['leave-balance', publicId],
    queryFn: () => fetchLeaveBalance(publicId!),
    enabled: !!publicId,
  });
}
