/**
 * Teacher Detail Screen — shared-stack "TeacherDetail"
 * Phone numbers are masked by the backend based on the caller's permissions.
 */

import { useRoute, type RouteProp } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  DetailScreenShell,
  DetailSection,
  DetailRow,
  ChipRow,
} from '@/components/detail';
import { getMediaUrl } from '@/constants/config';
import { useTeacherDetail } from '@/features/teachers';
import { useAuthStore } from '@/lib/auth-store';
import type { SharedStackParamList } from '@/navigation/types';
import { isAdminRole } from '@/utils/role-utils';

export default function TeacherDetailScreen() {
  const route = useRoute<RouteProp<SharedStackParamList, 'TeacherDetail'>>();
  const { id, is_deleted, thumbnail } = route.params;
  const { user } = useAuthStore();
  const isAdmin = isAdminRole(user?.role);
  const isDeleted = is_deleted === 'true';
  const {
    data: teacher,
    isLoading,
    isError,
  } = useTeacherDetail(id || '', isDeleted, user?.role);

  // The backend handles phone masking based on permissions; the frontend just
  // displays whatever it returns (admins/supervisors see full, others masked).
  const phoneDisplay = teacher?.user?.phone || '—';

  // Use cached thumbnail from list navigation, fallback to detail response.
  const profileImageUrl =
    getMediaUrl(teacher?.profile_photo_thumbnail) || getMediaUrl(thumbnail);

  return (
    <DetailScreenShell
      title="Teacher Details"
      subtitle={teacher?.user?.full_name || '...'}
      isLoading={isLoading}
      isError={isError || !teacher}
      avatarName={teacher?.user?.full_name}
      avatarImageUri={profileImageUrl}
    >
      <Animated.View entering={FadeInDown.delay(100)}>
        <DetailSection title="Personal Info" icon="👤">
          <DetailRow label="Full Name" value={teacher?.user?.full_name} />
          <DetailRow label="Email" value={teacher?.user?.email} />
          <DetailRow label="Phone" value={phoneDisplay} />
          <DetailRow label="Gender" value={teacher?.user?.gender} />
          <DetailRow
            label="Date of Birth"
            value={teacher?.user?.date_of_birth}
          />
          <DetailRow label="Blood Group" value={teacher?.user?.blood_group} />
        </DetailSection>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200)}>
        <DetailSection title="Employment" icon="💼">
          <DetailRow label="Employee ID" value={teacher?.employee_id} />
          <DetailRow label="Designation" value={teacher?.designation} />
          <DetailRow label="Specialization" value={teacher?.specialization} />
          <DetailRow
            label="Qualification"
            value={teacher?.highest_qualification}
          />
          <DetailRow
            label="Experience (yrs)"
            value={teacher?.experience_years}
          />
          <DetailRow label="Joining Date" value={teacher?.joining_date} />
        </DetailSection>
      </Animated.View>

      {teacher?.subjects?.length ? (
        <Animated.View entering={FadeInDown.delay(300)}>
          <DetailSection title="Subjects" icon="📚">
            <ChipRow
              items={teacher.subjects.map(s => {
                const label = s.code ? `${s.name} (${s.code})` : s.name;
                return { key: s.public_id, label };
              })}
            />
          </DetailSection>
        </Animated.View>
      ) : null}

      {isAdmin && teacher?.user?.address ? (
        <Animated.View entering={FadeInDown.delay(400)}>
          <DetailSection title="Address" icon="📍">
            <DetailRow
              label="Street"
              value={teacher.user.address.street_address}
            />
            <DetailRow
              label="Address Line 2"
              value={teacher.user.address.address_line_2}
            />
            <DetailRow label="City" value={teacher.user.address.city} />
            <DetailRow label="State" value={teacher.user.address.state} />
            <DetailRow
              label="Postal Code"
              value={teacher.user.address.zip_code}
            />
            <DetailRow label="Country" value={teacher.user.address.country} />
          </DetailSection>
        </Animated.View>
      ) : null}
    </DetailScreenShell>
  );
}
