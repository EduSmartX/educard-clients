/**
 * Marks Overview Screen
 * Displays marks overview for a session and class
 * - Admin users see data via admin endpoint
 * - Teacher users see data via employee endpoint with permission-based editing
 */

import { getRoleGradient } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Users, TrendingUp, Award } from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useMarksOverview } from '@/features/exams';
import { useAuthStore } from '@/lib/auth-store';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

function MarksBar({ obtained, max, pass }: { obtained: number; max: number; pass: number }) {
  const pct = max > 0 ? (obtained / max) * 100 : 0;
  const passed = obtained >= pass;
  const barColor = passed ? '#22c55e' : '#ef4444';
  const bgColor = passed ? '#dcfce7' : '#fee2e2';

  return (
    <View style={barStyles.wrap}>
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

export default function MarksScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { sessionId, classId, className } = useLocalSearchParams<{
    sessionId: string;
    classId: string;
    subjectName?: string;
    className?: string;
    examId?: string;
  }>();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useMarksOverview(sessionId, classId, user?.role);

  const onRefresh = () => {
    setRefreshing(true);
    void refetch().finally(() => setRefreshing(false));
  };

  const stats = data?.stats;
  const subjects = data?.subjects ?? [];
  const students = data?.students ?? [];
  const title = className ? decodeURIComponent(className) : 'Marks Overview';

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
              <Text style={headerStyles.title}>Marks</Text>
              <Text style={headerStyles.subtitle}>{title}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      {isLoading && !refreshing && (
        <View style={s.loading}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={s.loadingText}>Loading marks...</Text>
        </View>
      )}
      {!(isLoading && !refreshing) && (!data || students.length === 0) && (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📊</Text>
          <Text style={s.emptyTitle}>No Marks Data</Text>
          <Text style={s.emptySubtitle}>No marks have been entered yet for this selection</Text>
        </View>
      )}
      {!(isLoading && !refreshing) && data && students.length > 0 && (
        <ScrollView
          style={s.body}
          contentContainerStyle={s.bodyContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7c3aed']} />
          }
        >
          {/* Stats Cards */}
          {stats && (
            <Animated.View entering={FadeInDown.delay(100).springify()} style={s.statsRow}>
              <View style={[s.statCard, { backgroundColor: '#eff6ff' }]}>
                <Users size={16} color="#2563eb" />
                <Text style={[s.statValue, { color: '#2563eb' }]}>{stats.total_students}</Text>
                <Text style={s.statLabel}>Total</Text>
              </View>
              <View style={[s.statCard, { backgroundColor: '#dcfce7' }]}>
                <TrendingUp size={16} color="#16a34a" />
                <Text style={[s.statValue, { color: '#16a34a' }]}>{stats.passed_count}</Text>
                <Text style={s.statLabel}>Passed</Text>
              </View>
              <View style={[s.statCard, { backgroundColor: '#fee2e2' }]}>
                <Text style={{ fontSize: 16 }}>📉</Text>
                <Text style={[s.statValue, { color: '#dc2626' }]}>{stats.failed_count}</Text>
                <Text style={s.statLabel}>Failed</Text>
              </View>
              <View style={[s.statCard, { backgroundColor: '#f5f3ff' }]}>
                <Award size={16} color="#7c3aed" />
                <Text style={[s.statValue, { color: '#7c3aed' }]}>
                  {stats.pass_percentage.toFixed(0)}%
                </Text>
                <Text style={s.statLabel}>Pass %</Text>
              </View>
            </Animated.View>
          )}

          {/* ── Subject-wise summary with bars ── */}
          {subjects.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Text style={s.sectionTitle}>Subject Summary</Text>
              {subjects.map((sub) => {
                const passPct =
                  sub.total_students > 0 ? (sub.passed / sub.total_students) * 100 : 0;
                const avgPct = sub.max_marks > 0 ? (sub.average_marks / sub.max_marks) * 100 : 0;
                return (
                  <View key={sub.exam_public_id} style={s.subjectCard}>
                    <View style={s.subjectHeader}>
                      <Text style={s.subjectName}>{sub.subject_name}</Text>
                      <Text style={s.subjectMax}>Max: {sub.max_marks}</Text>
                    </View>
                    {/* Average bar */}
                    <View style={s.barRow}>
                      <Text style={s.barLabel}>Avg</Text>
                      <View style={s.barContainer}>
                        <View style={[s.barTrack, { backgroundColor: '#eff6ff' }]}>
                          <View
                            style={[
                              s.barFill,
                              { width: `${Math.min(avgPct, 100)}%`, backgroundColor: '#3b82f6' },
                            ]}
                          />
                        </View>
                      </View>
                      <Text style={[s.barValue, { color: '#3b82f6' }]}>
                        {sub.average_marks.toFixed(1)}
                      </Text>
                    </View>
                    {/* Pass rate bar */}
                    <View style={s.barRow}>
                      <Text style={s.barLabel}>Pass</Text>
                      <View style={s.barContainer}>
                        <View
                          style={[
                            s.barTrack,
                            { backgroundColor: passPct >= 50 ? '#dcfce7' : '#fee2e2' },
                          ]}
                        >
                          <View
                            style={[
                              s.barFill,
                              {
                                width: `${Math.min(passPct, 100)}%`,
                                backgroundColor: passPct >= 50 ? '#22c55e' : '#ef4444',
                              },
                            ]}
                          />
                        </View>
                      </View>
                      <Text style={[s.barValue, { color: passPct >= 50 ? '#16a34a' : '#dc2626' }]}>
                        {passPct.toFixed(0)}%
                      </Text>
                    </View>
                    <View style={s.subjectStats}>
                      <Text style={[s.chip, { backgroundColor: '#dcfce7', color: '#16a34a' }]}>
                        ✓ {sub.passed}
                      </Text>
                      <Text style={[s.chip, { backgroundColor: '#fee2e2', color: '#dc2626' }]}>
                        ✗ {sub.failed}
                      </Text>
                      <Text style={[s.chip, { backgroundColor: '#fef3c7', color: '#d97706' }]}>
                        AB {sub.absent}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </Animated.View>
          )}

          {/* ── Student-wise results with horizontal mark bars ── */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text style={s.sectionTitle}>Student Results</Text>
            {students.map((student) => (
              <View key={student.student_public_id} style={s.studentCard}>
                <View style={s.studentHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.studentName}>{student.student_name}</Text>
                    <Text style={s.studentAdm}>
                      {student.admission_number}
                      {student.roll_number ? ` · Roll: ${student.roll_number}` : ''}
                    </Text>
                  </View>
                  {!!student.summary && (
                    <View
                      style={[
                        s.passBadge,
                        { backgroundColor: student.summary.is_pass ? '#dcfce7' : '#fee2e2' },
                      ]}
                    >
                      <Text
                        style={[
                          s.passText,
                          { color: student.summary.is_pass ? '#16a34a' : '#dc2626' },
                        ]}
                      >
                        {student.summary.is_pass ? 'PASS' : 'FAIL'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Per-subject horizontal bars */}
                {student.marks && subjects.length > 0 && (
                  <View style={s.marksBarSection}>
                    {subjects.map((sub) => {
                      const mark = student.marks?.[sub.exam_public_id];
                      return (
                        <View key={sub.exam_public_id} style={s.markBarRow}>
                          <Text style={s.markBarSubject} numberOfLines={1}>
                            {sub.subject_name}
                          </Text>
                          {!mark && <Text style={s.noMark}>—</Text>}
                          {mark && mark.is_absent && (
                            <View style={s.absentBar}>
                              <Text style={s.absentText}>ABSENT</Text>
                            </View>
                          )}
                          {mark && !mark.is_absent && (
                            <MarksBar
                              obtained={mark.marks_obtained}
                              max={mark.max_marks}
                              pass={sub.passing_marks}
                            />
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Total summary bar */}
                {!!student.summary && (
                  <View style={s.summarySection}>
                    <View style={s.summaryBarRow}>
                      <Text style={s.summaryLabel}>Total</Text>
                      <MarksBar
                        obtained={student.summary.total_obtained}
                        max={student.summary.total_max}
                        pass={student.summary.total_max * 0.35}
                      />
                    </View>
                    <View style={s.percentageRow}>
                      <Text style={s.percentageText}>
                        {student.summary.total_obtained}/{student.summary.total_max}
                      </Text>
                      <View
                        style={[
                          s.percentBadge,
                          { backgroundColor: student.summary.is_pass ? '#dcfce7' : '#fee2e2' },
                        ]}
                      >
                        <Text
                          style={[
                            s.percentBadgeText,
                            { color: student.summary.is_pass ? '#16a34a' : '#dc2626' },
                          ]}
                        >
                          {student.summary.percentage.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
}

const barStyles = StyleSheet.create({
  wrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  fill: { height: '100%', borderRadius: 5 },
  threshold: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  label: { fontSize: 12, fontWeight: '700', minWidth: 40, textAlign: 'right' },
});

const s = StyleSheet.create({
  body: { flex: 1, backgroundColor: '#f8fafc' },
  bodyContent: { padding: 16, paddingBottom: 40 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 14, gap: 4 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#64748b', fontWeight: '600' },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 10,
    marginTop: 8,
  },

  /* Subject card */
  subjectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  subjectMax: { fontSize: 12, color: '#94a3b8' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  barLabel: { fontSize: 11, color: '#94a3b8', width: 30 },
  barContainer: { flex: 1 },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barValue: { fontSize: 12, fontWeight: '700', minWidth: 36, textAlign: 'right' },
  subjectStats: { flexDirection: 'row', gap: 6, marginTop: 6 },
  chip: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },

  /* Student card */
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  studentName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  studentAdm: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  passBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  passText: { fontSize: 11, fontWeight: '800' },

  /* Marks bar section */
  marksBarSection: { gap: 8, marginBottom: 10 },
  markBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  markBarSubject: { fontSize: 11, color: '#64748b', width: 70 },
  absentBar: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  absentText: { fontSize: 8, fontWeight: '800', color: '#d97706' },
  noMark: { fontSize: 12, color: '#cbd5e1' },

  /* Summary */
  summarySection: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    marginTop: 4,
  },
  summaryBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: '#1e293b', width: 70 },
  percentageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  percentageText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  percentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  percentBadgeText: { fontSize: 13, fontWeight: '800' },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 14, color: '#64748b', marginTop: 12 },
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
