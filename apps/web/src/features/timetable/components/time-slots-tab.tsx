/**
 * Time Slots Tab — Per-day slot editor with multi-day save & copy-to-days
 *
 * Real-world flow:
 *  1. Select a day to edit (Mon / Tue / … / Sun) — one at a time
 *  2. Define or edit that day's period structure
 *  3. Optionally mark additional days in "Also Save To" to apply the same schedule
 *  4. "Save" persists to the active day + any extra days selected
 *  5. "Copy to…" dialog clones the current day's slots to other days
 *
 * Each day has exactly one set of slots per class group.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Clock,
  Coffee,
  BookOpen,
  AlertTriangle,
  Copy,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useClassGroups, useSlots } from '../hooks/queries';
import { useBulkSaveSlots, useClearDaySlots } from '../hooks/mutations';
import {
  DAY_LABELS,
  DAY_SHORT_LABELS,
  SLOT_TYPE,
  SLOT_TYPE_LABELS,
  BREAK_TYPES,
  ALL_DAYS,
  type SlotType,
  type BulkSlotItem,
  type ClassGroup,
  type TimetableSlot,
} from '../types';

const SLOT_TYPE_COLORS: Record<string, string> = {
  period: 'bg-blue-50 border-blue-200 text-blue-700',
  lunch_break: 'bg-amber-50 border-amber-200 text-amber-700',
  short_break: 'bg-green-50 border-green-200 text-green-700',
  assembly: 'bg-purple-50 border-purple-200 text-purple-700',
  free_period: 'bg-slate-50 border-slate-200 text-slate-600',
  special: 'bg-rose-50 border-rose-200 text-rose-700',
};

const SLOT_TYPE_ICONS: Record<string, typeof Clock> = {
  period: BookOpen,
  lunch_break: Coffee,
  short_break: Coffee,
  assembly: Clock,
  free_period: Clock,
  special: Clock,
};

function defaultSlot(slotNumber: number): BulkSlotItem {
  return {
    slot_number: slotNumber,
    slot_type: SLOT_TYPE.PERIOD,
    start_time: '',
    end_time: '',
    label: `Period ${slotNumber}`,
  };
}

function toInputTime(apiTime: string): string {
  if (!apiTime) {
    return '';
  }
  return apiTime.slice(0, 5);
}

function toApiTime(inputTime: string): string {
  if (!inputTime) {
    return '';
  }
  return inputTime.length === 5 ? `${inputTime}:00` : inputTime;
}

/** Detect time overlaps. Returns array of error messages. */
function findOverlaps(slots: BulkSlotItem[]): string[] {
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
function buildDaySlotMap(allSlots: TimetableSlot[] | undefined): Record<number, BulkSlotItem[]> {
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

function DayTabs({
  activeDay,
  onActiveDayChange,
  saveToDays,
  onSaveToDaysChange,
  configuredDays,
}: {
  activeDay: number;
  onActiveDayChange: (day: number) => void;
  saveToDays: number[];
  onSaveToDaysChange: (days: number[]) => void;
  configuredDays: Set<number>;
}) {
  const toggleSaveToDay = (day: number) => {
    if (day === activeDay) {
      return; // active day is always included
    }
    if (saveToDays.includes(day)) {
      onSaveToDaysChange(saveToDays.filter((d) => d !== day));
    } else {
      onSaveToDaysChange([...saveToDays, day].sort());
    }
  };

  const handleActiveDayChange = (day: number) => {
    onActiveDayChange(day);
    // Ensure the new active day is in saveToDays and old active day is removed
    // (unless it was explicitly added as extra)
    onSaveToDaysChange([day]);
  };

  const selectSaveWeekdays = () => {
    const days = [0, 1, 2, 3, 4];
    if (!days.includes(activeDay)) {
      days.push(activeDay);
    }
    onSaveToDaysChange(days.sort());
  };

  const selectSaveAll = () => onSaveToDaysChange([...ALL_DAYS]);

  return (
    <div className="space-y-2.5">
      {/* Active day selector — single select */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-slate-600">Editing Day</Label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_DAYS.map((day) => {
            const isActive = activeDay === day;
            const hasSlots = configuredDays.has(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => handleActiveDayChange(day)}
                className={`relative rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300'
                    : hasSlots
                      ? 'border border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-indigo-300 hover:bg-indigo-50'
                      : 'border border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                {DAY_LABELS[day]}
                {hasSlots && !isActive && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Also-save-to selector — multi select */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <Label className="text-xs font-medium text-slate-600">Also Save To</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectSaveWeekdays}
              className="text-[10px] font-medium text-indigo-600 hover:underline"
            >
              Mon–Fri
            </button>
            <button
              type="button"
              onClick={selectSaveAll}
              className="text-[10px] font-medium text-indigo-600 hover:underline"
            >
              All
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_DAYS.map((day) => {
            const isActive = activeDay === day;
            const isIncluded = saveToDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleSaveToDay(day)}
                className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                  isActive
                    ? 'cursor-default bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                    : isIncluded
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-400 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {DAY_SHORT_LABELS[day]}
                {isActive && ' ✎'}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SlotRow({
  slot,
  index,
  onChange,
  onRemove,
  hasOverlap,
}: {
  slot: BulkSlotItem;
  index: number;
  onChange: (updated: BulkSlotItem) => void;
  onRemove: () => void;
  hasOverlap?: boolean;
}) {
  const colors = SLOT_TYPE_COLORS[slot.slot_type] || SLOT_TYPE_COLORS.period;
  const isBreak = BREAK_TYPES.has(slot.slot_type);
  const Icon = SLOT_TYPE_ICONS[slot.slot_type] || Clock;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-xl border-2 px-3 py-2.5 transition-all ${
        hasOverlap ? 'border-red-400 bg-red-50 ring-2 ring-red-200' : colors
      }`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-sm">
        {hasOverlap ? (
          <AlertCircle className="h-4 w-4 text-red-500" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </div>
      <div className="w-14">
        <Input
          type="number"
          min={1}
          value={slot.slot_number}
          onChange={(e) => onChange({ ...slot, slot_number: Number(e.target.value) })}
          className="h-8 border-0 bg-white/70 text-center text-xs font-bold shadow-sm"
          title="Slot #"
        />
      </div>
      <div className="w-32">
        <Select
          value={slot.slot_type}
          onValueChange={(val) => {
            const updated = { ...slot, slot_type: val as SlotType };
            if (isBreak || val !== SLOT_TYPE.PERIOD) {
              updated.label = SLOT_TYPE_LABELS[val] || val;
            }
            onChange(updated);
          }}
        >
          <SelectTrigger className="h-8 border-0 bg-white/70 text-xs shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SLOT_TYPE_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-28">
        <Input
          type="time"
          value={slot.start_time}
          onChange={(e) => onChange({ ...slot, start_time: e.target.value })}
          className="h-8 border-0 bg-white/70 text-xs shadow-sm"
          title="Start"
        />
      </div>
      <span className="text-xs font-bold opacity-60">→</span>
      <div className="w-28">
        <Input
          type="time"
          value={slot.end_time}
          onChange={(e) => onChange({ ...slot, end_time: e.target.value })}
          className="h-8 border-0 bg-white/70 text-xs shadow-sm"
          title="End"
        />
      </div>
      <div className="min-w-[120px] flex-1">
        <Input
          value={slot.label}
          onChange={(e) => onChange({ ...slot, label: e.target.value })}
          placeholder={`${isBreak ? 'Break' : 'Period'} ${index + 1}`}
          className="h-8 border-0 bg-white/70 text-xs font-medium shadow-sm"
          title="Label"
        />
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 shrink-0 rounded-lg p-0 text-red-400 hover:bg-red-100 hover:text-red-600"
        onClick={onRemove}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function CopyToDaysDialog({
  open,
  onOpenChange,
  sourceDay,
  configuredDays,
  onCopy,
  isCopying,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceDay: number;
  configuredDays: Set<number>;
  onCopy: (targetDays: number[]) => void;
  isCopying: boolean;
}) {
  const [targetDays, setTargetDays] = useState<number[]>([]);

  // Reset when opened
  useEffect(() => {
    if (open) {
      // Pre-select all other days that don't have slots yet
      setTargetDays(ALL_DAYS.filter((d) => d !== sourceDay).map(Number));
    }
  }, [open, sourceDay]);

  const toggle = (day: number) => {
    setTargetDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-indigo-500" />
            Copy {DAY_LABELS[sourceDay]}&apos;s Slots
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <p className="mb-3 text-sm text-slate-600">
            This will <strong>replace</strong> slots on the selected days with{' '}
            {DAY_LABELS[sourceDay]}&apos;s schedule.
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map((day) => {
              if (day === sourceDay) {
                return null;
              }
              const isSelected = targetDays.includes(day);
              const hasExisting = configuredDays.has(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggle(day)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
                  }`}
                >
                  {DAY_LABELS[day]}
                  {hasExisting && <span className="ml-1 text-[10px] opacity-60">(has slots)</span>}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setTargetDays(ALL_DAYS.filter((d) => d !== sourceDay).map(Number))}
              className="text-[11px] font-medium text-indigo-600 hover:underline"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => setTargetDays([])}
              className="text-[11px] font-medium text-slate-400 hover:underline"
            >
              Clear
            </button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => onCopy(targetDays)}
            disabled={targetDays.length === 0 || isCopying}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Copy className="mr-1.5 h-4 w-4" />
            {isCopying
              ? 'Copying…'
              : `Copy to ${targetDays.length} day${targetDays.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SlotEditor({
  group,
  activeDay,
  saveToDays,
  daySlotMap,
  onSaved,
}: {
  group: ClassGroup;
  activeDay: number;
  saveToDays: number[];
  daySlotMap: Record<number, BulkSlotItem[]>;
  onSaved: () => void;
}) {
  const saveMutation = useBulkSaveSlots(group.public_id);

  const [slots, setSlots] = useState<BulkSlotItem[]>([]);
  const [loadedDayKey, setLoadedDayKey] = useState<string>('');

  // Load slots when active day changes
  useEffect(() => {
    const dayKey = String(activeDay);
    if (dayKey !== loadedDayKey) {
      const saved = daySlotMap[activeDay];
      setSlots(saved ? saved.map((s) => ({ ...s })) : []);
      setLoadedDayKey(dayKey);
    }
  }, [activeDay, daySlotMap, loadedDayKey]);

  // Live overlap detection
  const overlaps = useMemo(() => findOverlaps(slots), [slots]);

  const overlappingIndices = useMemo(() => {
    const indices = new Set<number>();
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
          indices.add(i);
          indices.add(j);
        }
      }
    }
    return indices;
  }, [slots]);

  // Days with saved slots (for "Copy from" — exclude active day)
  const copyFromDays = useMemo(() => {
    return Object.keys(daySlotMap)
      .map(Number)
      .filter((d) => d !== activeDay && daySlotMap[d].length > 0)
      .sort();
  }, [daySlotMap, activeDay]);

  const addSlot = () => {
    const nextNum = slots.length > 0 ? Math.max(...slots.map((s) => s.slot_number)) + 1 : 1;
    const prev = slots[slots.length - 1];
    const newSlot = defaultSlot(nextNum);
    if (prev?.end_time) {
      newSlot.start_time = prev.end_time;
    }
    setSlots([...slots, newSlot]);
  };

  const addBreak = () => {
    const nextNum = slots.length > 0 ? Math.max(...slots.map((s) => s.slot_number)) + 1 : 1;
    const prev = slots[slots.length - 1];
    setSlots([
      ...slots,
      {
        slot_number: nextNum,
        slot_type: SLOT_TYPE.SHORT_BREAK as SlotType,
        start_time: prev?.end_time || '',
        end_time: '',
        label: 'Short Break',
      },
    ]);
  };

  const updateSlot = (idx: number, updated: BulkSlotItem) => {
    setSlots(slots.map((s, i) => (i === idx ? updated : s)));
  };

  const removeSlot = (idx: number) => {
    setSlots(slots.filter((_, i) => i !== idx));
  };

  const handleCopyFrom = useCallback(
    (dayStr: string) => {
      const day = Number(dayStr);
      const source = daySlotMap[day];
      if (!source || source.length === 0) {
        toast.error(`No slots found for ${DAY_LABELS[day]}`);
        return;
      }
      setSlots(source.map((s, i) => ({ ...s, slot_number: i + 1 })));
      toast.success(`Loaded ${source.length} slots from ${DAY_LABELS[day]}`);
    },
    [daySlotMap]
  );

  const handleSave = () => {
    if (slots.length === 0) {
      toast.error('Add at least one slot before saving');
      return;
    }
    for (const s of slots) {
      if (!s.start_time || !s.end_time) {
        toast.error('All slots must have start and end times');
        return;
      }
      if (s.end_time <= s.start_time) {
        toast.error(`Slot "${s.label}": end time must be after start time`);
        return;
      }
      if (!s.label.trim()) {
        toast.error('All slots must have a label');
        return;
      }
    }

    if (overlaps.length > 0) {
      toast.error('Fix time overlaps before saving', {
        description: overlaps[0],
        duration: 5000,
      });
      return;
    }

    saveMutation.mutate(
      {
        days_of_week: saveToDays,
        slots: slots.map((s) => ({
          ...s,
          start_time: toApiTime(s.start_time),
          end_time: toApiTime(s.end_time),
        })),
      },
      {
        onSuccess: () => {
          onSaved();
        },
      }
    );
  };

  return (
    <div className="space-y-3">
      {/* Copy-from bar */}
      {copyFromDays.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Copy className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-500">Load from:</span>
          <div className="w-44">
            <Select onValueChange={handleCopyFrom}>
              <SelectTrigger className="h-8 border-slate-200 bg-white text-xs shadow-sm">
                <SelectValue placeholder="Select day…" />
              </SelectTrigger>
              <SelectContent>
                {copyFromDays.map((day) => (
                  <SelectItem key={day} value={String(day)}>
                    {DAY_LABELS[day]}{' '}
                    <span className="text-slate-400">({daySlotMap[day].length} slots)</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Overlap warnings */}
      {overlaps.length > 0 && (
        <div className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-700">Time Overlap Detected</p>
              <ul className="mt-1 space-y-0.5">
                {overlaps.map((msg, i) => (
                  <li key={i} className="text-xs text-red-600">
                    • {msg}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {slots.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-10">
          <Clock className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">
            No slots for {DAY_LABELS[activeDay]} yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Add periods &amp; breaks, or load from another day
          </p>
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={addSlot} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-1 h-3.5 w-3.5" /> Add Period
            </Button>
            <Button size="sm" variant="outline" onClick={addBreak}>
              <Coffee className="mr-1 h-3.5 w-3.5" /> Add Break
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="hidden items-center gap-2 px-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase sm:flex">
            <div className="w-8" />
            <div className="w-14 text-center">#</div>
            <div className="w-32">Type</div>
            <div className="w-28">Start</div>
            <div className="w-3" />
            <div className="w-28">End</div>
            <div className="flex-1">Label</div>
            <div className="w-8" />
          </div>

          <div className="space-y-1.5">
            {slots.map((slot, idx) => (
              <SlotRow
                key={idx}
                slot={slot}
                index={idx}
                onChange={(updated) => updateSlot(idx, updated)}
                onRemove={() => removeSlot(idx)}
                hasOverlap={overlappingIndices.has(idx)}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={addSlot}
              className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Period
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={addBreak}
              className="border-amber-200 text-amber-600 hover:bg-amber-50"
            >
              <Coffee className="mr-1 h-3.5 w-3.5" /> Break
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-600">
                {saveToDays.map((d) => DAY_SHORT_LABELS[d]).join(', ')}
              </Badge>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending || overlaps.length > 0}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Save className="mr-1.5 h-4 w-4" />
                {saveMutation.isPending
                  ? 'Saving…'
                  : `Save${saveToDays.length > 1 ? ` (${saveToDays.length} days)` : ''}`}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function TimeSlotsTab() {
  const { data: groups, isLoading: groupsLoading } = useClassGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [activeDay, setActiveDay] = useState<number>(0); // Monday
  const [saveToDays, setSaveToDays] = useState<number[]>([0]); // days to save slots to
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [showDeleteDayConfirm, setShowDeleteDayConfirm] = useState(false);
  const [copyCounter, setCopyCounter] = useState(0); // forces refetch after copy

  const selectedGroup = groups?.find((g) => g.public_id === selectedGroupId);

  // Fetch ALL slots for this group (no day filter)
  const {
    data: allSlots,
    isLoading: slotsLoading,
    refetch,
  } = useSlots(selectedGroupId || undefined);

  const daySlotMap = useMemo(() => buildDaySlotMap(allSlots), [allSlots]);

  const configuredDays = useMemo(
    () =>
      new Set(
        Object.keys(daySlotMap)
          .map(Number)
          .filter((d) => daySlotMap[d].length > 0)
      ),
    [daySlotMap]
  );

  const saveMutation = useBulkSaveSlots(selectedGroupId);
  const clearDayMutation = useClearDaySlots(selectedGroupId, {
    onSuccess: () => {
      setShowDeleteDayConfirm(false);
      setCopyCounter((c) => c + 1);
      refetch();
    },
  });

  useEffect(() => {
    if (!selectedGroupId && groups && groups.length > 0) {
      setSelectedGroupId(groups[0].public_id);
    }
  }, [groups, selectedGroupId]);

  const handleSaved = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleCopyToMultiple = useCallback(
    (targetDays: number[]) => {
      const source = daySlotMap[activeDay];
      if (!source || source.length === 0) {
        toast.error('No slots to copy. Save the current day first.');
        return;
      }

      // Save the same slots for ALL target days (plus the active day)
      const allDays = [...new Set([activeDay, ...targetDays])].sort();
      saveMutation.mutate(
        {
          days_of_week: allDays,
          slots: source.map((s) => ({
            ...s,
            start_time: toApiTime(s.start_time),
            end_time: toApiTime(s.end_time),
          })),
        },
        {
          onSuccess: () => {
            toast.success(
              `Copied slots to ${targetDays.map((d) => DAY_SHORT_LABELS[d]).join(', ')}`
            );
            setShowCopyDialog(false);
            setCopyCounter((c) => c + 1);
            refetch();
          },
        }
      );
    },
    [activeDay, daySlotMap, saveMutation, refetch]
  );

  if (groupsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-60 w-full rounded-2xl" />
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <Card className="border-2 border-dashed border-amber-200 bg-amber-50/50">
        <CardContent className="py-12 text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-400" />
          <h3 className="text-lg font-semibold text-amber-900">Create Class Groups First</h3>
          <p className="mt-1 text-sm text-amber-700">
            Go to the <strong>Class Groups</strong> tab and create at least one group before
            defining time slots.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Group selector + Day tabs */}
      <div className="flex flex-wrap items-end gap-6">
        <div className="w-64">
          <Label className="text-xs font-medium text-slate-600">Class Group</Label>
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger className="mt-1 border-slate-200 bg-white shadow-sm">
              <SelectValue placeholder="Select group" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.public_id} value={g.public_id}>
                  <span className="font-medium">{g.name}</span>
                  <span className="ml-2 text-slate-400">({g.class_count} classes)</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DayTabs
          activeDay={activeDay}
          onActiveDayChange={setActiveDay}
          saveToDays={saveToDays}
          onSaveToDaysChange={setSaveToDays}
          configuredDays={configuredDays}
        />
      </div>

      {/* Info bar */}
      <div className="flex flex-col gap-2 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Clock className="h-4 w-4 text-indigo-500" />
          <span className="font-medium text-indigo-700">
            {DAY_LABELS[activeDay]}&apos;s Schedule
          </span>
          {configuredDays.has(activeDay) && (
            <>
              <span className="text-indigo-400">•</span>
              <span className="text-xs text-emerald-600">
                ✓ {daySlotMap[activeDay]?.length || 0} slots configured
              </span>
            </>
          )}
          {saveToDays.length > 1 && (
            <>
              <span className="text-indigo-400">•</span>
              <span className="text-xs text-indigo-500">Saving to {saveToDays.length} days</span>
            </>
          )}
        </div>
        {configuredDays.has(activeDay) && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCopyDialog(true)}
              className="h-7 border-indigo-200 text-xs text-indigo-600 hover:bg-indigo-100"
            >
              <Copy className="mr-1.5 h-3 w-3" />
              Copy to other days
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDeleteDayConfirm(true)}
              className="h-7 border-red-200 text-xs text-red-600 hover:bg-red-50"
            >
              <Trash2 className="mr-1.5 h-3 w-3" />
              Delete Day
            </Button>
          </div>
        )}
      </div>

      {/* Slot editor card */}
      {selectedGroup ? (
        <Card className="overflow-hidden rounded-2xl border-0 shadow-md">
          <div className="border-b bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-3">
            <h3 className="font-semibold text-white">
              {selectedGroup.name} — {DAY_LABELS[activeDay]}
            </h3>
            <p className="text-xs text-white/70">
              Define periods, breaks, and assemblies for {DAY_LABELS[activeDay]}
              {saveToDays.length > 1 &&
                ` (+ ${saveToDays.length - 1} more day${saveToDays.length > 2 ? 's' : ''})`}
            </p>
          </div>
          <CardContent className="p-4">
            {slotsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <SlotEditor
                key={`${selectedGroupId}-${activeDay}-${copyCounter}`}
                group={selectedGroup}
                activeDay={activeDay}
                saveToDays={saveToDays}
                daySlotMap={daySlotMap}
                onSaved={handleSaved}
              />
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Copy-to dialog */}
      <CopyToDaysDialog
        open={showCopyDialog}
        onOpenChange={setShowCopyDialog}
        sourceDay={activeDay}
        configuredDays={configuredDays}
        onCopy={handleCopyToMultiple}
        isCopying={saveMutation.isPending}
      />

      {/* Delete Day confirmation dialog */}
      <Dialog open={showDeleteDayConfirm} onOpenChange={setShowDeleteDayConfirm}>
        <DialogContent className="border-2 border-slate-200 bg-white shadow-2xl sm:max-w-md sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-slate-900">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete {DAY_LABELS[activeDay]}&apos;s Slots
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm leading-relaxed text-slate-700">
              This will permanently remove{' '}
              <strong className="text-slate-900">
                all {daySlotMap[activeDay]?.length || 0} slots
              </strong>{' '}
              configured for <strong className="text-slate-900">{DAY_LABELS[activeDay]}</strong> in
              the <strong className="text-slate-900">{selectedGroup?.name}</strong> group.
            </p>
            <p className="text-sm leading-relaxed text-slate-700">
              Any teacher/subject assignments for this day will also be deleted.
            </p>
            <div className="flex items-center gap-2 rounded-lg border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              This action cannot be undone.
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDayConfirm(false)}
              className="border-2 border-slate-300 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              onClick={() => clearDayMutation.mutate(activeDay)}
              disabled={clearDayMutation.isPending}
              className="border-2 border-red-600 bg-red-600 font-semibold text-white hover:bg-red-700"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              {clearDayMutation.isPending ? 'Deleting…' : `Delete ${DAY_LABELS[activeDay]}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
