/**
 * Class Detail Screen — /(admin-screens)/classes/[id]
 */

import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useClassDetail } from '@/features/classes';
import { DetailScreenShell, DetailSection, DetailRow, ChipRow } from '@/components/detail';

export default function ClassDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: cls, isLoading, isError } = useClassDetail(id || '');

  const c = cls as any;
  const displayName = c?.class_master?.name
    ? `${c.class_master.name} - ${c.name}`
    : c?.name || '...';

  return (
    <DetailScreenShell
      title="Class Details"
      subtitle={displayName}
      isLoading={isLoading}
      isError={isError || !cls}
      onBack={() => router.navigate('/(tabs)/(admin)/classes' as any)}
    >
      <Animated.View entering={FadeInDown.delay(100)}>
        <DetailSection title="Class Info" icon="🏫">
          <DetailRow label="Grade / Class" value={c?.class_master?.name} />
          <DetailRow label="Section" value={c?.name} />
          <DetailRow label="Capacity" value={c?.capacity} />
          <DetailRow label="Students" value={c?.student_count} />
          <DetailRow label="Subjects" value={c?.subjects_count} />
          <DetailRow label="Available Seats" value={c?.available_seats} />
          <DetailRow
            label="Full"
            value={c?.is_full ? 'Yes' : c?.is_full === false ? 'No' : undefined}
          />
          <DetailRow label="Info" value={c?.info} />
        </DetailSection>
      </Animated.View>

      {c?.class_teacher && (
        <Animated.View entering={FadeInDown.delay(200)}>
          <DetailSection title="Class Teacher" icon="👨‍🏫">
            <DetailRow label="Name" value={c.class_teacher.full_name} />
            <DetailRow label="Email" value={c.class_teacher.email} />
            <DetailRow label="Phone" value={c.class_teacher.phone} />
          </DetailSection>
        </Animated.View>
      )}

      {c?.subjects?.length ? (
        <Animated.View entering={FadeInDown.delay(300)}>
          <DetailSection title="Subjects" icon="📚">
            <ChipRow
              items={c.subjects.map((s: any) => ({
                key: s.public_id,
                label: `${s.subject_info?.name || s.name}${s.subject_info?.code || s.code ? ` (${s.subject_info?.code || s.code})` : ''}`,
              }))}
            />
          </DetailSection>
        </Animated.View>
      ) : null}

      {c?.students?.length ? (
        <Animated.View entering={FadeInDown.delay(400)}>
          <DetailSection title={`Students (${c.students.length})`} icon="🎓">
            {c.students.map((s: any) => (
              <View key={s.public_id} style={extraStyles.studentRow}>
                <Text style={extraStyles.studentName}>{s.full_name}</Text>
                <Text style={extraStyles.studentAdm}>{s.admission_number}</Text>
              </View>
            ))}
          </DetailSection>
        </Animated.View>
      ) : null}
    </DetailScreenShell>
  );
}

const extraStyles = StyleSheet.create({
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  studentName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  studentAdm: { fontSize: 13, color: '#64748b' },
});
