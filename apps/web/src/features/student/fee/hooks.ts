import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFeeSummary,
  getFeePayments,
  getFeeComponents,
  requestOptIn,
  requestOptOut,
} from './api';

export function useFeeSummary() {
  return useQuery({
    queryKey: ['student', 'fee', 'summary'],
    queryFn: getFeeSummary,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useFeePayments() {
  return useQuery({
    queryKey: ['student', 'fee', 'payments'],
    queryFn: getFeePayments,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useFeeComponents() {
  return useQuery({
    queryKey: ['student', 'fee', 'components'],
    queryFn: getFeeComponents,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useOptOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, requestNote }: { publicId: string; requestNote: string }) =>
      requestOptOut(publicId, requestNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', 'fee'] });
    },
  });
}

export function useOptIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, requestNote }: { publicId: string; requestNote: string }) =>
      requestOptIn(publicId, requestNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', 'fee'] });
    },
  });
}
