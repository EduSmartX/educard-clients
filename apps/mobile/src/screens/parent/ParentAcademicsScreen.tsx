/**
 * Student Academics Screen
 * Timetable, Homework, and Exams in tab sections
 */

import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { extractApiError, getSubjectColor } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { format, addDays } from 'date-fns';
import {
  Calendar,
  CalendarDays,
  BookOpen,
  FileText,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  RefreshCw,
  User,
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
  Platform,
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

function formatSlotTime(t?: string | null): string {
  if (!t || !t.includes(':')) return '--';
  const [h, m] = t.split(':');
  const hour = Number.parseInt(h, 10);
  if (!Number.isFinite(hour) || !m) return t;
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const {
    data: periods,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useTimetable(dateStr);

  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setSelectedDate(date);
  };

  const renderPeriodsList = () => {
    if (isLoading) {
      return (
        <View style={timetableStyles.stateCard}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={timetableStyles.stateTitle}>Loading timetable</Text>
          <Text style={timetableStyles.stateMessage}>
            Getting the class schedule for this date.
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={[timetableStyles.stateCard, timetableStyles.errorCard]}>
          <AlertTriangle size={30} color="#dc2626" />
          <Text style={timetableStyles.stateTitle}>
            Unable to load timetable
          </Text>
          <Text style={timetableStyles.stateMessage}>
            {extractApiError(error)}
          </Text>
          <TouchableOpacity
            style={timetableStyles.retryButton}
            onPress={() => void refetch()}
          >
            <RefreshCw size={16} color="#fff" />
            <Text style={timetableStyles.retryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (Array.isArray(periods) && periods.length > 0) {
      return periods.map((period: TimetableEntry, index) => {
        const isBreak = period.slot_type !== 'class';
        const isCancelled = period.is_cancelled;
        const subjectColor = getSubjectColor(
          period.subject_name || period.label || 'Class',
        );
        const cardColor = isCancelled
          ? { backgroundColor: '#fef2f2', borderLeftColor: '#ef4444' }
          : isBreak
            ? { backgroundColor: '#fffbeb', borderLeftColor: '#f59e0b' }
            : {
                backgroundColor: subjectColor.light,
                borderLeftColor: subjectColor.hex,
              };
        const statusLabel = period.override_type
          ? OVERRIDE_LABELS[period.override_type]
          : isBreak
            ? period.label || 'Break'
            : 'Scheduled class';

        return (
          <Animated.View
            key={period.slot_public_id || `${dateStr}-${index}`}
            entering={ZoomIn.delay(index * 45)
              .springify()
              .damping(16)}
            style={[timetableStyles.slotCard, cardColor]}
          >
            <View style={timetableStyles.slotTopRow}>
              <View style={timetableStyles.timeRow}>
                <Clock size={13} color="#475569" />
                <Text style={timetableStyles.timeText}>
                  {formatSlotTime(period.start_time)} –{' '}
                  {formatSlotTime(period.end_time)}
                </Text>
              </View>
              <View
                style={[
                  timetableStyles.statusBadge,
                  isCancelled && timetableStyles.cancelledBadge,
                ]}
              >
                <Text
                  style={[
                    timetableStyles.statusText,
                    isCancelled && timetableStyles.cancelledText,
                  ]}
                >
                  {statusLabel}
                </Text>
              </View>
            </View>

            <View style={timetableStyles.subjectRow}>
              <View
                style={[
                  timetableStyles.periodNumber,
                  { backgroundColor: subjectColor.hex },
                ]}
              >
                <Text style={timetableStyles.periodNumberText}>
                  {period.slot_number || index + 1}
                </Text>
              </View>
              <View style={timetableStyles.subjectContent}>
                <Text
                  style={[
                    timetableStyles.subjectText,
                    isCancelled && timetableStyles.cancelledSubject,
                  ]}
                >
                  {period.subject_name || period.label || 'Unassigned period'}
                </Text>
                <Text style={timetableStyles.slotLabel}>{period.label}</Text>
              </View>
            </View>
            {!!period.teacher_name && (
              <View style={timetableStyles.detailRow}>
                <User size={15} color="#64748b" />
                <Text style={timetableStyles.detailText}>
                  {period.teacher_name}
                </Text>
              </View>
            )}
            {!!period.room && (
              <View style={timetableStyles.detailRow}>
                <MapPin size={15} color="#64748b" />
                <Text style={timetableStyles.detailText}>
                  Room {period.room}
                </Text>
              </View>
            )}
          </Animated.View>
        );
      });
    }
    return (
      <View style={timetableStyles.stateCard}>
        <CalendarOff size={34} color="#94a3b8" />
        <Text style={timetableStyles.stateTitle}>No classes scheduled</Text>
        <Text style={timetableStyles.stateMessage}>
          There are no timetable slots for {format(selectedDate, 'd MMMM yyyy')}
          .
        </Text>
      </View>
    );
  };

  return (
    <ScrollView
      style={timetableStyles.screen}
      contentContainerStyle={timetableStyles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
        />
      }
    >
      <View style={timetableStyles.filterCard}>
        <Text style={timetableStyles.filterLabel}>Schedule date</Text>
        <View style={timetableStyles.dateRow}>
          <TouchableOpacity
            onPress={() => setSelectedDate(date => addDays(date, -1))}
            style={timetableStyles.dateArrow}
            accessibilityLabel="Previous day"
          >
            <ChevronLeft size={21} color="#0f766e" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={timetableStyles.dateInput}
          >
            <CalendarDays size={20} color="#0f766e" />
            <View style={timetableStyles.dateTextGroup}>
              <Text style={timetableStyles.dateDay}>
                {format(selectedDate, 'EEEE')}
              </Text>
              <Text style={timetableStyles.dateValue}>
                {format(selectedDate, 'dd MMMM yyyy')}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedDate(date => addDays(date, 1))}
            style={timetableStyles.dateArrow}
            accessibilityLabel="Next day"
          >
            <ChevronRight size={21} color="#0f766e" />
          </TouchableOpacity>
        </View>
        {!isToday && (
          <TouchableOpacity
            style={timetableStyles.todayButton}
            onPress={() => setSelectedDate(new Date())}
          >
            <Text style={timetableStyles.todayButtonText}>Back to today</Text>
          </TouchableOpacity>
        )}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )}
      </View>

      <View style={timetableStyles.sectionHeader}>
        <View>
          <Text style={timetableStyles.sectionTitle}>Class schedule</Text>
          <Text style={timetableStyles.sectionSubtitle}>
            Includes substitutions, cancellations and extra classes
          </Text>
        </View>
      </View>

      <View>{renderPeriodsList()}</View>
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
      <View style={menuStyles.taskContent}>
        {task === 'timetable' && <TimetableSection />}
        {task === 'homework' && <HomeworkSection />}
        {task === 'exams' && <ExamsSection />}
      </View>
    </Screen>
  );
}

const menuStyles = StyleSheet.create({
  taskContent: { flex: 1 },
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
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 32 },
  filterCard: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccfbf1',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  filterLabel: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  dateRow: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  dateArrow: {
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#99f6e4',
    borderRadius: 10,
    backgroundColor: '#f0fdfa',
  },
  dateInput: {
    minHeight: 58,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  dateTextGroup: { marginLeft: 10, flex: 1 },
  dateDay: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  dateValue: { marginTop: 2, fontSize: 12, color: '#64748b' },
  todayButton: { alignSelf: 'center', paddingHorizontal: 12, paddingTop: 11 },
  todayButtonText: { fontSize: 12, fontWeight: '700', color: '#0f766e' },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  sectionSubtitle: { marginTop: 3, fontSize: 12, color: '#64748b' },
  slotCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 5,
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  slotTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  statusBadge: {
    maxWidth: '48%',
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: { fontSize: 10, fontWeight: '800', color: '#475569' },
  subjectRow: { flexDirection: 'row', alignItems: 'center' },
  periodNumber: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  periodNumberText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  subjectContent: { flex: 1 },
  subjectText: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  cancelledSubject: { textDecorationLine: 'line-through', color: '#991b1b' },
  slotLabel: { marginTop: 2, fontSize: 11, color: '#64748b' },
  detailRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  detailText: { flex: 1, fontSize: 12, color: '#64748b' },
  cancelledBadge: { backgroundColor: '#fee2e2' },
  cancelledText: { fontSize: 10, fontWeight: '700', color: '#b91c1c' },
  stateCard: {
    minHeight: 210,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 24,
    backgroundColor: '#fff',
  },
  errorCard: { borderColor: '#fecaca', backgroundColor: '#fff7f7' },
  stateTitle: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
  },
  stateMessage: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: '#64748b',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0f766e',
  },
  retryButtonText: { fontSize: 12, fontWeight: '800', color: '#fff' },
});
