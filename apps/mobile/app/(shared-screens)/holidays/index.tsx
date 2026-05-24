/**
 * Holiday Calendar Screen
 * Premium calendar view with colored cells + Table list view
 *
 * Permission Model:
 * - Admin: Add, Edit, Delete holidays
 * - Teacher: View-only access (no CRUD buttons)
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any, @typescript-eslint/no-floating-promises, @typescript-eslint/no-unused-vars, @typescript-eslint/no-non-null-assertion */

import { Colors, getRoleGradient, extractApiError } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Trash2,
  Pencil,
  Plus,
  List,
  Grid3x3,
  X,
  Clock,
  Upload,
} from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { ConfirmDialog, BulkUploadModal } from '@/components/common';
import { FormInput, FormDropdown, FormDatePicker } from '@/components/forms';
import {
  useHolidays,
  useCreateHoliday,
  useUpdateHoliday,
  useDeleteHoliday,
  useWorkingDayPolicy,
  downloadHolidayTemplate,
  bulkUploadHolidays,
  type Holiday,
  type CreateHolidayPayload,
} from '@/features/holidays';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/lib/toast-context';
import { headerStyles, layoutStyles } from '@/styles';
import { isAdminRole } from '@/utils/role-utils';

const adminGradient = getRoleGradient('admin');

/** Holiday type display config */
const HOLIDAY_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; darkBg: string; icon: string }
> = {
  NATIONAL_HOLIDAY: {
    label: 'National Holiday',
    color: '#dc2626',
    bg: '#fef2f2',
    darkBg: '#fee2e2',
    icon: '🏛️',
  },
  FESTIVAL: {
    label: 'Festival',
    color: '#ea580c',
    bg: '#fff7ed',
    darkBg: '#ffedd5',
    icon: '🎉',
  },
  ORGANIZATION_HOLIDAY: {
    label: 'Organization',
    color: '#059669',
    bg: '#ecfdf5',
    darkBg: '#d1fae5',
    icon: '🏢',
  },
  SECOND_SATURDAY: {
    label: '2nd Saturday',
    color: '#4f46e5',
    bg: '#eef2ff',
    darkBg: '#e0e7ff',
    icon: '📅',
  },
  SUNDAY: { label: 'Sunday', color: '#db2777', bg: '#fce7f3', darkBg: '#fbcfe8', icon: '☀️' },
  SATURDAY: {
    label: 'Saturday',
    color: '#6b7280',
    bg: '#f9fafb',
    darkBg: '#f3f4f6',
    icon: '📅',
  },
  OTHER: { label: 'Other', color: '#7c3aed', bg: '#f5f3ff', darkBg: '#ede9fe', icon: '📌' },
};

