/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-misused-promises, @typescript-eslint/no-floating-promises, @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/no-unsafe-return */ /**
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
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  Switch,
} from 'react-native';

import { apiClient } from '@/api/client';
import { FAB, ConfirmDialog } from '@/components/common';
import { useClasses } from '@/features/classes';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/lib/toast-context';
import { isAdminRole } from '@/utils/role-utils';

const { width: screenWidth } = Dimensions.get('window');
const CALENDAR_CELL_SIZE = Math.floor((screenWidth - 80) / 7);

// Use admin theme for consistency
const adminGradient = getRoleGradient('admin');
const adminTheme = getRoleThemeColors('admin');

interface CalendarException {
  public_id: string;
  date: string;
  override_type: 'FORCE_WORKING' | 'FORCE_HOLIDAY';
  reason: string;
  is_applicable_to_all_classes: boolean;
  classes?: { public_id: string; display_name: string }[];
  created_at: string;
}

interface CalendarExceptionCreate {
  date: string;
  override_type: 'FORCE_WORKING' | 'FORCE_HOLIDAY';
  reason: string;
  is_applicable_to_all_classes: boolean;
  classes?: string[];
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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

  const handleSelectDate = (date: Date) => {
    onSelectDate(date);
    onClose();
  };

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
              <View key={`weekday-${i}`} style={modalStyles.weekdayCell}>
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
                  onPress={() => handleSelectDate(date)}
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
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // Fetch classes for selection
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
      const message = extractApiError(error, 'Failed to create exception');
      showToast({ type: 'error', title: 'Error', message });
    },
  });

  const resetForm = () => {
    setSelectedDate(null);
    setOverrideType('FORCE_WORKING');
    setReason('');
    setIsAllClasses(true);
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

            {!isAllClasses && (
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
                        onPress={() => toggleClassSelection(cls.public_id)}
                      >
                        <Text
                          style={[
                            modalStyles.classChipText,
                            selectedClasses.includes(cls.public_id) &&
                              modalStyles.classChipTextSelected,
                          ]}
                        >
                          {cls.display_name || cls.name}
                        </Text>
                        {selectedClasses.includes(cls.public_id) && (
                          <Check size={14} color="#0d9488" />
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>
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

      {exception.reason && (
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
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CalendarException | null>(null);

  // Role-based access check
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
      queryClient.invalidateQueries({ queryKey: ['calendar-exceptions'] });
      setDeleteTarget(null);
    },
    onError: () => {
      setDeleteTarget(null);
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (exception: CalendarException) => {
    setDeleteTarget(exception);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.public_id);
    }
  };

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['calendar-exceptions'] });
  };

  const forceWorkingDays = exceptions?.filter((e) => e.override_type === 'FORCE_WORKING') || [];
  const forceHolidays = exceptions?.filter((e) => e.override_type === 'FORCE_HOLIDAY') || [];

  return (
    <View style={styles.container}>
      {/* Header */}
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

      {/* Read-only banner for teachers */}
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
        {/* Info Card */}
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
            {/* Force Working Days Section */}
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
                    onDelete={() => handleDelete(exception)}
                    canManage={canManage}
                  />
                ))
              )}
            </View>

            {/* Force Holidays Section */}
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
                    onDelete={() => handleDelete(exception)}
                    canManage={canManage}
                  />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* FAB for adding new exception - Only for admin */}
      {canManage && (
        <FAB onPress={() => setShowCreateModal(true)} icon={Plus} color={adminTheme.accent} />
      )}

      {/* Create Exception Modal */}
      <CreateExceptionModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Delete Confirmation Dialog - Using reusable ConfirmDialog */}
      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete Exception"
        message={
          deleteTarget
            ? `Are you sure you want to delete the exception for ${format(parseISO(deleteTarget.date), 'dd MMM yyyy')}?`
            : ''
        }
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
  container: { flex: 1, backgroundColor: '#fff7ed' },
  header: { paddingTop: 48, paddingBottom: 20, paddingHorizontal: 16 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { padding: 4 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: '700' },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  // Read-only banner
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  readOnlyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7c3aed',
  },
  content: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#d1fae5', // emerald-100 (admin theme light)
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#6ee7b7', // emerald-300
  },
  infoText: { flex: 1, fontSize: 13, color: '#065f46', lineHeight: 18 }, // emerald-800
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { color: '#6b7280', marginTop: 12 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  sectionCount: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionCountText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  emptySection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptySectionText: { color: '#9ca3af', fontSize: 14 },
  exceptionCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  forceWorkingCard: { backgroundColor: '#f0fdfa', borderColor: '#99f6e4' },
  forceHolidayCard: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  exceptionCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  exceptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forceWorkingIcon: { backgroundColor: '#ccfbf1' },
  forceHolidayIcon: { backgroundColor: '#fee2e2' },
  exceptionInfo: { flex: 1 },
  exceptionDate: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  exceptionTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },
  forceWorkingBadge: { backgroundColor: '#ccfbf1' },
  forceHolidayBadge: { backgroundColor: '#fee2e2' },
  exceptionTypeText: { fontSize: 11, fontWeight: '600' },
  forceWorkingText: { color: '#0d9488' },
  forceHolidayText: { color: '#dc2626' },
  deleteButton: { padding: 8 },
  exceptionReason: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  exceptionReasonLabel: { fontSize: 11, fontWeight: '600', color: '#6b7280', marginBottom: 4 },
  exceptionReasonText: { fontSize: 13, color: '#374151' },
  exceptionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  exceptionMetaText: { fontSize: 11, color: '#9ca3af' },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  body: {
    padding: 20,
    maxHeight: 400,
  },
  field: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  typeSelector: {
    gap: 10,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    backgroundColor: '#f9fafb',
  },
  typeOptionSelectedWorking: {
    borderColor: '#0d9488',
    backgroundColor: '#f0fdfa',
  },
  typeOptionSelectedHoliday: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  typeOptionText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  typeOptionTextWorking: {
    color: '#0d9488',
    fontWeight: '600',
  },
  typeOptionTextHoliday: {
    color: '#dc2626',
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1f2937',
    minHeight: 80,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  switchHint: {
    fontSize: 12,
    color: '#9ca3af',
  },
  classesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  classChipSelected: {
    backgroundColor: '#f0fdfa',
    borderColor: '#0d9488',
  },
  classChipText: {
    fontSize: 13,
    color: '#6b7280',
  },
  classChipTextSelected: {
    color: '#0d9488',
    fontWeight: '500',
  },
  noClassesText: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  cancelActionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  submitButtonWorking: {
    backgroundColor: '#0d9488',
  },
  submitButtonHoliday: {
    backgroundColor: '#dc2626',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  // Date Picker Modal Styles
  datePickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthNavButton: {
    padding: 8,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    width: CALENDAR_CELL_SIZE,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: CALENDAR_CELL_SIZE,
    height: CALENDAR_CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CALENDAR_CELL_SIZE / 2,
  },
  selectedDayCell: {
    backgroundColor: '#10b981', // emerald-500 (admin accent)
  },
  todayCell: {
    borderWidth: 2,
    borderColor: '#10b981', // emerald-500
  },
  dayText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedDayText: {
    color: 'white',
    fontWeight: '600',
  },
  todayText: {
    color: '#10b981', // emerald-500
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
});
