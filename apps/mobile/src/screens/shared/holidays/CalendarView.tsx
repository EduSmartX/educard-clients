import { ChevronLeft, ChevronRight, Clock } from 'lucide-react-native';
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { Holiday } from '@/features/holidays';
import { LinearGradient } from '@/lib/linear-gradient';

import { HOLIDAY_TYPE_CONFIG, DAYS, MONTHS } from './constants';
import { styles } from './styles';
import { isToday, formatDate, getDaysBetween } from './utils';

const CAL_HEADER_GRADIENT = ['#4f46e5', '#6366f1'] as const;

interface CalendarViewProps {
  currentMonth: Date;
  calendarDays: {
    date: Date | null;
    day: number;
    isCurrentMonth: boolean;
    cellKey: string;
  }[];
  getHolidaysForDate: (date: Date) => Holiday[];
  navigateMonth: (direction: number) => void;
  monthHolidayCount: number;
  upcomingHolidays: Holiday[];
  refreshing: boolean;
  onRefresh: () => void;
  onDateTap: (date: Date) => void;
  onHolidayTap: (h: Holiday) => void;
}

export function CalendarView({
  currentMonth,
  calendarDays,
  getHolidaysForDate,
  navigateMonth,
  monthHolidayCount,
  upcomingHolidays,
  refreshing,
  onRefresh,
  onDateTap,
  onHolidayTap,
}: CalendarViewProps) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={styles.scrollContent}
    >
      {/* Month Navigator */}
      <View style={styles.monthNav}>
        <TouchableOpacity
          onPress={() => navigateMonth(-1)}
          style={styles.monthBtn}
        >
          <ChevronLeft size={20} color="#4f46e5" />
        </TouchableOpacity>
        <View style={styles.monthCenter}>
          <Text style={styles.monthTitle}>
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          <Text style={styles.monthSubtitle}>
            {monthHolidayCount} holiday{monthHolidayCount !== 1 ? 's' : ''} this
            month
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigateMonth(1)}
          style={styles.monthBtn}
        >
          <ChevronRight size={20} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      {/* Calendar Grid Card */}
      <View style={styles.calendarCard}>
        {/* Day Headers */}
        <LinearGradient
          colors={CAL_HEADER_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.calHeaderRow}
        >
          {DAYS.map(d => (
            <View key={d} style={styles.calHeaderCell}>
              <Text
                style={[
                  styles.calHeaderText,
                  d === 'Sun' && styles.calHeaderTextSun,
                ]}
              >
                {d}
              </Text>
            </View>
          ))}
        </LinearGradient>

        {/* Calendar Grid */}
        <View style={styles.calGrid}>
          {calendarDays.map(item => {
            if (!item.date || !item.isCurrentMonth) {
              return (
                <View key={item.cellKey} style={styles.calCellEmpty}>
                  <Text style={styles.calCellEmptyText}>{item.day || ''}</Text>
                </View>
              );
            }

            const dayHolidays = getHolidaysForDate(item.date);
            const today = isToday(item.date);
            const isSunday = item.date.getDay() === 0;
            const primaryHoliday = dayHolidays.find(
              h => h.holiday_type !== 'SUNDAY' && h.holiday_type !== 'SATURDAY',
            );
            const secondSatHoliday = dayHolidays.find(
              h => h.holiday_type === 'SECOND_SATURDAY',
            );
            const config = primaryHoliday
              ? HOLIDAY_TYPE_CONFIG[primaryHoliday.holiday_type]
              : null;
            const primaryDesc = primaryHoliday?.description ?? '';

            return (
              <TouchableOpacity
                key={`day-${item.day}`}
                style={[
                  styles.calCell,
                  today && styles.calCellToday,
                  config && styles.calCellHoliday,
                  config && {
                    backgroundColor: config.bg,
                    borderColor: config.color + '60',
                  },
                  !config && isSunday && styles.calCellSunday,
                  !config && secondSatHoliday && styles.calCellSecondSat,
                ]}
                activeOpacity={0.6}
                onPress={() => item.date && onDateTap(item.date)}
              >
                <Text
                  style={[
                    styles.calCellDay,
                    today && styles.calCellDayToday,
                    isSunday && !config && styles.calCellDaySunday,
                    secondSatHoliday && !config && styles.calCellDaySecondSat,
                    config && styles.calCellDayHoliday,
                    config && { color: config.color },
                  ]}
                >
                  {item.day}
                </Text>
                {config && (
                  <View
                    style={[
                      styles.calCellBadge,
                      { backgroundColor: config.color + '18' },
                    ]}
                  >
                    <Text
                      style={[styles.calCellBadgeText, { color: config.color }]}
                      numberOfLines={1}
                    >
                      {primaryDesc.length > 6
                        ? primaryDesc.slice(0, 5) + '..'
                        : primaryDesc}
                    </Text>
                  </View>
                )}
                {!config && secondSatHoliday && (
                  <View
                    style={[styles.calCellBadge, styles.calCellBadgeSecondSat]}
                  >
                    <Text
                      style={[
                        styles.calCellBadgeText,
                        styles.calCellBadgeTextSecondSat,
                      ]}
                    >
                      2nd Sat
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendCard}>
        <Text style={styles.legendTitle}>Holiday Types</Text>
        <View style={styles.legendGrid}>
          {Object.entries(HOLIDAY_TYPE_CONFIG)
            .filter(([key]) => key !== 'SATURDAY')
            .map(([key, val]) => (
              <View
                key={key}
                style={[styles.legendChip, { backgroundColor: val.bg }]}
              >
                <View
                  style={[styles.legendDot, { backgroundColor: val.color }]}
                />
                <Text style={[styles.legendChipText, { color: val.color }]}>
                  {val.label}
                </Text>
              </View>
            ))}
        </View>
      </View>

      {/* Upcoming Holidays */}
      {upcomingHolidays.length > 0 && (
        <View style={styles.upcomingSection}>
          <View style={styles.upcomingSectionHeader}>
            <Clock size={16} color="#4f46e5" />
            <Text style={styles.upcomingTitle}>Upcoming Holidays</Text>
          </View>
          {upcomingHolidays.map((h, i) => {
            const hConfig =
              HOLIDAY_TYPE_CONFIG[h.holiday_type] || HOLIDAY_TYPE_CONFIG.OTHER;
            const duration = getDaysBetween(h.start_date, h.end_date);
            return (
              <Animated.View
                key={h.public_id}
                entering={FadeInDown.delay(i * 50).duration(300)}
              >
                <TouchableOpacity
                  style={[
                    styles.upcomingCard,
                    { borderLeftColor: hConfig.color },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => onHolidayTap(h)}
                >
                  <View style={styles.upcomingCardTop}>
                    <Text style={styles.upcomingIcon}>{hConfig.icon}</Text>
                    <View style={styles.flex1}>
                      <Text style={styles.upcomingName}>{h.description}</Text>
                      <Text style={styles.upcomingDate}>
                        {formatDate(h.start_date)}
                        {h.start_date !== h.end_date &&
                          ` — ${formatDate(h.end_date)}`}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.upcomingCardBottom}>
                    <View
                      style={[
                        styles.upcomingTypeBadge,
                        { backgroundColor: hConfig.bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.upcomingTypeText,
                          { color: hConfig.color },
                        ]}
                      >
                        {hConfig.label}
                      </Text>
                    </View>
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>
                        {duration} {duration === 1 ? 'Day' : 'Days'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
