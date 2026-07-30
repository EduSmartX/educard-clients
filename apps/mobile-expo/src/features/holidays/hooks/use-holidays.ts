/**
 * Holiday Calendar — React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { handleMutationError, type MutationOptions } from '@/lib/mutation-utils';
import { showToast } from '@/utils/toast';

import {
  getHolidays,
  getHolidayById,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  getWorkingDayPolicy,
  createWorkingDayPolicy,
  updateWorkingDayPolicy,
  sendHolidayNotification,
  type FetchHolidaysParams,
  type Holiday,
  type WorkingDayPolicy,
} from '../api/holidays-api';

export const holidayKeys = {
  all: ['holidays'] as const,
  list: (params?: FetchHolidaysParams) => [...holidayKeys.all, 'list', params] as const,
  detail: (id: string) => [...holidayKeys.all, 'detail', id] as const,
  workingDayPolicy: () => [...holidayKeys.all, 'working-day-policy'] as const,
};

export function useHolidays(params?: FetchHolidaysParams) {
  return useQuery({
    queryKey: holidayKeys.list(params),
    queryFn: () => getHolidays(params),
    staleTime: 60_000,
  });
}

export function useHolidayDetail(id: string) {
  return useQuery({
    queryKey: holidayKeys.detail(id),
    queryFn: () => getHolidayById(id),
    enabled: !!id,
  });
}

export function useCreateHoliday(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createHoliday,
    onSuccess: () => {
      showToast('success', 'Holiday created successfully');
      void qc.invalidateQueries({ queryKey: holidayKeys.all });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to create holiday', options?.onError);
    },
  });
}

export function useUpdateHoliday(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Holiday> }) => updateHoliday(id, data),
    onSuccess: () => {
      showToast('success', 'Holiday updated successfully');
      void qc.invalidateQueries({ queryKey: holidayKeys.all });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to update holiday', options?.onError);
    },
  });
}

export function useDeleteHoliday(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteHoliday,
    onSuccess: () => {
      showToast('success', 'Holiday deleted successfully');
      void qc.invalidateQueries({ queryKey: holidayKeys.all });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to delete holiday', options?.onError);
    },
  });
}

export function useWorkingDayPolicy() {
  return useQuery({
    queryKey: holidayKeys.workingDayPolicy(),
    queryFn: getWorkingDayPolicy,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateWorkingDayPolicy(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createWorkingDayPolicy,
    onSuccess: () => {
      showToast('success', 'Working day policy created successfully');
      void qc.invalidateQueries({ queryKey: holidayKeys.workingDayPolicy() });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to create working day policy', options?.onError);
    },
  });
}

export function useUpdateWorkingDayPolicy(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkingDayPolicy> }) =>
      updateWorkingDayPolicy(id, data),
    onSuccess: () => {
      showToast('success', 'Working day policy updated successfully');
      void qc.invalidateQueries({ queryKey: holidayKeys.workingDayPolicy() });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to update working day policy', options?.onError);
    },
  });
}

export function useSendHolidayNotification(options?: MutationOptions) {
  return useMutation({
    mutationFn: (holidayIds: string[]) => sendHolidayNotification(holidayIds),
    onSuccess: (response) => {
      showToast('success', `Notification queued for ${response.data.count} holiday(s)`);
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to send holiday notification', options?.onError);
    },
  });
}
