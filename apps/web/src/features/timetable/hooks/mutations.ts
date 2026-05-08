/**
 * Timetable Mutation Hooks
 * Uses the standard handleMutationError pattern for consistent error display.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { handleMutationError, type MutationOptions } from '@/lib/utils/mutation-utils';
import { ErrorMessages, SuccessMessages } from '@/constants';
import {
  createClassGroup,
  updateClassGroup,
  deleteClassGroup,
  addClassToGroup,
  removeClassFromGroup,
  bulkSaveSlots,
  clearDaySlots,
  createEntry,
  deleteEntry,
  type CreateEntryResult,
} from '../api/timetable-api';
import { timetableKeys } from './queries';
import type {
  ClassGroupCreatePayload,
  BulkSlotPayload,
  TimetableEntryCreatePayload,
} from '../types';

export function useCreateClassGroup(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ClassGroupCreatePayload) => createClassGroup(data),
    onSuccess: () => {
      toast.success(SuccessMessages.TIMETABLE.GROUP_CREATED);
      qc.invalidateQueries({ queryKey: timetableKeys.classGroups() });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.TIMETABLE.CREATE_GROUP_FAILED, options?.onError);
    },
  });
}

export function useUpdateClassGroup(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, data }: { publicId: string; data: ClassGroupCreatePayload }) =>
      updateClassGroup(publicId, data),
    onSuccess: () => {
      toast.success(SuccessMessages.TIMETABLE.GROUP_UPDATED);
      qc.invalidateQueries({ queryKey: timetableKeys.classGroups() });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.TIMETABLE.UPDATE_GROUP_FAILED, options?.onError);
    },
  });
}

export function useDeleteClassGroup(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => deleteClassGroup(publicId),
    onSuccess: () => {
      toast.success(SuccessMessages.TIMETABLE.GROUP_DELETED);
      qc.invalidateQueries({ queryKey: timetableKeys.classGroups() });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.TIMETABLE.DELETE_GROUP_FAILED, options?.onError);
    },
  });
}

export function useAddClassToGroup(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupPublicId,
      classPublicId,
    }: {
      groupPublicId: string;
      classPublicId: string;
    }) => addClassToGroup(groupPublicId, classPublicId),
    onSuccess: () => {
      toast.success(SuccessMessages.TIMETABLE.CLASS_ADDED);
      qc.invalidateQueries({ queryKey: timetableKeys.classGroups() });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.TIMETABLE.ADD_CLASS_FAILED, options?.onError);
    },
  });
}

export function useRemoveClassFromGroup(options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupPublicId,
      classPublicId,
    }: {
      groupPublicId: string;
      classPublicId: string;
    }) => removeClassFromGroup(groupPublicId, classPublicId),
    onSuccess: () => {
      toast.success(SuccessMessages.TIMETABLE.CLASS_REMOVED);
      qc.invalidateQueries({ queryKey: timetableKeys.classGroups() });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.TIMETABLE.REMOVE_CLASS_FAILED, options?.onError);
    },
  });
}

export function useBulkSaveSlots(groupPublicId: string, options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkSlotPayload) => bulkSaveSlots(groupPublicId, data),
    onSuccess: () => {
      toast.success(SuccessMessages.TIMETABLE.SLOTS_SAVED);
      qc.invalidateQueries({ queryKey: timetableKeys.slots(groupPublicId) });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.TIMETABLE.SAVE_SLOTS_FAILED, options?.onError);
    },
  });
}

export function useClearDaySlots(groupPublicId: string, options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (day: number) => clearDaySlots(groupPublicId, day),
    onSuccess: () => {
      toast.success(SuccessMessages.TIMETABLE.DAY_CLEARED);
      // Invalidate all slot queries for this group (with or without day filter)
      qc.invalidateQueries({
        queryKey: ['timetable', 'slots', groupPublicId],
        refetchType: 'all',
      });
      // Also invalidate class timetable views since entries were removed
      qc.invalidateQueries({
        queryKey: ['timetable', 'class-timetable'],
        refetchType: 'all',
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.TIMETABLE.CLEAR_DAY_FAILED, options?.onError);
    },
  });
}

export function useCreateEntry(classPublicId?: string, options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TimetableEntryCreatePayload) => createEntry(data),
    onSuccess: (result: CreateEntryResult) => {
      if (result.warnings?.length) {
        return;
      }

      toast.success(SuccessMessages.TIMETABLE.ENTRY_CREATED);
      if (classPublicId) {
        qc.invalidateQueries({
          queryKey: timetableKeys.classTimetable(classPublicId),
        });
      }
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.TIMETABLE.CREATE_ENTRY_FAILED, options?.onError);
    },
  });
}

export function useDeleteEntry(classPublicId?: string, options?: MutationOptions) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => deleteEntry(publicId),
    onSuccess: () => {
      toast.success(SuccessMessages.TIMETABLE.ENTRY_DELETED);
      if (classPublicId) {
        qc.invalidateQueries({
          queryKey: timetableKeys.classTimetable(classPublicId),
        });
      }
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.TIMETABLE.DELETE_ENTRY_FAILED, options?.onError);
    },
  });
}
