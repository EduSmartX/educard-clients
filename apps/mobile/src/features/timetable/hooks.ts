/**
 * Timetable React Query hooks
 */

import type {
  ClassGroupCreatePayload,
  BulkSlotPayload,
  TimetableEntryCreatePayload,
} from '@educard/shared';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchClassGroups,
  fetchSlots,
  fetchClassTimetable,
  fetchMyTimetable,
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

// Mutations

export function useCreateClassGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ClassGroupCreatePayload) => createClassGroup(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable', 'class-groups'] }),
  });
}

export function useUpdateClassGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, data }: { publicId: string; data: ClassGroupCreatePayload }) =>
      updateClassGroup(publicId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable', 'class-groups'] }),
  });
}

export function useDeleteClassGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => deleteClassGroup(publicId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable', 'class-groups'] }),
  });
}

export function useAddClassToGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, classId }: { groupId: string; classId: string }) =>
      addClassToGroup(groupId, classId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable', 'class-groups'] }),
  });
}

export function useRemoveClassFromGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, classId }: { groupId: string; classId: string }) =>
      removeClassFromGroup(groupId, classId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable', 'class-groups'] }),
  });
}

export function useBulkSaveSlots(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkSlotPayload) => bulkSaveSlots(groupId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'slots', groupId] });
      void qc.invalidateQueries({ queryKey: ['timetable', 'class-timetable'] });
    },
  });
}

export function useClearDaySlots(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (day: number) => clearDaySlots(groupId, day),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['timetable', 'slots', groupId] });
      void qc.invalidateQueries({ queryKey: ['timetable', 'class-timetable'] });
    },
  });
}

export function useCreateEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TimetableEntryCreatePayload) => createEntry(data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['timetable', 'class-timetable'] }),
  });
}

export function useDeleteEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => deleteEntry(publicId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timetable', 'class-timetable'] }),
  });
}
