/**
 * A student's ID card as it will print, rendered live from the school's approved design
 * and the student's own details, with anything the card is missing. Only the school admin
 * and the class teacher can load it; for anyone else the section stays out of the way.
 */
import { IdCard } from 'lucide-react-native';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { LoadingState } from '@/components/common/ListStates';
import { InfoPoints } from '@/components/ui';

import { useStudentCard } from '../hooks/use-store';
import { CardSides } from './CardSides';
import { MissingCardFields } from './MissingCardFields';

export function StudentIdCardSection({ studentId }: { studentId: string }) {
  const { width } = useWindowDimensions();
  const { data, isLoading, isError } = useStudentCard(studentId);
  const card = data?.data;

  if (isError) {
    return null;
  }
  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <IdCard size={18} color="#111827" />
        <Text style={styles.title}>ID card preview</Text>
      </View>
      {isLoading ? (
        <LoadingState color="#7c3aed" message="Rendering the card…" />
      ) : card?.available && card.front_preview_url ? (
        <>
          <CardSides
            frontPath={card.front_preview_url}
            backPath={card.back_preview_url || null}
            orientation={card.orientation}
            width={width - 32 - 32}
          />
          <MissingCardFields card={card} />
          <InfoPoints
            tone="muted"
            items={[
              card.design_name ? `Design: ${card.design_name}` : null,
              'Filled in from this student’s profile: fix the profile (name, photo, class, …) to change the card.',
            ]}
          />
        </>
      ) : (
        <InfoPoints
          tone="muted"
          items={[
            'No ID card design is approved for this student’s class yet.',
            'Choose or send one under Store Setup, and EduCard will approve it.',
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
});
