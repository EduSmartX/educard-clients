/**
 * Student Homework — assignments and submission status for a selected date.
 */

import { useNavigation } from '@react-navigation/native';
import { format, addDays } from 'date-fns';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';

import { colors } from '@/constants/colors';
import {
  useStudentHomework,
  type HomeworkItem,
} from '@/features/student-portal';
import type { SharedStackNavigation } from '@/navigation/types';

import { safeFormat } from './academics-utils';

function getDefaultHomeworkDate(): Date {
  const now = new Date();
  return now.getHours() >= 16 ? addDays(now, 1) : addDays(now, -1);
}

export function HomeworkSection() {
  const navigation = useNavigation<SharedStackNavigation>();
  const [selectedDate, setSelectedDate] = useState(getDefaultHomeworkDate);
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const {
    data: homework,
    isLoading,
    isRefetching,
    refetch,
  } = useStudentHomework(dateStr);

  const goDay = (offset: number) =>
    setSelectedDate(prev => addDays(prev, offset));

  const dateLabel = (() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const s = new Date(selectedDate);
    s.setHours(0, 0, 0, 0);
    const diff = Math.round((s.getTime() - t.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    return format(selectedDate, 'EEE, d MMM');
  })();

  const statusStyle = (hw: HomeworkItem) => {
    if (hw.my_submission_status === 'not_submitted')
      return { bg: 'bg-red-100', text: 'text-red-700', label: 'Not Submitted' };
    if (hw.is_overdue)
      return { bg: 'bg-red-100', text: 'text-red-700', label: 'Overdue' };
    if (hw.my_submission_status === 'reviewed')
      return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Reviewed' };
    if (hw.my_submission_status === 'submitted')
      return { bg: 'bg-green-100', text: 'text-green-700', label: 'Submitted' };
    return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' };
  };

  const renderHomeworkList = () => {
    if (isLoading) {
      return (
        <View className="items-center py-10">
          <ActivityIndicator color={colors.primary[500]} />
        </View>
      );
    }
    if (homework && homework.length > 0) {
      return homework.map((hw: HomeworkItem) => {
        const st = statusStyle(hw);
        return (
          <TouchableOpacity
            key={hw.public_id}
            onPress={() =>
              navigation.navigate('StudentHomeworkDetail', {
                id: hw.public_id,
                date: dateStr,
              })
            }
            className="mb-3 rounded-xl border border-gray-100 bg-white p-4"
            activeOpacity={0.7}
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-2">
                <Text className="text-base font-semibold text-gray-800">
                  {hw.title}
                </Text>
                <Text className="mt-0.5 text-xs text-gray-500">
                  {hw.subject_name}
                  {hw.chapter ? ` • ${hw.chapter}` : ''}
                </Text>
              </View>
              <View className={`rounded-lg px-2.5 py-1 ${st.bg}`}>
                <Text className={`text-[10px] font-semibold ${st.text}`}>
                  {st.label}
                </Text>
              </View>
            </View>
            <View className="mt-2 flex-row items-center">
              <Clock size={12} color={colors.gray[400]} />
              <Text className="ml-1 text-[11px] text-gray-400">
                Due: {safeFormat(hw.due_datetime, 'd MMM h:mm a')}
              </Text>
              <Text className="ml-3 text-[11px] text-gray-400">
                By: {hw.assigned_by_name}
              </Text>
            </View>
            {hw.priority === 'high' && (
              <View className="mt-1.5 flex-row items-center">
                <AlertTriangle size={12} color={colors.danger[500]} />
                <Text className="ml-1 text-[10px] font-medium text-red-600">
                  High Priority
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      });
    }
    return (
      <View className="items-center py-10">
        <Text className="text-3xl">🦋</Text>
        <Text className="mt-2 text-sm text-gray-500">
          No homework for {dateLabel.toLowerCase()}
        </Text>
      </View>
    );
  };

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
      <View className="mx-4 mt-4 flex-row items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5">
        <TouchableOpacity onPress={() => goDay(-1)} className="p-1">
          <ChevronLeft size={18} color={colors.gray[600]} />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-sm font-semibold text-gray-700">
            {dateLabel}
          </Text>
          <Text className="text-[10px] text-gray-400">
            {format(selectedDate, 'd MMMM yyyy')}
          </Text>
        </View>
        <TouchableOpacity onPress={() => goDay(1)} className="p-1">
          <ChevronRight size={18} color={colors.gray[600]} />
        </TouchableOpacity>
      </View>

      <View className="mt-4 px-4 pb-6">{renderHomeworkList()}</View>
    </ScrollView>
  );
}
