/**
 * Student Exams — upcoming schedules and completed results.
 */

import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';

import { colors } from '@/constants/colors';
import { useExamSessions, type ExamSession } from '@/features/student-portal';
import type { SharedStackNavigation } from '@/navigation/types';

import { safeFormat } from './academics-utils';

export function ExamsSection() {
  const navigation = useNavigation<SharedStackNavigation>();
  const {
    data: sessions,
    isLoading,
    isRefetching,
    refetch,
  } = useExamSessions();
  const now = Date.now();
  const endTime = (s: ExamSession) => new Date(s.end_date).getTime();
  const completed =
    sessions?.filter((s: ExamSession) => {
      const t = endTime(s);
      return !Number.isNaN(t) && t < now;
    }) ?? [];
  const upcoming =
    sessions?.filter((s: ExamSession) => {
      const t = endTime(s);
      return Number.isNaN(t) || t >= now;
    }) ?? [];

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-6"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
        />
      }
    >
      <View className="px-4 pb-6 pt-4">
        {isLoading ? (
          <View className="items-center py-10">
            <ActivityIndicator color={colors.primary[500]} />
          </View>
        ) : (
          <>
            <Text className="mb-3 text-sm font-semibold text-gray-600">
              📋 Upcoming
            </Text>
            {upcoming.length > 0 ? (
              upcoming.map((s: ExamSession) => (
                <TouchableOpacity
                  key={s.public_id}
                  onPress={() =>
                    navigation.navigate('StudentExamDetail', {
                      id: s.public_id,
                      mode: 'schedule',
                    })
                  }
                  className="mb-3 rounded-xl border border-gray-200 bg-white p-4"
                  activeOpacity={0.7}
                >
                  <Text className="text-base font-semibold text-gray-800">
                    {s.name}
                  </Text>
                  <Text className="mt-0.5 text-xs text-gray-500">
                    {safeFormat(s.start_date, 'd MMM')} —{' '}
                    {safeFormat(s.end_date, 'd MMM')}
                  </Text>
                  <View className="mt-2 self-start rounded-lg bg-emerald-50 px-2.5 py-1">
                    <Text className="text-[10px] font-semibold text-emerald-700">
                      View Schedule
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="mb-4 items-center rounded-xl bg-gray-50 py-6">
                <Text className="text-sm text-gray-400">
                  No upcoming exams 🎉
                </Text>
              </View>
            )}

            <Text className="mb-3 mt-4 text-sm font-semibold text-gray-600">
              🏆 Completed
            </Text>
            {completed.length > 0 ? (
              completed.map((s: ExamSession) => (
                <TouchableOpacity
                  key={s.public_id}
                  onPress={() =>
                    navigation.navigate('StudentExamDetail', {
                      id: s.public_id,
                      mode: 'results',
                    })
                  }
                  className="mb-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4"
                  activeOpacity={0.7}
                >
                  <Text className="text-base font-semibold text-gray-800">
                    {s.name}
                  </Text>
                  <Text className="mt-0.5 text-xs text-gray-500">
                    {safeFormat(s.start_date, 'd MMM')} —{' '}
                    {safeFormat(s.end_date, 'd MMM')}
                  </Text>
                  <View className="mt-2 self-start rounded-lg bg-emerald-100 px-2.5 py-1">
                    <Text className="text-[10px] font-semibold text-emerald-700">
                      View Results
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="items-center rounded-xl bg-gray-50 py-6">
                <Text className="text-sm text-gray-400">
                  No completed exams yet
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
