/**
 * View Teacher Screen
 * Displays full teacher detail fetched by public_id
 */

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, User, Briefcase, Phone } from 'lucide-react-native';
import { getRoleGradient } from '@educard/shared';
import { useTeacherDetail } from '@/hooks';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{String(value)}</Text>
    </View>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {icon} {title}
      </Text>
      {children}
    </View>
  );
}

export default function ViewTeacherScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: teacher, isLoading, isError } = useTeacherDetail(id || '');

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <Animated.View entering={FadeIn.delay(100)} style={headerStyles.circle1} />
        <Animated.View entering={FadeIn.delay(200)} style={headerStyles.circle2} />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Teacher Details</Text>
              <Text style={headerStyles.subtitle}>{teacher?.user?.full_name || '...'}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      ) : isError || !teacher ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load teacher details.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(100)}>
            <Section title="Personal Info" icon="👤">
              <Row label="Full Name" value={teacher.user?.full_name} />
              <Row label="Email" value={teacher.user?.email} />
              <Row label="Phone" value={teacher.user?.phone} />
              <Row label="Gender" value={teacher.user?.gender} />
              <Row label="Date of Birth" value={teacher.user?.date_of_birth} />
              <Row label="Blood Group" value={teacher.user?.blood_group} />
            </Section>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)}>
            <Section title="Employment" icon="💼">
              <Row label="Employee ID" value={teacher.employee_id} />
              <Row label="Designation" value={teacher.designation} />
              <Row label="Specialization" value={teacher.specialization} />
              <Row label="Qualification" value={teacher.highest_qualification} />
              <Row label="Experience (yrs)" value={teacher.experience_years} />
              <Row label="Joining Date" value={teacher.joining_date} />
            </Section>
          </Animated.View>

          {teacher.subjects?.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300)}>
              <Section title="Subjects" icon="📚">
                <View style={styles.chipRow}>
                  {teacher.subjects.map((s) => (
                    <View key={s.public_id} style={styles.chip}>
                      <Text style={styles.chipText}>
                        {s.name}
                        {s.code ? ` (${s.code})` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              </Section>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(400)}>
            <Section title="Emergency Contact" icon="🆘">
              <Row label="Name" value={teacher.emergency_contact_name} />
              <Row label="Number" value={teacher.emergency_contact_number} />
            </Section>
          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#ef4444', fontSize: 16 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  rowLabel: { fontSize: 14, color: '#64748b', flex: 1 },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#1e293b', flex: 1.5, textAlign: 'right' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#ede9fe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  chipText: { color: '#7c3aed', fontSize: 13, fontWeight: '600' },
});
