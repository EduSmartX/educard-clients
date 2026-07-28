/**
 * Time Slots Editor — pure helpers, constants and colors
 */

import {
  SLOT_TYPE_LABELS,
  type TimetableSlot,
  type BulkSlotItem,
} from '@educard/shared';

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export const SLOT_TYPE_OPTIONS = Object.entries(SLOT_TYPE_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export const SLOT_COLORS: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  period: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' },
  lunch_break: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
  short_break: { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
  assembly: { bg: '#fae8ff', border: '#e879f9', text: '#86198f' },
  free_period: { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' },
  special: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
};

export function toInputTime(apiTime: string): string {
  if (!apiTime) return '';
  return apiTime.slice(0, 5); // "HH:MM:SS" -> "HH:MM"
}

/** Normalize a time string to HH:MM (zero-padded 24h) */
export function normalizeTime(t: string): string {
  if (!t) return '';
  const cleaned = t.trim().replace(/[^\d:]/g, '');
  const parts = cleaned.split(':');
  if (parts.length < 2) return cleaned;
  const h = parts[0].padStart(2, '0');
  const m = (parts[1] || '00').padStart(2, '0');
  return `${h}:${m}`;
}

export function toApiTime(inputTime: string): string {
  if (!inputTime) return '';
  // Normalize: ensure HH:MM:SS format
  const normalized = normalizeTime(inputTime);
  return normalized.length === 5 ? `${normalized}:00` : normalized;
}

/** Compare two HH:MM time strings numerically */
export function timeIsAfter(end: string, start: string): boolean {
  const toMinutes = (t: string): number => {
    const n = normalizeTime(t);
    const [h, m] = n.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  return toMinutes(end) > toMinutes(start);
}

export function formatTimeDisplay(t: string): string {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = Number.parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export function buildDaySlotMap(
  allSlots: TimetableSlot[],
): Record<number, BulkSlotItem[]> {
  const map: Record<number, BulkSlotItem[]> = {};
  for (const s of allSlots) {
    const item: BulkSlotItem = {
      slot_number: s.slot_number,
      slot_type: s.slot_type,
      start_time: toInputTime(s.start_time),
      end_time: toInputTime(s.end_time),
      label: s.label,
    };
    for (const day of s.days_of_week) {
      if (!map[day]) map[day] = [];
      if (
        !map[day].some(
          x =>
            x.slot_number === item.slot_number &&
            x.start_time === item.start_time,
        )
      ) {
        map[day].push(item);
      }
    }
  }
  for (const day of Object.keys(map)) {
    map[Number(day)].sort((a, b) => a.slot_number - b.slot_number);
  }
  return map;
}
