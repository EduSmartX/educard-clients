import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLeaveBalance,
  getLeaveRequests,
  applyLeaveRequest,
  type ApplyLeavePayload,
} from './api';

export function useLeaveBalance() {
  return useQuery({
    queryKey: ['student', 'leave', 'balance'],
    queryFn: getLeaveBalance,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLeaveRequests() {
  return useQuery({
    queryKey: ['student', 'leave', 'requests'],
    queryFn: getLeaveRequests,
    staleTime: 5 * 60 * 1000,
  });
}

export function useApplyLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ApplyLeavePayload) => applyLeaveRequest(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', 'leave'] });
    },
  });
}
