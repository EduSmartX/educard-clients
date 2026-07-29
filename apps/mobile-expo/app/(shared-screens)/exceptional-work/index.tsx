/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-misused-promises, @typescript-eslint/no-floating-promises, @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/no-unsafe-return */
/**
 * Exceptional Work Policy Screen - Manage calendar exceptions
 */

import { getRoleGradient, getRoleThemeColors, extractApiError } from '@educard/shared';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  format,
  parseISO,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameDay,
} from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Calendar,
  Plus,
  Trash2,
  Briefcase,
  PartyPopper,
  X,
  Check,
  Eye,
} from 'lucide-react-native';
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';

import { apiClient } from '@/api/client';
import { FAB as FloatingActionButton, ConfirmDialog } from '@/components/common';
import { useClasses } from '@/features/classes';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/lib/toast-context';
import { isAdminRole } from '@/utils/role-utils';

import { styles, modalStyles } from './styles';

const adminGradient = getRoleGradient('admin');
const adminTheme = getRoleThemeColors('admin');

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface CalendarException {
  public_id: string;
  date: string;
  override_type: 'FORCE_WORKING' | 'FORCE_HOLIDAY';
  reason: string;
  is_applicable_to_all_classes: boolean;
  is_applicable_to_all_teachers: boolean;
  classes?: { public_id: string; display_name: string }[];
  created_at: string;
}

interface CalendarExceptionCreate {
  date: string;
  override_type: 'FORCE_WORKING' | 'FORCE_HOLIDAY';
  reason: string;
  is_applicable_to_all_classes: boolean;
  is_applicable_to_all_teachers: boolean;
  classes?: string[];
}

const getCalendarExceptions = async (): Promise<CalendarException[]> => {
  const response = await apiClient.get('/attendance/admin/calendar-exception/');
  return (
    response.data.data?.results || response.data.results || response.data.data || response.data
  );
};

const createCalendarException = async (
  data: CalendarExceptionCreate
): Promise<CalendarException> => {
  const response = await apiClient.post('/attendance/admin/calendar-exception/', data);
  return response.data.data || response.data;
};

const deleteCalendarException = async (id: string): Promise<void> => {
  await apiClient.delete(`/attendance/admin/calendar-exception/${id}/`);
};

