/**
 * View Class Screen
 */

import { getRoleGradient } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useClassDetail } from '@/features/classes';
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

export default function ViewClassScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: cls, isLoading, isError } = useClassDetail(id || '');

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
              <Text style={headerStyles.title}>Class Details</Text>
              <Text style={headerStyles.subtitle}>{cls?.display_name || cls?.name || '...'}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      ) : isError || !cls ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load class details.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(100)}>
            <Section title="Class Info" icon="🏫">
              <Row label="Section Name" value={cls.name} />
              <Row label="Master Class" value={cls.class_master?.name} />
              <Row label="Display Name" value={cls.display_name} />
              <Row label="Room Number" value={cls.room_number} />
              <Row label="Capacity" value={cls.capacity} />
              <Row label="Students" value={cls.student_count ?? cls.students_count} />
              <Row label="Info" value={cls.info} />
            </Section>
          </Animated.View>

          {!!cls.class_teacher && (
            <Animated.View entering={FadeInDown.delay(200)}>
              <Section title="Class Teacher" icon="👨‍🏫">
                <Row label="Name" value={cls.class_teacher.full_name} />
                <Row label="Email" value={cls.class_teacher.email} />
                <Row label="Phone" value={cls.class_teacher.phone} />
              </Section>
            </Animated.View>
          )}

          {cls.subjects && cls.subjects.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300)}>
              <Section title="Subjects" icon="📚">
                <View style={styles.chipRow}>
                  {cls.subjects.map((s) => (
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

          {cls.students && cls.students.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400)}>
              <Section title={`Students (${cls.students.length})`} icon="🎓">
                {cls.students.map((s) => (
                  <View key={s.public_id} style={styles.studentRow}>
                    <Text style={styles.studentName}>{s.full_name}</Text>
                    <Text style={styles.studentAdm}>{s.admission_number}</Text>
                  </View>
                ))}
              </Section>
            </Animated.View>
          )}
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
