// Re-export timetable types from shared package
// Note: api.ts also re-exports some of these types, so we only export the ones not in api.ts here
export {
  // Types not exported from api.ts
  type SlotType,
  type ClassGroupMapping,
  type ClassGroupUpdatePayload,
  type TimetableSlotCreatePayload,
  type BulkSlotItem,
  type TimetableEntryUpdatePayload,
  type ClassTimetableSlot,
  type TimetableSlotListParams,
  type TimetableEntryListParams,
  // Constants
  DAY_LABELS,
  DAY_SHORT_LABELS,
  SLOT_TYPE_LABELS,
  SLOT_TYPE_OPTIONS,
  BREAK_TYPES,
  // Utilities
  isBreakSlot,
  getDayLabel,
  getSlotTypeLabel,
} from '@educard/shared';

export * from './hooks';
export * from './api';
