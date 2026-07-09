/**
 * Timetable Types — Re-exports from @educard/shared
 * Single source of truth for Web and Mobile
 */

// Re-export all timetable types from shared package
export {
  // Types
  type SlotType,
  type ClassGroup,
  type ClassGroupMapping,
  type ClassGroupCreatePayload,
  type ClassGroupUpdatePayload,
  type TimetableSlot,
  type TimetableSlotCreatePayload,
  type BulkSlotItem,
  type BulkSlotPayload,
  type TimetableEntry,
  type TimetableEntryCreatePayload,
  type TimetableEntryUpdatePayload,
  type ClassTimetableSlot,
  type ClassTimetableResponse,
  type ClassTimetableDateSlot,
  type ClassTimetableDateResponse,
  type ClassTimetableWeekDay,
  type ClassTimetableWeekResponse,
  type MyTimetableResponse,
  type TimetableOverrideType,
  type TimetableOverride,
  type TimetableOverrideUpsertPayload,
  type TimetableSlotListParams,
  type TimetableEntryListParams,
  // Constants
  DAY_OF_WEEK,
  DAY_LABELS,
  DAY_SHORT_LABELS,
  ALL_DAYS,
  WEEKDAYS,
  SLOT_TYPE,
  SLOT_TYPE_LABELS,
  SLOT_TYPE_OPTIONS,
  BREAK_TYPES,
  ASSIGNABLE_TYPES,
  // Utilities
  isBreakSlot,
  getDayLabel,
  getSlotTypeLabel,
} from '@educard/shared';

import type { TimetableEntry as _TimetableEntry } from '@educard/shared';

/** Row structure for the teacher weekly grid view */
export interface TeacherSlotRow {
  slotLabel: string;
  startTime: string;
  endTime: string;
  slotType: string;
  entries: Record<string, _TimetableEntry | null>;
}
