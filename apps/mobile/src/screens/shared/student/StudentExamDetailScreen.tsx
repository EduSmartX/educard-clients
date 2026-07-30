/**
 * Student Exam Detail Screen
 * Schedule view or Results view
 */

import { useRoute, type RouteProp } from '@react-navigation/native';
import { format } from 'date-fns';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  type DimensionValue,
} from 'react-native';

import { Screen, Header } from '@/components/layout';
import { colors } from '@/constants/colors';
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
      <Screen>
        <Header title="Exam" showBack />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary[500]} />
        </View>
      </Screen>
    );
  }

  if (!detail) {
    return (
      <Screen>
        <Header title="Exam" showBack />
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
    <Screen>
      <Header title={detail.name} showBack />
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
          <View className="mx-4 mt-4 overflow-hidden rounded-xl border border-gray-100 bg-white">
            {/* Header */}
            <View className="flex-row bg-gray-50 px-3 py-2.5">
              <Text className="w-8 text-[10px] font-semibold uppercase text-gray-400">
                #
              </Text>
              <Text className="flex-1 text-[10px] font-semibold uppercase text-gray-400">
                Subject
              </Text>
              <Text className="w-20 text-[10px] font-semibold uppercase text-gray-400">
                Date
              </Text>
              <Text className="w-16 text-[10px] font-semibold uppercase text-gray-400">
                Time
              </Text>
              <Text className="w-20 text-[10px] font-semibold uppercase text-gray-400">
                Teacher
              </Text>
            </View>
            {detail.exams.map((exam: ExamResult, idx: number) => (
              <View
                key={exam.exam_public_id}
                className="flex-row items-center border-t border-gray-50 px-3 py-3"
              >
                <View className="w-8">
                  <View className="h-6 w-6 items-center justify-center rounded-md bg-blue-100">
                    <Text className="text-[10px] font-bold text-blue-600">
                      {idx + 1}
                    </Text>
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-800">
                    {exam.subject_name}
                  </Text>
                  <Text className="text-[10px] text-gray-400">
                    Max: {exam.max_marks} | Pass: {exam.passing_marks}
                  </Text>
                </View>
                <View className="w-20">
                  <Text className="text-xs text-gray-600">
                    {exam.date ? format(new Date(exam.date), 'd MMM') : 'TBD'}
                  </Text>
                  {exam.date && (
                    <Text className="text-[10px] text-gray-400">
                      {format(new Date(exam.date), 'EEE')}
                    </Text>
                  )}
                </View>
                <View className="w-16">
                  {exam.start_time ? (
                    <>
                      <Text className="text-xs text-gray-600">
                        {formatTime(exam.start_time)}
                      </Text>
                      {exam.end_time && (
                        <Text className="text-[10px] text-gray-400">
                          to {formatTime(exam.end_time)}
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text className="text-xs text-gray-400">—</Text>
                  )}
                </View>
                <View className="w-20">
                  <Text className="text-xs text-gray-600" numberOfLines={1}>
                    {exam.teacher_name || '—'}
                  </Text>
                </View>
              </View>
            ))}
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
            <View className="mx-4 mt-4 overflow-hidden rounded-xl border border-gray-100 bg-white">
              <View className="border-b border-gray-100 px-4 py-3">
                <Text className="text-sm font-semibold text-gray-700">
                  📊 Subject-wise Results
                </Text>
              </View>
              {detail.exams.map((exam: ExamResult) => {
                const pct = exam.percentage ?? 0;
                let barColor: string = colors.danger[500];
                if (exam.is_absent) {
                  barColor = colors.gray[300];
                } else if (exam.passed) {
                  barColor = colors.success[500];
                }
                const barWidth: DimensionValue = `${exam.is_absent ? 0 : pct}%`;
                return (
                  <View
                    key={exam.exam_public_id}
                    className="border-t border-gray-50 px-4 py-3"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-medium text-gray-800">
                        {exam.subject_name}
                      </Text>
                      {exam.is_absent ? (
                        <View className="rounded-md bg-gray-100 px-2 py-0.5">
                          <Text className="text-[10px] font-medium text-gray-500">
                            Absent
                          </Text>
                        </View>
                      ) : (
                        <View className="flex-row items-center gap-2">
                          <Text className="text-xs text-gray-600">
                            {exam.marks_obtained ?? 0}/{exam.max_marks}
                          </Text>
                          <View
                            className={`rounded-md px-2 py-0.5 ${exam.passed ? 'bg-green-100' : 'bg-red-100'}`}
                          >
                            <Text
                              className={`text-[10px] font-medium ${exam.passed ? 'text-green-700' : 'text-red-700'}`}
                            >
                              {exam.grade || `${pct.toFixed(0)}%`}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                    <View className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                      <View
                        className="h-full rounded-full"
                        style={{ width: barWidth, backgroundColor: barColor }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
        <View className="h-8" />
      </ScrollView>
    </Screen>
  );
}

const overallCardStyle = { backgroundColor: colors.primary[600] };
