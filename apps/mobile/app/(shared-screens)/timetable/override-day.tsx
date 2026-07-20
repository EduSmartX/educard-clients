import {
  extractApiError,
  getRoleGradient,
  type ClassTimetableDateSlot,
  type TimetableOverrideType,
} from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Save, Trash2, CalendarRange } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { FormDropdown } from '@/components/forms';
import { useClasses } from '@/features/classes';
import { useSubjectsByClass } from '@/features/subjects';
import {
  useClassTimetableForDate,
  useDeleteOverride,
  useUpsertOverride,
} from '@/features/timetable';
import { useManageableUsers } from '@/hooks/use-manageable-users';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

const OVERRIDE_TYPE_OPTIONS: { label: string; value: TimetableOverrideType }[] = [
  { label: 'Substitute', value: 'substitute' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Extra Class', value: 'extra_class' },
];

const ASSIGNMENT_MODE_OPTIONS = [
  { label: 'Subject', value: 'subject' },
  { label: 'Other Activity', value: 'other' },
] as const;

const OTHER_ACTIVITY_TYPE_OPTIONS = [
  { value: 'activity', label: 'Activity' },
  { value: 'club', label: 'Club' },
  { value: 'sports', label: 'Sports' },
  { value: 'assembly', label: 'Assembly' },
  { value: 'event', label: 'Event' },
  { value: 'study_hall', label: 'Study Hall' },
];

function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isDateStringValid(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default function TimetableOverrideDayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ classId?: string }>();
  const [selectedClassId, setSelectedClassId] = useState(params.classId ?? '');
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [refreshing, setRefreshing] = useState(false);

  const { data: classesData, isLoading: classesLoading } = useClasses({ page_size: 200 });

  useEffect(() => {
    if (!selectedClassId && classesData?.classes?.length) {
      setSelectedClassId(classesData.classes[0].public_id);
    }
  }, [classesData, selectedClassId]);

  const {
    data: dayTimetable,
    isLoading: dayLoading,
    refetch,
    error,
  } = useClassTimetableForDate(selectedClassId || undefined, selectedDate || undefined);

  const { data: subjectsData } = useSubjectsByClass(selectedClassId);
  const { data: staffUsers } = useManageableUsers('staff', true);

  const upsertOverride = useUpsertOverride(selectedClassId || '');
  const deleteOverride = useDeleteOverride(selectedClassId || '');

  const classOptions = useMemo(() => {
    return (classesData?.classes ?? []).map((c) => ({
      label: `${c.class_master?.name ?? c.name} - ${c.name}`,
      value: c.public_id,
    }));
  }, [classesData]);

  const subjectOptions = useMemo(() => {
    return (subjectsData?.data ?? []).map((s) => ({
      label: s.subject_info?.name ?? 'Subject',
      value: s.public_id,
    }));
  }, [subjectsData]);

  const teacherOptions = useMemo(() => {
    return (staffUsers ?? []).map((u) => ({
      label: u.full_name,
      value: u.public_id,
    }));
  }, [staffUsers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSaveOverride = async (
    slot: ClassTimetableDateSlot,
    form: {
      overrideType: TimetableOverrideType;
      substituteAssignmentType: 'subject' | 'other';
      substituteTeacherId: string;
      substituteSubjectId: string;
      substituteOtherPeriodType: string;
      substituteOtherLabel: string;
      substituteOtherNotes: string;
      reason: string;
    }
  ) => {
    if (!slot.entry_public_id) {
      Alert.alert('Missing Entry', 'This slot has no weekly assignment to override.');
      return;
    }
    if (!isDateStringValid(selectedDate)) {
      Alert.alert('Invalid Date', 'Please use YYYY-MM-DD format.');
      return;
    }

    try {
      await upsertOverride.mutateAsync({
        original_entry_public_id: slot.entry_public_id,
        override_date: selectedDate,
        override_type: form.overrideType,
        substitute_assignment_type: form.substituteAssignmentType,
        substitute_teacher_public_id:
          form.overrideType === 'cancelled' ? null : form.substituteTeacherId || null,
        substitute_subject_public_id:
          form.overrideType === 'cancelled' || form.substituteAssignmentType === 'other'
            ? null
            : form.substituteSubjectId || null,
        substitute_other_period_type:
          form.overrideType === 'cancelled' || form.substituteAssignmentType !== 'other'
            ? ''
            : form.substituteOtherPeriodType,
        substitute_other_label:
          form.overrideType === 'cancelled' || form.substituteAssignmentType !== 'other'
            ? ''
            : form.substituteOtherLabel.trim(),
        substitute_other_notes:
          form.overrideType === 'cancelled' || form.substituteAssignmentType !== 'other'
            ? ''
            : form.substituteOtherNotes.trim(),
        reason: form.reason.trim(),
      });
    } catch (err) {
      Alert.alert('Save Failed', extractApiError(err));
    }
  };

  const handleDeleteOverride = async (overridePublicId: string) => {
    try {
      await deleteOverride.mutateAsync({
        overridePublicId,
        date: selectedDate,
      });
    } catch (err) {
      Alert.alert('Delete Failed', extractApiError(err));
    }
  };

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Day Overrides</Text>
              <Text style={headerStyles.subtitle}>Change one-day timetable only</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
      >
        <View style={styles.filtersCard}>
          <FormDropdown
            label="Class"
            options={classOptions}
            value={selectedClassId}
            onChange={setSelectedClassId}
            placeholder={classesLoading ? 'Loading classes...' : 'Select class'}
            searchable
          />

          <Text style={styles.dateLabel}>Date (YYYY-MM-DD)</Text>
          <TextInput
            value={selectedDate}
            onChangeText={setSelectedDate}
            placeholder="2026-07-09"
            style={styles.dateInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {dayLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#7c3aed" />
          </View>
        ) : !selectedClassId ? (
          <View style={styles.centerState}>
            <CalendarRange size={24} color="#64748b" />
            <Text style={styles.emptyText}>Select class and date to view slots</Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{extractApiError(error)}</Text>
          </View>
        ) : (
          <View style={styles.slotList}>
            {(dayTimetable?.slots ?? []).map((slot) => (
              <OverrideSlotCard
                key={slot.slot_public_id}
                slot={slot}
                teacherOptions={teacherOptions}
                subjectOptions={subjectOptions}
                pending={upsertOverride.isPending || deleteOverride.isPending}
                onSave={(form) => void handleSaveOverride(slot, form)}
                onDelete={(overridePublicId) => void handleDeleteOverride(overridePublicId)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function OverrideSlotCard({
  slot,
  teacherOptions,
  subjectOptions,
  pending,
  onSave,
  onDelete,
}: {
  slot: {
    slot_public_id: string;
    label: string;
    start_time: string;
    end_time: string;
    is_break: boolean;
    entry_public_id: string | null;
    subject_name: string | null;
    teacher_name: string | null;
    override: {
      override_public_id: string;
      override_type: TimetableOverrideType;
      substitute_assignment_type: 'subject' | 'other';
      substitute_teacher_public_id: string | null;
      substitute_subject_public_id: string | null;
      substitute_other_period_type: string | null;
      substitute_other_label: string | null;
      substitute_other_notes: string;
      reason: string;
    } | null;
  };
  teacherOptions: { label: string; value: string }[];
  subjectOptions: { label: string; value: string }[];
  pending: boolean;
  onSave: (form: {
    overrideType: TimetableOverrideType;
    substituteAssignmentType: 'subject' | 'other';
    substituteTeacherId: string;
    substituteSubjectId: string;
    substituteOtherPeriodType: string;
    substituteOtherLabel: string;
    substituteOtherNotes: string;
    reason: string;
  }) => void;
  onDelete: (overridePublicId: string) => void;
}) {
  const [overrideType, setOverrideType] = useState<TimetableOverrideType>(
    slot.override?.override_type ?? 'substitute'
  );
  const [substituteTeacherId, setSubstituteTeacherId] = useState(
    slot.override?.substitute_teacher_public_id ?? ''
  );
  const [substituteAssignmentType, setSubstituteAssignmentType] = useState<'subject' | 'other'>(
    slot.override?.substitute_assignment_type ?? 'subject'
  );
  const [substituteSubjectId, setSubstituteSubjectId] = useState(
    slot.override?.substitute_subject_public_id ?? ''
  );
  const [substituteOtherPeriodType, setSubstituteOtherPeriodType] = useState(
    slot.override?.substitute_other_period_type ?? 'activity'
  );
  const [substituteOtherLabel, setSubstituteOtherLabel] = useState(
    slot.override?.substitute_other_label ?? ''
  );
  const [substituteOtherNotes, setSubstituteOtherNotes] = useState(
    slot.override?.substitute_other_notes ?? ''
  );
  const [reason, setReason] = useState(slot.override?.reason ?? '');

  useEffect(() => {
    setOverrideType(slot.override?.override_type ?? 'substitute');
    setSubstituteTeacherId(slot.override?.substitute_teacher_public_id ?? '');
    setSubstituteAssignmentType(slot.override?.substitute_assignment_type ?? 'subject');
    setSubstituteSubjectId(slot.override?.substitute_subject_public_id ?? '');
    setSubstituteOtherPeriodType(slot.override?.substitute_other_period_type ?? 'activity');
    setSubstituteOtherLabel(slot.override?.substitute_other_label ?? '');
    setSubstituteOtherNotes(slot.override?.substitute_other_notes ?? '');
    setReason(slot.override?.reason ?? '');
  }, [slot.override]);

  const isCancelled = overrideType === 'cancelled';
  const isOtherAssignment = substituteAssignmentType === 'other';

  if (slot.is_break) {
    return (
      <View style={[styles.slotCard, styles.breakCard]}>
        <Text style={styles.slotTitle}>{slot.label}</Text>
        <Text style={styles.slotMeta}>
          {slot.start_time} - {slot.end_time}
        </Text>
      </View>
    );
  }

  if (!slot.entry_public_id) {
    return (
      <View style={styles.slotCard}>
        <Text style={styles.slotTitle}>{slot.label}</Text>
        <Text style={styles.slotMeta}>No weekly assignment exists for this slot.</Text>
      </View>
    );
  }

  return (
    <View style={styles.slotCard}>
      <Text style={styles.slotTitle}>{slot.label}</Text>
      <Text style={styles.slotMeta}>
        {slot.start_time} - {slot.end_time}
        {slot.subject_name ? ` | ${slot.subject_name}` : ''}
        {slot.teacher_name ? ` | ${slot.teacher_name}` : ''}
      </Text>

      <View style={styles.fieldGap}>
        <FormDropdown
          label="Override Type"
          options={OVERRIDE_TYPE_OPTIONS}
          value={overrideType}
          onChange={(v) => setOverrideType(v as TimetableOverrideType)}
          placeholder="Select type"
        />

        <FormDropdown
          label="Assignment Mode"
          options={[...ASSIGNMENT_MODE_OPTIONS]}
          value={substituteAssignmentType}
          onChange={(v) => setSubstituteAssignmentType(v as 'subject' | 'other')}
          placeholder="Select assignment mode"
        />

        <FormDropdown
          label="Substitute Teacher (optional)"
          options={teacherOptions}
          value={substituteTeacherId}
          onChange={setSubstituteTeacherId}
          placeholder="Select teacher"
          searchable
          disabled={isCancelled}
        />

        {!isOtherAssignment ? (
          <FormDropdown
            label="Substitute Subject (optional)"
            options={subjectOptions}
            value={substituteSubjectId}
            onChange={setSubstituteSubjectId}
            placeholder="Select subject"
            searchable
            disabled={isCancelled}
          />
        ) : (
          <>
            <FormDropdown
              label="Other Activity Type"
              options={OTHER_ACTIVITY_TYPE_OPTIONS}
              value={substituteOtherPeriodType}
              onChange={setSubstituteOtherPeriodType}
              placeholder="Select activity type"
              searchable
              disabled={isCancelled}
            />
            <Text style={styles.dateLabel}>Other Activity Label</Text>
            <TextInput
              value={substituteOtherLabel}
              onChangeText={setSubstituteOtherLabel}
              placeholder="e.g., Lab Preparation"
              style={styles.reasonInput}
              maxLength={60}
              editable={!isCancelled}
            />
            <Text style={styles.dateLabel}>Other Activity Notes (optional)</Text>
            <TextInput
              value={substituteOtherNotes}
              onChangeText={setSubstituteOtherNotes}
              placeholder="Optional activity notes"
              style={styles.reasonInput}
              maxLength={200}
              editable={!isCancelled}
            />
          </>
        )}

        <Text style={styles.dateLabel}>Reason</Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Sports event / revision class / special activity"
          style={styles.reasonInput}
          maxLength={200}
        />
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.primaryBtn, pending && styles.btnDisabled]}
          onPress={() =>
            onSave({
              overrideType,
              substituteAssignmentType,
              substituteTeacherId,
              substituteSubjectId,
              substituteOtherPeriodType,
              substituteOtherLabel,
              substituteOtherNotes,
              reason,
            })
          }
          disabled={pending}
        >
          {pending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Save size={16} color="#fff" />
              <Text style={styles.primaryBtnText}>Save Override</Text>
            </>
          )}
        </TouchableOpacity>

        {slot.override?.override_public_id && (
          <TouchableOpacity
            style={[styles.deleteBtn, pending && styles.btnDisabled]}
            onPress={() => {
              if (slot.override?.override_public_id) {
                onDelete(slot.override.override_public_id);
              }
            }}
            disabled={pending}
          >
            <Trash2 size={16} color="#dc2626" />
            <Text style={styles.deleteBtnText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, backgroundColor: '#f8fafc' },
  bodyContent: { padding: 16, paddingBottom: 40 },
  filtersCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#fff',
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: { fontSize: 14, color: '#64748b' },
  errorText: { fontSize: 14, color: '#dc2626', textAlign: 'center' },
  slotList: { gap: 12 },
  slotCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  breakCard: {
    backgroundColor: '#f8fafc',
    borderStyle: 'dashed',
  },
  slotTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  slotMeta: { fontSize: 12, color: '#64748b' },
  fieldGap: { gap: 10 },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#fff',
  },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flex: 1,
  },
  primaryBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  deleteBtnText: { color: '#dc2626', fontSize: 13, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
