/**
 * Holiday Calendar — React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getHolidays,
  getHolidayById,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  getWorkingDayPolicy,
  createWorkingDayPolicy,
  updateWorkingDayPolicy,
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

export function useCreateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createHoliday,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: holidayKeys.all });
    },
  });
}

export function useUpdateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Holiday> }) => updateHoliday(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: holidayKeys.all });
    },
  });
}

export function useDeleteHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteHoliday,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: holidayKeys.all });
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

export function useCreateWorkingDayPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createWorkingDayPolicy,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: holidayKeys.workingDayPolicy() });
    },
  });
}

export function useUpdateWorkingDayPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkingDayPolicy> }) =>
      updateWorkingDayPolicy(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: holidayKeys.workingDayPolicy() });
    },
  });
}
