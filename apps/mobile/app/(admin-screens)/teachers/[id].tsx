/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-misused-promises, @typescript-eslint/no-floating-promises, @typescript-eslint/prefer-nullish-coalescing */ /**
 * Teacher Detail Screen — /(admin-screens)/teachers/[id]
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DetailScreenShell, DetailSection, DetailRow, ChipRow } from '@/components/detail';
import { getMediaUrl } from '@/constants/config';
import { useTeacherDetail } from '@/features/teachers';

export default function TeacherDetailScreen() {
  const { id, is_deleted } = useLocalSearchParams<{ id: string; is_deleted?: string }>();
  const router = useRouter();
  const isDeleted = is_deleted === 'true';
  const { data: teacher, isLoading, isError } = useTeacherDetail(id || '', isDeleted);

  // The backend handles phone masking based on permissions
  const phoneDisplay = teacher?.user?.phone || '—';

  // Get profile image URL
  const profileImageUrl = getMediaUrl(teacher?.profile_photo_thumbnail);

  return (
    <DetailScreenShell
      title="Teacher Details"
      subtitle={teacher?.user?.full_name || '...'}
      isLoading={isLoading}
      isError={isError || !teacher}
      onBack={() => router.back()}
      avatarName={teacher?.user?.full_name}
      avatarImageUri={profileImageUrl}
    >
      <Animated.View entering={FadeInDown.delay(100)}>
        <DetailSection title="Personal Info" icon="👤">
          <DetailRow label="Full Name" value={teacher?.user?.full_name} />
          <DetailRow label="Email" value={teacher?.user?.email} />
          <DetailRow label="Phone" value={phoneDisplay} />
          <DetailRow label="Gender" value={teacher?.user?.gender} />
          <DetailRow label="Date of Birth" value={teacher?.user?.date_of_birth} />
          <DetailRow label="Blood Group" value={teacher?.user?.blood_group} />
        </DetailSection>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200)}>
        <DetailSection title="Employment" icon="💼">
          <DetailRow label="Employee ID" value={teacher?.employee_id} />
          <DetailRow label="Designation" value={teacher?.designation} />
          <DetailRow label="Specialization" value={teacher?.specialization} />
          <DetailRow label="Qualification" value={teacher?.highest_qualification} />
          <DetailRow label="Experience (yrs)" value={teacher?.experience_years} />
          <DetailRow label="Joining Date" value={teacher?.joining_date} />
        </DetailSection>
      </Animated.View>

      {teacher?.subjects?.length ? (
        <Animated.View entering={FadeInDown.delay(300)}>
          <DetailSection title="Subjects" icon="📚">
            <ChipRow
              items={teacher.subjects.map((s) => ({
                key: s.public_id,
                label: `${s.name}${s.code ? ` (${s.code})` : ''}`,
              }))}
            />
          </DetailSection>
        </Animated.View>
      ) : null}
    </DetailScreenShell>
  );
}
