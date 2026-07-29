/**
 * View Class Screen
 */

import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DetailScreenBase, DetailSection, DetailRow } from '@/components/screens/DetailScreenBase';
import { useClassDetail } from '@/features/classes';

export default function ViewClassScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: cls, isLoading, isError } = useClassDetail(id || '');

  return (
    <DetailScreenBase
      title="Class Details"
      subtitle={cls?.display_name || cls?.name || '...'}
      isLoading={isLoading}
      isError={isError}
      hasData={!!cls}
      errorMessage="Failed to load class details."
    >
      <Animated.View entering={FadeInDown.delay(100)}>
        <DetailSection title="Class Info" icon="🏫">
          <DetailRow label="Section Name" value={cls?.name} />
          <DetailRow label="Master Class" value={cls?.class_master?.name} />
          <DetailRow label="Display Name" value={cls?.display_name} />
          <DetailRow label="Room Number" value={cls?.room_number} />
          <DetailRow label="Capacity" value={cls?.capacity} />
          <DetailRow label="Students" value={cls?.student_count ?? cls?.students_count} />
          <DetailRow label="Info" value={cls?.info} />
        </DetailSection>
      </Animated.View>

      {!!cls?.class_teacher && (
        <Animated.View entering={FadeInDown.delay(200)}>
          <DetailSection title="Class Teacher" icon="👨‍🏫">
            <DetailRow label="Name" value={cls.class_teacher.full_name} />
            <DetailRow label="Email" value={cls.class_teacher.email} />
            <DetailRow label="Phone" value={cls.class_teacher.phone} />
          </DetailSection>
        </Animated.View>
      )}

      {cls?.subjects && cls.subjects.length > 0 && (
        <Animated.View entering={FadeInDown.delay(300)}>
          <DetailSection title="Subjects" icon="📚">
            <View style={localStyles.chipRow}>
              {cls.subjects.map((s) => (
                <View key={s.public_id} style={localStyles.chip}>
                  <Text style={localStyles.chipText}>
                    {s.name}
                    {s.code ? ` (${s.code})` : ''}
                  </Text>
                </View>
              ))}
            </View>
          </DetailSection>
        </Animated.View>
      )}

      {cls?.students && cls.students.length > 0 && (
        <Animated.View entering={FadeInDown.delay(400)}>
          <DetailSection title={`Students (${cls.students.length})`} icon="🎓">
            {cls.students.map((s) => (
              <View key={s.public_id} style={localStyles.studentRow}>
                <Text style={localStyles.studentName}>{s.full_name}</Text>
                <Text style={localStyles.studentAdm}>{s.admission_number}</Text>
              </View>
            ))}
          </DetailSection>
        </Animated.View>
      )}
    </DetailScreenBase>
  );
}

const localStyles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#ede9fe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  chipText: { color: '#7c3aed', fontSize: 13, fontWeight: '600' },
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
