/**
 * Student Detail - Show all subject marks with horizontal bars
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-promises */

import { getRoleGradient } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useMarksOverview } from '@/features/exams';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

/** Horizontal progress bar for marks */
function MarksBar({ obtained, max, pass }: { obtained: number; max: number; pass: number }) {
  const pct = max > 0 ? (obtained / max) * 100 : 0;
  const passed = obtained >= pass;
  const barColor = passed ? '#22c55e' : '#ef4444';
  const bgColor = passed ? '#dcfce7' : '#fee2e2';

  return (
    <View style={barStyles.container}>
      <View style={[barStyles.track, { backgroundColor: bgColor }]}>
        <View
          style={[barStyles.fill, { width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }]}
        />
        {max > 0 && <View style={[barStyles.threshold, { left: `${(pass / max) * 100}%` }]} />}
      </View>
      <Text style={[barStyles.label, { color: barColor }]}>
        {obtained}/{max}
      </Text>
    </View>
  );
}

export default function StudentDetailScreen() {
  const router = useRouter();
  const { studentId, sessionId, classId, studentName } = useLocalSearchParams<{
    studentId: string;
    sessionId: string;
    classId: string;
    studentName: string;
  }>();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useMarksOverview(sessionId, classId);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const student = data?.students.find(
    (s: { student_public_id: string }) => s.student_public_id === studentId
  );
  const subjects = data?.subjects ?? [];

  if (isLoading && !refreshing) {
    return (
      <View style={layoutStyles.container}>
        <LinearGradient colors={adminGradient} style={headerStyles.header}>
          <Animated.View
            entering={FadeIn.delay(100)}
            style={headerStyles.circle1}
            pointerEvents="none"
          />
          <Animated.View
            entering={FadeIn.delay(200)}
            style={headerStyles.circle2}
            pointerEvents="none"
          />
          <View style={headerStyles.content}>
            <View style={headerStyles.topRow}>
              <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
                <ChevronLeft size={24} color="#fff" />
              </TouchableOpacity>
              <View style={headerStyles.titleContainer}>
                <Text style={headerStyles.title}>Student Marks</Text>
                <Text style={headerStyles.subtitle}>{decodeURIComponent(studentName || '')}</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>
          </View>
        </LinearGradient>
        <View style={s.loading}>
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      </View>
    );
  }

  if (!student) {
    return (
      <View style={layoutStyles.container}>
        <LinearGradient colors={adminGradient} style={headerStyles.header}>
          <Animated.View
            entering={FadeIn.delay(100)}
            style={headerStyles.circle1}
            pointerEvents="none"
          />
          <Animated.View
            entering={FadeIn.delay(200)}
            style={headerStyles.circle2}
            pointerEvents="none"
          />
          <View style={headerStyles.content}>
            <View style={headerStyles.topRow}>
              <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
                <ChevronLeft size={24} color="#fff" />
              </TouchableOpacity>
              <View style={headerStyles.titleContainer}>
                <Text style={headerStyles.title}>Student Marks</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>
          </View>
        </LinearGradient>
        <View style={s.empty}>
          <Text style={s.emptyIcon}>❌</Text>
          <Text style={s.emptyTitle}>No Data</Text>
          <Text style={s.emptySubtitle}>Student marks not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <Animated.View
          entering={FadeIn.delay(100)}
          style={headerStyles.circle1}
          pointerEvents="none"
        />
        <Animated.View
          entering={FadeIn.delay(200)}
          style={headerStyles.circle2}
          pointerEvents="none"
        />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Student Marks</Text>
              <Text style={headerStyles.subtitle}>{student.student_name}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={s.body}
        contentContainerStyle={s.bodyContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7c3aed']} />
        }
      >
        {/* Student Info Card */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={s.infoCard}>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Admission No:</Text>
            <Text style={s.infoValue}>{student.admission_number}</Text>
          </View>
          {!!student.roll_number && (
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Roll No:</Text>
              <Text style={s.infoValue}>{student.roll_number}</Text>
            </View>
          )}
          {!!student.summary && (
            <>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Total:</Text>
                <Text style={s.infoValue}>
                  {student.summary.total_obtained}/{student.summary.total_max}
                </Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Percentage:</Text>
                <Text
                  style={[
                    s.infoValue,
                    { color: student.summary.is_pass ? '#16a34a' : '#dc2626', fontWeight: '700' },
                  ]}
                >
                  {student.summary.percentage.toFixed(1)}%
                </Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Status:</Text>
                <View
                  style={[
                    s.statusBadge,
                    { backgroundColor: student.summary.is_pass ? '#dcfce7' : '#fee2e2' },
                  ]}
                >
                  <Text
                    style={[
                      s.statusText,
                      { color: student.summary.is_pass ? '#16a34a' : '#dc2626' },
                    ]}
                  >
                    {student.summary.is_pass ? 'PASS' : 'FAIL'}
                  </Text>
                </View>
              </View>
            </>
          )}
        </Animated.View>

        {/* Subject-wise Marks with Horizontal Bars */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text style={s.sectionTitle}>Subject-wise Marks</Text>
          {subjects.map((sub: any, idx: number) => {
            const mark = student.marks?.[sub.exam_public_id];
            return (
              <Animated.View
                key={sub.exam_public_id}
                entering={FadeInDown.delay(250 + idx * 50)
                  .springify()
                  .damping(18)}
                style={s.subjectCard}
              >
                <Text style={s.subjectName}>{sub.subject_name}</Text>
                {mark ? (
                  mark.is_absent ? (
                    <View style={s.absentBar}>
                      <Text style={s.absentText}>ABSENT</Text>
                    </View>
                  ) : (
                    <View style={s.marksRow}>
                      <MarksBar
                        obtained={mark.marks_obtained}
                        max={mark.max_marks}
                        pass={sub.passing_marks}
                      />
                      <View
                        style={[
                          s.markBadge,
                          { backgroundColor: mark.is_pass ? '#dcfce7' : '#fee2e2' },
                        ]}
                      >
                        <Text
                          style={[s.markBadgeText, { color: mark.is_pass ? '#16a34a' : '#dc2626' }]}
                        >
                          {mark.is_pass ? 'P' : 'F'}
                        </Text>
                      </View>
                    </View>
                  )
                ) : (
                  <Text style={s.noMark}>No marks entered</Text>
                )}
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Total Bar */}
        {!!student.summary && (
          <Animated.View entering={FadeInDown.delay(400).springify()} style={s.totalCard}>
            <Text style={s.totalTitle}>Overall Performance</Text>
            <MarksBar
              obtained={student.summary.total_obtained}
              max={student.summary.total_max}
              pass={Math.round(student.summary.total_max * 0.35)}
            />
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: { height: '100%', borderRadius: 6 },
  threshold: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  label: { fontSize: 13, fontWeight: '700', minWidth: 50, textAlign: 'right' },
});

const s = StyleSheet.create({
  body: { flex: 1, backgroundColor: '#f8fafc' },
  bodyContent: { padding: 16, paddingBottom: 40 },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  infoValue: { fontSize: 14, color: '#1e293b', fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '800' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },

  subjectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  subjectName: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 10 },
  marksRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  markBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
  },
  markBadgeText: { fontSize: 12, fontWeight: '800' },
  absentBar: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  absentText: { fontSize: 12, fontWeight: '800', color: '#d97706' },
  noMark: { fontSize: 13, color: '#cbd5e1', fontStyle: 'italic' },

  totalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  totalTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 12 },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155' },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginTop: 6,
  },
});
