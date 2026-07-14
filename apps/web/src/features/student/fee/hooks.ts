import { useQuery } from '@tanstack/react-query';
import { getFeeSummary, getFeePayments } from './api';

export function useFeeSummary() {
  return useQuery({
    queryKey: ['student', 'fee', 'summary'],
    queryFn: getFeeSummary,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeePayments() {
  return useQuery({
    queryKey: ['student', 'fee', 'payments'],
    queryFn: getFeePayments,
    staleTime: 5 * 60 * 1000,
  });
}
