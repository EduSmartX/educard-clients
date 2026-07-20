import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CalendarRange, Info, Plus, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/loading-spinner';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useRole } from '@/hooks/use-role';
import { useSubjects } from '@/features/subjects/hooks/use-subjects';
import { useTeachers } from '@/features/teachers/hooks/use-teachers';
import { getErrorMessage } from '@/lib/utils/error-handler';
import { deleteTimetableOverride, upsertTimetableOverride } from '../api/timetable-api';
import { timetableKeys, useClassTimetableForDate } from '../hooks/queries';
import type {
  ClassTimetableDateSlot,
  TimetableOverrideType,
  TimetableOverrideUpsertPayload,
} from '../types';

const OVERRIDE_TYPE_OPTIONS: { label: string; value: TimetableOverrideType }[] = [
  { label: 'Substitute', value: 'substitute' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Extra Class', value: 'extra_class' },
];

const ASSIGNMENT_TYPE_OPTIONS = [
  { label: 'Subject', value: 'subject' },
  { label: 'Other Activity', value: 'other' },
] as const;

const OTHER_TYPE_OPTIONS = [
  { value: 'activity', label: 'Activity' },
  { value: 'club', label: 'Club' },
  { value: 'sports', label: 'Sports' },
  { value: 'assembly', label: 'Assembly' },
  { value: 'event', label: 'Event' },
  { value: 'study_hall', label: 'Study Hall' },
];

type OverrideDraft = {
  overrideType: TimetableOverrideType;
  substituteAssignmentType: 'subject' | 'other';
  substituteTeacherId: string;
  substituteSubjectId: string;
  substituteOtherType: string;
  substituteOtherLabel: string;
  substituteOtherNotes: string;
  extraClassStartTime: string;
  extraClassEndTime: string;
  reason: string;
  clearOverride: boolean;
};

function getOverrideCardTone(overrideType: TimetableOverrideType) {
  if (overrideType === 'extra_class') {
    return 'border-2 border-emerald-300 bg-emerald-50/45 shadow-sm';
  }
  if (overrideType === 'cancelled') {
    return 'border-2 border-rose-300 bg-rose-50/45 shadow-sm';
  }
  if (overrideType === 'substitute') {
    return 'border-2 border-amber-300 bg-amber-50/45 shadow-sm';
  }
  return 'border-2 border-slate-300 bg-white shadow-sm';
}

function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getFallbackDraft(): OverrideDraft {
  return {
    overrideType: 'substitute',
    substituteAssignmentType: 'subject',
    substituteTeacherId: '',
    substituteSubjectId: '',
    substituteOtherType: 'activity',
    substituteOtherLabel: '',
    substituteOtherNotes: '',
    extraClassStartTime: '',
    extraClassEndTime: '',
    reason: '',
    clearOverride: false,
  };
}

function initDraft(slot: ClassTimetableDateSlot): OverrideDraft {
  return {
    overrideType: slot.override?.override_type ?? 'substitute',
    substituteAssignmentType: slot.override?.substitute_assignment_type ?? 'subject',
    substituteTeacherId: slot.override?.substitute_teacher_public_id ?? '',
    substituteSubjectId: slot.override?.substitute_subject_public_id ?? '',
    substituteOtherType: slot.override?.substitute_other_period_type ?? 'activity',
    substituteOtherLabel: slot.override?.substitute_other_label ?? '',
    substituteOtherNotes: slot.override?.substitute_other_notes ?? '',
    extraClassStartTime: slot.override?.extra_class_start_time ?? '',
    extraClassEndTime: slot.override?.extra_class_end_time ?? '',
    reason: slot.override?.reason ?? '',
    clearOverride: false,
  };
}

function OverrideEditorRow({
  slot,
  slotOptions,
  selectedSlotId,
  onSlotChange,
  onRemove,
  canRemove,
  draft,
  onDraftChange,
  onSubjectChange,
  teacherOptions,
  subjectOptions,
}: {
  slot: ClassTimetableDateSlot;
  slotOptions: Array<{ label: string; value: string }>;
  selectedSlotId: string;
  onSlotChange: (slotId: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  draft: OverrideDraft;
  onDraftChange: (next: Partial<OverrideDraft>) => void;
  onSubjectChange: (subjectId: string) => void;
  teacherOptions: Array<{ label: string; value: string }>;
  subjectOptions: Array<{ label: string; value: string }>;
}) {
  const isCancelled = draft.overrideType === 'cancelled';
  const isOtherAssignment = draft.substituteAssignmentType === 'other';
  const isExtraClass = draft.overrideType === 'extra_class';

  return (
    <Card className={getOverrideCardTone(draft.overrideType)}>
      <CardHeader className="border-b border-slate-200/70 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 space-y-2">
            {!isExtraClass ? (
              <>
                <SearchableSelect
                  value={selectedSlotId}
                  onValueChange={onSlotChange}
                  options={slotOptions}
                  placeholder="Select period"
                  searchPlaceholder="Search period..."
                />

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <CardTitle className="text-base text-slate-900">{slot.label}</CardTitle>
                  <span>{slot.start_time}</span>
                  <span>-</span>
                  <span>{slot.end_time}</span>
                  <Badge variant="outline" className="text-[11px]">
                    Current: {slot.subject_name || 'No subject'}
                    {slot.teacher_name ? ` | ${slot.teacher_name}` : ''}
                  </Badge>
                </div>
              </>
            ) : (
              <div className="rounded-md border-2 border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                Extra class for this day. Period context is hidden.
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {slot.override ? (
              <Badge variant="secondary">Overridden</Badge>
            ) : (
              <Badge variant="outline">Default</Badge>
            )}

            {canRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-4">
          <SearchableSelect
            value={draft.overrideType}
            onValueChange={(v) => onDraftChange({ overrideType: v as TimetableOverrideType })}
            options={OVERRIDE_TYPE_OPTIONS}
            placeholder="Select override type"
            searchPlaceholder="Search type..."
          />

          <SearchableSelect
            value={draft.substituteAssignmentType}
            onValueChange={(v) =>
              onDraftChange({ substituteAssignmentType: v as 'subject' | 'other' })
            }
            options={[...ASSIGNMENT_TYPE_OPTIONS]}
            placeholder="Assignment mode"
            searchPlaceholder="Search mode..."
            disabled={isCancelled}
          />

          {!isOtherAssignment ? (
            <SearchableSelect
              value={draft.substituteSubjectId}
              onValueChange={onSubjectChange}
              options={subjectOptions}
              placeholder={
                isCancelled ? 'Not required for cancelled' : 'Substitute subject (optional)'
              }
              searchPlaceholder="Search subjects..."
              disabled={isCancelled}
            />
          ) : (
            <SearchableSelect
              value={draft.substituteOtherType}
              onValueChange={(v) => onDraftChange({ substituteOtherType: v })}
              options={OTHER_TYPE_OPTIONS}
              placeholder="Other activity type"
              searchPlaceholder="Search activity type..."
              disabled={isCancelled}
            />
          )}

          <SearchableSelect
            value={draft.substituteTeacherId}
            onValueChange={(v) => onDraftChange({ substituteTeacherId: v })}
            options={teacherOptions}
            placeholder={
              isCancelled ? 'Not required for cancelled' : 'Substitute teacher (optional)'
            }
            searchPlaceholder="Search staff..."
            disabled={isCancelled}
          />
        </div>

        {isOtherAssignment && (
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={draft.substituteOtherLabel}
              onChange={(e) => onDraftChange({ substituteOtherLabel: e.target.value })}
              placeholder="Other activity label (e.g., Lab Preparation)"
              maxLength={60}
              disabled={isCancelled}
            />
            <Input
              value={draft.substituteOtherNotes}
              onChange={(e) => onDraftChange({ substituteOtherNotes: e.target.value })}
              placeholder="Other activity notes (optional)"
              maxLength={200}
              disabled={isCancelled}
            />
          </div>
        )}

        {isExtraClass && (
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              type="time"
              value={draft.extraClassStartTime}
              onChange={(e) => onDraftChange({ extraClassStartTime: e.target.value })}
              placeholder="Extra class start time"
              disabled={isCancelled}
            />
            <Input
              type="time"
              value={draft.extraClassEndTime}
              onChange={(e) => onDraftChange({ extraClassEndTime: e.target.value })}
              placeholder="Extra class end time"
              disabled={isCancelled}
            />
          </div>
        )}

        <Input
          value={draft.reason}
          onChange={(e) => onDraftChange({ reason: e.target.value })}
          placeholder="Reason (e.g., Sports Day, exam prep, special class)"
          maxLength={200}
        />

        {slot.override && (
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={draft.clearOverride}
              onChange={(e) => onDraftChange({ clearOverride: e.target.checked })}
            />
            Remove existing override for this period
          </label>
        )}
      </CardContent>
    </Card>
  );
}

export default function TimetableOverridePage() {
  const qc = useQueryClient();
  const { isAdmin } = useRole();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, OverrideDraft>>({});
  const [isSavingAll, setIsSavingAll] = useState(false);

  const { data: classesData, isLoading: classesLoading } = useClasses({
    page_size: 200,
    is_deleted: false,
    ...(isAdmin ? {} : { my_classes_only: true }),
  });

  useEffect(() => {
    if (!selectedClassId && classesData?.data?.length) {
      setSelectedClassId(classesData.data[0].public_id);
    }
  }, [classesData, selectedClassId]);

  const {
    data: dayTimetable,
    isLoading: dayLoading,
    isError,
    error,
  } = useClassTimetableForDate(selectedClassId || undefined, selectedDate || undefined);

  const { data: subjectsData } = useSubjects({
    class_assigned: selectedClassId,
    page_size: 100,
  });
  const { data: teachersData } = useTeachers({ page_size: 300, is_deleted: false });

  const classOptions = useMemo(
    () =>
      (classesData?.data ?? []).map((cls) => ({
        value: cls.public_id,
        label: `${cls.class_master?.name} - ${cls.name}`,
      })),
    [classesData]
  );

  const subjectOptions = useMemo(
    () =>
      (subjectsData?.data ?? []).map((s) => ({
        value: s.public_id,
        label: s.subject_info.name,
      })),
    [subjectsData]
  );

  const subjectTeacherMap = useMemo(
    () =>
      new Map(
        (subjectsData?.data ?? []).map((s) => [s.public_id, s.teacher_info?.public_id ?? ''])
      ),
    [subjectsData]
  );

  const teacherOptions = useMemo(
    () =>
      (teachersData?.data ?? []).map((t) => ({
        value: t.public_id,
        label: t.employee_id ? `${t.full_name} (${t.employee_id})` : t.full_name,
      })),
    [teachersData]
  );

  const overridableSlots = useMemo(
    () =>
      (dayTimetable?.slots ?? []).filter(
        (slot) => !slot.is_break && (!!slot.entry_public_id || !!slot.override?.override_public_id)
      ),
    [dayTimetable]
  );

  const slotById = useMemo(
    () => new Map(overridableSlots.map((slot) => [slot.slot_public_id, slot])),
    [overridableSlots]
  );

  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const slot of overridableSlots) {
        if (!next[slot.slot_public_id]) {
          next[slot.slot_public_id] = initDraft(slot);
        }
      }
      return next;
    });

    setSelectedSlotIds((prev) => {
      const availableIds = new Set(overridableSlots.map((slot) => slot.slot_public_id));
      const kept = prev.filter((id) => availableIds.has(id));

      if (kept.length > 0) {
        return kept;
      }

      const overridden = overridableSlots
        .filter((slot) => !!slot.override)
        .map((slot) => slot.slot_public_id);
      if (overridden.length > 0) {
        return overridden;
      }

      return overridableSlots.length > 0 ? [overridableSlots[0].slot_public_id] : [];
    });
  }, [overridableSlots]);

  const addPeriodRow = () => {
    const next = overridableSlots.find((slot) => !selectedSlotIds.includes(slot.slot_public_id));
    if (!next) {
      return;
    }
    setSelectedSlotIds((prev) => [...prev, next.slot_public_id]);
  };

  const removePeriodRow = (index: number) => {
    setSelectedSlotIds((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updatePeriodSelection = (index: number, slotId: string) => {
    setSelectedSlotIds((prev) => {
      const next = [...prev];
      next[index] = slotId;
      return next;
    });
  };

  const updateDraft = (slotId: string, patch: Partial<OverrideDraft>) => {
    const slot = slotById.get(slotId);
    setDrafts((prev) => ({
      ...prev,
      [slotId]: {
        ...(prev[slotId] ?? (slot ? initDraft(slot) : getFallbackDraft())),
        ...patch,
      },
    }));
  };

  const handleSubjectChange = (slotId: string, subjectId: string) => {
    const mappedTeacherId = subjectTeacherMap.get(subjectId) || '';
    setDrafts((prev) => {
      const slot = slotById.get(slotId);
      const currentDraft = prev[slotId] ?? (slot ? initDraft(slot) : getFallbackDraft());

      return {
        ...prev,
        [slotId]: {
          ...currentDraft,
          substituteSubjectId: subjectId,
          substituteTeacherId: mappedTeacherId || currentDraft.substituteTeacherId,
        },
      };
    });
  };

  const hasMorePeriodsToAdd = selectedSlotIds.length < overridableSlots.length;

  const saveAllOverrides = async () => {
    if (!selectedClassId || !selectedDate || selectedSlotIds.length === 0) {
      return;
    }

    setIsSavingAll(true);
    try {
      for (const slotId of selectedSlotIds) {
        const slot = slotById.get(slotId);
        const draft = drafts[slotId];
        if (!slot || !draft) {
          continue;
        }

        if (draft.clearOverride && slot.override?.override_public_id) {
          await deleteTimetableOverride(slot.override.override_public_id);
          continue;
        }

        if (!slot.entry_public_id) {
          toast.error(`Cannot update ${slot.label} because the source period is missing.`);
          setIsSavingAll(false);
          return;
        }

        if (
          draft.overrideType === 'extra_class' &&
          (!draft.extraClassStartTime || !draft.extraClassEndTime)
        ) {
          toast.error(`Please select start and end time for ${slot.label}.`);
          setIsSavingAll(false);
          return;
        }

        const payload: TimetableOverrideUpsertPayload = {
          original_entry_public_id: slot.entry_public_id,
          override_date: selectedDate,
          override_type: draft.overrideType,
          substitute_assignment_type: draft.substituteAssignmentType,
          substitute_teacher_public_id: draft.substituteTeacherId || null,
          substitute_subject_public_id:
            draft.overrideType === 'cancelled' || draft.substituteAssignmentType === 'other'
              ? null
              : draft.substituteSubjectId || null,
          substitute_other_period_type:
            draft.overrideType === 'cancelled' || draft.substituteAssignmentType !== 'other'
              ? ''
              : draft.substituteOtherType,
          substitute_other_label:
            draft.overrideType === 'cancelled' || draft.substituteAssignmentType !== 'other'
              ? ''
              : draft.substituteOtherLabel.trim(),
          substitute_other_notes:
            draft.overrideType === 'cancelled' || draft.substituteAssignmentType !== 'other'
              ? ''
              : draft.substituteOtherNotes.trim(),
          extra_class_start_time:
            draft.overrideType === 'extra_class' ? draft.extraClassStartTime : null,
          extra_class_end_time:
            draft.overrideType === 'extra_class' ? draft.extraClassEndTime : null,
          reason: draft.reason.trim(),
        };

        await upsertTimetableOverride(selectedClassId, payload);
      }

      await qc.invalidateQueries({
        queryKey: timetableKeys.classTimetableDate(selectedClassId, selectedDate),
      });
      await qc.invalidateQueries({
        queryKey: timetableKeys.classTimetable(selectedClassId),
      });
      await qc.invalidateQueries({
        queryKey: timetableKeys.classTimetableWeek(selectedClassId, selectedDate),
      });
      await qc.invalidateQueries({
        queryKey: timetableKeys.classOverrides(selectedClassId, selectedDate),
      });

      toast.success('Period overrides saved successfully.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to save period overrides.'));
    } finally {
      setIsSavingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable Period Overrides"
        description="Modify specific periods for a selected date without changing the weekly timetable"
      />

      <Card className="border-2 border-slate-300">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <div>
            {classesLoading ? (
              <div className="bg-muted h-10 animate-pulse rounded-md" />
            ) : (
              <SearchableSelect
                options={classOptions}
                value={selectedClassId}
                onValueChange={setSelectedClassId}
                placeholder="Select class"
                searchPlaceholder="Search class..."
              />
            )}
          </div>
          <div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max="2100-12-31"
            />
          </div>
        </CardContent>
      </Card>

      {!classesLoading && !isAdmin && classOptions.length === 0 ? (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-center gap-2 py-8 text-sm text-blue-700">
            <Info className="h-4 w-4 shrink-0" />
            You are not a class teacher. Only class teachers can manage period overrides.
          </CardContent>
        </Card>
      ) : !selectedClassId ? (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-2 py-8 text-sm text-slate-500">
            <CalendarRange className="h-4 w-4" />
            Select a class and date to manage period overrides.
          </CardContent>
        </Card>
      ) : dayLoading ? (
        <PageLoader />
      ) : isError ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 py-6 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4" />
            {(error as Error)?.message || 'Unable to load day timetable.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {overridableSlots.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-sm text-slate-500">
                No overridable periods available for this class/date. Configure weekly timetable
                entries first.
              </CardContent>
            </Card>
          ) : (
            <>
              {selectedSlotIds.map((slotId, index) => {
                const slot = slotById.get(slotId);
                if (!slot) {
                  return null;
                }

                const usedByOtherRows = new Set(selectedSlotIds.filter((id, idx) => idx !== index));
                const periodOptions = overridableSlots
                  .filter(
                    (item) =>
                      item.slot_public_id === slotId || !usedByOtherRows.has(item.slot_public_id)
                  )
                  .map((item) => ({
                    value: item.slot_public_id,
                    label: `${item.label} (${item.start_time} - ${item.end_time})`,
                  }));

                return (
                  <OverrideEditorRow
                    key={`${slotId}-${index}`}
                    slot={slot}
                    slotOptions={periodOptions}
                    selectedSlotId={slotId}
                    onSlotChange={(value) => updatePeriodSelection(index, value)}
                    onRemove={() => removePeriodRow(index)}
                    canRemove={selectedSlotIds.length > 1}
                    draft={drafts[slotId] ?? initDraft(slot)}
                    onDraftChange={(patch) => updateDraft(slotId, patch)}
                    onSubjectChange={(subjectId) => handleSubjectChange(slotId, subjectId)}
                    teacherOptions={teacherOptions}
                    subjectOptions={subjectOptions}
                  />
                );
              })}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addPeriodRow}
                  disabled={!hasMorePeriodsToAdd || isSavingAll}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another Period
                </Button>

                <Button type="button" onClick={saveAllOverrides} disabled={isSavingAll}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSavingAll ? 'Saving All...' : 'Save All Period Overrides'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
