import { Fragment, useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCurrentDayIndex, formatSlotTime } from '@educard/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { PageHeader } from '@/components/common';
import { PageLoader } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';
import { School, User } from 'lucide-react';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useRole } from '@/hooks/use-role';
import { useManageableUsers } from '@/hooks/use-manageable-users';
import { useClassTimetable, useMyTimetable, useTeacherTimetable } from '../hooks/queries';
import { TimetableGrid } from '../components/timetable-grid';
import { DAY_LABELS, type TimetableEntry, type TeacherSlotRow } from '../types';
import type { Class } from '@/features/classes/types';
import { PERIOD_PASTEL_COLORS } from '../constants';

const SELF_TEACHER_OPTION = '__self_timetable__';

function ByClassView() {
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const { data: classesData, isLoading: classesLoading } = useClasses({
    page_size: 200,
    is_deleted: false,
  });

  const {
    data: timetable,
    isLoading: timetableLoading,
    isError,
    error,
  } = useClassTimetable(selectedClassId || undefined);

  useEffect(() => {
    if (!selectedClassId && classesData?.data && classesData.data.length > 0) {
      setSelectedClassId(classesData.data[0].public_id);
    }
  }, [classesData, selectedClassId]);

  const classes: Class[] = classesData?.data ?? [];

  const renderTimetableContent = () => {
    if (timetableLoading) {
      return <PageLoader />;
    }
    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-destructive mb-3 text-5xl">⚠️</div>
          <h3 className="text-lg font-semibold">Error Loading Timetable</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            {(error as Error)?.message || 'Something went wrong.'}
          </p>
        </div>
      );
    }
    if (timetable) {
      return <TimetableGrid timetable={timetable} readOnly />;
    }
    return null;
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-full sm:w-72">
          {classesLoading ? (
            <div className="bg-muted h-10 animate-pulse rounded-md" />
          ) : (
            <SearchableSelect
              options={classes.map((cls) => ({
                value: cls.public_id,
                label: `${cls.class_master?.name} - ${cls.name}`,
              }))}
              value={selectedClassId}
              onValueChange={setSelectedClassId}
              placeholder="Select a class"
              searchPlaceholder="Search classes..."
            />
          )}
        </div>
      </div>

      {selectedClassId ? (
        renderTimetableContent()
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-muted-foreground mb-3 text-5xl">📚</div>
          <h3 className="text-lg font-semibold">Select a Class</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Choose a class from the dropdown above to view its timetable.
          </p>
        </div>
      )}
    </div>
  );
}

