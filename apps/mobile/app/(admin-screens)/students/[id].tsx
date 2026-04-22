/**
 * Student Detail Screen — /(admin-screens)/students/[id]
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStudentDetail } from '@/features/students';
import { DetailScreenShell, DetailSection, DetailRow } from '@/components/detail';

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: student, isLoading, isError } = useStudentDetail(id || '');

  return (
    <DetailScreenShell
      title="Student Details"
      subtitle={student?.full_name || '...'}
      isLoading={isLoading}
      isError={isError || !student}
      onBack={() => router.navigate('/(tabs)/(admin)/students' as any)}
    >
      <Animated.View entering={FadeInDown.delay(100)}>
        <DetailSection title="Personal Info" icon="👤">
          <DetailRow label="Full Name" value={student?.full_name} />
          <DetailRow label="Email" value={student?.user_info?.email} />
          <DetailRow label="Phone" value={student?.user_info?.phone} />
          <DetailRow label="Gender" value={student?.user_info?.gender} />
          <DetailRow label="Date of Birth" value={student?.user_info?.date_of_birth} />
          <DetailRow label="Blood Group" value={student?.user_info?.blood_group} />
        </DetailSection>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200)}>
        <DetailSection title="Admission" icon="🎓">
          <DetailRow label="Roll Number" value={student?.roll_number} />
          <DetailRow label="Admission No." value={student?.admission_number} />
          <DetailRow label="Admission Date" value={student?.admission_date} />
          <DetailRow label="Class" value={(student as any)?.class_info?.class_master?.name} />
          <DetailRow label="Section" value={(student as any)?.class_info?.name} />
        </DetailSection>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300)}>
        <DetailSection title="Guardian" icon="👨‍👩‍👦">
          <DetailRow label="Name" value={student?.guardian_name} />
          <DetailRow label="Phone" value={student?.guardian_phone} />
          <DetailRow label="Email" value={student?.guardian_email} />
          <DetailRow label="Relationship" value={student?.guardian_relationship} />
        </DetailSection>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400)}>
        <DetailSection title="Emergency & Medical" icon="🆘">
          <DetailRow label="Emergency Contact" value={student?.emergency_contact_name} />
          <DetailRow label="Emergency Phone" value={student?.emergency_contact_phone} />
          <DetailRow label="Medical Conditions" value={student?.medical_conditions} />
        </DetailSection>
      </Animated.View>
    </DetailScreenShell>
  );
}
