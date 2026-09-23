import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useCriticalOperation } from '@/providers/critical-operation-context';

import {
  getStudentLeaveBalance,
  getStudentLeaveRequests,
  applyStudentLeave,
  type ApplyStudentLeavePayload,
} from './api';

export function useStudentLeaveBalance() {
  return useQuery({
    queryKey: ['student', 'leave', 'balance'],
    queryFn: getStudentLeaveBalance,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStudentLeaveRequests() {
  return useQuery({
    queryKey: ['student', 'leave', 'requests'],
    queryFn: getStudentLeaveRequests,
    staleTime: 5 * 60 * 1000,
  });
}

export function useApplyStudentLeave() {
  const qc = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: (data: ApplyStudentLeavePayload) => applyStudentLeave(data),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Submitting leave request',
        description: 'Validating balances and creating the request...',
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['student', 'leave'] });
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}