const HOLIDAY_TYPE_OPTIONS = [
  { value: 'NATIONAL_HOLIDAY', label: '🏛️ National Holiday' },
  { value: 'FESTIVAL', label: '🎉 Festival' },
  { value: 'ORGANIZATION_HOLIDAY', label: '🏢 Organization Holiday' },
  { value: 'OTHER', label: '📌 Other' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Check if a Saturday is off based on policy pattern */
function isSaturdayOffByPolicy(day: number, pattern: string): boolean {
  const nthSaturday = Math.ceil(day / 7);
  switch (pattern) {
    case 'ALL':
      return true;
    case 'SECOND_ONLY':
      return nthSaturday === 2;
    case 'SECOND_AND_FOURTH':
      return nthSaturday === 2 || nthSaturday === 4;
    default:
      return false;
  }
}

/** Generate weekend holidays for a month based on working day policy */
function generateWeekendHolidays(
  workingDayPolicy: { sunday_off: boolean; saturday_off_pattern: string } | undefined,
  currentMonth: Date
): Holiday[] {
  if (!workingDayPolicy) return [];

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const endDate = new Date(year, month + 1, 0);
  const holidays: Holiday[] = [];

  const formatLocalDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const currentDate = new Date(year, month, 1);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const dateStr = formatLocalDate(currentDate);

    if (dayOfWeek === 0 && workingDayPolicy.sunday_off) {
      holidays.push({
        public_id: `sunday-${dateStr}`,
        start_date: dateStr,
        end_date: dateStr,
        holiday_type: 'SUNDAY',
        description: 'Sunday',
      });
    }

    if (
      dayOfWeek === 6 &&
      isSaturdayOffByPolicy(currentDate.getDate(), workingDayPolicy.saturday_off_pattern)
    ) {
      const nthSaturday = Math.ceil(currentDate.getDate() / 7);
      holidays.push({
        public_id: `saturday-${dateStr}`,
        start_date: dateStr,
        end_date: dateStr,
        holiday_type: nthSaturday === 2 ? 'SECOND_SATURDAY' : 'SATURDAY',
        description: nthSaturday === 2 ? '2nd Saturday' : 'Saturday',
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return holidays;
}

export default function HolidayCalendarScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Check if current user is admin (has CRUD access)
  const canManage = useMemo(() => isAdminRole(user?.role), [user?.role]);

  // Form modal state
  const [formModal, setFormModal] = useState<{ visible: boolean; editing: Holiday | null }>({
    visible: false,
    editing: null,
  });
  const [formData, setFormData] = useState({
    description: '',
    holiday_type: '',
    start_date: '',
    end_date: '',
  });

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);

  // Detail popup state
  const [detailPopup, setDetailPopup] = useState<{
    visible: boolean;
    holidays: Holiday[];
    date: Date | null;
  }>({ visible: false, holidays: [], date: null });

  const { data, isLoading, refetch } = useHolidays({ page_size: 500, ordering: 'start_date' });
  const { data: policyData } = useWorkingDayPolicy();
  const createMutation = useCreateHoliday();
  const updateMutation = useUpdateHoliday();
  const deleteMutation = useDeleteHoliday();

  const workingDayPolicy = policyData?.data?.[0];

  // Generate weekend holidays based on working day policy
  const generatedWeekendHolidays = useMemo(
    () => generateWeekendHolidays(workingDayPolicy, currentMonth),
    [workingDayPolicy, currentMonth]
  );

  // Combine API holidays with generated weekend holidays
  const holidays = useMemo(() => {
    const apiHolidays = data?.data ?? [];
    return [...apiHolidays, ...generatedWeekendHolidays];
  }, [data?.data, generatedWeekendHolidays]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

    const days: { date: Date | null; day: number; isCurrentMonth: boolean }[] = [];
    for (let i = 0; i < totalCells; i++) {
      const dayOffset = i - firstDay;
      if (dayOffset < 0 || dayOffset >= daysInMonth) {
        days.push({ date: null, day: 0, isCurrentMonth: false });
      } else {
        days.push({
          date: new Date(year, month, dayOffset + 1),
          day: dayOffset + 1,
          isCurrentMonth: true,
        });
      }
    }
    return days;
  }, [currentMonth]);

  const holidayDateMap = useMemo(() => {
    const map: Record<string, Holiday[]> = {};
    holidays.forEach((h) => {
      const start = new Date(h.start_date + 'T00:00:00');
      const end = new Date(h.end_date + 'T00:00:00');
      const d = new Date(start);
      while (d <= end) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!map[key]) map[key] = [];
        map[key].push(h);
        d.setDate(d.getDate() + 1);
      }
    });
    return map;
  }, [holidays]);

  const getHolidaysForDate = useCallback(
    (date: Date) => {
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return holidayDateMap[key] || [];
    },
    [holidayDateMap]
  );

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDaysBetween = (start: string, end: string) => {
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end + 'T00:00:00');
    return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const openAddModal = () => {
    setFormData({ description: '', holiday_type: '', start_date: '', end_date: '' });
    setFormModal({ visible: true, editing: null });
  };

  const openEditModal = (h: Holiday) => {
    setFormData({
      description: h.description,
      holiday_type: h.holiday_type,
      start_date: h.start_date,
      end_date: h.end_date,
    });
    setFormModal({ visible: true, editing: h });
  };

  const handleDelete = (h: Holiday) => {
    setDeleteTarget(h);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.public_id, {
        onSuccess: () => {
          setDeleteTarget(null);
          refetch();
        },
        onError: (error: unknown) => {
          setDeleteTarget(null);
          showToast({
            type: 'error',
            title: 'Error',
            message: extractApiError(error, 'Failed to delete holiday'),
          });
        },
      });
    }
  };

  const handleFormSubmit = () => {
    if (!formData.description.trim() || !formData.holiday_type || !formData.start_date) {
      Alert.alert('Error', 'Please fill description, type, and start date.');
      return;
    }
    const payload: CreateHolidayPayload = {
      description: formData.description.trim(),
      holiday_type: formData.holiday_type,
      start_date: formData.start_date,
      end_date: formData.end_date || formData.start_date,
    };

    if (formModal.editing) {
      updateMutation.mutate(
        { id: formModal.editing.public_id, data: payload },
        {
          onSuccess: () => {
            setFormModal({ visible: false, editing: null });
            refetch();
          },
          onError: (error: unknown) =>
            showToast({
              type: 'error',
              title: 'Error',
              message: extractApiError(error, 'Failed to update holiday'),
            }),
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setFormModal({ visible: false, editing: null });
          refetch();
        },
        onError: (error: unknown) =>
          showToast({
            type: 'error',
            title: 'Error',
            message: extractApiError(error, 'Failed to create holiday'),
          }),
      });
    }
  };

  const handleDateTap = (date: Date) => {
    const dayHolidays = getHolidaysForDate(date).filter(
      (h) => h.holiday_type !== 'SUNDAY' && h.holiday_type !== 'SATURDAY'
    );
    if (dayHolidays.length > 0) {
      setDetailPopup({ visible: true, holidays: dayHolidays, date });
    }
  };

  const tableHolidays = useMemo(() => {
    return holidays.filter((h) => h.holiday_type !== 'SUNDAY' && h.holiday_type !== 'SATURDAY');
  }, [holidays]);

  const monthHolidayCount = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return tableHolidays.filter((h) => {
      const sd = new Date(h.start_date + 'T00:00:00');
      const ed = new Date(h.end_date + 'T00:00:00');
      return (
        (sd.getFullYear() === year && sd.getMonth() === month) ||
        (ed.getFullYear() === year && ed.getMonth() === month)
      );
    }).length;
  }, [tableHolidays, currentMonth]);

  const upcomingHolidays = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return tableHolidays
      .filter((h) => h.start_date >= todayStr)
      .sort((a, b) => a.start_date.localeCompare(b.start_date)) // Sort by date ascending (earliest first)
      .slice(0, 6);
  }, [tableHolidays]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const renderCalendar = () => (
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
          {calendarDays.map((item, idx) => {
            if (!item.date || !item.isCurrentMonth) {
              return (
                <View key={`empty-${idx}`} style={styles.calCellEmpty}>
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
                onPress={() => item.date && handleDateTap(item.date)}
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
            const config = HOLIDAY_TYPE_CONFIG[h.holiday_type] || HOLIDAY_TYPE_CONFIG.OTHER;
            const duration = getDaysBetween(h.start_date, h.end_date);
            return (
              <Animated.View key={h.public_id} entering={FadeInDown.delay(i * 50).duration(300)}>
                <TouchableOpacity
                  style={[styles.upcomingCard, { borderLeftColor: config.color }]}
                  activeOpacity={0.7}
                  onPress={() =>
                    setDetailPopup({
                      visible: true,
                      holidays: [h],
                      date: new Date(h.start_date + 'T00:00:00'),
                    })
                  }
                >
                  <View style={styles.upcomingCardTop}>
                    <Text style={styles.upcomingIcon}>{config.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.upcomingName}>{h.description}</Text>
                      <Text style={styles.upcomingDate}>
                        {formatDate(h.start_date)}
                        {h.start_date !== h.end_date && ` — ${formatDate(h.end_date)}`}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.upcomingCardBottom}>
                    <View style={[styles.upcomingTypeBadge, { backgroundColor: config.bg }]}>
                      <Text style={[styles.upcomingTypeText, { color: config.color }]}>
                        {config.label}
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

  const renderTableItem = ({ item, index }: { item: Holiday; index: number }) => {
    const config = HOLIDAY_TYPE_CONFIG[item.holiday_type] || HOLIDAY_TYPE_CONFIG.OTHER;
    const duration = getDaysBetween(item.start_date, item.end_date);

    return (
      <Animated.View entering={FadeInDown.delay(index * 30).duration(300)}>
        <View style={[styles.tableCard, { borderLeftColor: config.color }]}>
          <View style={styles.tableCardRow}>
            <View style={[styles.tableIcon, { backgroundColor: config.bg }]}>
              <Text style={{ fontSize: 18 }}>{config.icon}</Text>
            </View>
            <View style={styles.tableCardInfo}>
              <Text style={styles.tableCardTitle}>{item.description}</Text>
              <Text style={styles.tableCardDate}>
                {formatDate(item.start_date)}
                {item.start_date !== item.end_date && ` — ${formatDate(item.end_date)}`}
              </Text>
            </View>
          </View>
          <View style={styles.tableCardFooter}>
            <View style={[styles.upcomingTypeBadge, { backgroundColor: config.bg }]}>
              <Text style={[styles.upcomingTypeText, { color: config.color }]}>{config.label}</Text>
            </View>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>
                {duration} {duration === 1 ? 'Day' : 'Days'}
              </Text>
            </View>
            <View style={{ flex: 1 }} />
            {/* Edit/Delete buttons - only for admin */}
            {canManage && (
              <>
                <TouchableOpacity onPress={() => openEditModal(item)} style={styles.tinyBtn}>
                  <Pencil size={14} color="#7c3aed" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.tinyBtn}>
                  <Trash2 size={14} color={Colors.danger[400]} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={layoutStyles.container}>
      {/* Header */}
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <Animated.View
          entering={FadeIn.delay(100)}
          style={headerStyles.circle1}
          pointerEvents="none"
        />
        <Animated.View
          entering={FadeIn.delay(200)}
          style={headerStyles.circle2}
          pointerEvents="none"
        />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Holiday Calendar</Text>
              <Text style={headerStyles.subtitle}>
                {tableHolidays.length} holiday{tableHolidays.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={headerStyles.actions}>
              <TouchableOpacity
                style={[
                  headerStyles.actionBtn,
                  viewMode === 'table' && { backgroundColor: 'rgba(255,255,255,0.35)' },
                ]}
                onPress={() => setViewMode(viewMode === 'calendar' ? 'table' : 'calendar')}
              >
                {viewMode === 'calendar' ? (
                  <List size={18} color="#fff" />
                ) : (
                  <Grid3x3 size={18} color="#fff" />
                )}
              </TouchableOpacity>
              {/* Bulk upload button - only for admin */}
              {canManage && (
                <TouchableOpacity
                  style={headerStyles.actionBtn}
                  onPress={() => setShowBulkUpload(true)}
                >
                  <Upload size={18} color="#fff" />
                </TouchableOpacity>
              )}
              {/* Add button - only for admin */}
              {canManage && (
                <TouchableOpacity style={headerStyles.primaryBtn} onPress={openAddModal}>
                  <Plus size={20} color="#7c3aed" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        visible={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        title="Bulk Upload Holidays"
        description="Upload multiple holidays at once using an Excel template"
        downloadTemplate={downloadHolidayTemplate}
        uploadFile={bulkUploadHolidays}
        templateFileName="holidays_template.xlsx"
        onUploadSuccess={() => void refetch()}
      />

      {/* Content */}
      {isLoading && !refreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      )}
      {!(isLoading && !refreshing) && viewMode === 'calendar' && renderCalendar()}
      {!(isLoading && !refreshing) && viewMode !== 'calendar' && (
        <FlatList
          data={tableHolidays}
          keyExtractor={(item) => item.public_id}
          renderItem={renderTableItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Calendar size={48} color={Colors.gray[300]} />
              <Text style={styles.emptyText}>No holidays found</Text>
            </View>
          }
        />
      )}

      {/* ================================================================== */}
      {/* Holiday Detail Popup */}
      {/* ================================================================== */}
      <Modal
        visible={detailPopup.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailPopup((p) => ({ ...p, visible: false }))}
      >
        <TouchableOpacity
          style={styles.popupOverlay}
          activeOpacity={1}
          onPress={() => setDetailPopup((p) => ({ ...p, visible: false }))}
        >
          <View style={styles.popupCard}>
            {/* Colored header */}
            {detailPopup.holidays.length > 0 && (
              <LinearGradient
                colors={[
                  HOLIDAY_TYPE_CONFIG[detailPopup.holidays[0].holiday_type]?.color || '#7c3aed',
                  (HOLIDAY_TYPE_CONFIG[detailPopup.holidays[0].holiday_type]?.color || '#7c3aed') +
                    'cc',
                ]}
                style={styles.popupHeader}
              >
                <Text style={styles.popupHeaderIcon}>
                  {HOLIDAY_TYPE_CONFIG[detailPopup.holidays[0].holiday_type]?.icon || '📅'}
                </Text>
                <Text style={styles.popupHeaderDate}>
                  {detailPopup.date
                    ? detailPopup.date.toLocaleDateString('en-IN', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : ''}
                </Text>
              </LinearGradient>
            )}

            {/* Holiday list */}
            {detailPopup.holidays.map((h, i) => {
              const config = HOLIDAY_TYPE_CONFIG[h.holiday_type] || HOLIDAY_TYPE_CONFIG.OTHER;
              const duration = getDaysBetween(h.start_date, h.end_date);
              return (
                <View key={h.public_id} style={styles.popupItem}>
                  <View style={styles.popupItemHeader}>
                    <Calendar size={14} color={config.color} />
                    <Text style={styles.popupItemTitle}>{h.description}</Text>
                  </View>
                  <View style={styles.popupItemDetails}>
                    <View style={[styles.popupTypeBadge, { backgroundColor: config.bg }]}>
                      <Text style={[styles.popupTypeText, { color: config.color }]}>
                        {config.label}
                      </Text>
                    </View>
                    {duration > 1 && (
                      <Text style={styles.popupDuration}>
                        {formatDate(h.start_date)} — {formatDate(h.end_date)} ({duration} days)
                      </Text>
                    )}
                  </View>
                  {i < detailPopup.holidays.length - 1 && <View style={styles.popupDivider} />}
                </View>
              );
            })}

            {/* Actions */}
            <View style={styles.popupActions}>
              {canManage && detailPopup.holidays.length === 1 && (
                <TouchableOpacity
                  style={styles.popupEditBtn}
                  onPress={() => {
                    setDetailPopup((p) => ({ ...p, visible: false }));
                    openEditModal(detailPopup.holidays[0]);
                  }}
                >
                  <Pencil size={14} color="#7c3aed" />
                  <Text style={styles.popupEditText}>Edit</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.popupCloseBtn}
                onPress={() => setDetailPopup((p) => ({ ...p, visible: false }))}
              >
                <Text style={styles.popupCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ================================================================== */}
      {/* Add/Edit Holiday Form Modal */}
      {/* ================================================================== */}
      <Modal
        visible={formModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setFormModal({ visible: false, editing: null })}
      >
        <KeyboardAwareScrollView
          style={styles.formOverlay}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          enableOnAndroid
          extraScrollHeight={20}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <View>
                <Text style={styles.formTitle}>
                  {formModal.editing ? 'Edit Holiday' : 'Add Holiday'}
                </Text>
                <Text style={styles.formSubtitle}>
                  {formModal.editing ? 'Update holiday details' : 'Create a new holiday entry'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setFormModal({ visible: false, editing: null })}
                style={styles.formCloseBtn}
              >
                <X size={20} color={Colors.gray[500]} />
              </TouchableOpacity>
            </View>

            <View style={{ maxHeight: 400 }}>
              <FormInput
                label="Holiday Name"
                required
                value={formData.description}
                onChangeText={(v) => setFormData((p) => ({ ...p, description: v }))}
                placeholder="e.g. Republic Day, Diwali"
              />
              <FormDropdown
                label="Holiday Type"
                required
                options={HOLIDAY_TYPE_OPTIONS}
                value={formData.holiday_type}
                onChange={(v) => setFormData((p) => ({ ...p, holiday_type: v }))}
                placeholder="Select type"
              />
              <FormDatePicker
                label="Start Date"
                required
                value={formData.start_date}
                onChange={(v) => setFormData((p) => ({ ...p, start_date: v }))}
                placeholder="Select start date"
              />
              <FormDatePicker
                label="End Date"
                value={formData.end_date}
                onChange={(v) => setFormData((p) => ({ ...p, end_date: v }))}
                placeholder="Same as start (optional)"
              />
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.formCancelBtn}
                onPress={() => setFormModal({ visible: false, editing: null })}
              >
                <Text style={styles.formCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formSaveBtn, isSaving && { opacity: 0.5 }]}
                onPress={handleFormSubmit}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.formSaveText}>{formModal.editing ? 'Update' : 'Create'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete Holiday"
        message={deleteTarget ? `Delete "${deleteTarget.description}"?` : ''}
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, paddingBottom: 100 },

  // Month Navigator
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  monthBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCenter: { alignItems: 'center' },
  monthTitle: { fontSize: 20, fontWeight: '800', color: '#1e1b4b' },
  monthSubtitle: { fontSize: 12, color: '#6366f1', fontWeight: '500', marginTop: 2 },

  // Calendar Card
  calendarCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  calHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  calHeaderCell: {
    width: '14.28%' as any,
    alignItems: 'center',
  },
  calHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: '14.28%' as any,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: '#f1f5f9',
  },
  calCellEmpty: {
    width: '14.28%' as any,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
    borderBottomWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: '#f1f5f9',
  },
  calCellEmptyText: { fontSize: 12, color: '#d1d5db' },
  calCellToday: {
    borderWidth: 2,
    borderColor: '#4f46e5',
    borderRadius: 4,
  },
  calCellDay: { fontSize: 14, fontWeight: '600', color: '#374151' },
  calCellDayToday: { color: '#4f46e5', fontWeight: '800', fontSize: 15 },
  calCellBadge: {
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
    marginTop: 1,
  },
  calCellBadgeText: { fontSize: 7, fontWeight: '700' },

  // Legend
  legendCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  legendTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.gray[700],
    marginBottom: 10,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendChipText: { fontSize: 11, fontWeight: '600' },

  // Upcoming
  upcomingSection: { paddingHorizontal: 16, paddingTop: 20 },
  upcomingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  upcomingTitle: { fontSize: 16, fontWeight: '700', color: '#1e1b4b' },
  upcomingCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  upcomingCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  upcomingIcon: { fontSize: 22 },
  upcomingName: { fontSize: 15, fontWeight: '700', color: Colors.gray[800] },
  upcomingDate: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
  upcomingCardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  upcomingTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  upcomingTypeText: { fontSize: 11, fontWeight: '700' },
  durationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  durationText: { fontSize: 11, fontWeight: '600', color: Colors.gray[600] },

  // Table Card
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  tableCardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  tableIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCardInfo: { flex: 1, marginLeft: 12 },
  tableCardTitle: { fontSize: 15, fontWeight: '700', color: Colors.gray[800] },
  tableCardDate: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },
  tableCardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tinyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: Colors.gray[400], marginTop: 12 },

  // Detail Popup
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  popupCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
  },
  popupHeader: {
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  popupHeaderIcon: { fontSize: 32 },
  popupHeaderDate: { fontSize: 14, fontWeight: '600', color: '#fff', textAlign: 'center' },
  popupItem: { paddingHorizontal: 20, paddingVertical: 12 },
  popupItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  popupItemTitle: { fontSize: 17, fontWeight: '700', color: Colors.gray[800] },
  popupItemDetails: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  popupTypeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  popupTypeText: { fontSize: 12, fontWeight: '600' },
  popupDuration: { fontSize: 12, color: Colors.gray[500] },
  popupDivider: { height: 1, backgroundColor: '#f1f5f9', marginTop: 12 },
  popupActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  popupEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#ede9fe',
  },
  popupEditText: { fontSize: 14, fontWeight: '600', color: '#7c3aed' },
  popupCloseBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  popupCloseText: { fontSize: 14, fontWeight: '600', color: Colors.gray[600] },

  // Form Modal
  formOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  formCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  formTitle: { fontSize: 18, fontWeight: '700', color: Colors.gray[800] },
  formSubtitle: { fontSize: 13, color: Colors.gray[500], marginTop: 2 },
  formCloseBtn: { padding: 4 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  formCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  formCancelText: { fontSize: 14, fontWeight: '600', color: Colors.gray[600] },
  formSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
  },
  formSaveText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
