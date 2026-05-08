/**
 * Assign Timetable Entry Screen
 * Select a slot → assign subject (teacher auto-assigned from subject)
 * Accessed from timetable view by tapping an unassigned slot
 */

import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Check, Trash2 } from 'lucide-react-native';
import { useState, useMemo } from 'react';
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

import { getRoleGradient, extractApiError } from '@educard/shared';
import { FormDropdown, FormInput } from '@/components/forms';
import { useSubjects } from '@/features/subjects';
import { useCreateEntry, useDeleteEntry } from '@/features/timetable';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

export default function AssignEntryScreen() {
  const router = useRouter();
  const {
    slotId,
    dayOfWeek,
    classId,
    entryId,
    subjectId: existingSubjectId,
    slotLabel,
    className,
  } = useLocalSearchParams<{
    slotId: string;
    dayOfWeek: string;
    classId: string;
    entryId?: string;
    subjectId?: string;
    slotLabel?: string;
    className?: string;
  }>();

  const [selectedSubjectId, setSelectedSubjectId] = useState(existingSubjectId ?? '');
  const [room, setRoom] = useState('');
  const [notes, setNotes] = useState('');

  const createEntry = useCreateEntry();
  const deleteEntry = useDeleteEntry();

  // Fetch subjects for this class
  const { data: subjectsData } = useSubjects({ class_id: classId, page_size: 100 });

  const subjectOptions = useMemo(
    () => (subjectsData?.subjects ?? []).map((s) => ({ label: s.name, value: s.public_id })),
    [subjectsData]
  );

  const handleAssign = async () => {
    if (!selectedSubjectId) {
      Alert.alert('Error', 'Please select a subject');
      return;
    }
    try {
      // If there's an existing entry, delete it first
      if (entryId) {
        await deleteEntry.mutateAsync(entryId);
      }
      const result = await createEntry.mutateAsync({
        slot_public_id: slotId,
        day_of_week: parseInt(dayOfWeek, 10),
        class_public_id: classId,
        subject_public_id: selectedSubjectId,
        room: room.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if (result.warnings?.length) {
        Alert.alert('Warning', result.warnings.join('\n'), [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        router.back();
      }
    } catch (err) {
      Alert.alert('Error', extractApiError(err));
    }
  };

  const handleRemove = () => {
    if (!entryId) return;
    Alert.alert('Remove Assignment', 'Remove the subject assignment from this slot?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteEntry.mutateAsync(entryId);
              router.back();
            } catch (err) {
              Alert.alert('Error', extractApiError(err));
            }
          })();
        },
      },
    ]);
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
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Assign Subject</Text>
              <Text style={headerStyles.subtitle}>
                {decodeURIComponent(slotLabel ?? 'Slot')} ·{' '}
                {decodeURIComponent(className ?? 'Class')}
              </Text>
            </View>
            <View style={{ width: 40 }} />
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
              required
            />
            <FormInput
              label="Room"
              value={room}
              onChangeText={setRoom}
              placeholder="e.g., Room 101 (optional)"
            />
            <FormInput
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional notes"
              multiline
            />
          </View>
        </Animated.View>

        <View style={st.actions}>
          <TouchableOpacity
            style={[st.assignBtn, isPending && st.assignBtnDisabled]}
            onPress={() => void handleAssign()}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Check size={18} color="#fff" />
                <Text style={st.assignText}>{entryId ? 'Update' : 'Assign'}</Text>
              </>
            )}
          </TouchableOpacity>

          {entryId && (
            <TouchableOpacity style={st.removeBtn} onPress={handleRemove} disabled={isPending}>
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
