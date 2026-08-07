/**
 * Exam Dashboard
 * Per-subject edit permission: admin & class teachers can edit ALL subjects;
 * subject teachers can only edit subjects in `permissions.editable_subject_ids`
 * (others open in view-only mode). Enforced again by the backend.
 */

import { getRoleGradient } from '@educard/shared';
import {
  EXAM_STATUS,
  EXAM_STATUS_LABELS,
  EXAM_STATUS_COLORS,
  EXAM_STATUS_OPTIONS,
  type Exam,
  type ExamStatus,
} from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { ChevronLeft, Plus, Calendar, Clock } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { SearchableSelect } from '@/components/ui';
import { useClasses } from '@/features/classes';
import type { Class } from '@/features/classes/types';
import {
  useExams,
  useMarksOverview,
  useUpdateExam,
  useSendExamScheduleNotification,
  useSendExamResultsNotification,
  useSendExamProgressNotification,
} from '@/features/exams';
import { useAuthStore } from '@/lib/auth-store';
import { LinearGradient } from '@/lib/linear-gradient';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';
import { useToast } from '@/lib/toast-context';
import { headerStyles, layoutStyles } from '@/styles';

import { ExamNotificationActions } from './ExamNotificationActions';
import { styles } from './dashboard-styles';

const adminGradient = getRoleGradient('admin');

