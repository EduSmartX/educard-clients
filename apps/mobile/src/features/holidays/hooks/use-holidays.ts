/**
 * Holiday Calendar — React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  handleMutationError,
  type MutationOptions,
} from '@/lib/mutation-utils';
import { useCriticalOperation } from '@/providers/critical-operation-context';
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
  list: (params?: FetchHolidaysParams) =>
    [...holidayKeys.all, 'list', params] as const,
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
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: createHoliday,
    onMutate: () => {
      beginCriticalOperation({
        title: 'Creating holiday',
        description: 'Updating the calendar and working-day records...',
      });
    },
    onSuccess: () => {
      showToast('success', 'Holiday created successfully');
      void qc.invalidateQueries({ queryKey: holidayKeys.all });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to create holiday', options?.onError);
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

export function useUpdateHoliday(options?: MutationOptions) {
  const qc = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Holiday> }) =>
      updateHoliday(id, data),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Updating holiday',
        description: 'Recalculating working-day records...',
      });
    },
    onSuccess: () => {
      showToast('success', 'Holiday updated successfully');
      void qc.invalidateQueries({ queryKey: holidayKeys.all });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to update holiday', options?.onError);
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

export function useDeleteHoliday(options?: MutationOptions) {
  const qc = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: deleteHoliday,
    onMutate: () => {
      beginCriticalOperation({
        title: 'Deleting holiday',
        description: 'Recalculating working-day records...',
      });
    },
    onSuccess: () => {
      showToast('success', 'Holiday deleted successfully');
      void qc.invalidateQueries({ queryKey: holidayKeys.all });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to delete holiday', options?.onError);
    },
    onSettled: () => {
      endCriticalOperation();
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
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: createWorkingDayPolicy,
    onMutate: () => {
      beginCriticalOperation({
        title: 'Saving working-day policy',
        description: 'Applying the policy across the calendar...',
      });
    },
    onSuccess: () => {
      showToast('success', 'Working day policy created successfully');
      void qc.invalidateQueries({ queryKey: holidayKeys.workingDayPolicy() });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to create working day policy',
        options?.onError,
      );
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

export function useUpdateWorkingDayPolicy(options?: MutationOptions) {
  const qc = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<WorkingDayPolicy>;
    }) => updateWorkingDayPolicy(id, data),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Updating working-day policy',
        description: 'Recalculating working days across the calendar...',
      });
    },
    onSuccess: () => {
      showToast('success', 'Working day policy updated successfully');
      void qc.invalidateQueries({ queryKey: holidayKeys.workingDayPolicy() });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to update working day policy',
        options?.onError,
      );
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

export function useSendHolidayNotification(options?: MutationOptions) {
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: (holidayIds: string[]) => sendHolidayNotification(holidayIds),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Sending notification',
        description: 'Notifying users about the holiday...',
      });
    },
    onSuccess: response => {
      showToast(
        'success',
        `Notification queued for ${response.data.count} holiday(s)`,
      );
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to send holiday notification',
        options?.onError,
      );
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}
