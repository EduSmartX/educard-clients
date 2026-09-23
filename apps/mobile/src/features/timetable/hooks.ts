/**
 * Timetable React Query hooks
 */

import type {
  ClassGroupCreatePayload,
  BulkSlotPayload,
  TimetableEntryCreatePayload,
  TimetableOverrideUpsertPayload,
} from '@educard/shared';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { showToast } from '@/utils/toast';
import { useCriticalOperation } from '@/providers/critical-operation-context';

import {
  fetchClassGroups,
  fetchSlots,
  fetchClassTimetable,
  fetchMyTimetable,
  fetchTeacherTimetable,
  fetchClassTimetableForDate,
  fetchClassOverrides,
  upsertOverride,
  deleteOverride,
  createClassGroup,
  updateClassGroup,
  deleteClassGroup,
  addClassToGroup,
  removeClassFromGroup,
  bulkSaveSlots,
  clearDaySlots,
  createEntry,
  deleteEntry,
} from './api';

export function useClassGroups() {
  return useQuery({
    queryKey: ['timetable', 'class-groups'],
    queryFn: fetchClassGroups,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSlots(groupId: string | undefined, day?: number) {
  return useQuery({
    queryKey: ['timetable', 'slots', groupId, day],
    queryFn: () => fetchSlots(groupId ?? '', day),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useClassTimetable(classId: string | undefined) {
  return useQuery({
    queryKey: ['timetable', 'class-timetable', classId],
    queryFn: () => fetchClassTimetable(classId ?? ''),
    enabled: !!classId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useMyTimetable() {
  return useQuery({
    queryKey: ['timetable', 'my-timetable'],
    queryFn: fetchMyTimetable,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTeacherTimetable(userPublicId: string | undefined) {
  return useQuery({
    queryKey: ['timetable', 'teacher-timetable', userPublicId],
    queryFn: () => fetchTeacherTimetable(userPublicId ?? ''),
    enabled: !!userPublicId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useClassTimetableForDate(
  classId: string | undefined,
  date: string | undefined,
) {
  return useQuery({
    queryKey: ['timetable', 'class-timetable-date', classId, date],
    queryFn: () => fetchClassTimetableForDate(classId ?? '', date ?? ''),
    enabled: !!classId && !!date,
    staleTime: 60 * 1000,
  });
}

export function useClassOverrides(classId: string | undefined, date?: string) {
  return useQuery({
    queryKey: ['timetable', 'overrides', classId, date],
    queryFn: () => fetchClassOverrides(classId ?? '', date),
    enabled: !!classId,
    staleTime: 60 * 1000,
  });
}

// Mutations

export function useCreateClassGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ClassGroupCreatePayload) => createClassGroup(data),
    onSuccess: () => {
      showToast('success', 'Class group created successfully');
      void qc.invalidateQueries({ queryKey: ['timetable', 'class-groups'] });
    },
  });
}

export function useUpdateClassGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      publicId,
      data,
    }: {
      publicId: string;
      data: ClassGroupCreatePayload;
    }) => updateClassGroup(publicId, data),
    onSuccess: () => {
      showToast('success', 'Class group updated successfully');
      void qc.invalidateQueries({ queryKey: ['timetable', 'class-groups'] });
    },
  });
}

export function useDeleteClassGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => deleteClassGroup(publicId),
    onSuccess: () => {
      showToast('success', 'Class group deleted successfully');
      void qc.invalidateQueries({ queryKey: ['timetable', 'class-groups'] });
    },
  });
}

export function useAddClassToGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, classId }: { groupId: string; classId: string }) =>
      addClassToGroup(groupId, classId),
    onSuccess: () => {
      showToast('success', 'Class added to group');
      // Membership decides which slots apply, so every timetable view is stale.
      void qc.invalidateQueries({ queryKey: ['timetable'] });
    },
  });
}

export function useRemoveClassFromGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, classId }: { groupId: string; classId: string }) =>
      removeClassFromGroup(groupId, classId),
    onSuccess: () => {
      showToast('success', 'Class removed from group');
      void qc.invalidateQueries({ queryKey: ['timetable'] });
    },
  });
}

export function useBulkSaveSlots(groupId: string) {
  const qc = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: (data: BulkSlotPayload) => bulkSaveSlots(groupId, data),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Saving timetable',
        description: 'Saving all slots for the class...',
      });
    },
    onSuccess: () => {
      showToast('success', 'Slots saved successfully');
      void qc.invalidateQueries({ queryKey: ['timetable', 'slots', groupId] });
      void qc.invalidateQueries({ queryKey: ['timetable', 'class-timetable'] });
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

export function useClearDaySlots(groupId: string) {
  const qc = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: (day: number) => clearDaySlots(groupId, day),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Clearing slots',
        description: 'Clearing the timetable slots for the day...',
      });
    },
    onSuccess: () => {
      showToast('success', 'Day slots cleared');
      void qc.invalidateQueries({ queryKey: ['timetable', 'slots', groupId] });
      void qc.invalidateQueries({ queryKey: ['timetable', 'class-timetable'] });
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

export function useCreateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TimetableEntryCreatePayload) => createEntry(data),
    onSuccess: () => {
      showToast('success', 'Timetable entry created');
      void qc.invalidateQueries({ queryKey: ['timetable', 'class-timetable'] });
    },
  });
}

export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => deleteEntry(publicId),
    onSuccess: () => {
      showToast('success', 'Timetable entry deleted');
      void qc.invalidateQueries({ queryKey: ['timetable', 'class-timetable'] });
    },
  });
}

export function useUpsertOverride(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TimetableOverrideUpsertPayload) =>
      upsertOverride(classId, data),
    onSuccess: (_data, variables) => {
      showToast('success', 'Timetable override saved');
      void qc.invalidateQueries({
        queryKey: [
          'timetable',
          'class-timetable-date',
          classId,
          variables.override_date,
        ],
      });
      void qc.invalidateQueries({
        queryKey: ['timetable', 'class-timetable', classId],
      });
      void qc.invalidateQueries({
        queryKey: ['timetable', 'overrides', classId, variables.override_date],
      });
    },
  });
}

export function useDeleteOverride(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      overridePublicId,
      date,
    }: {
      overridePublicId: string;
      date: string;
    }) => deleteOverride(overridePublicId).then(() => date),
    onSuccess: date => {
      showToast('success', 'Timetable override removed');
      void qc.invalidateQueries({
        queryKey: ['timetable', 'class-timetable-date', classId, date],
      });
      void qc.invalidateQueries({
        queryKey: ['timetable', 'class-timetable', classId],
      });
      void qc.invalidateQueries({
        queryKey: ['timetable', 'overrides', classId, date],
      });
    },
  });
}
