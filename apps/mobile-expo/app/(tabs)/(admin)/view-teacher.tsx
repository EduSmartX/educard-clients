/**
 * View Teacher Screen
 */

import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ProfileAvatar } from '@/components/common/ProfileAvatar';
import { DetailScreenBase, DetailSection, DetailRow } from '@/components/screens/DetailScreenBase';
import { useTeacherDetail } from '@/features/teachers';

export default function ViewTeacherScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: teacher, isLoading, isError } = useTeacherDetail(id || '');

  return (
    <DetailScreenBase
      title="Teacher Details"
      subtitle={teacher?.user?.full_name || '...'}
      isLoading={isLoading}
      isError={isError}
      hasData={!!teacher}
      errorMessage="Failed to load teacher details."
    >
      {/* Avatar */}
      <Animated.View entering={FadeInDown.delay(50)} style={localStyles.avatarContainer}>
        <ProfileAvatar
          name={teacher?.user?.full_name}
          imageUri={teacher?.profile_photo_thumbnail}
          size={90}
        />
        <Text style={localStyles.avatarName}>{teacher?.user?.full_name}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100)}>
        <DetailSection title="Personal Info" icon="👤">
          <DetailRow label="Full Name" value={teacher?.user?.full_name} />
          <DetailRow label="Email" value={teacher?.user?.email} />
          <DetailRow label="Phone" value={teacher?.user?.phone} />
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

      {teacher?.subjects && teacher.subjects.length > 0 && (
        <Animated.View entering={FadeInDown.delay(300)}>
          <DetailSection title="Subjects" icon="📚">
            <View style={localStyles.chipRow}>
              {teacher.subjects.map((s) => (
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
    </DetailScreenBase>
  );
}

const localStyles = StyleSheet.create({
  avatarContainer: { alignItems: 'center', marginBottom: 16 },
  avatarName: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#ede9fe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  chipText: { color: '#7c3aed', fontSize: 13, fontWeight: '600' },
});
