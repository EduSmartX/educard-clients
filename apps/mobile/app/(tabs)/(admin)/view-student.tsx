/**
 * View Student Screen
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
import { ChevronLeft } from 'lucide-react-native';
import { getRoleGradient } from '@educard/shared';
import { useStudentDetail } from '@/hooks';
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

export default function ViewStudentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: student, isLoading, isError } = useStudentDetail(id || '');

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
              <Text style={headerStyles.title}>Student Details</Text>
              <Text style={headerStyles.subtitle}>{student?.full_name || '...'}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      ) : isError || !student ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load student details.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(100)}>
            <Section title="Personal Info" icon="👤">
              <Row label="Full Name" value={student.full_name} />
              <Row label="Email" value={student.user_info?.email} />
              <Row label="Phone" value={student.user_info?.phone} />
              <Row label="Gender" value={student.user_info?.gender} />
              <Row label="Date of Birth" value={student.user_info?.date_of_birth} />
              <Row label="Blood Group" value={student.user_info?.blood_group} />
            </Section>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)}>
            <Section title="Admission" icon="🎓">
              <Row label="Roll Number" value={student.roll_number} />
              <Row label="Admission No." value={student.admission_number} />
              <Row label="Admission Date" value={student.admission_date} />
              <Row label="Class" value={student.class_info?.class_master_name} />
              <Row label="Section" value={student.class_info?.name} />
            </Section>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300)}>
            <Section title="Guardian" icon="👨‍👩‍👦">
              <Row label="Name" value={student.guardian_name} />
              <Row label="Phone" value={student.guardian_phone} />
              <Row label="Email" value={student.guardian_email} />
              <Row label="Relationship" value={student.guardian_relationship} />
            </Section>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400)}>
            <Section title="Emergency & Medical" icon="🆘">
              <Row label="Emergency Contact" value={student.emergency_contact_name} />
              <Row label="Emergency Phone" value={student.emergency_contact_phone} />
              <Row label="Medical Conditions" value={student.medical_conditions} />
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
});
