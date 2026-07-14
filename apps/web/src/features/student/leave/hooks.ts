import { useQuery } from '@tanstack/react-query';
import { getLeaveBalance, getLeaveRequests } from './api';

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
