/**
 * Timetable Override Day Screen
 * Change a single day's timetable (substitute/cancel/extra class) without altering the weekly plan.
 */

import {
  extractApiError,
  getRoleGradient,
  type ClassTimetableDateSlot,
  type TimetableOverrideType,
} from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { ChevronLeft, CalendarRange } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { FormDropdown } from '@/components/forms';
import { useClasses } from '@/features/classes';
import { useSubjectsByClass } from '@/features/subjects';
import { useTeachers } from '@/features/teachers';
import {
  useClassTimetableForDate,
  useDeleteOverride,
  useUpsertOverride,
} from '@/features/timetable';
import { LinearGradient } from '@/lib/linear-gradient';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';

import {
  getTodayDateString,
  isDateStringValid,
} from './override-day-constants';
import { OverrideSlotCard } from './OverrideSlotCard';
import { styles } from './override-day-styles';

const adminGradient = getRoleGradient('admin');

export default function TimetableOverrideDayScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const route =
    useRoute<RouteProp<SharedStackParamList, 'TimetableOverrideDay'>>();
  const params = route.params ?? {};
  const [selectedClassId, setSelectedClassId] = useState(params.classId ?? '');
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [refreshing, setRefreshing] = useState(false);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  const { data: classesData, isLoading: classesLoading } = useClasses({
    page_size: 200,
  });

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
  } = useClassTimetableForDate(
    selectedClassId || undefined,
    selectedDate || undefined,
  );

  const { data: subjectsData } = useSubjectsByClass(selectedClassId);
  const { data: teachersData } = useTeachers({ page_size: 200 });

  const upsertOverride = useUpsertOverride(selectedClassId || '');
  const deleteOverride = useDeleteOverride(selectedClassId || '');

  const classOptions = useMemo(() => {
    return (classesData?.classes ?? []).map(c => ({
      label: `${c.class_master?.name ?? c.name} - ${c.name}`,
      value: c.public_id,
    }));
  }, [classesData]);

  const subjectOptions = useMemo(() => {
    return (subjectsData?.data ?? []).map(s => ({
      label: s.subject_info?.name ?? 'Subject',
      value: s.public_id,
    }));
  }, [subjectsData]);

  // Subject -> its assigned teacher, so picking a subject fills the teacher.
  const teacherBySubject = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of subjectsData?.data ?? []) {
      const teacherId = s.teacher_info?.public_id ?? s.teacher?.public_id;
      if (teacherId) map[s.public_id] = teacherId;
    }
    return map;
  }, [subjectsData]);

  // Teacher profile public_ids — the override API rejects user public_ids.
  const teacherOptions = useMemo(() => {
    return (teachersData?.teachers ?? []).map(t => ({
      label: t.full_name,
      value: t.public_id,
    }));
  }, [teachersData]);

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
    },
  ) => {
    if (!slot.entry_public_id) {
      Alert.alert(
        'Missing Entry',
        'This slot has no weekly assignment to override.',
      );
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
          form.overrideType === 'cancelled'
            ? null
            : form.substituteTeacherId || null,
        substitute_subject_public_id:
          form.overrideType === 'cancelled' ||
          form.substituteAssignmentType === 'other'
            ? null
            : form.substituteSubjectId || null,
        substitute_other_period_type:
          form.overrideType === 'cancelled' ||
          form.substituteAssignmentType !== 'other'
            ? ''
            : form.substituteOtherPeriodType,
        substitute_other_label:
          form.overrideType === 'cancelled' ||
          form.substituteAssignmentType !== 'other'
            ? ''
            : form.substituteOtherLabel.trim(),
        substitute_other_notes:
          form.overrideType === 'cancelled' ||
          form.substituteAssignmentType !== 'other'
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

  const renderDayContent = () => {
    if (dayLoading) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      );
    }
    if (!selectedClassId) {
      return (
        <View style={styles.centerState}>
          <CalendarRange size={24} color="#64748b" />
          <Text style={styles.emptyText}>
            Select class and date to view slots
          </Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{extractApiError(error)}</Text>
        </View>
      );
    }
    return (
      <View style={styles.slotList}>
        {(dayTimetable?.slots ?? []).map(slot => (
          <OverrideSlotCard
            key={slot.slot_public_id}
            slot={slot}
            teacherOptions={teacherOptions}
            subjectOptions={subjectOptions}
            teacherBySubject={teacherBySubject}
            pending={upsertOverride.isPending || deleteOverride.isPending}
            onSave={form => void handleSaveOverride(slot, form)}
            onDelete={overridePublicId =>
              void handleDeleteOverride(overridePublicId)
            }
          />
        ))}
      </View>
    );
  };

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={handleBack}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Day Overrides</Text>
              <Text style={headerStyles.subtitle}>
                Change one-day timetable only
              </Text>
            </View>
            <View style={styles.spacer} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
          />
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

        {renderDayContent()}
      </ScrollView>
    </View>
  );
}
