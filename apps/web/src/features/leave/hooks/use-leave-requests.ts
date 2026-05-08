/**
 * React Query Hooks for Leave Requests
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type {
  ApiListResponse,
  ApiSingleResponse,
  LeaveRequest,
  LeaveRequestQueryParams,
} from '../types';
import { fetchLeaveRequest, fetchMyLeaveRequests, fetchUserLeaveRequests } from '../api';

/**
 * Fetch leave requests for current user
 */
export function useMyLeaveRequests(
  params?: LeaveRequestQueryParams
): UseQueryResult<ApiListResponse<LeaveRequest>> {
  return useQuery({
    queryKey: ['leave-requests', 'my', params],
    queryFn: () => fetchMyLeaveRequests(params),
    refetchOnMount: 'always',
  });
}

/**
 * Fetch leave requests for a specific user
 */
export function useUserLeaveRequests(
  userPublicId: string,
  params?: LeaveRequestQueryParams
): UseQueryResult<ApiListResponse<LeaveRequest>> {
  return useQuery({
    queryKey: ['leave-requests', 'user', userPublicId, params],
    queryFn: () => fetchUserLeaveRequests(userPublicId, params),
    enabled: !!userPublicId,
    refetchOnMount: 'always',
  });
}

/**
 * Fetch single leave request by public_id
 */
export function useLeaveRequest(
  publicId?: string,
  isDeleted = false
): UseQueryResult<ApiSingleResponse<LeaveRequest>> {
  return useQuery({
    queryKey: ['leave-request', publicId, isDeleted],
    queryFn: () => fetchLeaveRequest(publicId!, isDeleted),
    enabled: !!publicId,
    refetchOnMount: 'always',
  });
}
