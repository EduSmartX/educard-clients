/**
 * Holiday Calendar Screen
 * Premium calendar view with colored cells + Table list view
 *
 * Permission Model:
 * - Admin: Add, Edit, Delete holidays
 * - Teacher: View-only access (no CRUD buttons)
 */

import { Colors, getRoleGradient, extractApiError } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  Calendar,
  Plus,
  List,
  Grid3x3,
  Upload,
} from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ConfirmDialog, BulkUploadModal } from '@/components/common';
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
import { LinearGradient } from '@/lib/linear-gradient';
import { useToast } from '@/lib/toast-context';
import type { SharedStackNavigation } from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';
import { isAdminRole } from '@/utils/role-utils';

import { CalendarView } from './CalendarView';
import { HolidayDetailPopup } from './HolidayDetailPopup';
import { HolidayFormModal } from './HolidayFormModal';
import { styles } from './styles';
import { TableItem } from './TableItem';
import { generateWeekendHolidays } from './utils';

const adminGradient = getRoleGradient('admin');

export default function HolidayCalendarScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const canManage = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  // Form modal state
  const [formModal, setFormModal] = useState<{
    visible: boolean;
    editing: Holiday | null;
  }>({
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

  const { data, isLoading, refetch } = useHolidays({
    page_size: 500,
    ordering: 'start_date',
  });
  const { data: policyData } = useWorkingDayPolicy();
  const createMutation = useCreateHoliday();
  const updateMutation = useUpdateHoliday();
  const deleteMutation = useDeleteHoliday();

  const workingDayPolicy = policyData?.data?.[0];

  const generatedWeekendHolidays = useMemo(
    () => generateWeekendHolidays(workingDayPolicy, currentMonth),
    [workingDayPolicy, currentMonth],
  );

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

    const days: {
      date: Date | null;
      day: number;
      isCurrentMonth: boolean;
      cellKey: string;
    }[] = [];
    for (let i = 0; i < totalCells; i++) {
      const dayOffset = i - firstDay;
      if (dayOffset < 0 || dayOffset >= daysInMonth) {
        days.push({
          date: null,
          day: 0,
          isCurrentMonth: false,
          cellKey: `empty-${i}`,
        });
      } else {
        days.push({
          date: new Date(year, month, dayOffset + 1),
          day: dayOffset + 1,
          isCurrentMonth: true,
          cellKey: `day-${dayOffset + 1}`,
        });
      }
    }
    return days;
  }, [currentMonth]);

  const holidayDateMap = useMemo(() => {
    const map: Record<string, Holiday[]> = {};
    holidays.forEach(h => {
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
    [holidayDateMap],
  );

  const navigateMonth = (direction: number) => {
    setCurrentMonth(
      prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1),
    );
  };

  const openAddModal = () => {
    setFormData({
      description: '',
      holiday_type: '',
      start_date: '',
      end_date: '',
    });
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

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.public_id, {
        onSuccess: () => {
          setDeleteTarget(null);
          void refetch();
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
    if (
      !formData.description.trim() ||
      !formData.holiday_type ||
      !formData.start_date
    ) {
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
            void refetch();
          },
          onError: (error: unknown) =>
            showToast({
              type: 'error',
              title: 'Error',
              message: extractApiError(error, 'Failed to update holiday'),
            }),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setFormModal({ visible: false, editing: null });
          void refetch();
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
      h => h.holiday_type !== 'SUNDAY' && h.holiday_type !== 'SATURDAY',
    );
    if (dayHolidays.length > 0) {
      setDetailPopup({ visible: true, holidays: dayHolidays, date });
    }
  };

  const tableHolidays = useMemo(() => {
    return holidays.filter(
      h => h.holiday_type !== 'SUNDAY' && h.holiday_type !== 'SATURDAY',
    );
  }, [holidays]);

  const monthHolidayCount = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return tableHolidays.filter(h => {
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
      .filter(h => h.start_date >= todayStr)
      .sort((a, b) => a.start_date.localeCompare(b.start_date))
      .slice(0, 6);
  }, [tableHolidays]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const renderTableItem = ({
    item,
    index,
  }: {
    item: Holiday;
    index: number;
  }) => (
    <TableItem
      item={item}
      index={index}
      canManage={canManage}
      onEdit={openEditModal}
      onDelete={setDeleteTarget}
    />
  );

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
            <TouchableOpacity style={headerStyles.backBtn} onPress={handleBack}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Holiday Calendar</Text>
              <Text style={headerStyles.subtitle}>
                {tableHolidays.length} holiday
                {tableHolidays.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={headerStyles.actions}>
              <TouchableOpacity
                style={[
                  headerStyles.actionBtn,
                  viewMode === 'table' && styles.actionBtnActive,
                ]}
                onPress={() =>
                  setViewMode(viewMode === 'calendar' ? 'table' : 'calendar')
                }
              >
                {viewMode === 'calendar' ? (
                  <List size={18} color="#fff" />
                ) : (
                  <Grid3x3 size={18} color="#fff" />
                )}
              </TouchableOpacity>
              {canManage && (
                <TouchableOpacity
                  style={headerStyles.actionBtn}
                  onPress={() => setShowBulkUpload(true)}
                >
                  <Upload size={18} color="#fff" />
                </TouchableOpacity>
              )}
              {canManage && (
                <TouchableOpacity
                  style={headerStyles.primaryBtn}
                  onPress={openAddModal}
                >
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
        onUploadSuccess={() => void refetch()}
      />

      {/* Content */}
      {isLoading && !refreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      )}
      {!(isLoading && !refreshing) && viewMode === 'calendar' && (
        <CalendarView
          currentMonth={currentMonth}
          calendarDays={calendarDays}
          getHolidaysForDate={getHolidaysForDate}
          navigateMonth={navigateMonth}
          monthHolidayCount={monthHolidayCount}
          upcomingHolidays={upcomingHolidays}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onDateTap={handleDateTap}
          onHolidayTap={h =>
            setDetailPopup({
              visible: true,
              holidays: [h],
              date: new Date(h.start_date + 'T00:00:00'),
            })
          }
        />
      )}
      {!(isLoading && !refreshing) && viewMode !== 'calendar' && (
        <FlatList
          data={tableHolidays}
          keyExtractor={item => item.public_id}
          renderItem={renderTableItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Calendar size={48} color={Colors.gray[300]} />
              <Text style={styles.emptyText}>No holidays found</Text>
            </View>
          }
        />
      )}

      {/* Detail Popup */}
      <HolidayDetailPopup
        visible={detailPopup.visible}
        holidays={detailPopup.holidays}
        date={detailPopup.date}
        canManage={canManage}
        onClose={() => setDetailPopup(p => ({ ...p, visible: false }))}
        onEdit={openEditModal}
      />

      {/* Add/Edit Form Modal */}
      <HolidayFormModal
        visible={formModal.visible}
        isEditing={!!formModal.editing}
        formData={formData}
        isSaving={isSaving}
        onClose={() => setFormModal({ visible: false, editing: null })}
        onSubmit={handleFormSubmit}
        onChangeField={(field, value) =>
          setFormData(p => ({ ...p, [field]: value }))
        }
      />

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
