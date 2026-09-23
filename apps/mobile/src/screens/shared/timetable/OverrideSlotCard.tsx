/**
 * OverrideSlotCard - editable per-slot day-override form used by the override-day screen.
 */

import type { TimetableOverrideType } from '@educard/shared';
import { Save, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { FormDropdown } from '@/components/forms';

import {
  OVERRIDE_TYPE_OPTIONS,
  ASSIGNMENT_MODE_OPTIONS,
  OTHER_ACTIVITY_TYPE_OPTIONS,
} from './override-day-constants';
import { styles } from './override-day-styles';

interface OverrideForm {
  overrideType: TimetableOverrideType;
  substituteAssignmentType: 'subject' | 'other';
  substituteTeacherId: string;
  substituteSubjectId: string;
  substituteOtherPeriodType: string;
  substituteOtherLabel: string;
  substituteOtherNotes: string;
  reason: string;
}

interface OverrideSlotCardProps {
  readonly slot: {
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
  readonly teacherOptions: { label: string; value: string }[];
  readonly subjectOptions: { label: string; value: string }[];
  readonly teacherBySubject: Record<string, string>;
  readonly pending: boolean;
  readonly onSave: (form: OverrideForm) => void;
  readonly onDelete: (overridePublicId: string) => void;
}

export function OverrideSlotCard({
  slot,
  teacherOptions,
  subjectOptions,
  teacherBySubject,
  pending,
  onSave,
  onDelete,
}: OverrideSlotCardProps) {
  const [overrideType, setOverrideType] = useState<TimetableOverrideType>(
    slot.override?.override_type ?? 'substitute',
  );
  const [substituteTeacherId, setSubstituteTeacherId] = useState(
    slot.override?.substitute_teacher_public_id ?? '',
  );
  const [substituteAssignmentType, setSubstituteAssignmentType] = useState<
    'subject' | 'other'
  >(slot.override?.substitute_assignment_type ?? 'subject');
  const [substituteSubjectId, setSubstituteSubjectId] = useState(
    slot.override?.substitute_subject_public_id ?? '',
  );
  const [substituteOtherPeriodType, setSubstituteOtherPeriodType] = useState(
    slot.override?.substitute_other_period_type ?? 'activity',
  );
  const [substituteOtherLabel, setSubstituteOtherLabel] = useState(
    slot.override?.substitute_other_label ?? '',
  );
  const [substituteOtherNotes, setSubstituteOtherNotes] = useState(
    slot.override?.substitute_other_notes ?? '',
  );
  const [reason, setReason] = useState(slot.override?.reason ?? '');

  useEffect(() => {
    setOverrideType(slot.override?.override_type ?? 'substitute');
    setSubstituteTeacherId(slot.override?.substitute_teacher_public_id ?? '');
    setSubstituteAssignmentType(
      slot.override?.substitute_assignment_type ?? 'subject',
    );
    setSubstituteSubjectId(slot.override?.substitute_subject_public_id ?? '');
    setSubstituteOtherPeriodType(
      slot.override?.substitute_other_period_type ?? 'activity',
    );
    setSubstituteOtherLabel(slot.override?.substitute_other_label ?? '');
    setSubstituteOtherNotes(slot.override?.substitute_other_notes ?? '');
    setReason(slot.override?.reason ?? '');
  }, [slot.override]);

  const isCancelled = overrideType === 'cancelled';
  const isOtherAssignment = substituteAssignmentType === 'other';

  // A period cannot be substituted with the subject it already runs.
  const availableSubjectOptions = slot.subject_name
    ? subjectOptions.filter(
        option =>
          option.label.trim().toLowerCase() !==
          slot.subject_name?.trim().toLowerCase(),
      )
    : subjectOptions;

  const handleSubjectChange = (subjectId: string) => {
    setSubstituteSubjectId(subjectId);
    const mappedTeacher = teacherBySubject[subjectId];
    if (mappedTeacher) setSubstituteTeacherId(mappedTeacher);
  };

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
        <Text style={styles.slotMeta}>
          No weekly assignment exists for this slot.
        </Text>
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
          onChange={v => setOverrideType(v as TimetableOverrideType)}
          placeholder="Select type"
        />

        <FormDropdown
          label="Assignment Mode"
          options={[...ASSIGNMENT_MODE_OPTIONS]}
          value={substituteAssignmentType}
          onChange={v => setSubstituteAssignmentType(v as 'subject' | 'other')}
          placeholder="Select assignment mode"
        />

        {!isOtherAssignment ? (
          <>
            <FormDropdown
              label="Substitute Subject (optional)"
              options={availableSubjectOptions}
              value={substituteSubjectId}
              onChange={handleSubjectChange}
              placeholder="Select subject"
              searchable
              disabled={isCancelled}
            />
            <FormDropdown
              label="Substitute Teacher (optional)"
              options={teacherOptions}
              value={substituteTeacherId}
              onChange={setSubstituteTeacherId}
              placeholder="Select subject first, or pick a teacher"
              searchable
              disabled={isCancelled}
            />
          </>
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
            <FormDropdown
              label="Substitute Teacher (optional)"
              options={teacherOptions}
              value={substituteTeacherId}
              onChange={setSubstituteTeacherId}
              placeholder="Select teacher"
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
            <Text style={styles.dateLabel}>
              Other Activity Notes (optional)
            </Text>
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
