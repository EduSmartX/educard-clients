/**
 * Timetable Grid Component
 * Weekly calendar-style timetable view with inline subject assignment.
 *
 * - Color-coded subject cards (like a modern calendar)
 * - Teacher avatar + name auto-populated from the subject
 * - Click "+" to assign a subject; teacher appears automatically
 * - Breaks rendered as thin merged rows
 * - Subject color legend at the bottom
 */

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { formatSlotTime } from '@educard/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { AlertTriangle, BookOpen, Clock, Coffee, Copy, Plus, User, X } from 'lucide-react';
import { toast } from 'sonner';
import { useSubjects } from '@/features/subjects/hooks/use-subjects';
import { useRole } from '@/hooks/use-role';
import { useCreateEntry, useDeleteEntry } from '../hooks/mutations';
import { timetableKeys } from '../hooks/queries';
import {
  getSubjectColor,
  buildSubjectColorMap,
  type SubjectColorScheme,
} from '@/constants/subject-colors';
import { TimetablePdfExport, type TimetableExportData } from '@/components/export';
import { ValidationMessages } from '@/constants';
import {
  type ClassTimetableResponse,
  type ClassTimetableSlot,
  DAY_LABELS,
  DAY_SHORT_LABELS,
  BREAK_TYPES,
  SLOT_TYPE_LABELS,
} from '../types';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface TimetableGridProps {
  timetable: ClassTimetableResponse;
  isLoading?: boolean;
  readOnly?: boolean;
}

type CopySource = {
  subjectPublicId: string;
  subjectName: string;
  teacherName: string | null;
};

function getActiveDays(days: Record<string, ClassTimetableSlot[]>): number[] {
  return Object.keys(days)
    .map(Number)
    .sort((a, b) => a - b);
}

function gridStyle(dayCount: number): React.CSSProperties {
  return {
    gridTemplateColumns: `90px repeat(${dayCount}, minmax(0, 1fr))`,
    display: 'grid',
  };
}

