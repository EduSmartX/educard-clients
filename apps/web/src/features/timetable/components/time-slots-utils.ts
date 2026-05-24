import { Clock, Coffee, BookOpen } from 'lucide-react';

import { SLOT_TYPE, type BulkSlotItem, type TimetableSlot } from '../types';

export const SLOT_TYPE_COLORS: Record<string, string> = {
  period: 'bg-blue-50 border-blue-200 text-blue-700',
  lunch_break: 'bg-amber-50 border-amber-200 text-amber-700',
  short_break: 'bg-green-50 border-green-200 text-green-700',
  assembly: 'bg-purple-50 border-purple-200 text-purple-700',
  free_period: 'bg-slate-50 border-slate-200 text-slate-600',
  special: 'bg-rose-50 border-rose-200 text-rose-700',
};

export const SLOT_TYPE_ICONS: Record<string, typeof Clock> = {
  period: BookOpen,
  lunch_break: Coffee,
  short_break: Coffee,
  assembly: Clock,
  free_period: Clock,
  special: Clock,
};

export function defaultSlot(slotNumber: number): BulkSlotItem {
  return {
    slot_number: slotNumber,
    slot_type: SLOT_TYPE.PERIOD,
    start_time: '',
    end_time: '',
    label: `Period ${slotNumber}`,
  };
}

export function toInputTime(apiTime: string): string {
  if (!apiTime) {
    return '';
  }
  return apiTime.slice(0, 5);
}

export function toApiTime(inputTime: string): string {
  if (!inputTime) {
    return '';
  }
  return inputTime.length === 5 ? `${inputTime}:00` : inputTime;
}

/** Detect time overlaps. Returns array of error messages. */
export function findOverlaps(slots: BulkSlotItem[]): string[] {
  const errors: string[] = [];
  for (let i = 0; i < slots.length; i++) {
    const a = slots[i];
    if (!a.start_time || !a.end_time) {
      continue;
    }
    for (let j = i + 1; j < slots.length; j++) {
      const b = slots[j];
      if (!b.start_time || !b.end_time) {
        continue;
      }
      if (a.start_time < b.end_time && b.start_time < a.end_time) {
        errors.push(
          `"${a.label}" (${a.start_time}–${a.end_time}) overlaps with "${b.label}" (${b.start_time}–${b.end_time})`
        );
      }
    }
  }
  return errors;
}

/** Build day→slots map from backend slot data */
export function buildDaySlotMap(
  allSlots: TimetableSlot[] | undefined
): Record<number, BulkSlotItem[]> {
  const map: Record<number, BulkSlotItem[]> = {};
  if (!allSlots) {
    return map;
  }
  for (const s of allSlots) {
    const item: BulkSlotItem = {
      slot_number: s.slot_number,
      slot_type: s.slot_type,
      start_time: toInputTime(s.start_time),
      end_time: toInputTime(s.end_time),
      label: s.label,
    };
    for (const day of s.days_of_week) {
      if (!map[day]) {
        map[day] = [];
      }
      if (
        !map[day].some(
          (x) => x.slot_number === item.slot_number && x.start_time === item.start_time
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

export function getDayButtonClass(isActive: boolean, hasSlots: boolean): string {
  if (isActive) {
    return 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300';
  }
  if (hasSlots) {
    return 'border border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-indigo-300 hover:bg-indigo-50';
  }
  return 'border border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:bg-indigo-50';
}

export function getSaveToButtonClass(isActive: boolean, isIncluded: boolean): string {
  if (isActive) {
    return 'cursor-default bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300';
  }
  if (isIncluded) {
    return 'bg-indigo-600 text-white shadow-sm';
  }
  return 'border border-slate-200 bg-white text-slate-400 hover:border-indigo-300 hover:text-indigo-600';
}

export function getSaveButtonLabel(isPending: boolean, dayCount: number): string {
  if (isPending) {
    return 'Saving…';
  }
  if (dayCount > 1) {
    return `Save (${dayCount} days)`;
  }
  return 'Save';
}

export function getCopyButtonLabel(isCopying: boolean, dayCount: number): string {
  if (isCopying) {
    return 'Copying…';
  }
  const suffix = dayCount === 1 ? '' : 's';
  return `Copy to ${dayCount} day${suffix}`;
}
