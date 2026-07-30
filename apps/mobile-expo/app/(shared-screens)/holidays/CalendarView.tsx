/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react-native';
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { Holiday } from '@/features/holidays';

import { HOLIDAY_TYPE_CONFIG, DAYS, MONTHS } from './constants';
import { styles } from './styles';
import { isToday, formatDate, getDaysBetween } from './utils';

interface CalendarViewProps {
  currentMonth: Date;
  calendarDays: { date: Date | null; day: number; isCurrentMonth: boolean; cellKey: string }[];
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Month Navigator */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.monthBtn}>
          <ChevronLeft size={20} color="#4f46e5" />
        </TouchableOpacity>
        <View style={styles.monthCenter}>
          <Text style={styles.monthTitle}>
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          <Text style={styles.monthSubtitle}>
            {monthHolidayCount} holiday{monthHolidayCount !== 1 ? 's' : ''} this month
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.monthBtn}>
          <ChevronRight size={20} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      {/* Calendar Grid Card */}
      <View style={styles.calendarCard}>
        {/* Day Headers */}
        <LinearGradient
          colors={['#4f46e5', '#6366f1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.calHeaderRow}
        >
          {DAYS.map((d) => (
            <View key={d} style={styles.calHeaderCell}>
              <Text style={[styles.calHeaderText, d === 'Sun' && { color: '#fca5a5' }]}>{d}</Text>
            </View>
          ))}
        </LinearGradient>

        {/* Calendar Grid */}
        <View style={styles.calGrid}>
          {calendarDays.map((item) => {
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
              (h) => h.holiday_type !== 'SUNDAY' && h.holiday_type !== 'SATURDAY'
            );
            const secondSatHoliday = dayHolidays.find((h) => h.holiday_type === 'SECOND_SATURDAY');
            const config = primaryHoliday ? HOLIDAY_TYPE_CONFIG[primaryHoliday.holiday_type] : null;

            return (
              <TouchableOpacity
                key={`day-${item.day}`}
                style={[
                  styles.calCell,
                  today && styles.calCellToday,
                  config && {
                    backgroundColor: config.bg,
                    borderWidth: 1.5,
                    borderColor: config.color + '60',
                    borderRadius: 10,
                  },
                  !config &&
                    isSunday && {
                      backgroundColor: '#fce7f3',
                      borderWidth: 1.5,
                      borderColor: '#f9a8d440',
                      borderRadius: 10,
                    },
                  !config &&
                    secondSatHoliday && {
                      backgroundColor: '#eef2ff',
                      borderWidth: 1.5,
                      borderColor: '#818cf840',
                      borderRadius: 10,
                    },
                ]}
                activeOpacity={0.6}
                onPress={() => item.date && onDateTap(item.date)}
              >
                <Text
                  style={[
                    styles.calCellDay,
                    today && styles.calCellDayToday,
                    isSunday && !config && { color: '#db2777' },
                    secondSatHoliday && !config && { color: '#4f46e5', fontWeight: '700' },
                    config && { color: config.color, fontWeight: '800' },
                  ]}
                >
                  {item.day}
                </Text>
                {config && (
                  <View style={[styles.calCellBadge, { backgroundColor: config.color + '18' }]}>
                    <Text
                      style={[styles.calCellBadgeText, { color: config.color }]}
                      numberOfLines={1}
                    >
                      {primaryHoliday!.description.length > 6
                        ? primaryHoliday!.description.slice(0, 5) + '..'
                        : primaryHoliday!.description}
                    </Text>
                  </View>
                )}
                {!config && secondSatHoliday && (
                  <View style={[styles.calCellBadge, { backgroundColor: '#4f46e518' }]}>
                    <Text style={[styles.calCellBadgeText, { color: '#4f46e5' }]}>2nd Sat</Text>
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
              <View key={key} style={[styles.legendChip, { backgroundColor: val.bg }]}>
                <View style={[styles.legendDot, { backgroundColor: val.color }]} />
                <Text style={[styles.legendChipText, { color: val.color }]}>{val.label}</Text>
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
            const hConfig = HOLIDAY_TYPE_CONFIG[h.holiday_type] || HOLIDAY_TYPE_CONFIG.OTHER;
            const duration = getDaysBetween(h.start_date, h.end_date);
            return (
              <Animated.View key={h.public_id} entering={FadeInDown.delay(i * 50).duration(300)}>
                <TouchableOpacity
                  style={[styles.upcomingCard, { borderLeftColor: hConfig.color }]}
                  activeOpacity={0.7}
                  onPress={() => onHolidayTap(h)}
                >
                  <View style={styles.upcomingCardTop}>
                    <Text style={styles.upcomingIcon}>{hConfig.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.upcomingName}>{h.description}</Text>
                      <Text style={styles.upcomingDate}>
                        {formatDate(h.start_date)}
                        {h.start_date !== h.end_date && ` — ${formatDate(h.end_date)}`}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.upcomingCardBottom}>
                    <View style={[styles.upcomingTypeBadge, { backgroundColor: hConfig.bg }]}>
                      <Text style={[styles.upcomingTypeText, { color: hConfig.color }]}>
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
