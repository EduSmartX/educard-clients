/**
 * Timetable Types — matches backend API responses
 */

export const DAY_LABELS: Record<number, string> = {
  0: 'Monday',
  1: 'Tuesday',
  2: 'Wednesday',
  3: 'Thursday',
  4: 'Friday',
  5: 'Saturday',
  6: 'Sunday',
};

export const DAY_SHORT_LABELS: Record<number, string> = {
  0: 'Mon',
  1: 'Tue',
  2: 'Wed',
  3: 'Thu',
  4: 'Fri',
  5: 'Sat',
  6: 'Sun',
};

export const SLOT_TYPE_LABELS: Record<string, string> = {
  period: 'Period',
  lunch_break: 'Lunch Break',
  short_break: 'Short Break',
  assembly: 'Assembly',
  free_period: 'Free Period',
  special: 'Special',
};

export const BREAK_TYPES = new Set(['lunch_break', 'short_break', 'assembly']);

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

export interface TimetableEntry {
  public_id: string;
  slot_public_id: string;
  day_of_week: number;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  slot_label: string;
  slot_type: string;
  class_public_id: string;
  class_name: string;
  subject_public_id: string | null;
  subject_name: string | null;
  teacher_public_id: string | null;
  teacher_name: string | null;
  room: string;
  notes: string;
}

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
  subject_name: string | null;
  teacher_name: string | null;
  teacher_public_id: string | null;
  subject_public_id: string | null;
  room: string;
  notes: string;
}

export interface ClassTimetableResponse {
  class_group: ClassGroup | null;
  class: string;
  class_public_id: string;
  days: Record<string, ClassTimetableSlot[]>;
}

export interface MyTimetableResponse {
  teacher_name: string;
  days: Record<string, TimetableEntry[]>;
}

// Mutation Payloads

export interface ClassGroupCreatePayload {
  name: string;
  description?: string;
  display_order?: number;
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

export interface TimetableEntryCreatePayload {
  slot_public_id: string;
  day_of_week: number;
  class_public_id: string;
  subject_public_id?: string | null;
  room?: string;
  notes?: string;
}
