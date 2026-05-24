/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-misused-promises, @typescript-eslint/no-floating-promises, @typescript-eslint/prefer-nullish-coalescing */ /**
 * Class Detail Screen — /(shared-screens)/classes/[id]
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DetailScreenShell, DetailSection, DetailRow, ChipRow } from '@/components/detail';
import { useClassDetail } from '@/features/classes';

export default function ClassDetailScreen() {
  const { id, is_deleted } = useLocalSearchParams<{ id: string; is_deleted?: string }>();
  const router = useRouter();
  const isDeleted = is_deleted === 'true';
  const { data: cls, isLoading, isError } = useClassDetail(id || '', isDeleted);

  const c = cls;
  let isFullDisplay: string | undefined;
  if (c?.is_full != null) {
    isFullDisplay = c.is_full ? 'Yes' : 'No';
  }
  const displayName = c?.class_master?.name
    ? `${c.class_master.name} - ${c.name}`
    : c?.name || '...';

  return (
    <DetailScreenShell
      title="Class Details"
      subtitle={displayName}
      isLoading={isLoading}
      isError={isError || !cls}
      onBack={() => router.back()}
    >
      <Animated.View entering={FadeInDown.delay(100)}>
        <DetailSection title="Class Info" icon="🏫">
          <DetailRow label="Grade / Class" value={c?.class_master?.name} />
          <DetailRow label="Section" value={c?.name} />
          <DetailRow label="Room Number" value={c?.room_number} />
          <DetailRow label="Capacity" value={c?.capacity} />
          <DetailRow label="Students" value={c?.student_count} />
          <DetailRow label="Subjects" value={c?.subjects_count} />
          <DetailRow label="Available Seats" value={c?.available_seats} />
          <DetailRow label="Full" value={isFullDisplay} />
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
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
              items={c.subjects.map((s: any) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
                const name = s.subject_info?.name || s.name;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                const code = s.subject_info?.code || s.code;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
                const label = code ? `${name} (${code})` : String(name);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
                return { key: s.public_id, label };
              })}
            />
          </DetailSection>
        </Animated.View>
      ) : null}

      {c?.students?.length ? (
        <Animated.View entering={FadeInDown.delay(400)}>
          <DetailSection title={`Students (${c.students.length})`} icon="🎓">
            {/* eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */}
            {c.students.map((s: any) => (
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              <View key={s.public_id} style={extraStyles.studentRow}>
                {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
                <Text style={extraStyles.studentName}>{s.full_name}</Text>
                {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
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
