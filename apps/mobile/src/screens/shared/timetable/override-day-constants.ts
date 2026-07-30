import type { TimetableOverrideType } from '@educard/shared';

export const OVERRIDE_TYPE_OPTIONS: {
  label: string;
  value: TimetableOverrideType;
}[] = [
  { label: 'Substitute', value: 'substitute' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Extra Class', value: 'extra_class' },
];

export const ASSIGNMENT_MODE_OPTIONS = [
  { label: 'Subject', value: 'subject' },
  { label: 'Other Activity', value: 'other' },
] as const;

export const OTHER_ACTIVITY_TYPE_OPTIONS = [
  { value: 'activity', label: 'Activity' },
  { value: 'club', label: 'Club' },
  { value: 'sports', label: 'Sports' },
  { value: 'assembly', label: 'Assembly' },
  { value: 'event', label: 'Event' },
  { value: 'study_hall', label: 'Study Hall' },
];

export function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isDateStringValid(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
