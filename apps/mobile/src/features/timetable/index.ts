// Re-export timetable types from shared package
export {
  type SlotType,
  type ClassGroupMapping,
  type ClassGroupUpdatePayload,
  type TimetableSlotCreatePayload,
  type BulkSlotItem,
  type TimetableEntryUpdatePayload,
  type ClassTimetableSlot,
  type ClassTimetableDateSlot,
  type TimetableSlotListParams,
  type TimetableEntryListParams,
  type TimetableOverrideType,
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
