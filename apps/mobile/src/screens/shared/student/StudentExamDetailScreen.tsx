/**
 * Student Exam Detail Screen
 * Schedule view or Results view
 */

import { useRoute, type RouteProp } from '@react-navigation/native';
import { format } from 'date-fns';
import { CalendarDays, Clock, User } from 'lucide-react-native';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Image,
  StyleSheet,
  type DimensionValue,
} from 'react-native';

import { Screen } from '@/components/layout';
import { ScreenHeader } from '@/components/ui';
import { colors } from '@/constants/colors';
import { getSubjectVisual } from '@/constants/subject-visuals';
import {
  useExamSessionDetail,
  type ExamResult,
} from '@/features/student-portal';
import type { SharedStackParamList } from '@/navigation/types';

function formatTime(t: string | null): string {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = Number.parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

export default function StudentExamDetailScreen() {
  const route =
    useRoute<RouteProp<SharedStackParamList, 'StudentExamDetail'>>();
  const { id, mode } = route.params;
  const { data: detail, isLoading } = useExamSessionDetail(id || null);

  if (isLoading) {
    return (
      <Screen safeArea={false} statusBarStyle="light">
        <ScreenHeader title="Exam" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary[500]} />
        </View>
      </Screen>
    );
  }

  if (!detail) {
    return (
      <Screen safeArea={false} statusBarStyle="light">
        <ScreenHeader title="Exam" />
        <View className="flex-1 items-center justify-center">
          <Text className="text-3xl">📭</Text>
          <Text className="mt-2 text-sm text-gray-500">Exam not found</Text>
        </View>
      </Screen>
    );
  }

  const isSchedule = mode === 'schedule';
  const appeared = detail.exams.filter(e => !e.is_absent);
  const totalMax = appeared.reduce((s, e) => s + e.max_marks, 0);
  const totalObt = appeared.reduce((s, e) => s + (e.marks_obtained ?? 0), 0);
  const overallPct = totalMax > 0 ? (totalObt / totalMax) * 100 : 0;

  return (
    <Screen safeArea={false} statusBarStyle="light">
      <ScreenHeader title={detail.name} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Session Info */}
        <View className="mx-4 mt-4 rounded-xl border border-gray-100 bg-white p-4">
          <Text className="text-lg font-bold text-gray-800">{detail.name}</Text>
          <Text className="mt-1 text-sm text-gray-500">
            {format(new Date(detail.start_date), 'd MMM yyyy')} —{' '}
            {format(new Date(detail.end_date), 'd MMM yyyy')}
          </Text>
        </View>

        {isSchedule ? (
          /* Schedule View */
          <View className="mt-4">
            {detail.exams.map((exam: ExamResult, idx: number) => {
              const visual = getSubjectVisual(exam.subject_name);
              const SubjectIcon = visual.icon;
              return (
                <View
                  key={exam.exam_public_id}
                  style={[
                    s.subjectCard,
                    {
                      backgroundColor: visual.soft,
                      borderColor: visual.accent,
                      borderLeftColor: visual.accent,
                    },
                  ]}
                >
                  <View style={s.rowTop}>
                    {visual.image ? (
                      <View style={s.avatar}>
                        <Image
                          source={visual.image}
                          style={s.avatarImage}
                          resizeMode="cover"
                        />
                      </View>
                    ) : (
                      <View
                        style={[s.avatar, { backgroundColor: visual.accent }]}
                      >
                        <SubjectIcon size={20} color="#fff" />
                      </View>
                    )}
                    <View className="flex-1">
                      <Text style={s.subjectName}>{exam.subject_name}</Text>
                      <Text style={s.subjectMeta}>
                        Max {exam.max_marks} • Pass {exam.passing_marks}
                      </Text>
                    </View>
                    <View
                      style={[s.indexChip, { backgroundColor: visual.accent }]}
                    >
                      <Text style={s.indexChipText}>{idx + 1}</Text>
                    </View>
                  </View>

                  <View style={s.detailRow}>
                    <CalendarDays size={13} color="#64748b" />
                    <Text style={s.detailText}>
                      {exam.date
                        ? format(new Date(exam.date), 'EEE, d MMM yyyy')
                        : 'Date to be announced'}
                    </Text>
                  </View>
                  {!!exam.start_time && (
                    <View style={s.detailRow}>
                      <Clock size={13} color="#64748b" />
                      <Text style={s.detailText}>
                        {formatTime(exam.start_time)}
                        {exam.end_time ? ` – ${formatTime(exam.end_time)}` : ''}
                      </Text>
                    </View>
                  )}
                  {!!exam.teacher_name && (
                    <View style={s.detailRow}>
                      <User size={13} color="#64748b" />
                      <Text style={s.detailText}>{exam.teacher_name}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          /* Results View */
          <>
            {/* Overall Stats */}
            <View
              className="mx-4 mt-4 rounded-2xl p-5"
              style={overallCardStyle}
            >
              <Text className="text-xl font-bold text-white">
                {overallPct.toFixed(1)}%
              </Text>
              <Text className="text-xs text-white/70">
                Overall • Grade: {detail.overall_grade || '—'}
              </Text>
              <View className="mt-3 flex-row gap-3">
                <View className="flex-1 items-center rounded-xl bg-white/15 p-2.5">
                  <Text className="text-lg font-bold text-white">
                    {appeared.length}/{detail.exams.length}
                  </Text>
                  <Text className="text-[10px] text-white/70">Appeared</Text>
                </View>
                <View className="flex-1 items-center rounded-xl bg-white/15 p-2.5">
                  <Text className="text-lg font-bold text-white">
                    {totalObt.toFixed(0)}/{totalMax.toFixed(0)}
                  </Text>
                  <Text className="text-[10px] text-white/70">Marks</Text>
                </View>
              </View>
            </View>

            {/* Subject Results */}
            <Text style={s.sectionHeading}>Subject-wise Results</Text>
            {detail.exams.map((exam: ExamResult) => {
              const pct = exam.percentage ?? 0;
              let barColor: string = colors.danger[500];
              if (exam.is_absent) {
                barColor = colors.gray[300];
              } else if (exam.passed) {
                barColor = colors.success[500];
              }
              const barWidth: DimensionValue = `${exam.is_absent ? 0 : pct}%`;
              const visual = getSubjectVisual(exam.subject_name);
              const SubjectIcon = visual.icon;
              return (
                <View
                  key={exam.exam_public_id}
                  style={[
                    s.subjectCard,
                    {
                      backgroundColor: visual.soft,
                      borderColor: visual.accent,
                      borderLeftColor: visual.accent,
                    },
                  ]}
                >
                  <View style={s.rowTop}>
                    {visual.image ? (
                      <View style={s.avatar}>
                        <Image
                          source={visual.image}
                          style={s.avatarImage}
                          resizeMode="cover"
                        />
                      </View>
                    ) : (
                      <View
                        style={[s.avatar, { backgroundColor: visual.accent }]}
                      >
                        <SubjectIcon size={20} color="#fff" />
                      </View>
                    )}
                    <View className="flex-1">
                      <Text style={s.subjectName}>{exam.subject_name}</Text>
                      <Text style={s.subjectMeta}>
                        {exam.is_absent
                          ? 'Not appeared'
                          : `${exam.marks_obtained ?? 0} / ${exam.max_marks}`}
                      </Text>
                    </View>
                    {exam.is_absent ? (
                      <View style={s.absentChip}>
                        <Text style={s.absentChipText}>Absent</Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          s.gradeChip,
                          exam.passed ? s.gradePassBg : s.gradeFailBg,
                        ]}
                      >
                        <Text
                          style={[
                            s.gradeChipText,
                            exam.passed ? s.gradePassText : s.gradeFailText,
                          ]}
                        >
                          {exam.grade || `${pct.toFixed(0)}%`}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={s.track}>
                    <View
                      style={[
                        s.trackFill,
                        { width: barWidth, backgroundColor: barColor },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </>
        )}
        <View className="h-8" />
      </ScrollView>
    </Screen>
  );
}

const overallCardStyle = { backgroundColor: colors.primary[600] };

const s = StyleSheet.create({
  sectionHeading: {
    marginTop: 20,
    marginBottom: 10,
    marginHorizontal: 16,
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  subjectCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: 14,
    padding: 14,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  avatarImage: { width: '100%', height: '100%' },
  subjectName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  subjectMeta: { marginTop: 3, fontSize: 11, color: '#64748b' },
  indexChip: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  indexChipText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  detailRow: {
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  detailText: { flex: 1, fontSize: 12, color: '#64748b' },
  gradeChip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  gradeChipText: { fontSize: 11, fontWeight: '800' },
  gradePassBg: { backgroundColor: '#dcfce7' },
  gradeFailBg: { backgroundColor: '#fee2e2' },
  gradePassText: { color: '#15803d' },
  gradeFailText: { color: '#b91c1c' },
  absentChip: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f1f5f9',
  },
  absentChipText: { fontSize: 11, fontWeight: '800', color: '#64748b' },
  track: {
    height: 7,
    marginTop: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.75)',
    overflow: 'hidden',
  },
  trackFill: { height: '100%', borderRadius: 4 },
});
