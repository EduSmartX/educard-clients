/**
 * Student Academics Screen
 * Timetable, Homework, and Exams in tab sections
 */

import { useNavigation } from '@react-navigation/native';
import { format, addDays, startOfWeek } from 'date-fns';
import {
  Calendar,
  BookOpen,
  FileText,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CalendarOff,
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

import { Screen } from '@/components/layout';
import { ScreenHeader } from '@/components/ui';
import { colors } from '@/constants/colors';
import {
  useTimetable,
  useStudentHomework,
  useExamSessions,
  type TimetableEntry,
  type HomeworkItem,
  type ExamSession,
} from '@/features/student-portal';
import { useAuthStore } from '@/lib/auth-store';
import type { SharedStackNavigation } from '@/navigation/types';

type Tab = 'timetable' | 'homework' | 'exams';

const TABS: { key: Tab; label: string; icon: typeof Calendar }[] = [
  { key: 'timetable', label: 'Timetable', icon: Calendar },
  { key: 'homework', label: 'Homework', icon: BookOpen },
  { key: 'exams', label: 'Exams', icon: FileText },
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatSlotTime(t: string): string {
  const [h, m] = t.split(':');
  const hour = Number.parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

function getDefaultHomeworkDate(): Date {
  const now = new Date();
  return now.getHours() >= 16 ? addDays(now, 1) : addDays(now, -1);
}

// ── Timetable Section ──

function TimetableSection() {
  const today = new Date();
  const [weekOffset, setWeekOffset] = useState(0);
  const todayIdx = today.getDay() === 0 ? 5 : today.getDay() - 1;
  const [selectedDay, setSelectedDay] = useState(Math.min(todayIdx, 5));

  const monday = addDays(
    startOfWeek(today, { weekStartsOn: 1 }),
    weekOffset * 7,
  );
  const dateStr = format(addDays(monday, selectedDay), 'yyyy-MM-dd');
  const {
    data: periods,
    isLoading,
    isRefetching,
    refetch,
  } = useTimetable(dateStr);

  const renderPeriodsList = () => {
    if (isLoading) {
      return (
        <View className="items-center py-10">
          <ActivityIndicator color={colors.primary[500]} />
        </View>
      );
    }
    if (periods && periods.length > 0) {
      return periods.map((p: TimetableEntry) => (
        <View
          key={p.slot_public_id}
          className={`flex-row items-center border-b border-gray-100 px-3 py-3 ${p.slot_type !== 'class' ? 'bg-amber-50/50' : ''}`}
        >
          <View className="w-10">
            <View className="h-7 w-7 items-center justify-center rounded-lg bg-green-500">
              <Text className="text-xs font-bold text-white">
                {p.slot_number}
              </Text>
            </View>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-gray-800">
              {p.subject_name || p.label}
            </Text>
            {p.is_cancelled && (
              <Text className="text-[10px] text-red-500">Cancelled</Text>
            )}
          </View>
          <View className="w-20">
            <Text className="text-xs font-medium text-gray-600">
              {formatSlotTime(p.start_time)}
            </Text>
            <Text className="text-[10px] text-gray-400">
              to {formatSlotTime(p.end_time)}
            </Text>
          </View>
          <View className="w-24">
            <Text className="text-xs text-gray-600" numberOfLines={1}>
              {p.teacher_name || '—'}
            </Text>
          </View>
        </View>
      ));
    }
    return (
      <View className="items-center py-10">
        <Text className="text-3xl">🌴</Text>
        <Text className="mt-2 text-sm text-gray-500">No classes this day</Text>
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
      {/* Week Nav */}
      <View className="mx-4 mt-4 flex-row items-center justify-between rounded-xl bg-blue-50 px-3 py-2.5">
        <TouchableOpacity
          onPress={() => setWeekOffset(weekOffset - 1)}
          className="p-1"
        >
          <ChevronLeft size={18} color={colors.gray[600]} />
        </TouchableOpacity>
        <Text className="text-sm font-semibold text-gray-700">
          {format(monday, 'd MMM')} — {format(addDays(monday, 5), 'd MMM')}
        </Text>
        <TouchableOpacity
          onPress={() => setWeekOffset(weekOffset + 1)}
          className="p-1"
        >
          <ChevronRight size={18} color={colors.gray[600]} />
        </TouchableOpacity>
      </View>

      {/* Day Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-3 px-4"
      >
        {WEEKDAYS.map((day, i) => {
          const d = addDays(monday, i);
          const isToday =
            format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
          const sel = selectedDay === i;
          let tabBg = 'bg-gray-50';
          if (sel) {
            tabBg = 'bg-blue-500';
          } else if (isToday) {
            tabBg = 'bg-blue-100';
          }
          let tabText = 'text-gray-600';
          if (sel) {
            tabText = 'text-white';
          } else if (isToday) {
            tabText = 'text-blue-600';
          }
          return (
            <TouchableOpacity
              key={day}
              onPress={() => setSelectedDay(i)}
              className={`mr-2 rounded-xl px-4 py-2.5 ${tabBg}`}
            >
              <Text className={`text-sm font-medium ${tabText}`}>
                {day} {d.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Periods */}
      <View className="mt-4 px-4 pb-6">
        <View className="flex-row rounded-t-xl bg-gray-50 px-3 py-2.5">
          <Text className="w-10 text-[10px] font-semibold uppercase text-gray-400">
            #
          </Text>
          <Text className="flex-1 text-[10px] font-semibold uppercase text-gray-400">
            Subject
          </Text>
          <Text className="w-20 text-[10px] font-semibold uppercase text-gray-400">
            Time
          </Text>
          <Text className="w-24 text-[10px] font-semibold uppercase text-gray-400">
            Teacher
          </Text>
        </View>
        {renderPeriodsList()}
      </View>
    </ScrollView>
  );
}

// ── Homework Section ──

function HomeworkSection() {
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
                Due: {format(new Date(hw.due_datetime), 'd MMM h:mm a')}
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
      <View className="mx-4 mt-4 flex-row items-center justify-between rounded-xl bg-orange-50 px-3 py-2.5">
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

// ── Exams Section ──

function ExamsSection() {
  const navigation = useNavigation<SharedStackNavigation>();
  const {
    data: sessions,
    isLoading,
    isRefetching,
    refetch,
  } = useExamSessions();
  const completed =
    sessions?.filter((s: ExamSession) => new Date(s.end_date) < new Date()) ??
    [];
  const upcoming =
    sessions?.filter((s: ExamSession) => new Date(s.end_date) >= new Date()) ??
    [];

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
                  className="mb-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4"
                  activeOpacity={0.7}
                >
                  <Text className="text-base font-semibold text-gray-800">
                    {s.name}
                  </Text>
                  <Text className="mt-0.5 text-xs text-gray-500">
                    {format(new Date(s.start_date), 'd MMM')} —{' '}
                    {format(new Date(s.end_date), 'd MMM')}
                  </Text>
                  <View className="mt-2 self-start rounded-lg bg-blue-100 px-2.5 py-1">
                    <Text className="text-[10px] font-semibold text-blue-700">
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
                    {format(new Date(s.start_date), 'd MMM')} —{' '}
                    {format(new Date(s.end_date), 'd MMM')}
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

// ── Main ──

export default function ParentAcademicsScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const isStudent = useAuthStore(s => s.user?.role) === 'student';
  const [activeTab, setActiveTab] = useState<Tab>('timetable');

  return (
    <Screen safeArea={false} statusBarStyle="light">
      <ScreenHeader
        title="Academics"
        showBack={false}
        right={
          isStudent ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('StudentLeave')}
              className="h-9 w-9 items-center justify-center rounded-full bg-white/20"
            >
              <CalendarOff size={20} color="#fff" />
            </TouchableOpacity>
          ) : undefined
        }
      />
      <View className="flex-row border-b border-gray-100 bg-white px-4">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-3 ${isActive ? 'border-b-2 border-emerald-600' : ''}`}
            >
              <Icon size={16} color={isActive ? '#059669' : colors.gray[400]} />
              <Text
                className={`text-sm font-medium ${isActive ? 'text-emerald-700' : 'text-gray-400'}`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View className="flex-1">
        {activeTab === 'timetable' && <TimetableSection />}
        {activeTab === 'homework' && <HomeworkSection />}
        {activeTab === 'exams' && <ExamsSection />}
      </View>
    </Screen>
  );
}
