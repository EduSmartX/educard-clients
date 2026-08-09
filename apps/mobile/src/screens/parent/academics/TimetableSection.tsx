/**
 * Student Timetable — class schedule for a selected date, with overrides applied.
 */

import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { extractApiError, getSubjectColor } from '@educard/shared';
import { format, addDays } from 'date-fns';
import {
  AlertTriangle,
  CalendarDays,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  PartyPopper,
  RefreshCw,
  Settings,
  User,
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
} from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { colors } from '@/constants/colors';
import { useWorkingDayInfo } from '@/features/calendar';
import {
  useTimetable,
  useStudentDashboard,
  type TimetableEntry,
} from '@/features/student-portal';

import { timetableStyles } from './timetable-styles';

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

export function TimetableSection() {
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

  const {
    data: dayInfo,
    isLoading: dayLoading,
    refetch: refetchDayInfo,
  } = useWorkingDayInfo({ date: dateStr });
  const { data: dashboard } = useStudentDashboard();

  const isNonWorkingDay = !!dayInfo && !dayInfo.is_working_day;
  const isHoliday =
    dayInfo?.day_type === 'holiday' || dayInfo?.day_type === 'force_holiday';

  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

  const handleRefresh = () => {
    void refetch();
    void refetchDayInfo();
  };

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setSelectedDate(date);
  };

  const renderPeriodsList = () => {
    if (isLoading || dayLoading) {
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

    if (isNonWorkingDay) {
      return (
        <View
          style={[
            timetableStyles.stateCard,
            isHoliday
              ? timetableStyles.holidayCard
              : timetableStyles.weekendCard,
          ]}
        >
          {isHoliday ? (
            <PartyPopper size={34} color="#e11d48" />
          ) : (
            <CalendarOff size={34} color="#4f46e5" />
          )}
          <Text
            style={[
              timetableStyles.stateTitle,
              isHoliday
                ? timetableStyles.holidayTitle
                : timetableStyles.weekendTitle,
            ]}
          >
            {isHoliday
              ? 'Holiday - no classes today'
              : 'Weekly off - no classes'}
          </Text>
          <Text style={timetableStyles.stateReason}>{dayInfo.reason}</Text>
          <Text style={timetableStyles.stateMessage}>
            {format(selectedDate, 'EEEE, d MMMM yyyy')}
          </Text>
        </View>
      );
    }

    return (
      <View style={[timetableStyles.stateCard, timetableStyles.setupCard]}>
        <Settings size={32} color="#b45309" />
        <Text style={[timetableStyles.stateTitle, timetableStyles.setupTitle]}>
          Timetable setup not done yet
        </Text>
        <Text style={timetableStyles.stateMessage}>
          No periods are configured for {dashboard?.class_name || 'your class'}{' '}
          on {format(selectedDate, 'EEEE, d MMMM yyyy')}. Please contact your
          class teacher.
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
        <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
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
        {isNonWorkingDay && (
          <View
            style={[
              timetableStyles.dayChip,
              isHoliday
                ? timetableStyles.holidayChip
                : timetableStyles.weekendChip,
            ]}
          >
            <Text
              style={[
                timetableStyles.dayChipText,
                isHoliday
                  ? timetableStyles.holidayChipText
                  : timetableStyles.weekendChipText,
              ]}
            >
              {dayInfo.reason}
            </Text>
          </View>
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
            {dashboard?.class_name ? `${dashboard.class_name} \u2022 ` : ''}
            Includes substitutions, cancellations and extra classes
          </Text>
        </View>
      </View>

      <View>{renderPeriodsList()}</View>
    </ScrollView>
  );
}