function AssignmentPopover({
  slot,
  classPublicId,
  onAssigned,
}: {
  slot: ClassTimetableSlot;
  classPublicId: string;
  onAssigned: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const qc = useQueryClient();

  const { data: subjectsData } = useSubjects({
    class_assigned: classPublicId,
    page_size: 100,
  });
  const createEntry = useCreateEntry(classPublicId, {
    onSuccess: () => {
      setOpen(false);
      setSelectedSubjectId('');
      onAssigned();
    },
  });

  const subjects = subjectsData?.data ?? [];
  const selectedSubject = subjects.find((s) => s.public_id === selectedSubjectId);

  // Warnings returned from the server after a successful save
  const warnings = createEntry.data?.warnings ?? [];
  const hasWarnings = warnings.length > 0;

  const handleAssign = () => {
    if (!selectedSubjectId) {
      toast.error(ValidationMessages.SELECT_SUBJECT);
      return;
    }
    createEntry.mutate({
      slot_public_id: slot.public_id,
      day_of_week: slot.day_of_week,
      class_public_id: classPublicId,
      subject_public_id: selectedSubjectId,
    });
  };

  const handleDismissWarning = () => {
    // Now invalidate cache so the grid refreshes with the new entry
    qc.invalidateQueries({ queryKey: timetableKeys.classTimetable(classPublicId) });
    setOpen(false);
    setSelectedSubjectId('');
    createEntry.reset();
    onAssigned();
  };

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          createEntry.reset();
          setSelectedSubjectId('');
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          data-timetable-cell="true"
          className="flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-indigo-200/60 bg-indigo-50/30 px-2 py-3 transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-sm"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100/80">
            <Plus className="h-4 w-4 text-indigo-400" />
          </div>
          <span className="text-[10px] font-medium text-indigo-400">Assign</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="z-[100] w-80 p-4 shadow-xl"
        side="bottom"
        align="center"
        sideOffset={8}
      >
        <div className="space-y-3">
          {/* ── Warning state (shown after save if teacher conflict) ── */}
          {hasWarnings ? (
            <>
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-800">Teacher Conflict</span>
                </div>
                {warnings.map((w) => (
                  <p key={w} className="text-xs leading-relaxed text-amber-700">
                    {w}
                  </p>
                ))}
                <p className="mt-2 text-[10px] text-amber-600">
                  The assignment was saved. You can keep it or change the subject.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 flex-1 text-xs"
                  onClick={() => {
                    createEntry.reset();
                  }}
                >
                  Change Subject
                </Button>
                <Button
                  size="sm"
                  className="h-8 flex-1 bg-amber-600 text-xs text-white hover:bg-amber-700"
                  onClick={handleDismissWarning}
                >
                  Keep Assignment
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* ── Normal assignment form ── */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">{slot.label}</p>
                  <p className="text-xs text-slate-400">
                    {formatSlotTime(slot.start_time)} – {formatSlotTime(slot.end_time)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                  Subject
                </span>
                <SearchableSelect
                  options={subjects.map((sub) => ({
                    value: sub.public_id,
                    label: sub.subject_info.name,
                  }))}
                  value={selectedSubjectId}
                  onValueChange={setSelectedSubjectId}
                  placeholder="Choose a subject…"
                  searchPlaceholder="Search subjects..."
                  emptyText="No subjects configured for this class"
                  className="h-9 text-xs"
                />
              </label>

              {selectedSubject && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <span className="mb-2 block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    Teacher (auto-assigned)
                  </span>
                  {selectedSubject.teacher_info ? (
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8 shadow-sm">
                        <AvatarFallback className="bg-indigo-100 text-xs font-bold text-indigo-600">
                          {getInitials(selectedSubject.teacher_info.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          {selectedSubject.teacher_info.full_name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {selectedSubject.teacher_info.employee_id}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <User className="h-4 w-4" />
                      No teacher assigned to this subject
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 flex-1 text-xs"
                  onClick={() => {
                    setOpen(false);
                    setSelectedSubjectId('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-8 flex-1 bg-indigo-600 text-xs hover:bg-indigo-700"
                  onClick={handleAssign}
                  disabled={!selectedSubjectId || createEntry.isPending}
                >
                  {createEntry.isPending ? 'Saving…' : 'Assign'}
                </Button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function BreakRow({ slot, colCount }: { slot: ClassTimetableSlot; colCount: number }) {
  const typeLabel = SLOT_TYPE_LABELS[slot.slot_type] ?? slot.slot_type;
  const icon =
    slot.slot_type === 'assembly' ? (
      <Clock className="h-3.5 w-3.5" />
    ) : (
      <Coffee className="h-3.5 w-3.5" />
    );

  return (
    <div className="mb-1.5 grid gap-1.5" style={gridStyle(colCount)}>
      <div className="flex flex-col items-center justify-center rounded-lg bg-slate-100/80 px-1 py-2 text-center">
        <span className="text-[10px] font-medium text-slate-600">{slot.label || typeLabel}</span>
        <span className="text-[9px] text-slate-500">{formatSlotTime(slot.start_time)}</span>
        <span className="text-[9px] text-slate-500">{formatSlotTime(slot.end_time)}</span>
      </div>
      <div
        className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/70 py-2.5"
        style={{ gridColumn: '2 / -1' }}
      >
        <span className="text-amber-500">{icon}</span>
        <span className="text-xs font-semibold text-amber-700">{slot.label || typeLabel}</span>
        <span className="text-[10px] text-amber-500">
          {formatSlotTime(slot.start_time)} – {formatSlotTime(slot.end_time)}
        </span>
      </div>
    </div>
  );
}

function PeriodCell({
  slot,
  color,
  classPublicId,
  onChanged,
  isAdmin,
  copySource,
  onStartCopy,
  onQuickCopy,
}: {
  slot: ClassTimetableSlot;
  color: SubjectColorScheme;
  classPublicId: string;
  onChanged: () => void;
  isAdmin: boolean;
  copySource: CopySource | null;
  onStartCopy: (source: CopySource) => void;
  onQuickCopy: (slot: ClassTimetableSlot) => void;
}) {
  const deleteEntry = useDeleteEntry(classPublicId, { onSuccess: onChanged });

  if (!slot.subject_name) {
    // Non-admin: show empty placeholder instead of assignment popover
    if (!isAdmin) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/30 px-2 py-3">
          <span className="text-[10px] text-slate-300">No assignment</span>
        </div>
      );
    }
    if (copySource) {
      return (
        <button
          type="button"
          data-timetable-cell="true"
          onClick={() => onQuickCopy(slot)}
          className="flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/70 px-2 py-3 text-center transition-all hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-sm"
          title={`Copy ${copySource.subjectName} here`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100/90">
            <Copy className="h-4 w-4 text-indigo-500" />
          </div>
          <span className="text-[10px] font-semibold text-indigo-500">Paste</span>
          <span className="max-w-full truncate text-[9px] text-indigo-400">
            {copySource.subjectName}
          </span>
        </button>
      );
    }

    return <AssignmentPopover slot={slot} classPublicId={classPublicId} onAssigned={onChanged} />;
  }

  return (
    <div
      data-timetable-cell="true"
      className={`group relative flex h-full flex-col rounded-xl border border-l-4 ${color.border} ${color.bg} px-3 py-2.5 transition-all hover:shadow-md ${
        copySource?.subjectPublicId === slot.subject_public_id
          ? 'ring-2 ring-indigo-400 ring-offset-2'
          : ''
      }`}
    >
      {isAdmin && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartCopy({
                subjectPublicId: slot.subject_public_id ?? '',
                subjectName: slot.subject_name ?? '',
                teacherName: slot.teacher_name,
              });
            }}
            className="absolute -top-1.5 right-6 z-10 hidden h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white shadow-sm transition-all group-hover:flex hover:bg-indigo-600"
            title="Copy this subject to other periods"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (slot.entry_public_id) {
                deleteEntry.mutate(slot.entry_public_id);
              }
            }}
            className="absolute -top-1.5 -right-1.5 z-10 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-all group-hover:flex hover:bg-red-600"
            title="Remove assignment"
          >
            <X className="h-3 w-3" />
          </button>
        </>
      )}

      <span className={`text-[10px] font-semibold ${color.text} opacity-60`}>
        {formatSlotTime(slot.start_time)} – {formatSlotTime(slot.end_time)}
      </span>

      <span className={`mt-0.5 text-sm leading-tight font-bold ${color.text}`}>
        {slot.subject_name}
      </span>

      {!!slot.teacher_name && (
        <div className="mt-auto flex items-center gap-1.5 pt-2">
          <Avatar className="h-5 w-5 shadow-sm">
            <AvatarFallback className={`${color.light} text-[8px] font-bold ${color.text}`}>
              {getInitials(slot.teacher_name)}
            </AvatarFallback>
          </Avatar>
          <span className={`truncate text-[10px] font-medium ${color.text} opacity-75`}>
            {slot.teacher_name}
          </span>
        </div>
      )}

      {!!slot.room && (
        <span
          className={`mt-1.5 self-start rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${color.badge}`}
        >
          📍 {slot.room}
        </span>
      )}

      {isAdmin && copySource?.subjectPublicId === slot.subject_public_id && (
        <span className="mt-2 inline-flex self-start rounded-full bg-indigo-500/10 px-2 py-0.5 text-[9px] font-semibold text-indigo-600">
          Copy source
        </span>
      )}
    </div>
  );
}

function TimetableGridSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <div className="flex gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-10 flex-1 rounded-lg" />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, row) => (
        <div key={row} className="flex gap-2">
          <Skeleton className="h-6 w-[90px] rounded-lg" />
          {Array.from({ length: 6 }).map((_, col) => (
            <Skeleton key={col} className="h-20 flex-1 rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function TimetableGrid({ timetable, isLoading, readOnly }: Readonly<TimetableGridProps>) {
  const { isAdmin: isAdminRole } = useRole();
  const isAdmin = isAdminRole && !readOnly;
  const qc = useQueryClient();
  const copyEntry = useCreateEntry(timetable.class_public_id);
  const [copySource, setCopySource] = useState<CopySource | null>(null);
  const timetableAreaRef = useRef<HTMLDivElement | null>(null);
  const activeDays = useMemo(
    () => (timetable.days ? getActiveDays(timetable.days) : []),
    [timetable.days]
  );

  const subjectColorMap = useMemo(() => {
    if (!timetable.days) {
      return new Map<string, SubjectColorScheme>();
    }
    const allNames: (string | null)[] = [];
    for (const daySlots of Object.values(timetable.days)) {
      for (const slot of daySlots) {
        allNames.push(slot.subject_name);
      }
    }
    return buildSubjectColorMap(allNames);
  }, [timetable.days]);

  const handleStartCopy = useCallback((source: CopySource) => {
    setCopySource(source);
    toast.message(`Copying ${source.subjectName}. Click empty slots to paste it.`);
  }, []);

  const handleQuickCopy = useCallback(
    async (slot: ClassTimetableSlot) => {
      if (!copySource?.subjectPublicId) {
        return;
      }

      try {
        const result = await copyEntry.mutateAsync({
          slot_public_id: slot.public_id,
          day_of_week: slot.day_of_week,
          class_public_id: timetable.class_public_id,
          subject_public_id: copySource.subjectPublicId,
        });

        if (result.warnings?.length) {
          toast.warning(result.warnings[0] ?? 'Assignment saved with warnings.');
          await qc.invalidateQueries({
            queryKey: timetableKeys.classTimetable(timetable.class_public_id),
          });
        }
      } catch {
        // Mutation errors are surfaced by the shared mutation handler.
      }
    },
    [copyEntry, copySource?.subjectPublicId, qc, timetable.class_public_id]
  );

  const handleCancelCopy = useCallback(() => {
    setCopySource(null);
  }, []);

  useEffect(() => {
    if (!copySource) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      if (target.closest('[data-copy-preserve="true"]')) {
        return;
      }

      if (!target.closest('[data-timetable-cell="true"]')) {
        setCopySource(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setCopySource(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [copySource]);

  const handleChanged = useCallback(() => {}, []);

  if (isLoading) {
    return <TimetableGridSkeleton />;
  }
  if (!timetable.class_group || Object.keys(timetable.days).length === 0) {
    // Show empty grid with default days (Mon-Sat) and a message
    const defaultDays = [0, 1, 2, 3, 4, 5];
    return (
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-gray-50 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {timetable.class ?? 'Class'} — Weekly Timetable
              </CardTitle>
              {!!timetable.class_group && (
                <p className="text-muted-foreground mt-0.5 text-sm">
                  Group: {timetable.class_group.name}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {/* Day headers */}
          <div className="mb-3 grid gap-1.5" style={gridStyle(defaultDays.length)}>
            <div className="flex items-center justify-center rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 px-2 py-2.5">
              <Clock className="h-3.5 w-3.5 text-white" />
              <span className="ml-1 text-[10px] font-bold tracking-wider text-white uppercase">
                Time
              </span>
            </div>
            {defaultDays.map((day) => (
              <div
                key={day}
                className="flex items-center justify-center rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 px-2 py-2.5"
              >
                <span className="text-[11px] font-bold tracking-wider text-white uppercase">
                  {DAY_SHORT_LABELS[day]}
                </span>
              </div>
            ))}
          </div>
          {/* Empty message */}
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <BookOpen className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-700">No Timetable Configured</h3>
            <p className="text-muted-foreground mt-1 max-w-sm text-sm">
              This class doesn&apos;t have time slots configured yet. Set up a class group and
              define periods in Timetable Setup.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const refDay = activeDays.reduce(
    (best, d) =>
      (timetable.days[String(d)]?.length ?? 0) > (timetable.days[String(best)]?.length ?? 0)
        ? d
        : best,
    activeDays[0]
  );
  const refSlots = timetable.days[String(refDay)] ?? [];

  const totalAssignable =
    refSlots.filter((s) => !BREAK_TYPES.has(s.slot_type)).length * activeDays.length;
  const totalAssigned = activeDays.reduce((sum, d) => {
    const ds = timetable.days[String(d)] ?? [];
    return sum + ds.filter((s) => !BREAK_TYPES.has(s.slot_type) && s.subject_name).length;
  }, 0);

  // Prepare export data
  const exportData: TimetableExportData = {
    title: `${timetable.class} — Weekly Timetable`,
    subtitle: timetable.class_group?.name ? `Group: ${timetable.class_group.name}` : undefined,
    days: activeDays.reduce(
      (acc, dayNum) => {
        const daySlots = timetable.days[String(dayNum)] ?? [];
        acc[dayNum] = {
          slots: daySlots.map((slot) => ({
            slot: {
              slot_label: slot.label,
              start_time: slot.start_time,
              end_time: slot.end_time,
              is_break: BREAK_TYPES.has(slot.slot_type),
              slot_type: slot.slot_type,
            },
            entry: slot.subject_name
              ? {
                  subject_name: slot.subject_name,
                  teacher_name: slot.teacher_name || undefined,
                  room: slot.room || undefined,
                }
              : undefined,
          })),
        };
        return acc;
      },
      {} as TimetableExportData['days'] // NOSONAR
    ),
    activeDays,
    generatedAt: `${totalAssigned}/${totalAssignable} periods assigned`,
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800">
              {timetable.class} — Weekly Timetable
            </CardTitle>
            {!!timetable.class_group && (
              <p className="mt-1 text-sm text-slate-500">
                Group:{' '}
                <span className="font-medium text-slate-700">{timetable.class_group.name}</span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
              <BookOpen className="mr-1 h-3 w-3" />
              {totalAssigned}/{totalAssignable} assigned
            </Badge>
            <Badge variant="outline" className="border-slate-200 bg-white">
              {refSlots.filter((s) => !BREAK_TYPES.has(s.slot_type)).length} periods/day
            </Badge>
            <Badge variant="outline" className="border-slate-200 bg-white">
              {activeDays.length} days/week
            </Badge>
            <TimetablePdfExport data={exportData} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto p-3 sm:p-5">
        <div ref={timetableAreaRef} className="min-w-[700px]">
          {copySource && (
            <div
              data-copy-preserve="true"
              className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-indigo-200 bg-indigo-50 px-3 py-2"
            >
              <div className="text-sm text-indigo-700">
                <span className="font-semibold">Copy mode:</span> {copySource.subjectName}
                {copySource.teacherName ? ` · ${copySource.teacherName}` : ''}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 border-indigo-200 bg-white text-xs text-indigo-700 hover:bg-indigo-50"
                onClick={handleCancelCopy}
              >
                Cancel copy
              </Button>
            </div>
          )}

          {/* Day headers */}
          <div className="mb-2 grid gap-1.5" style={gridStyle(activeDays.length)}>
            <div className="flex items-center justify-center rounded-lg bg-indigo-600 px-2 py-3.5 shadow-sm">
              <Clock className="mr-1.5 h-3.5 w-3.5 text-white/80" />
              <span className="text-[11px] font-bold tracking-wider text-white uppercase">
                Time
              </span>
            </div>
            {activeDays.map((day) => (
              <div
                key={day}
                className="flex items-center justify-center rounded-lg bg-indigo-600 px-2 py-3.5 shadow-sm"
              >
                <span className="hidden text-[11px] font-bold tracking-wider text-white uppercase sm:inline">
                  {DAY_LABELS[day]}
                </span>
                <span className="text-[11px] font-bold tracking-wider text-white uppercase sm:hidden">
                  {DAY_SHORT_LABELS[day]}
                </span>
              </div>
            ))}
          </div>

          {/* Slot rows */}
          {refSlots.map((refSlot, idx) => {
            if (BREAK_TYPES.has(refSlot.slot_type)) {
              return (
                <BreakRow key={refSlot.public_id} slot={refSlot} colCount={activeDays.length} />
              );
            }
            return (
              <div
                key={refSlot.public_id}
                className="mb-1.5 grid gap-1.5"
                style={gridStyle(activeDays.length)}
              >
                <div className="flex flex-col items-center justify-center rounded-lg bg-slate-100/80 px-1 py-2 text-center">
                  <span className="text-[11px] font-bold text-slate-700">{refSlot.label}</span>
                  <span className="mt-0.5 text-[10px] font-medium text-slate-500">
                    {formatSlotTime(refSlot.start_time)}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">
                    {formatSlotTime(refSlot.end_time)}
                  </span>
                </div>
                {activeDays.map((day) => {
                  const daySlots = timetable.days[String(day)] ?? [];
                  const slot = daySlots[idx];
                  if (!slot) {
                    return (
                      <div
                        key={day}
                        className="min-h-[88px] rounded-xl border border-slate-200 bg-slate-50/50"
                      />
                    );
                  }
                  const color =
                    subjectColorMap.get(slot.subject_name ?? '') ??
                    getSubjectColor(slot.subject_name);
                  return (
                    <div key={day} className="min-h-[88px]">
                      <PeriodCell
                        slot={slot}
                        color={color}
                        classPublicId={timetable.class_public_id}
                        onChanged={handleChanged}
                        isAdmin={isAdmin}
                        copySource={copySource}
                        onStartCopy={handleStartCopy}
                        onQuickCopy={handleQuickCopy}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
