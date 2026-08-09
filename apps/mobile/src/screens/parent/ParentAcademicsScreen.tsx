/**
 * Student Academics Screen
 * Timetable, Homework, and Exams in tab sections
 */

import { useNavigation } from '@react-navigation/native';
import { format, addDays } from 'date-fns';
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
  StyleSheet,
} from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

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
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackNavigation } from '@/navigation/types';

type Tab = 'timetable' | 'homework' | 'exams';

const TABS: { key: Tab; label: string; icon: typeof Calendar }[] = [
  { key: 'timetable', label: 'Timetable', icon: Calendar },
  { key: 'homework', label: 'Homework', icon: BookOpen },
  { key: 'exams', label: 'Exams', icon: FileText },
];

function formatSlotTime(t: string): string {
  const [h, m] = t.split(':');
  const hour = Number.parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

const OVERRIDE_LABELS: Record<
  NonNullable<TimetableEntry['override_type']>,
  string
> = {
  substitute: 'Substitute class',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
  extra_class: 'Extra class',
};

function getDefaultHomeworkDate(): Date {
  const now = new Date();
  return now.getHours() >= 16 ? addDays(now, 1) : addDays(now, -1);
}

// ── Timetable Section ──

function TimetableSection() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
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
      return periods.map((period: TimetableEntry, index) => {
        const isBreak = period.slot_type !== 'class';
        const isCancelled = period.is_cancelled;
        const palette = isCancelled
          ? timetableStyles.cancelled
          : isBreak
            ? timetableStyles.break
            : timetableStyles.period;

        return (
          <Animated.View
            key={period.slot_public_id}
            entering={ZoomIn.delay(index * 45)
              .springify()
              .damping(16)}
            style={[timetableStyles.slotCard, palette]}
          >
            <View style={timetableStyles.slotTopRow}>
              <View style={timetableStyles.timeRow}>
                <Clock size={13} color="#475569" />
                <Text style={timetableStyles.timeText}>
                  {formatSlotTime(period.start_time)} –{' '}
                  {formatSlotTime(period.end_time)}
                </Text>
              </View>
              <View style={timetableStyles.numberBadge}>
                <Text style={timetableStyles.numberText}>
                  {period.slot_number}
                </Text>
              </View>
            </View>

            <Text style={timetableStyles.subjectText}>
              {period.subject_name || period.label}
            </Text>
            {!!period.teacher_name && (
              <Text style={timetableStyles.detailText}>
                {period.teacher_name}
              </Text>
            )}
            {!!period.room && (
              <Text style={timetableStyles.detailText}>
                Room: {period.room}
              </Text>
            )}
            {!!period.override_type && (
              <View
                style={[
                  timetableStyles.overrideBadge,
                  isCancelled && timetableStyles.cancelledBadge,
                ]}
              >
                <Text
                  style={[
                    timetableStyles.overrideText,
                    isCancelled && timetableStyles.cancelledText,
                  ]}
                >
                  {OVERRIDE_LABELS[period.override_type]}
                </Text>
              </View>
            )}
          </Animated.View>
        );
      });
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
      {/* Date selector */}
      <View className="mx-4 mt-4 flex-row items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5">
        <TouchableOpacity
          onPress={() => setSelectedDate(date => addDays(date, -1))}
          className="p-1"
        >
          <ChevronLeft size={18} color={colors.gray[600]} />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-sm font-semibold text-gray-800">
            {format(selectedDate, 'EEEE')}
          </Text>
          <Text className="mt-0.5 text-xs text-gray-500">
            {format(selectedDate, 'd MMMM yyyy')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setSelectedDate(date => addDays(date, 1))}
          className="p-1"
        >
          <ChevronRight size={18} color={colors.gray[600]} />
        </TouchableOpacity>
      </View>

      <View className="mx-4 mb-6 mt-4">{renderPeriodsList()}</View>
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
                  className="mb-3 rounded-xl border border-gray-200 bg-white p-4"
                  activeOpacity={0.7}
                >
                  <Text className="text-base font-semibold text-gray-800">
                    {s.name}
                  </Text>
                  <Text className="mt-0.5 text-xs text-gray-500">
                    {format(new Date(s.start_date), 'd MMM')} —{' '}
                    {format(new Date(s.end_date), 'd MMM')}
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

  return (
    <Screen safeArea={false} statusBarStyle="light" backgroundColor="#f0fdf4">
      <ScreenHeader
        title="Academics"
        subtitle="Learning and class activities"
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
      <ScrollView
        className="flex-1"
        contentContainerStyle={menuStyles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={menuStyles.grid}>
          {TABS.map((tab, index) => {
            const Icon = tab.icon;
            return (
              <Animated.View
                key={tab.key}
                entering={ZoomIn.delay(index * 70)
                  .springify()
                  .damping(13)}
                style={menuStyles.gridItem}
              >
                <TouchableOpacity
                  style={menuStyles.iconCard}
                  onPress={() =>
                    navigation.navigate('StudentAcademicsTask', {
                      task: tab.key,
                    })
                  }
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={ACADEMIC_GRADIENTS[tab.key]}
                    style={menuStyles.iconCircle}
                  >
                    <Icon size={28} color="#fff" strokeWidth={2} />
                  </LinearGradient>
                  <Text style={menuStyles.iconLabel}>{tab.label}</Text>
                  <Text style={menuStyles.iconSubtitle}>
                    {ACADEMIC_SUBTITLES[tab.key]}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const ACADEMIC_GRADIENTS: Record<Tab, readonly [string, string]> = {
  timetable: ['#6366f1', '#818cf8'],
  homework: ['#ea580c', '#fb923c'],
  exams: ['#e11d48', '#fb7185'],
};

const ACADEMIC_SUBTITLES: Record<Tab, string> = {
  timetable: 'Daily class schedule',
  homework: 'Assignments and submissions',
  exams: 'Schedules and results',
};

export function ParentAcademicsTaskScreen({
  route,
}: {
  route: { params: { task: Tab } };
}) {
  const { task } = route.params;
  const title = TABS.find(tab => tab.key === task)?.label ?? 'Academics';

  return (
    <Screen safeArea={false} statusBarStyle="light" backgroundColor="#f8fafc">
      <ScreenHeader title={title} subtitle={ACADEMIC_SUBTITLES[task]} />
      <View className="flex-1">
        {task === 'timetable' && <TimetableSection />}
        {task === 'homework' && <HomeworkSection />}
        {task === 'exams' && <ExamsSection />}
      </View>
    </Screen>
  );
}

const menuStyles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  gridItem: { width: '33.33%', padding: 5 },
  iconCard: {
    minHeight: 142,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconLabel: { fontSize: 13, fontWeight: '700', color: '#1f2937' },
  iconSubtitle: {
    marginTop: 5,
    fontSize: 10,
    lineHeight: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});

const timetableStyles = StyleSheet.create({
  slotCard: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 5,
    padding: 16,
  },
  period: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
    borderLeftColor: '#3b82f6',
  },
  break: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderLeftColor: '#f59e0b',
  },
  cancelled: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderLeftColor: '#ef4444',
  },
  slotTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  numberBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  numberText: { fontSize: 12, fontWeight: '800', color: '#334155' },
  subjectText: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  detailText: { marginTop: 5, fontSize: 12, color: '#64748b' },
  overrideBadge: {
    alignSelf: 'flex-start',
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#ede9fe',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  cancelledBadge: { backgroundColor: '#fee2e2' },
  overrideText: { fontSize: 10, fontWeight: '700', color: '#6d28d9' },
  cancelledText: { fontSize: 10, fontWeight: '700', color: '#b91c1c' },
});