function DatePickerModal({
  visible,
  selectedDate,
  onSelectDate,
  onClose,
}: {
  visible: boolean;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}) {
  const [viewDate, setViewDate] = useState(selectedDate || new Date());

  const monthStart = useMemo(() => startOfMonth(viewDate), [viewDate]);
  const monthEnd = useMemo(() => endOfMonth(viewDate), [viewDate]);
  const monthDays = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd]
  );
  const leadingEmptyDays = useMemo(() => Array.from({ length: monthStart.getDay() }), [monthStart]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.datePickerContainer}>
          <View style={modalStyles.datePickerHeader}>
            <Text style={modalStyles.datePickerTitle}>Select Date</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={modalStyles.monthNavigation}>
            <TouchableOpacity
              onPress={() => setViewDate(subMonths(viewDate, 1))}
              style={modalStyles.monthNavButton}
            >
              <ChevronLeft size={20} color="#374151" />
            </TouchableOpacity>
            <Text style={modalStyles.monthLabel}>{format(viewDate, 'MMMM yyyy')}</Text>
            <TouchableOpacity
              onPress={() => setViewDate(addMonths(viewDate, 1))}
              style={modalStyles.monthNavButton}
            >
              <ChevronRight size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={modalStyles.weekdaysRow}>
            {WEEKDAYS.map((day, i) => (
              <View key={`${day}-${i}`} style={modalStyles.weekdayCell}>
                <Text style={[modalStyles.weekdayText, i === 0 && { color: '#ef4444' }]}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          <View style={modalStyles.daysGrid}>
            {leadingEmptyDays.map((_, i) => (
              <View key={`empty-${format(viewDate, 'yyyy-MM')}-${i}`} style={modalStyles.dayCell} />
            ))}
            {monthDays.map((date) => {
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isTodayDate = isToday(date);
              const dateKey = format(date, 'yyyy-MM-dd');
              return (
                <TouchableOpacity
                  key={`day-${dateKey}`}
                  style={[
                    modalStyles.dayCell,
                    isSelected && modalStyles.selectedDayCell,
                    isTodayDate && !isSelected && modalStyles.todayCell,
                  ]}
                  onPress={() => {
                    onSelectDate(date);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      modalStyles.dayText,
                      isSelected && modalStyles.selectedDayText,
                      isTodayDate && !isSelected && modalStyles.todayText,
                    ]}
                  >
                    {format(date, 'd')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={modalStyles.cancelButton} onPress={onClose}>
            <Text style={modalStyles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ClassSelectionGrid({
  classes,
  selectedClasses,
  onToggle,
}: Readonly<{
  classes: any[];
  selectedClasses: string[];
  onToggle: (classId: string) => void;
}>) {
  return (
    <View style={modalStyles.field}>
      <Text style={modalStyles.fieldLabel}>Select Classes *</Text>
      <View style={modalStyles.classesGrid}>
        {classes.length === 0 ? (
          <Text style={modalStyles.noClassesText}>No classes available</Text>
        ) : (
          classes.map((cls: any) => (
            <TouchableOpacity
              key={cls.public_id}
              style={[
                modalStyles.classChip,
                selectedClasses.includes(cls.public_id) && modalStyles.classChipSelected,
              ]}
              onPress={() => onToggle(cls.public_id)}
            >
              <Text
                style={[
                  modalStyles.classChipText,
                  selectedClasses.includes(cls.public_id) && modalStyles.classChipTextSelected,
                ]}
              >
                {cls.display_name || cls.name}
              </Text>
              {selectedClasses.includes(cls.public_id) && <Check size={14} color="#0d9488" />}
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
}

function CreateExceptionModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [overrideType, setOverrideType] = useState<'FORCE_WORKING' | 'FORCE_HOLIDAY'>(
    'FORCE_WORKING'
  );
  const [reason, setReason] = useState('');
  const [isAllClasses, setIsAllClasses] = useState(true);
  const [isAllTeachers, setIsAllTeachers] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  const { data: classesData } = useClasses({ is_active: true });
  const classes = classesData?.classes || [];

  const createMutation = useMutation({
    mutationFn: createCalendarException,
    onSuccess: () => {
      showToast({ type: 'success', title: 'Success', message: 'Exception created successfully' });
      resetForm();
      onSuccess();
      onClose();
    },
    onError: (error: unknown) => {
      showToast({
        type: 'error',
        title: 'Error',
        message: extractApiError(error, 'Failed to create exception'),
      });
    },
  });

  const resetForm = () => {
    setSelectedDate(null);
    setOverrideType('FORCE_WORKING');
    setReason('');
    setIsAllClasses(true);
    setIsAllTeachers(true);
    setSelectedClasses([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Error', 'Please enter a reason');
      return;
    }
    if (!isAllClasses && selectedClasses.length === 0) {
      Alert.alert('Error', 'Please select at least one class');
      return;
    }
    createMutation.mutate({
      date: format(selectedDate, 'yyyy-MM-dd'),
      override_type: overrideType,
      reason: reason.trim(),
      is_applicable_to_all_classes: isAllClasses,
      is_applicable_to_all_teachers: isAllTeachers,
      classes: isAllClasses ? [] : selectedClasses,
    });
  };

  const toggleClassSelection = (classId: string) => {
    setSelectedClasses((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Add Exception</Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={modalStyles.body} showsVerticalScrollIndicator={false}>
            <View style={modalStyles.field}>
              <Text style={modalStyles.fieldLabel}>Date *</Text>
              <TouchableOpacity
                style={modalStyles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={18} color="#6b7280" />
                <Text style={[modalStyles.dateButtonText, !selectedDate && { color: '#9ca3af' }]}>
                  {selectedDate ? format(selectedDate, 'EEEE, dd MMMM yyyy') : 'Select date'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={modalStyles.field}>
              <Text style={modalStyles.fieldLabel}>Exception Type *</Text>
              <View style={modalStyles.typeSelector}>
                <TouchableOpacity
                  style={[
                    modalStyles.typeOption,
                    overrideType === 'FORCE_WORKING' && modalStyles.typeOptionSelectedWorking,
                  ]}
                  onPress={() => setOverrideType('FORCE_WORKING')}
                >
                  <Briefcase
                    size={18}
                    color={overrideType === 'FORCE_WORKING' ? '#0d9488' : '#9ca3af'}
                  />
                  <Text
                    style={[
                      modalStyles.typeOptionText,
                      overrideType === 'FORCE_WORKING' && modalStyles.typeOptionTextWorking,
                    ]}
                  >
                    Force Working Day
                  </Text>
                  {overrideType === 'FORCE_WORKING' && <Check size={16} color="#0d9488" />}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    modalStyles.typeOption,
                    overrideType === 'FORCE_HOLIDAY' && modalStyles.typeOptionSelectedHoliday,
                  ]}
                  onPress={() => setOverrideType('FORCE_HOLIDAY')}
                >
                  <PartyPopper
                    size={18}
                    color={overrideType === 'FORCE_HOLIDAY' ? '#dc2626' : '#9ca3af'}
                  />
                  <Text
                    style={[
                      modalStyles.typeOptionText,
                      overrideType === 'FORCE_HOLIDAY' && modalStyles.typeOptionTextHoliday,
                    ]}
                  >
                    Force Holiday
                  </Text>
                  {overrideType === 'FORCE_HOLIDAY' && <Check size={16} color="#dc2626" />}
                </TouchableOpacity>
              </View>
            </View>

            <View style={modalStyles.field}>
              <Text style={modalStyles.fieldLabel}>Reason *</Text>
              <TextInput
                style={modalStyles.textInput}
                placeholder="Enter reason for this exception"
                placeholderTextColor="#9ca3af"
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={modalStyles.field}>
              <View style={modalStyles.switchRow}>
                <Text style={modalStyles.fieldLabel}>Apply to All Classes</Text>
                <Switch
                  value={isAllClasses}
                  onValueChange={setIsAllClasses}
                  trackColor={{ false: '#e5e7eb', true: '#99f6e4' }}
                  thumbColor={isAllClasses ? '#0d9488' : '#9ca3af'}
                />
              </View>
              <Text style={modalStyles.switchHint}>
                {isAllClasses
                  ? 'This exception will apply to all classes in the organization.'
                  : 'Select specific classes this exception applies to.'}
              </Text>
            </View>

            <View style={modalStyles.field}>
              <View style={modalStyles.switchRow}>
                <Text style={modalStyles.fieldLabel}>Apply to All Teachers</Text>
                <Switch
                  value={isAllTeachers}
                  onValueChange={setIsAllTeachers}
                  trackColor={{ false: '#e5e7eb', true: '#99f6e4' }}
                  thumbColor={isAllTeachers ? '#0d9488' : '#9ca3af'}
                />
              </View>
              <Text style={modalStyles.switchHint}>
                {isAllTeachers
                  ? 'This exception will apply to all teachers/staff in the organization.'
                  : 'This exception will not apply to teachers/staff attendance.'}
              </Text>
            </View>

            {!isAllClasses && (
              <ClassSelectionGrid
                classes={classes}
                selectedClasses={selectedClasses}
                onToggle={toggleClassSelection}
              />
            )}
          </ScrollView>

          <View style={modalStyles.actions}>
            <TouchableOpacity style={modalStyles.cancelActionButton} onPress={handleClose}>
              <Text style={modalStyles.cancelActionText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                modalStyles.submitButton,
                overrideType === 'FORCE_WORKING'
                  ? modalStyles.submitButtonWorking
                  : modalStyles.submitButtonHoliday,
                createMutation.isPending && { opacity: 0.6 },
              ]}
              onPress={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Plus size={18} color="white" />
                  <Text style={modalStyles.submitButtonText}>Create Exception</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <DatePickerModal
        visible={showDatePicker}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onClose={() => setShowDatePicker(false)}
      />
    </Modal>
  );
}

function ExceptionCard({
  exception,
  onDelete,
  canManage = true,
}: {
  exception: CalendarException;
  onDelete: () => void;
  canManage?: boolean;
}) {
  const isForceWorking = exception.override_type === 'FORCE_WORKING';
  const formattedDate = format(parseISO(exception.date), 'EEEE, dd MMMM yyyy');

  return (
    <View
      style={[
        styles.exceptionCard,
        isForceWorking ? styles.forceWorkingCard : styles.forceHolidayCard,
      ]}
    >
      <View style={styles.exceptionCardHeader}>
        <View
          style={[
            styles.exceptionIcon,
            isForceWorking ? styles.forceWorkingIcon : styles.forceHolidayIcon,
          ]}
        >
          {isForceWorking ? (
            <Briefcase size={18} color="#0d9488" />
          ) : (
            <PartyPopper size={18} color="#dc2626" />
          )}
        </View>
        <View style={styles.exceptionInfo}>
          <Text style={styles.exceptionDate}>{formattedDate}</Text>
          <View
            style={[
              styles.exceptionTypeBadge,
              isForceWorking ? styles.forceWorkingBadge : styles.forceHolidayBadge,
            ]}
          >
            <Text
              style={[
                styles.exceptionTypeText,
                isForceWorking ? styles.forceWorkingText : styles.forceHolidayText,
              ]}
            >
              {isForceWorking ? 'Force Working Day' : 'Force Holiday'}
            </Text>
          </View>
        </View>
        {canManage && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Trash2 size={18} color="#dc2626" />
          </TouchableOpacity>
        )}
      </View>
      {!!exception.reason && (
        <View style={styles.exceptionReason}>
          <Text style={styles.exceptionReasonLabel}>Reason:</Text>
          <Text style={styles.exceptionReasonText}>{exception.reason}</Text>
        </View>
      )}
      <View style={styles.exceptionMeta}>
        <Text style={styles.exceptionMetaText}>
          {exception.is_applicable_to_all_classes
            ? 'Applies to all classes'
            : `${exception.classes?.length || 0} class(es)`}
        </Text>
        <Text style={styles.exceptionMetaText}>
          Created: {format(parseISO(exception.created_at), 'dd MMM yyyy')}
        </Text>
      </View>
    </View>
  );
}

export default function ExceptionalWorkScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CalendarException | null>(null);

  const { user } = useAuthStore();
  const canManage = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const {
    data: exceptions,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['calendar-exceptions'],
    queryFn: getCalendarExceptions,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCalendarException,
    onSuccess: () => {
      showToast({ type: 'success', title: 'Deleted', message: 'Exception deleted successfully' });
      setDeleteTarget(null);
      refetch();
    },
    onError: () => {
      showToast({ type: 'error', title: 'Error', message: 'Failed to delete exception' });
      setDeleteTarget(null);
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const forceWorkingDays = exceptions?.filter((e) => e.override_type === 'FORCE_WORKING') || [];
  const forceHolidays = exceptions?.filter((e) => e.override_type === 'FORCE_HOLIDAY') || [];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={adminGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color="white" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Exceptional Work Policy</Text>
              <Text style={styles.headerSubtitle}>
                {canManage ? 'Manage calendar exceptions' : 'View calendar exceptions'}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {!canManage && (
        <View style={styles.readOnlyBanner}>
          <Eye size={16} color="#7c3aed" />
          <Text style={styles.readOnlyText}>View only — Contact admin to modify exceptions</Text>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <AlertTriangle size={20} color={adminTheme.accent} />
          <Text style={styles.infoText}>
            Exceptions override the regular working day policy. Use Force Working to make a
            holiday/weekend a working day, or Force Holiday to make a working day a holiday.
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={adminTheme.accent} />
            <Text style={styles.loadingText}>Loading exceptions...</Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Briefcase size={18} color="#0d9488" />
                  <Text style={styles.sectionTitle}>Force Working Days</Text>
                </View>
                <View style={styles.sectionCount}>
                  <Text style={styles.sectionCountText}>{forceWorkingDays.length}</Text>
                </View>
              </View>
              {forceWorkingDays.length === 0 ? (
                <View style={styles.emptySection}>
                  <Text style={styles.emptySectionText}>No force working days</Text>
                </View>
              ) : (
                forceWorkingDays.map((exception) => (
                  <ExceptionCard
                    key={exception.public_id}
                    exception={exception}
                    onDelete={() => setDeleteTarget(exception)}
                    canManage={canManage}
                  />
                ))
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <PartyPopper size={18} color="#dc2626" />
                  <Text style={styles.sectionTitle}>Force Holidays</Text>
                </View>
                <View style={styles.sectionCount}>
                  <Text style={styles.sectionCountText}>{forceHolidays.length}</Text>
                </View>
              </View>
              {forceHolidays.length === 0 ? (
                <View style={styles.emptySection}>
                  <Text style={styles.emptySectionText}>No force holidays</Text>
                </View>
              ) : (
                forceHolidays.map((exception) => (
                  <ExceptionCard
                    key={exception.public_id}
                    exception={exception}
                    onDelete={() => setDeleteTarget(exception)}
                    canManage={canManage}
                  />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {canManage && (
        <FloatingActionButton
          onPress={() => setShowCreateModal(true)}
          icon={Plus}
          color={adminTheme.accent}
        />
      )}

      <CreateExceptionModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['calendar-exceptions'] })}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete Exception"
        message={
          deleteTarget
            ? `Are you sure you want to delete the exception for ${format(parseISO(deleteTarget.date), 'dd MMM yyyy')}?`
            : ''
        }
        confirmText="Delete"
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.public_id);
        }}
        onCancel={() => setDeleteTarget(null)}
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </View>
  );
}