function ByTeacherView() {
  const { isAdmin } = useRole();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    isAdmin ? '' : SELF_TEACHER_OPTION
  );

  const { data: manageableTeachers, isLoading: teachersLoading } = useManageableUsers('teacher');

  const teachers = useMemo(() => manageableTeachers ?? [], [manageableTeachers]);
  const { data: myTimetable, isLoading: myLoading } = useMyTimetable();

  const {
    data: teacherTimetable,
    isLoading: timetableLoading,
    isError,
    error,
  } = useTeacherTimetable(
    selectedTeacherId && selectedTeacherId !== SELF_TEACHER_OPTION ? selectedTeacherId : undefined
  );

  const isSelfView = selectedTeacherId === SELF_TEACHER_OPTION;
  const timetableData = isSelfView ? myTimetable : teacherTimetable;
  const isLoading = isSelfView ? myLoading : timetableLoading;

  useEffect(() => {
    if (isAdmin && !selectedTeacherId && teachers.length > 0) {
      setSelectedTeacherId(teachers[0].public_id);
    }
  }, [teachers, selectedTeacherId, isAdmin]);

  useEffect(() => {
    if (!isAdmin && !selectedTeacherId) {
      setSelectedTeacherId(SELF_TEACHER_OPTION);
    }
  }, [isAdmin, selectedTeacherId]);

  const teacherOptions = useMemo(() => {
    const options = teachers.map((t) => ({ value: t.public_id, label: t.full_name }));
    const myLabel = myTimetable?.teacher_name
      ? `${myTimetable.teacher_name} (My Timetable)`
      : 'My Timetable';

    return [{ value: SELF_TEACHER_OPTION, label: myLabel }, ...options];
  }, [teachers, myTimetable?.teacher_name]);

  const { slotRows, availableDays } = useMemo(() => {
    if (!timetableData?.days) {
      return { slotRows: [], availableDays: [] as number[] };
    }

    const days = Object.keys(timetableData.days)
      .map(Number)
      .sort((a, b) => a - b);

    const slotMap = new Map<
      string,
      { slotLabel: string; startTime: string; endTime: string; slotType: string }
    >();
    for (const dayKey of Object.keys(timetableData.days)) {
      for (const entry of timetableData.days[dayKey]) {
        if (!slotMap.has(entry.start_time)) {
          slotMap.set(entry.start_time, {
            slotLabel: entry.slot_label || '',
            startTime: entry.start_time,
            endTime: entry.end_time,
            slotType: entry.slot_type || 'period',
          });
        }
      }
    }

    const sortedSlots = [...slotMap.values()].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

    const rows: TeacherSlotRow[] = sortedSlots.map((slot) => {
      const entries: Record<string, TimetableEntry | null> = {};
      for (const day of days) {
        const dayEntries = timetableData.days[String(day)] ?? [];
        entries[String(day)] = dayEntries.find((e) => e.start_time === slot.startTime) || null;
      }
      return { ...slot, entries };
    });

    return { slotRows: rows, availableDays: days };
  }, [timetableData]);

  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');

  useEffect(() => {
    if (availableDays.length === 0) {
      setSelectedDay('all');
      return;
    }

    const today = getCurrentDayIndex();
    setSelectedDay((prev) => {
      if (prev !== 'all' && availableDays.includes(prev)) {
        return prev;
      }
      if (availableDays.includes(today)) {
        return today;
      }
      return availableDays[0];
    });
  }, [availableDays]);

  if (isError && selectedTeacherId && selectedTeacherId !== SELF_TEACHER_OPTION) {
    const errorMsg =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      (error as Error)?.message ||
      'Could not load the timetable.';
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:w-80">
            <SearchableSelect
              options={teacherOptions}
              value={selectedTeacherId}
              onValueChange={setSelectedTeacherId}
              placeholder="Select a teacher"
              searchPlaceholder="Search teachers..."
            />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 text-5xl">🔒</div>
          <h3 className="text-lg font-semibold text-gray-700">Access Restricted</h3>
          <p className="text-muted-foreground mt-1 max-w-md text-sm">{errorMsg}</p>
        </div>
      </div>
    );
  }

  const todayIndex = getCurrentDayIndex();
  const visibleDays =
    selectedDay === 'all' ? availableDays : availableDays.filter((day) => day === selectedDay);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:w-80">
          {teachersLoading ? (
            <div className="bg-muted h-10 animate-pulse rounded-md" />
          ) : (
            <SearchableSelect
              options={teacherOptions}
              value={selectedTeacherId}
              onValueChange={setSelectedTeacherId}
              placeholder="Select a teacher"
              searchPlaceholder="Search teachers..."
            />
          )}
        </div>

        {timetableData?.teacher_name && !isLoading && (
          <div className="flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500">
              <User className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-indigo-700">
              {timetableData.teacher_name}
            </span>
          </div>
        )}
      </div>

      {isLoading && <PageLoader />}

      {!isLoading && timetableData && slotRows.length > 0 && (
        <div className="space-y-3">
          {availableDays.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedDay('all')}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                  selectedDay === 'all'
                    ? 'border-indigo-300 bg-indigo-100 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                )}
              >
                All Days
              </button>
              {availableDays.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                    selectedDay === day
                      ? 'border-indigo-300 bg-indigo-100 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {DAY_LABELS[day] ?? `Day ${day}`}
                  {day === todayIndex ? ' (Today)' : ''}
                </button>
              ))}
            </div>
          )}

          {(() => {
            const classColorMap = new Map<string, (typeof PERIOD_PASTEL_COLORS)[number]>();
            let colorIdx = 0;
            for (const row of slotRows) {
              for (const entry of Object.values(row.entries)) {
                if (entry?.class_name && !classColorMap.has(entry.class_name)) {
                  classColorMap.set(
                    entry.class_name,
                    PERIOD_PASTEL_COLORS[colorIdx % PERIOD_PASTEL_COLORS.length]
                  );
                  colorIdx++;
                }
              }
            }

            return (
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <div
                  className="grid min-w-[700px]"
                  style={{
                    gridTemplateColumns: `90px repeat(${visibleDays.length}, minmax(0, 1fr))`,
                  }}
                >
                  <div className="sticky top-0 z-10 flex items-center justify-center border-b border-gray-200 bg-gray-50 p-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Time</span>
                  </div>
                  {visibleDays.map((day) => (
                    <div
                      key={day}
                      className={cn(
                        'sticky top-0 z-10 border-b border-l border-gray-200 p-3 text-center',
                        day === todayIndex ? 'bg-indigo-50' : 'bg-gray-50'
                      )}
                    >
                      <div
                        className={cn(
                          'text-sm font-semibold',
                          day === todayIndex ? 'text-indigo-700' : 'text-gray-700'
                        )}
                      >
                        {DAY_LABELS[day] ?? `Day ${day}`}
                      </div>
                      {day === todayIndex && (
                        <span className="mt-0.5 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-500">
                          Today
                        </span>
                      )}
                    </div>
                  ))}

                  {slotRows.map((row, rowIndex) => {
                    const isBreak = row.slotType === 'short_break' || row.slotType === 'long_break';

                    return (
                      <Fragment key={`row-${row.startTime}`}>
                        <div
                          className={cn(
                            'flex flex-col items-center justify-center border-b border-gray-100 p-2',
                            isBreak ? 'bg-amber-50/50' : 'bg-white'
                          )}
                        >
                          <span className="text-xs font-semibold text-gray-700">
                            {formatSlotTime(row.startTime)}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {formatSlotTime(row.endTime)}
                          </span>
                          {!!row.slotLabel && (
                            <span className="mt-0.5 text-[10px] text-gray-400">{row.slotLabel}</span>
                          )}
                        </div>

                        {visibleDays.map((day) => {
                          const entry = row.entries[String(day)];

                          if (isBreak) {
                            return (
                              <div
                                key={`${rowIndex}-${day}`}
                                className="flex items-center justify-center border-b border-l border-gray-100 bg-amber-50/50 p-2"
                              >
                                <span className="text-xs font-medium text-amber-600">
                                  ☕ {row.slotLabel || 'Break'}
                                </span>
                              </div>
                            );
                          }

                          if (!entry) {
                            return (
                              <div
                                key={`${rowIndex}-${day}`}
                                className={cn(
                                  'flex items-center justify-center border-b border-l border-gray-100 p-2',
                                  day === todayIndex ? 'bg-indigo-50/30' : 'bg-gray-50/30'
                                )}
                              >
                                <span className="text-xs text-gray-400 italic">Leisure</span>
                              </div>
                            );
                          }

                          const periodColor =
                            classColorMap.get(entry.class_name ?? '') ??
                            PERIOD_PASTEL_COLORS[rowIndex % PERIOD_PASTEL_COLORS.length];
                          return (
                            <div
                              key={`${rowIndex}-${day}`}
                              className={cn(
                                'border-b border-l border-gray-100 p-1.5',
                                day === todayIndex ? 'bg-indigo-50/20' : ''
                              )}
                            >
                              <div
                                className={cn(
                                  'h-full rounded-lg border-l-3 p-2',
                                  periodColor.bg,
                                  periodColor.border
                                )}
                              >
                                <div
                                  className={cn('truncate text-xs font-semibold', periodColor.text)}
                                >
                                  {entry.subject_name || 'Unassigned'}
                                </div>
                                <div className={cn('mt-0.5 truncate text-[11px]', periodColor.sub)}>
                                  {entry.class_name}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {!isLoading && timetableData && slotRows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-muted-foreground mb-3 text-5xl">📅</div>
          <h3 className="text-lg font-semibold">No Timetable Data</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            No scheduled periods found for this teacher.
          </p>
        </div>
      )}
    </div>
  );
}

export default function TimetableViewPage() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'by-teacher' ? 'by-teacher' : 'by-class';

  return (
    <div className="space-y-6">
      <PageHeader title="View Timetable" description="View timetables by class or by teacher" />

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList>
          <TabsTrigger value="by-class" className="gap-2">
            <School className="h-4 w-4" />
            By Class
          </TabsTrigger>
          <TabsTrigger value="by-teacher" className="gap-2">
            <User className="h-4 w-4" />
            By Teacher
          </TabsTrigger>
        </TabsList>

        <TabsContent value="by-class" className="mt-4">
          <ByClassView />
        </TabsContent>

        <TabsContent value="by-teacher" className="mt-4">
          <ByTeacherView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
