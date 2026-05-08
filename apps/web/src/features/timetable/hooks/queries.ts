/**
 * Timetable Query Hooks
 */

import { useQuery } from '@tanstack/react-query';
import {
  fetchClassGroups,
  fetchClassGroup,
  fetchSlots,
  fetchClassTimetable,
  fetchMyTimetable,
} from '../api/timetable-api';

export const timetableKeys = {
  all: ['timetable'] as const,
  classGroups: () => [...timetableKeys.all, 'class-groups'] as const,
  classGroup: (id: string) => [...timetableKeys.all, 'class-group', id] as const,
  slots: (groupId: string, day?: number) => [...timetableKeys.all, 'slots', groupId, day] as const,
  classTimetable: (classId: string) => [...timetableKeys.all, 'class-timetable', classId] as const,
  myTimetable: () => [...timetableKeys.all, 'my-timetable'] as const,
};

export function useClassGroups() {
  return useQuery({
    queryKey: timetableKeys.classGroups(),
    queryFn: fetchClassGroups,
    staleTime: 5 * 60 * 1000,
  });
}

export function useClassGroup(publicId: string | undefined) {
  return useQuery({
    queryKey: timetableKeys.classGroup(publicId ?? ''),
    queryFn: () => fetchClassGroup(publicId!),
    enabled: !!publicId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSlots(groupPublicId: string | undefined, day?: number) {
  return useQuery({
    queryKey: timetableKeys.slots(groupPublicId ?? '', day),
    queryFn: () => fetchSlots(groupPublicId!, day),
    enabled: !!groupPublicId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useClassTimetable(classPublicId: string | undefined) {
  return useQuery({
    queryKey: timetableKeys.classTimetable(classPublicId ?? ''),
    queryFn: () => fetchClassTimetable(classPublicId!),
    enabled: !!classPublicId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useMyTimetable() {
  return useQuery({
    queryKey: timetableKeys.myTimetable(),
    queryFn: fetchMyTimetable,
    staleTime: 5 * 60 * 1000,
  });
}
