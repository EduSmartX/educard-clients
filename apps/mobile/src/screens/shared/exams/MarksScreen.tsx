/**
 * Marks Overview Screen
 * Displays marks overview for a session and class
 * - Admin users see data via admin endpoint
 * - Teacher users see data via employee endpoint with permission-based editing
 */

import { getRoleGradient } from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { ChevronLeft, Users, TrendingUp, Award } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  type DimensionValue,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useMarksOverview } from '@/features/exams';
import { useAuthStore } from '@/lib/auth-store';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackParamList } from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';

import { MarksBar } from './MarksBar';
import { marksStyles as s } from './marks-styles';

const adminGradient = getRoleGradient('admin');

export default function MarksScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<SharedStackParamList, 'ExamMarks'>>();
  const { user } = useAuthStore();
  const { sessionId, classId, className } = route.params;
  const [refreshing, setRefreshing] = useState(false);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  const { data, isLoading, refetch } = useMarksOverview(
    sessionId,
    classId,
    user?.role,
  );

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
            <TouchableOpacity style={headerStyles.backBtn} onPress={handleBack}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Marks</Text>
              <Text style={headerStyles.subtitle}>{title}</Text>
            </View>
            <View style={s.spacer} />
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
          <Text style={s.emptySubtitle}>
            No marks have been entered yet for this selection
          </Text>
        </View>
      )}
      {!(isLoading && !refreshing) && data && students.length > 0 && (
        <ScrollView
          style={s.body}
          contentContainerStyle={s.bodyContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#7c3aed']}
            />
          }
        >
          {/* Stats Cards */}
          {stats && (
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              style={s.statsRow}
            >
              <View style={[s.statCard, s.statCardBlue]}>
                <Users size={16} color="#2563eb" />
                <Text style={[s.statValue, s.statValueBlue]}>
                  {stats.total_students}
                </Text>
                <Text style={s.statLabel}>Total</Text>
              </View>
              <View style={[s.statCard, s.statCardGreen]}>
                <TrendingUp size={16} color="#16a34a" />
                <Text style={[s.statValue, s.statValueGreen]}>
                  {stats.passed_count}
                </Text>
                <Text style={s.statLabel}>Passed</Text>
              </View>
              <View style={[s.statCard, s.statCardRed]}>
                <Text style={s.emojiIcon}>📉</Text>
                <Text style={[s.statValue, s.statValueRed]}>
                  {stats.failed_count}
                </Text>
                <Text style={s.statLabel}>Failed</Text>
              </View>
              <View style={[s.statCard, s.statCardViolet]}>
                <Award size={16} color="#7c3aed" />
                <Text style={[s.statValue, s.statValueViolet]}>
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
              {subjects.map(sub => {
                const passPct =
                  sub.total_students > 0
                    ? (sub.passed / sub.total_students) * 100
                    : 0;
                const avgPct =
                  sub.max_marks > 0
                    ? (sub.average_marks / sub.max_marks) * 100
                    : 0;
                const avgWidth: DimensionValue = `${Math.min(avgPct, 100)}%`;
                const passWidth: DimensionValue = `${Math.min(passPct, 100)}%`;
                const passOk = passPct >= 50;
                const passTrackBg = passOk ? '#dcfce7' : '#fee2e2';
                const passFillColor = passOk ? '#22c55e' : '#ef4444';
                const passValColor = passOk ? '#16a34a' : '#dc2626';
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
                        <View style={[s.barTrack, s.barTrackBlue]}>
                          <View
                            style={[
                              s.barFill,
                              s.barFillBlue,
                              { width: avgWidth },
                            ]}
                          />
                        </View>
                      </View>
                      <Text style={[s.barValue, s.barValueBlue]}>
                        {sub.average_marks.toFixed(1)}
                      </Text>
                    </View>
                    {/* Pass rate bar */}
                    <View style={s.barRow}>
                      <Text style={s.barLabel}>Pass</Text>
                      <View style={s.barContainer}>
                        <View
                          style={[s.barTrack, { backgroundColor: passTrackBg }]}
                        >
                          <View
                            style={[
                              s.barFill,
                              {
                                width: passWidth,
                                backgroundColor: passFillColor,
                              },
                            ]}
                          />
                        </View>
                      </View>
                      <Text style={[s.barValue, { color: passValColor }]}>
                        {passPct.toFixed(0)}%
                      </Text>
                    </View>
                    <View style={s.subjectStats}>
                      <Text style={[s.chip, s.chipGreen]}>✓ {sub.passed}</Text>
                      <Text style={[s.chip, s.chipRed]}>✗ {sub.failed}</Text>
                      <Text style={[s.chip, s.chipAmber]}>AB {sub.absent}</Text>
                    </View>
                  </View>
                );
              })}
            </Animated.View>
          )}

          {/* ── Student-wise results with horizontal mark bars ── */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text style={s.sectionTitle}>Student Results</Text>
            {students.map(student => {
              const summary = student.summary;
              const isPass = summary?.is_pass ?? false;
              const badgeBg = isPass ? '#dcfce7' : '#fee2e2';
              const badgeColor = isPass ? '#16a34a' : '#dc2626';
              return (
                <View key={student.student_public_id} style={s.studentCard}>
                  <View style={s.studentHeader}>
                    <View style={s.flex1}>
                      <Text style={s.studentName}>{student.student_name}</Text>
                      <Text style={s.studentAdm}>
                        {student.admission_number}
                        {student.roll_number
                          ? ` · Roll: ${student.roll_number}`
                          : ''}
                      </Text>
                    </View>
                    {!!summary && (
                      <View style={[s.passBadge, { backgroundColor: badgeBg }]}>
                        <Text style={[s.passText, { color: badgeColor }]}>
                          {isPass ? 'PASS' : 'FAIL'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Per-subject horizontal bars */}
                  {student.marks && subjects.length > 0 && (
                    <View style={s.marksBarSection}>
                      {subjects.map(sub => {
                        const mark = student.marks?.[sub.exam_public_id];
                        return (
                          <View key={sub.exam_public_id} style={s.markBarRow}>
                            <Text style={s.markBarSubject} numberOfLines={1}>
                              {sub.subject_name}
                            </Text>
                            {!mark && <Text style={s.noMark}>—</Text>}
                            {mark?.is_absent && (
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
                  {!!summary && (
                    <View style={s.summarySection}>
                      <View style={s.summaryBarRow}>
                        <Text style={s.summaryLabel}>Total</Text>
                        <MarksBar
                          obtained={summary.total_obtained}
                          max={summary.total_max}
                          pass={summary.total_max * 0.35}
                        />
                      </View>
                      <View style={s.percentageRow}>
                        <Text style={s.percentageText}>
                          {summary.total_obtained}/{summary.total_max}
                        </Text>
                        <View
                          style={[s.percentBadge, { backgroundColor: badgeBg }]}
                        >
                          <Text
                            style={[s.percentBadgeText, { color: badgeColor }]}
                          >
                            {summary.percentage.toFixed(1)}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
}
