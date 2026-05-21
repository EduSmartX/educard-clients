/**
 * Fee Queries - React Query hooks for fetching fee data
 */

import { useQuery } from '@tanstack/react-query';
import {
  createFeeStructureApi,
  createStudentFeeApi,
  createFeePaymentApi,
  createFeeDashboardApi,
  createParentFeeApi,
  FeeQueryKeys,
  type FeeStructureFilters,
  type PaymentFilters,
  type StudentFeeFilters,
} from '@educard/shared';
import apiClient from '@/lib/api';

// Create API instances with the web's apiClient
const feeStructureApi = createFeeStructureApi(apiClient);
const studentFeeApi = createStudentFeeApi(apiClient);
const feePaymentApi = createFeePaymentApi(apiClient);
const feeDashboardApi = createFeeDashboardApi(apiClient);
const parentFeeApi = createParentFeeApi(apiClient);

// ============================================================================
// Fee Structure Queries
// ============================================================================

export function useFeeStructures(filters?: FeeStructureFilters) {
  return useQuery({
    queryKey: [FeeQueryKeys.FEE_STRUCTURES, filters],
    queryFn: () => feeStructureApi.list(filters),
  });
}

export function useFeeStructure(id: string | undefined) {
  return useQuery({
    queryKey: [FeeQueryKeys.FEE_STRUCTURE_DETAIL, id],
    queryFn: () => feeStructureApi.get(id!),
    enabled: !!id,
  });
}

// ============================================================================
// Student Fee Queries
// ============================================================================

export function useStudentFees(filters?: StudentFeeFilters) {
  return useQuery({
    queryKey: [FeeQueryKeys.STUDENT_FEES, filters],
    queryFn: async () => {
      try {
        const data = await studentFeeApi.list(filters);
        return data;
      } catch (error) {
        console.error('[useStudentFees] Error:', error);
        throw error;
      }
    },
  });
}

export function useStudentFee(id: string | undefined) {
  return useQuery({
    queryKey: [FeeQueryKeys.STUDENT_FEE_DETAIL, id],
    queryFn: () => studentFeeApi.get(id!),
    enabled: !!id,
  });
}

// ============================================================================
// Payment Queries
// ============================================================================

export function usePayments(filters?: PaymentFilters, enabled = true) {
  return useQuery({
    queryKey: [FeeQueryKeys.PAYMENTS, filters],
    queryFn: () => feePaymentApi.list(filters),
    enabled,
  });
}

export function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: [FeeQueryKeys.PAYMENT_DETAIL, id],
    queryFn: () => feePaymentApi.get(id!),
    enabled: !!id,
  });
}

export function useRecentPayments(filters?: PaymentFilters) {
  return useQuery({
    queryKey: [FeeQueryKeys.PAYMENTS, 'recent', filters],
    queryFn: async () => {
      try {
        const data = await feePaymentApi.list(filters);
        return data;
      } catch (error) {
        console.error('[useRecentPayments] Error:', error);
        throw error;
      }
    },
  });
}

// ============================================================================
// Dashboard Queries
// ============================================================================

export function useFeeDashboard() {
  return useQuery({
    queryKey: [FeeQueryKeys.FEE_DASHBOARD],
    queryFn: async () => {
      try {
        const data = await feeDashboardApi.get();
        return data;
      } catch (error) {
        console.error('[useFeeDashboard] Error fetching dashboard:', error);
        throw error;
      }
    },
  });
}

export function useDefaulters(paidPercentageLt?: number) {
  return useQuery({
    queryKey: [FeeQueryKeys.DEFAULTERS, paidPercentageLt],
    queryFn: () => feeDashboardApi.getDefaulters(paidPercentageLt),
  });
}

// ============================================================================
// Parent Fee Queries
// ============================================================================

export function useParentFees() {
  return useQuery({
    queryKey: [FeeQueryKeys.PARENT_FEES],
    queryFn: () => parentFeeApi.list(),
  });
}

export function useParentFee(id: string | undefined) {
  return useQuery({
    queryKey: [FeeQueryKeys.PARENT_FEE_DETAIL, id],
    queryFn: () => parentFeeApi.get(id!),
    enabled: !!id,
  });
}

export function useParentPayments(feeId: string | undefined) {
  return useQuery({
    queryKey: [FeeQueryKeys.PARENT_PAYMENTS, feeId],
    queryFn: () => parentFeeApi.getPayments(feeId!),
    enabled: !!feeId,
  });
}
