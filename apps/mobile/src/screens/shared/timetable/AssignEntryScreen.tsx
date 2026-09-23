/**
 * Assign Timetable Entry Screen
 * Select a slot → assign subject (teacher auto-assigned from subject)
 * Accessed from timetable view by tapping an unassigned slot
 */

import { getRoleGradient, extractApiError } from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { ChevronLeft, Check, Trash2, AlertCircle } from 'lucide-react-native';
import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { FormDropdown } from '@/components/forms';
import { useSubjectsByClass } from '@/features/subjects';
import { useCreateEntry, useDeleteEntry } from '@/features/timetable';
import { LinearGradient } from '@/lib/linear-gradient';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

export default function AssignEntryScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const route =
    useRoute<RouteProp<SharedStackParamList, 'TimetableAssignEntry'>>();
  const {
    slotId,
    dayOfWeek,
    classId,
    entryId,
    subjectId: existingSubjectId,
    slotLabel,
    className,
  } = route.params;

  const [selectedSubjectId, setSelectedSubjectId] = useState(
    existingSubjectId ?? '',
  );

  const createEntry = useCreateEntry();
  const deleteEntry = useDeleteEntry();

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  // Fetch subjects assigned to this class
  const {
    data: subjectsData,
    isLoading: subjectsLoading,
    isError: subjectsError,
    refetch: refetchSubjects,
  } = useSubjectsByClass(classId);

  const subjectOptions = useMemo(() => {
    const subjects = subjectsData?.data ?? [];
    return subjects.map(s => ({
      label: s.subject_info?.name ?? s.name ?? 'Unknown',
      value: s.public_id,
    }));
  }, [subjectsData]);

  const hasNoSubjects =
    !subjectsLoading && !subjectsError && subjectOptions.length === 0;

  const handleAssign = async () => {
    if (!selectedSubjectId) {
      Alert.alert('Error', 'Please select a subject');
      return;
    }
    try {
      // Backend upserts by (slot, day, class), so reassigning a slot must not
      // delete the existing entry first — that would leave the slot empty if
      // the create then fails.
      const result = await createEntry.mutateAsync({
        slot_public_id: slotId,
        day_of_week: Number.parseInt(dayOfWeek, 10),
        class_public_id: classId,
        assignment_type: 'subject',
        subject_public_id: selectedSubjectId,
      });
      if (result.warnings?.length) {
        Alert.alert('Warning', result.warnings.join('\n'), [
          { text: 'OK', onPress: handleBack },
        ]);
      } else {
        handleBack();
      }
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
    }
  };

  const handleRemove = () => {
    if (!entryId) return;
    Alert.alert(
      'Remove Assignment',
      'Remove the subject assignment from this slot?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteEntry.mutateAsync(entryId);
                handleBack();
              } catch (err) {
                Alert.alert('Error', extractApiError(err));
              }
            })();
          },
        },
      ],
    );
  };

  const isPending = createEntry.isPending || deleteEntry.isPending;

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <Animated.View
          entering={FadeIn.delay(100)}
          style={headerStyles.circle1}
          pointerEvents="none"
        />
        <Animated.View
          entering={FadeIn.delay(200)}
          style={headerStyles.circle2}
          pointerEvents="none"
        />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={handleBack}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Assign Subject</Text>
              <Text style={headerStyles.subtitle}>
                {decodeURIComponent(slotLabel ?? 'Slot')} ·{' '}
                {decodeURIComponent(className ?? 'Class')}
              </Text>
            </View>
            <View style={st.spacer} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={st.body} contentContainerStyle={st.bodyContent}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={st.card}>
            <FormDropdown
              label="Subject"
              value={selectedSubjectId}
              onChange={setSelectedSubjectId}
              options={subjectOptions}
              placeholder="Select a subject"
              loading={subjectsLoading}
              emptyMessage="No subjects assigned to this class"
              required
            />

            {subjectsError && (
              <TouchableOpacity
                style={st.noticeError}
                onPress={() => void refetchSubjects()}
              >
                <AlertCircle size={16} color="#b91c1c" />
                <Text style={st.noticeErrorText}>
                  Couldn't load subjects. Tap to retry.
                </Text>
              </TouchableOpacity>
            )}

            {hasNoSubjects && (
              <View style={st.noticeInfo}>
                <AlertCircle size={16} color="#92400e" />
                <Text style={st.noticeInfoText}>
                  No subjects are assigned to this class yet. Add subjects to
                  this class first, then come back to assign them to slots.
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        <View style={st.actions}>
          <TouchableOpacity
            style={[
              st.assignBtn,
              (isPending || hasNoSubjects) && st.assignBtnDisabled,
            ]}
            onPress={() => void handleAssign()}
            disabled={isPending || hasNoSubjects}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Check size={18} color="#fff" />
                <Text style={st.assignText}>
                  {entryId ? 'Update' : 'Assign'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {entryId && (
            <TouchableOpacity
              style={st.removeBtn}
              onPress={handleRemove}
              disabled={isPending}
            >
              <Trash2 size={18} color="#dc2626" />
              <Text style={st.removeText}>Remove Assignment</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  body: { flex: 1, backgroundColor: '#f8fafc' },
  bodyContent: { padding: 16, paddingBottom: 40 },
  spacer: { width: 40 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  noticeError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  noticeErrorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#b91c1c',
  },
  noticeInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  noticeInfoText: { flex: 1, fontSize: 13, lineHeight: 18, color: '#92400e' },

  actions: { gap: 12, marginTop: 8 },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    paddingVertical: 14,
    borderRadius: 12,
  },
  assignBtnDisabled: { opacity: 0.6 },
  assignText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    paddingVertical: 14,
    borderRadius: 12,
  },
  removeText: { fontSize: 15, fontWeight: '600', color: '#dc2626' },
});
