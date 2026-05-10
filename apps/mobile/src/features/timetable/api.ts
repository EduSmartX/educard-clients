/**
 * Timetable API — Uses shared API factory
 */

import {
  createTimetableApi,
  type ClassGroup,
  type TimetableSlot,
  type ClassTimetableResponse,
  type MyTimetableResponse,
  type ClassGroupCreatePayload,
  type BulkSlotPayload,
  type TimetableEntryCreatePayload,
  type TimetableEntry,
} from '@educard/shared';

import { apiClient } from '@/api/client';

// Re-export types for convenience
export type {
  ClassGroup,
  TimetableSlot,
  ClassTimetableResponse,
  MyTimetableResponse,
  ClassGroupCreatePayload,
  BulkSlotPayload,
  TimetableEntryCreatePayload,
  TimetableEntry,
};

// Create the API instance with mobile's axios client
const timetableApi = createTimetableApi({ client: apiClient });

// Export individual functions for backward compatibility
export const fetchClassGroups = timetableApi.listClassGroups;
export const fetchSlots = timetableApi.listSlots;
export const fetchClassTimetable = timetableApi.getClassTimetable;
export const fetchMyTimetable = timetableApi.getMyTimetable;
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
