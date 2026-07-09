/**
 * Timetable Types — Shared between Web and Mobile
 * Matches backend API responses
 */

// =============================================================================
// Constants
// =============================================================================

export const DAY_OF_WEEK = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
} as const;

export const DAY_LABELS: Record<number, string> = {
  0: "Monday",
  1: "Tuesday",
  2: "Wednesday",
  3: "Thursday",
  4: "Friday",
  5: "Saturday",
  6: "Sunday",
};

export const DAY_SHORT_LABELS: Record<number, string> = {
  0: "Mon",
  1: "Tue",
  2: "Wed",
  3: "Thu",
  4: "Fri",
  5: "Sat",
  6: "Sun",
};

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6] as const;
export const WEEKDAYS = [0, 1, 2, 3, 4] as const;

export const SLOT_TYPE = {
  PERIOD: "period",
  LUNCH_BREAK: "lunch_break",
  SHORT_BREAK: "short_break",
  ASSEMBLY: "assembly",
  FREE_PERIOD: "free_period",
  SPECIAL: "special",
} as const;

export type SlotType =
  | "period"
  | "lunch_break"
  | "short_break"
  | "assembly"
  | "free_period"
  | "special";

export const SLOT_TYPE_LABELS: Record<string, string> = {
  period: "Period",
  lunch_break: "Lunch Break",
  short_break: "Short Break",
  assembly: "Assembly",
  free_period: "Free Period",
  special: "Special",
};

export const SLOT_TYPE_OPTIONS = Object.entries(SLOT_TYPE_LABELS).map(
  ([value, label]) => ({
    value: value as SlotType,
    label,
  }),
);

export const BREAK_TYPES = new Set(["lunch_break", "short_break", "assembly"]);
export const ASSIGNABLE_TYPES = new Set(["period", "free_period", "special"]);

/** Check if a slot type is a break */
export function isBreakSlot(slotType: string): boolean {
  return BREAK_TYPES.has(slotType);
}

/** Get day label from day number */
export function getDayLabel(dayNumber: number, short = false): string {
  return short
    ? DAY_SHORT_LABELS[dayNumber] || ""
    : DAY_LABELS[dayNumber] || "";
}

/** Get slot type label */
export function getSlotTypeLabel(slotType: string): string {
  return SLOT_TYPE_LABELS[slotType] || slotType;
}

// =============================================================================
// Class Group Types
// =============================================================================

export interface ClassGroup {
  public_id: string;
  name: string;
  description: string;
  display_order: number;
  class_count: number;
  classes?: ClassGroupMapping[];
  created_at: string;
  updated_at: string;
}

export interface ClassGroupMapping {
  public_id: string;
  class_public_id: string;
  class_name: string;
  class_master_name: string;
  section_name: string;
}

export interface ClassGroupCreatePayload {
  name: string;
  description?: string;
  display_order?: number;
}

export interface ClassGroupUpdatePayload {
  name?: string;
  description?: string;
  display_order?: number;
}

// =============================================================================
// Timetable Slot Types
// =============================================================================

export interface TimetableSlot {
  public_id: string;
  days_of_week: number[];
  slot_number: number;
  slot_type: string;
  start_time: string;
  end_time: string;
  label: string;
  is_assignable: boolean;
  is_break: boolean;
  duration_minutes: number;
}

export interface TimetableSlotCreatePayload {
  days_of_week: number[];
  slot_number: number;
  slot_type: SlotType;
  start_time: string;
  end_time: string;
  label: string;
}

export interface BulkSlotItem {
  slot_number: number;
  slot_type: string;
  start_time: string;
  end_time: string;
  label: string;
}

export interface BulkSlotPayload {
  days_of_week: number[];
  slots: BulkSlotItem[];
}

// =============================================================================
// Timetable Entry Types
// =============================================================================

export interface TimetableEntry {
  public_id: string;
  slot_public_id: string;
  day_of_week: number;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  slot_label: string;
  slot_type: string;
  group_name: string;
  class_public_id: string;
  class_name: string;
  assignment_type: "subject" | "other";
  subject_public_id: string | null;
  subject_name: string | null;
  other_period_type: string | null;
  other_label: string | null;
  coordinator_public_id: string | null;
  coordinator_name: string | null;
  teacher_public_id: string | null;
  teacher_name: string | null;
  room: string;
  notes: string;
}

