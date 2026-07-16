/**
 * Timetable API — Uses shared API factory
 */

import { createTimetableApi } from '@educard/shared';

import { apiClient } from '@/api/client';

export type {
  ClassGroup,
  TimetableSlot,
  ClassTimetableResponse,
  ClassTimetableDateResponse,
  MyTimetableResponse,
  ClassGroupCreatePayload,
  BulkSlotPayload,
  TimetableEntryCreatePayload,
  TimetableEntry,
  TimetableOverride,
  TimetableOverrideUpsertPayload,
} from '@educard/shared';

const timetableApi = createTimetableApi({ client: apiClient });

// Export individual functions for backward compatibility
export const fetchClassGroups = timetableApi.listClassGroups;
export const fetchSlots = timetableApi.listSlots;
export const fetchClassTimetable = timetableApi.getClassTimetable;
export const fetchMyTimetable = timetableApi.getMyTimetable;
export const fetchTeacherTimetable = timetableApi.getTeacherTimetable;
export const fetchClassTimetableForDate = timetableApi.getClassTimetableForDate;
export const fetchClassOverrides = timetableApi.listClassOverrides;
export const upsertOverride = timetableApi.upsertOverride;
export const deleteOverride = timetableApi.deleteOverride;
export const createClassGroup = timetableApi.createClassGroup;
export const updateClassGroup = timetableApi.updateClassGroup;
export const deleteClassGroup = timetableApi.deleteClassGroup;
export const addClassToGroup = timetableApi.addClassToGroup;
export const removeClassFromGroup = timetableApi.removeClassFromGroup;
export const bulkSaveSlots = timetableApi.bulkSaveSlots;
export const clearDaySlots = timetableApi.clearDaySlots;
export const createEntry = timetableApi.createEntry;
export const deleteEntry = timetableApi.deleteEntry;

// Also export the full API object for new code
export { timetableApi };
