/**
 * ID Card Review (school admin and class teachers) - pick a class and step through its
 * students with Previous / Next. Each student's card is rendered from the school's
 * approved design; anything it is missing is listed, and "Edit details" fixes it.
 * The card refreshes when you come back from editing.
 */

import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  IdCard,
  PenLine,
  Users,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, LoadingState } from '@/components/common/ListStates';
import { InfoPoints, SearchableSelect } from '@/components/ui';
import { useManagedClasses } from '@/features/classes';
import {
  getStudentCard,
  storeKeys,
  useClassRoster,
  useStudentCard,
} from '@/features/store';
import { CardSides } from '@/features/store/components/CardSides';
import { MissingCardFields } from '@/features/store/components/MissingCardFields';
import { StoreHeader } from '@/features/store/components/StoreHeader';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';
import { layoutStyles } from '@/styles';

type ReviewRoute = RouteProp<SharedStackParamList, 'IdCardReview'>;

export default function IdCardReviewScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const { params } = useRoute<ReviewRoute>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();

  const { data: classData, isLoading: classesLoading } =
    useManagedClasses('student');
  const classes = useMemo(() => classData?.classes ?? [], [classData]);
  const [classId, setClassId] = useState<string | undefined>(params?.classId);
  const [studentId, setStudentId] = useState<string | undefined>(
    params?.studentId,
  );

  // Open the first class straight away.
  useEffect(() => {
    if (!classId && classes.length > 0) {
      setClassId(classes[0].public_id);
    }
  }, [classId, classes]);

  const { data: roster = [], isLoading: rosterLoading } =
    useClassRoster(classId);
  const index = Math.max(
    0,
    roster.findIndex(student => student.public_id === studentId),
  );
  const current = roster[index];
  const {
    data: cardResponse,
    isLoading: cardLoading,
    isError: cardError,
    refetch,
  } = useStudentCard(current?.public_id);
  const card = cardResponse?.data;

  // Back from "Edit details": show the corrected card.
  useFocusEffect(
    useCallback(() => {
      if (current?.public_id) {
        void refetch();
      }
    }, [current?.public_id, refetch]),
  );

  // Load the next student's card in the background so Next feels instant.
  const nextId = roster[index + 1]?.public_id;
  useEffect(() => {
    if (nextId) {
      void queryClient.prefetchQuery({
        queryKey: storeKeys.studentCard(nextId),
        queryFn: () => getStudentCard(nextId),
      });
    }
  }, [nextId, queryClient]);

  const classOptions = classes.map(cls => ({
    value: cls.public_id,
    label: cls.display_name || cls.name,
  }));
  const studentOptions = roster.map(student => ({
    value: student.public_id,
    label: student.roll_number
      ? `${student.roll_number} · ${student.full_name}`
      : student.full_name,
  }));

  const chooseClass = (value: string) => {
    setClassId(value);
    setStudentId(undefined);
  };
  const goTo = (nextIndex: number) => {
    const target = roster[nextIndex];
    if (target) {
      setStudentId(target.public_id);
    }
  };

  const cardWidth = width - 32 - 32;

  return (
    <View style={[layoutStyles.container, { paddingTop: insets.top }]}>
      <StoreHeader
        title="ID Card Review"
        subtitle="Check each student's card before printing"
      />
      {classesLoading ? (
        <LoadingState color="#7c3aed" />
      ) : classes.length === 0 ? (
        <EmptyState
          icon={<Users size={40} color="#9ca3af" />}
          message="No classes to review"
          subMessage="Only the school admin and class teachers can review ID cards."
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 32 },
          ]}
        >
          <View style={styles.card}>
            <SearchableSelect
              label="Class"
              title="Choose a class"
              options={classOptions}
              value={classId}
              onValueChange={chooseClass}
              placeholder="Select a class"
            />
            <SearchableSelect
              label="Student"
              title="Choose a student"
              options={studentOptions}
              value={current?.public_id}
              onValueChange={setStudentId}
              placeholder={
                rosterLoading ? 'Loading students…' : 'Select a student'
              }
              searchPlaceholder="Name or roll number"
              loading={rosterLoading}
              disabled={roster.length === 0}
            />
            <View style={styles.pager}>
              <TouchableOpacity
                style={[styles.pagerButton, index <= 0 && styles.disabled]}
                disabled={index <= 0}
                onPress={() => goTo(index - 1)}
                accessibilityLabel="Previous student"
              >
                <ChevronLeft size={20} color="#111827" />
                <Text style={styles.pagerText}>Previous</Text>
              </TouchableOpacity>
              <Text style={styles.position}>
                {roster.length ? `${index + 1} of ${roster.length}` : '0 of 0'}
              </Text>
              <TouchableOpacity
                style={[
                  styles.pagerButton,
                  index >= roster.length - 1 && styles.disabled,
                ]}
                disabled={index >= roster.length - 1}
                onPress={() => goTo(index + 1)}
                accessibilityLabel="Next student"
              >
                <Text style={styles.pagerText}>Next</Text>
                <ChevronRight size={20} color="#111827" />
              </TouchableOpacity>
            </View>
          </View>

          {!rosterLoading && roster.length === 0 ? (
            <EmptyState
              icon={<Users size={40} color="#9ca3af" />}
              message="There are no students in this class yet."
            />
          ) : current ? (
            <>
              <View style={styles.card}>
                <View style={styles.studentRow}>
                  <View style={styles.flex}>
                    <Text style={styles.studentName}>{current.full_name}</Text>
                    <Text style={styles.studentMeta}>
                      Roll {current.roll_number || '—'} ·{' '}
                      {[
                        current.class_info?.class_master_name,
                        current.class_info?.name,
                      ]
                        .filter(Boolean)
                        .join(' - ')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() =>
                      navigation.navigate('StudentEdit', {
                        id: current.public_id,
                      })
                    }
                  >
                    <PenLine size={16} color="#fff" />
                    <Text style={styles.editText}>Edit details</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <MissingCardFields
                card={card}
                action="The card prints without these. Tap Edit details to fill them in."
              />

              <View style={styles.card}>
                <View style={styles.cardTitleRow}>
                  <IdCard size={18} color="#111827" />
                  <Text style={styles.cardTitle}>ID card preview</Text>
                </View>
                {cardLoading ? (
                  <LoadingState color="#7c3aed" message="Rendering the card…" />
                ) : cardError ? (
                  <Text style={styles.muted}>
                    This card could not be loaded. Only the school admin and the
                    class teacher can see a student’s ID card.
                  </Text>
                ) : !card?.available ? (
                  <InfoPoints
                    tone="muted"
                    items={[
                      'No ID card design is approved for this class yet.',
                      'Choose or send one under Store Setup, and EduCard will approve it.',
                    ]}
                  />
                ) : (
                  <>
                    {card.design_name ? (
                      <Text style={styles.muted}>
                        Design: {card.design_name}
                      </Text>
                    ) : null}
                    <CardSides
                      frontPath={card.front_preview_url}
                      backPath={card.back_preview_url || null}
                      orientation={card.orientation}
                      width={cardWidth}
                    />
                    {(card.missing_fields?.length ?? 0) === 0 ? (
                      <View style={styles.okRow}>
                        <CheckCircle2 size={18} color="#16a34a" />
                        <Text style={styles.okText}>
                          Every detail this design prints is filled in.
                        </Text>
                      </View>
                    ) : null}
                    <InfoPoints
                      tone="muted"
                      items={[
                        'Check the spelling, photo and class.',
                        'The card is filled in from the student’s profile: correct the profile to correct the card.',
                      ]}
                    />
                  </>
                )}
              </View>
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 12,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pagerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 110,
    justifyContent: 'center',
  },
  pagerText: { fontSize: 15, fontWeight: '600', color: '#111827' },
  disabled: { opacity: 0.4 },
  position: { fontSize: 14, fontWeight: '600', color: '#4b5563' },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  studentName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  studentMeta: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  editText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  muted: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  okRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  okText: { flex: 1, fontSize: 14, color: '#15803d' },
});