function formatExamDate(d: string | null): string {
  if (!d) return 'Date not set';
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatExamTime(t: string | null): string {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = Number.parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

interface StudentSummaryItem {
  student_public_id: string;
  student_name: string;
  admission_number: string;
  summary?: {
    is_pass: boolean | null;
    total_obtained: number;
    total_max: number;
    percentage: number;
  };
}

export default function ExamDashboardScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const route = useRoute<RouteProp<SharedStackParamList, 'ExamDashboard'>>();
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const userRole = user?.role;
  const { sessionId, sessionName } = route.params;
  const [refreshing, setRefreshing] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'exams' | 'students'>('exams');
  const [statusModalExam, setStatusModalExam] = useState<Exam | null>(null);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  // Fetch classes
  const { data: classesData } = useClasses({ page_size: 100 });
  const classes = classesData?.classes ?? [];
  const selectedClass = classes.find(
    (c: { public_id: string }) => c.public_id === selectedClassId,
  );

  const classOptions = classes.map((c: Class) => ({
    value: c.public_id,
    label: c.display_name ?? `${c.class_master?.name ?? ''} - ${c.name}`.trim(),
  }));

  // Get full class name (e.g., "Class 10 - A")
  const getFullClassName = (
    cls: { class_master?: { name: string } | null; name: string } | undefined,
  ) => {
    if (!cls) return '';
    return cls.class_master?.name
      ? `${cls.class_master.name} - ${cls.name}`
      : cls.name;
  };
  const fullClassName = getFullClassName(selectedClass);

  // Fetch exams for selected class
  const {
    data: examsData,
    isLoading: examsLoading,
    refetch: refetchExams,
  } = useExams({
    session: sessionId,
    class_id: selectedClassId,
    page_size: 100,
  });
  const exams: Exam[] = examsData?.data ?? [];
  const allExamsCompleted =
    exams.length > 0 && exams.every(e => e.status === EXAM_STATUS.COMPLETED);
  const allMarksPublished =
    allExamsCompleted &&
    exams
      .filter(e => e.status === EXAM_STATUS.COMPLETED)
      .every(e => e.is_marks_published);
  const hasDraftExams = exams.some(e => e.status === EXAM_STATUS.DRAFT);
  const hasExams = exams.length > 0;

  // Notification mutations
  const sendScheduleMutation = useSendExamScheduleNotification();
  const sendResultsMutation = useSendExamResultsNotification();
  const sendProgressMutation = useSendExamProgressNotification();

  // Fetch student marks overview
  const {
    data: marksData,
    isLoading: marksLoading,
    refetch: refetchMarks,
  } = useMarksOverview(sessionId, selectedClassId);
  const students = marksData?.students ?? [];
  const permissions = marksData?.permissions;

  // Whether current user can edit marks for a specific subject
  const canEditSubject = useCallback(
    (subjectPublicId: string): boolean => {
      const hasFullAccess =
        !permissions ||
        permissions.is_admin ||
        permissions.is_class_teacher ||
        permissions.editable_subject_ids === null;
      return (
        hasFullAccess ||
        (Array.isArray(permissions?.editable_subject_ids) &&
          permissions.editable_subject_ids.includes(subjectPublicId))
      );
    },
    [permissions],
  );

  const onRefresh = () => {
    setRefreshing(true);
    const refetchFn = activeTab === 'exams' ? refetchExams : refetchMarks;
    void refetchFn().finally(() => setRefreshing(false));
  };

  const updateExamMutation = useUpdateExam(userRole);

  const handleStatusChange = (exam: Exam, newStatus: ExamStatus) => {
    setStatusModalExam(null);
    updateExamMutation.mutate(
      { id: exam.public_id, data: { status: newStatus } },
      {
        onError: (err: unknown) => {
          const error = err as { message?: string };
          showToast({
            type: 'error',
            title: 'Error',
            message: error?.message || 'Failed to update status',
          });
        },
      },
    );
  };

  const isLoading = activeTab === 'exams' ? examsLoading : marksLoading;

  const renderExam = useCallback(
    ({ item, index }: { item: Exam; index: number }) => {
      const statusColor =
        EXAM_STATUS_COLORS[item.status] ?? EXAM_STATUS_COLORS.draft;
      const canEdit = canEditSubject(item.subject_public_id);
      const isCompleted = item.status === EXAM_STATUS.COMPLETED;
      const marksEnabled = isCompleted && canEdit;
      const showEnterMarks = marksEnabled || !isCompleted;
      const buttonText = showEnterMarks ? 'Enter Marks' : 'View Marks';
      const buttonStyle = marksEnabled
        ? styles.enterMarksBtn
        : styles.enterMarksBtnDisabled;
      const textStyle = marksEnabled
        ? styles.enterMarksText
        : styles.enterMarksTextDisabled;

      return (
        <Animated.View
          entering={FadeInDown.delay(index * 40)
            .springify()
            .damping(18)}
        >
          <View style={styles.examCard}>
            <View style={styles.examHeader}>
              <Text style={styles.examSubject}>{item.subject_name}</Text>
              <TouchableOpacity
                onPress={() => setStatusModalExam(item)}
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColor.bg },
                ]}
              >
                <Text style={[styles.statusText, { color: statusColor.text }]}>
                  {EXAM_STATUS_LABELS[item.status]} ▾
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.examMetaRow}>
              <Calendar size={13} color="#7c3aed" />
              <Text style={styles.examMetaText}>
                {formatExamDate(item.date)}
              </Text>
              {!!item.start_time && (
                <>
                  <Clock
                    size={13}
                    color="#7c3aed"
                    style={styles.examMetaClock}
                  />
                  <Text style={styles.examMetaText}>
                    {formatExamTime(item.start_time)}
                    {item.end_time ? ` – ${formatExamTime(item.end_time)}` : ''}
                  </Text>
                </>
              )}
            </View>
            <Text style={styles.examDetails}>
              Max: {item.max_marks} • Pass: {item.passing_marks} • Marks:{' '}
              {item.marks_count}
            </Text>
            <TouchableOpacity
              style={buttonStyle}
              disabled={!isCompleted}
              onPress={() =>
                navigation.navigate('ExamEnterMarks', {
                  examId: item.public_id,
                  sessionId,
                  classId: selectedClassId,
                  subjectName: encodeURIComponent(item.subject_name),
                  className: encodeURIComponent(fullClassName),
                  maxMarks: String(item.max_marks),
                  viewOnly: String(!canEdit),
                })
              }
            >
              <Text style={textStyle}>{buttonText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      );
    },
    [navigation, canEditSubject, sessionId, selectedClassId, fullClassName],
  );

  const renderStudent = useCallback(
    ({ item, index }: { item: StudentSummaryItem; index: number }) => {
      const passed = item.summary?.is_pass;
      const badgeBg = passed ? '#dcfce7' : '#fee2e2';
      const badgeColor = passed ? '#16a34a' : '#dc2626';
      return (
        <Animated.View
          entering={FadeInDown.delay(index * 40)
            .springify()
            .damping(18)}
        >
          <TouchableOpacity
            style={styles.studentCard}
            onPress={() =>
              navigation.navigate('ExamStudentDetail', {
                studentId: item.student_public_id,
                sessionId,
                classId: selectedClassId,
                studentName: encodeURIComponent(item.student_name),
              })
            }
          >
            <View style={styles.studentHeader}>
              <View style={styles.flex1}>
                <Text style={styles.studentName}>{item.student_name}</Text>
                <Text style={styles.studentAdm}>{item.admission_number}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                <Text style={[styles.statusText, { color: badgeColor }]}>
                  {passed ? 'PASS' : 'FAIL'}
                </Text>
              </View>
            </View>
            {!!item.summary && (
              <View style={styles.studentStats}>
                <Text style={styles.statItem}>
                  Total: {item.summary.total_obtained}/{item.summary.total_max}
                </Text>
                <Text style={styles.statItem}>
                  Avg: {item.summary.percentage.toFixed(1)}%
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [navigation, sessionId, selectedClassId],
  );

  return (
    <View style={layoutStyles.container}>
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
              <Text style={styles.sessionEyebrow}>Exam Dashboard</Text>
              <Text style={styles.sessionTitle} numberOfLines={2}>
                {decodeURIComponent(sessionName || '')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('ExamCreate', { sessionId })}
            >
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Class Picker */}
          <SearchableSelect
            title="Select Class"
            value={selectedClassId}
            onValueChange={setSelectedClassId}
            options={classOptions}
            placeholder="Select Class"
            searchPlaceholder="Search classes..."
            emptyText="No classes found"
          />
        </View>
      </LinearGradient>

      {!selectedClassId && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🎓</Text>
          <Text style={styles.emptyTitle}>Select a Class</Text>
          <Text style={styles.emptySubtitle}>
            Choose a class from the dropdown above
          </Text>
        </View>
      )}

      {!!selectedClassId && (
        <>
          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'exams' && styles.tabActive]}
              onPress={() => setActiveTab('exams')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'exams' && styles.tabTextActive,
                ]}
              >
                Exams ({exams.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'students' && styles.tabActive,
                !allExamsCompleted && styles.tabDisabled,
              ]}
              onPress={() => allExamsCompleted && setActiveTab('students')}
              disabled={!allExamsCompleted}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'students' && styles.tabTextActive,
                  !allExamsCompleted && styles.tabTextDisabled,
                ]}
              >
                Students ({students.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Notification Actions */}
          {hasExams && (
            <ExamNotificationActions
              hasDraftExams={hasDraftExams}
              allExamsCompleted={allExamsCompleted}
              allMarksPublished={allMarksPublished}
              sessionId={sessionId}
              classId={selectedClassId}
              sendScheduleMutation={sendScheduleMutation}
              sendResultsMutation={sendResultsMutation}
              sendProgressMutation={sendProgressMutation}
            />
          )}

          {/* Content */}
          {isLoading && !refreshing && (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#7c3aed" />
            </View>
          )}
          {!(isLoading && !refreshing) &&
            activeTab === 'exams' &&
            exams.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📝</Text>
                <Text style={styles.emptyTitle}>No Exams</Text>
                <Text style={styles.emptySubtitle}>
                  Create exams for this class
                </Text>
              </View>
            )}
          {!(isLoading && !refreshing) &&
            activeTab === 'exams' &&
            exams.length > 0 && (
              <FlatList
                data={exams}
                renderItem={renderExam}
                keyExtractor={item => item.public_id}
                contentContainerStyle={styles.list}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#7c3aed']}
                  />
                }
              />
            )}
          {!(isLoading && !refreshing) &&
            activeTab === 'students' &&
            students.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyTitle}>No Students</Text>
                <Text style={styles.emptySubtitle}>
                  No marks data available
                </Text>
              </View>
            )}
          {!(isLoading && !refreshing) &&
            activeTab === 'students' &&
            students.length > 0 && (
              <FlatList
                data={students}
                renderItem={renderStudent}
                keyExtractor={item => item.student_public_id}
                contentContainerStyle={styles.list}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#7c3aed']}
                  />
                }
              />
            )}
        </>
      )}

      {/* Status Change Modal */}
      <Modal
        visible={!!statusModalExam}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalExam(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStatusModalExam(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Status</Text>
            <Text style={styles.modalSubtitle}>
              {statusModalExam?.subject_name}
            </Text>
            {EXAM_STATUS_OPTIONS.map(option => {
              const colors = EXAM_STATUS_COLORS[option.value];
              const isActive = option.value === statusModalExam?.status;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.statusOption,
                    isActive && styles.statusOptionActive,
                  ]}
                  onPress={() =>
                    statusModalExam &&
                    handleStatusChange(statusModalExam, option.value)
                  }
                  disabled={isActive}
                >
                  <View
                    style={[styles.statusDot, { backgroundColor: colors.text }]}
                  />
                  <Text
                    style={[
                      styles.statusOptionText,
                      isActive && [
                        styles.statusOptionTextActive,
                        { color: colors.text },
                      ],
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isActive && <Text style={styles.currentLabel}>Current</Text>}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setStatusModalExam(null)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