export interface TimetableEntryCreatePayload {
  slot_public_id: string;
  day_of_week: number;
  class_public_id: string;
  assignment_type?: "subject" | "other";
  subject_public_id?: string | null;
  coordinator_public_id?: string | null;
  other_period_type?: string;
  other_label?: string;
  room?: string;
  notes?: string;
}

export interface TimetableEntryUpdatePayload {
  subject_public_id?: string | null;
  teacher_public_id?: string | null;
  room?: string;
  notes?: string;
}

// =============================================================================
// Class Timetable View Types
// =============================================================================

export interface ClassTimetableSlot {
  public_id: string;
  entry_public_id: string | null;
  day_of_week: number;
  slot_number: number;
  slot_type: string;
  start_time: string;
  end_time: string;
  label: string;
  duration_minutes: number;
  is_break: boolean;
  assignment_type: "subject" | "other";
  subject_name: string | null;
  coordinator_public_id: string | null;
  coordinator_name: string | null;
  teacher_name: string | null;
  teacher_public_id: string | null;
  subject_public_id: string | null;
  other_period_type: string | null;
  other_label: string | null;
  room: string;
  notes: string;
}

export interface ClassTimetableResponse {
  class_group: ClassGroup | null;
  class: string;
  class_public_id: string;
  days: Record<string, ClassTimetableSlot[]>;
}

export type TimetableOverrideType = "substitute" | "cancelled" | "extra_class";

export interface TimetableOverride {
  override_public_id: string;
  original_entry_public_id: string;
  override_date: string;
  override_type: TimetableOverrideType;
  substitute_assignment_type: "subject" | "other";
  substitute_teacher_public_id: string | null;
  substitute_teacher_name: string | null;
  substitute_subject_public_id: string | null;
  substitute_subject_name: string | null;
  substitute_other_period_type: string | null;
  substitute_other_label: string | null;
  substitute_other_notes: string;
  extra_class_start_time: string | null;
  extra_class_end_time: string | null;
  reason: string;
}

export interface ClassTimetableDateSlot {
  slot_public_id: string;
  slot_number: number;
  slot_type: string;
  label: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_break: boolean;
  entry_public_id: string | null;
  subject_name: string | null;
  teacher_name: string | null;
  room: string;
  is_cancelled: boolean;
  override: TimetableOverride | null;
}

export interface ClassTimetableDateResponse {
  class: string;
  class_public_id: string;
  date: string;
  day_of_week: number;
  slots: ClassTimetableDateSlot[];
}

export interface ClassTimetableWeekDay {
  date: string;
  day_of_week: number;
  slots: ClassTimetableDateSlot[];
}

export interface ClassTimetableWeekResponse {
  class: string;
  class_public_id: string;
  anchor_date: string;
  week_start: string;
  week_end: string;
  days: ClassTimetableWeekDay[];
}

export interface TimetableOverrideUpsertPayload {
  original_entry_public_id: string;
  override_date: string;
  override_type: TimetableOverrideType;
  substitute_assignment_type?: "subject" | "other";
  substitute_teacher_public_id?: string | null;
  substitute_subject_public_id?: string | null;
  substitute_other_period_type?: string;
  substitute_other_label?: string;
  substitute_other_notes?: string;
  extra_class_start_time?: string | null;
  extra_class_end_time?: string | null;
  reason?: string;
}

// =============================================================================
// Teacher Timetable View Types (My Timetable)
// =============================================================================

export interface MyTimetableResponse {
  teacher_name: string;
  days: Record<string, TimetableEntry[]>;
}

// =============================================================================
// Timetable List Params
// =============================================================================

export interface TimetableSlotListParams {
  page?: number;
  page_size?: number;
  class_group?: string;
  day_of_week?: number;
  slot_type?: string;
}

export interface TimetableEntryListParams {
  page?: number;
  page_size?: number;
  class_id?: string;
  teacher_id?: string;
  day_of_week?: number;
}
