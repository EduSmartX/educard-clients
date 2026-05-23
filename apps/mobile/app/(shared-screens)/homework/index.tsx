/**
 * Homework List Screen (Board View)
 * Date-based, class-wise homework board matching web app
 *
 * Features:
 * - Class selection (shows classes where teacher is class teacher or subject teacher)
 * - Date navigation (previous/next working day)
 * - Subject-wise homework cards with color coding
 * - Add homework button per subject
 * - View submissions for existing homework
 *
 * Permissions:
 * - Admin: Can see all homework (view-only)
 * - Class Teacher: Can see/create homework for any subject in their class
 * - Subject Teacher: Can create homework for subjects they teach
 */

import {
  Colors,
  getRoleGradient,
  HOMEWORK_STATUS,
  getStatusLabel,
  getSubjectColor,
} from '@educard/shared';
import type { Homework, HomeworkStatus } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  BookOpen,
  Calendar,
  Clock,
  Users,
  FileText,
  CheckCircle,
  Eye,
  ChevronDown,
  X,
  Pencil,
  Trash2,
} from 'lucide-react-native';
import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useNavigateWorkingDay } from '@/features/calendar';
import { useTeacherClasses, useHomeworkList, useDeleteHomework } from '@/features/homework';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

function formatDateYYYYMMDD(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface SubjectHomework {
  subject: {
    public_id: string;
    subject_name: string;
    is_teacher?: boolean;
    teacher_name?: string;
  };
  homework: Homework | null;
  color: ReturnType<typeof getSubjectColor>;
}

export default function HomeworkListScreen() {
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Start with today
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [showClassPicker, setShowClassPicker] = useState(false);

  const {
    data: teacherClasses = [],
    isLoading: classesLoading,
    error: classesError,
  } = useTeacherClasses();

  // Auto-select first class
  useEffect(() => {
    if (teacherClasses.length > 0 && !selectedClassId) {
      setSelectedClassId(teacherClasses[0].public_id);
    }
  }, [teacherClasses, selectedClassId]);

  const selectedClass = useMemo(
    () => teacherClasses.find((c) => c.public_id === selectedClassId),
    [teacherClasses, selectedClassId]
  );

  const queryParams = useMemo(() => {
    if (!selectedClass) return undefined;
    return {
      class_public_id: selectedClass.public_id,
      assigned_date: formatDateYYYYMMDD(selectedDate),
    };
  }, [selectedClass, selectedDate]);

  const { data: homeworkList = [], isLoading, refetch } = useHomeworkList(queryParams);

  // Build subject-homework mapping
  const subjectsWithHomework: SubjectHomework[] = useMemo(() => {
    if (!selectedClass?.subjects) return [];

    return selectedClass.subjects.map((subject) => {
      const homework =
        homeworkList.find((hw) => hw.subject_public_id === subject.public_id) || null;
      const color = getSubjectColor(subject.subject_name);
      return { subject, homework, color };
    });
  }, [selectedClass?.subjects, homeworkList]);

  // Stats for current view
  const viewStats = useMemo(() => {
    const total = subjectsWithHomework.length;
    const assigned = subjectsWithHomework.filter((s) => s.homework).length;
    const published = subjectsWithHomework.filter(
      (s) => s.homework?.status === HOMEWORK_STATUS.PUBLISHED
    ).length;
    return { total, assigned, published, pending: total - assigned };
  }, [subjectsWithHomework]);

  // Working day navigation mutation
  const { mutateAsync: navigateWorkingDay, isPending: isNavigating } = useNavigateWorkingDay();

  // Check if we can navigate to next day (max 1 week from today)
  const canNavigateNext = useMemo(() => {
    const oneWeekFromToday = new Date();
    oneWeekFromToday.setDate(oneWeekFromToday.getDate() + 7);
    return selectedDate < oneWeekFromToday;
  }, [selectedDate]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const handlePrevDay = useCallback(async () => {
    try {
      const result = await navigateWorkingDay({
        date: formatDateYYYYMMDD(selectedDate),
        direction: 'previous',
        class_id: selectedClassId || undefined,
      });
      setSelectedDate(new Date(result.date));
    } catch {
      // Don't fallback to simple day change - stay on current date
      // to avoid landing on holidays/non-working days
    }
  }, [selectedDate, selectedClassId, navigateWorkingDay]);

  const handleNextDay = useCallback(async () => {
    if (!canNavigateNext) return;

    try {
      const result = await navigateWorkingDay({
        date: formatDateYYYYMMDD(selectedDate),
        direction: 'next',
        class_id: selectedClassId || undefined,
      });
      const resultDate = new Date(result.date);
      const oneWeekFromToday = new Date();
      oneWeekFromToday.setDate(oneWeekFromToday.getDate() + 7);
      if (resultDate <= oneWeekFromToday) setSelectedDate(resultDate);
    } catch {
      // Stay on current date to avoid landing on holidays/non-working days
    }
  }, [selectedDate, selectedClassId, navigateWorkingDay, canNavigateNext]);

  const handleCreateHomework = (subjectId?: string) => {
    const today = new Date();
    const dateStr = formatDateYYYYMMDD(today);
    let url = `/(shared-screens)/homework/create?class=${selectedClassId}&date=${dateStr}`;
    if (subjectId) {
      url += `&subject=${subjectId}`;
    }
    router.push(url as Href);
  };

  const handleViewHomework = (homework: Homework) => {
    router.push(`/(shared-screens)/homework/${homework.public_id}` as Href);
  };

  const handleEditHomework = (homework: Homework) => {
    router.push(`/(shared-screens)/homework/edit?id=${homework.public_id}` as Href);
  };

  const deleteMutation = useDeleteHomework();
  const handleDeleteHomework = (homework: Homework) => {
    deleteMutation.mutate(homework.public_id);
  };

  const handleViewSubmissions = (homework: Homework) => {
    router.push(`/(shared-screens)/homework/submissions?homework_id=${homework.public_id}` as Href);
  };

  const canAddForSubject = (_subject: SubjectHomework['subject']) => {
    // Admin and teachers can add homework — backend validates actual permissions
    return true;
  };

  const isToday = formatDateYYYYMMDD(selectedDate) === formatDateYYYYMMDD(new Date());
  const isYesterday = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDateYYYYMMDD(selectedDate) === formatDateYYYYMMDD(yesterday);
  }, [selectedDate]);

  const renderSubjectCard = ({ item, index }: { item: SubjectHomework; index: number }) => {
    const { subject, homework, color } = item;
    const canAdd = canAddForSubject(subject);

    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
        <View style={[styles.subjectCard, { borderLeftColor: color.hex }]}>
          {/* Subject Header */}
          <View style={styles.subjectHeader}>
            <View style={[styles.subjectIcon, { backgroundColor: color.bg }]}>
              <BookOpen size={16} color={color.hex} />
            </View>
            <View style={styles.subjectInfo}>
              <Text style={[styles.subjectName, { color: color.hex }]}>{subject.subject_name}</Text>
              {!!subject.teacher_name && (
                <Text style={styles.teacherName}>{subject.teacher_name}</Text>
              )}
            </View>
            {!!subject.is_teacher && (
              <View style={[styles.teacherBadge, { backgroundColor: color.bg }]}>
                <Text style={[styles.teacherBadgeText, { color: color.hex }]}>You</Text>
              </View>
            )}
          </View>

          {homework ? (
            /* Homework exists */
            <View style={styles.homeworkContent}>
              <Text style={styles.homeworkTitle} numberOfLines={2}>
                {homework.title}
              </Text>

              <View style={styles.homeworkMeta}>
                <View style={styles.metaItem}>
                  <Clock size={12} color={Colors.gray[400]} />
                  <Text style={styles.metaText}>
                    Due:{' '}
                    {new Date(homework.due_datetime).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusBgColor(homework.status) },
                  ]}
                >
                  <Text style={[styles.statusText, { color: getStatusTextColor(homework.status) }]}>
                    {getStatusLabel(homework.status)}
                  </Text>
                </View>
              </View>

              {/* Submission Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Users size={14} color={Colors.gray[400]} />
                  <Text style={styles.statText}>{homework.submission_stats.total_students}</Text>
                </View>
                <View style={styles.statItem}>
                  <FileText size={14} color="#3b82f6" />
                  <Text style={[styles.statText, { color: '#3b82f6' }]}>
                    {homework.submission_stats.submitted}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <CheckCircle size={14} color="#10b981" />
                  <Text style={[styles.statText, { color: '#10b981' }]}>
                    {homework.submission_stats.reviewed}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleViewHomework(homework)}
                >
                  <Eye size={14} color={Colors.primary[500]} />
                  <Text style={styles.actionBtnText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleEditHomework(homework)}
                >
                  <Pencil size={14} color="#f59e0b" />
                  <Text style={[styles.actionBtnText, { color: '#f59e0b' }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleDeleteHomework(homework)}
                >
                  <Trash2 size={14} color="#ef4444" />
                  <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.actionBtn, styles.submissionsBtn, { marginTop: 8 }]}
                onPress={() => handleViewSubmissions(homework)}
              >
                <FileText size={14} color="#fff" />
                <Text style={[styles.actionBtnText, { color: '#fff' }]}>
                  Submissions ({homework.submission_stats.submitted})
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* No homework yet */
            <View style={styles.noHomeworkContent}>
              <Text style={styles.noHomeworkText}>No homework assigned</Text>
              {canAdd && (
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: color.hex }]}
                  onPress={() => handleCreateHomework(subject.public_id)}
                >
                  <Plus size={16} color="#fff" />
                  <Text style={styles.addBtnText}>Add Homework</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

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
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Homework</Text>
              <Text style={headerStyles.subtitle}>{selectedClass?.name || 'Select a class'}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Class Selection Dropdown */}
      <View style={styles.classSelector}>
        {classesLoading ? (
          <View style={styles.classLoadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary[500]} />
            <Text style={styles.classLoadingText}>Loading classes...</Text>
          </View>
        ) : classesError ? (
          <View style={styles.noClassesContainer}>
            <Text style={styles.noClassesText}>
              Error: {(classesError as Error)?.message || 'Failed to load classes'}
            </Text>
          </View>
        ) : teacherClasses.length === 0 ? (
          <View style={styles.noClassesContainer}>
            <Text style={styles.noClassesText}>No classes assigned. Please contact admin.</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.classDropdown} onPress={() => setShowClassPicker(true)}>
            <View style={styles.classDropdownContent}>
              <Text style={styles.classDropdownLabel}>Class</Text>
              <View style={styles.classDropdownValue}>
                <Text style={styles.classDropdownText}>
                  {selectedClass?.name || 'Select a class'}
                </Text>
                {selectedClass?.is_class_teacher && (
                  <View style={styles.ctBadge}>
                    <Text style={styles.ctBadgeText}>CT</Text>
                  </View>
                )}
              </View>
            </View>
            <ChevronDown size={20} color={Colors.gray[500]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Class Picker Modal */}
      <Modal
        visible={showClassPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowClassPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowClassPicker(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Class</Text>
              <TouchableOpacity onPress={() => setShowClassPicker(false)}>
                <X size={24} color={Colors.gray[500]} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {teacherClasses.map((cls) => (
                <TouchableOpacity
                  key={cls.public_id}
                  style={[
                    styles.modalItem,
                    selectedClassId === cls.public_id && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedClassId(cls.public_id);
                    setShowClassPicker(false);
                  }}
                >
                  <View style={styles.modalItemContent}>
                    <Text
                      style={[
                        styles.modalItemText,
                        selectedClassId === cls.public_id && styles.modalItemTextSelected,
                      ]}
                    >
                      {cls.name}
                    </Text>
                    {!!cls.is_class_teacher && (
                      <View style={[styles.ctBadge, { marginLeft: 8 }]}>
                        <Text style={styles.ctBadgeText}>Class Teacher</Text>
                      </View>
                    )}
                  </View>
                  {selectedClassId === cls.public_id && (
                    <CheckCircle size={20} color={Colors.primary[500]} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Date Navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity
          style={[styles.dateNavBtn, isNavigating && styles.dateNavBtnDisabled]}
          onPress={() => void handlePrevDay()}
          disabled={isNavigating}
        >
          {isNavigating ? (
            <ActivityIndicator size="small" color={Colors.gray[400]} />
          ) : (
            <ChevronLeft size={20} color={Colors.gray[600]} />
          )}
        </TouchableOpacity>
        <View style={styles.dateDisplay}>
          <Calendar size={16} color={Colors.primary[500]} />
          <Text style={styles.dateText}>{formatDateDisplay(selectedDate)}</Text>
          {isYesterday && (
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeText}>Yesterday</Text>
            </View>
          )}
          {isToday && (
            <View style={[styles.dateBadge, { backgroundColor: Colors.primary[500] }]}>
              <Text style={[styles.dateBadgeText, { color: '#fff' }]}>Today</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.dateNavBtn,
            (isNavigating || !canNavigateNext) && styles.dateNavBtnDisabled,
          ]}
          onPress={() => void handleNextDay()}
          disabled={isNavigating || !canNavigateNext}
        >
          {isNavigating ? (
            <ActivityIndicator size="small" color={Colors.gray[400]} />
          ) : (
            <ChevronRight size={20} color={canNavigateNext ? Colors.gray[600] : Colors.gray[300]} />
          )}
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      {selectedClass && (
        <View style={styles.statsBar}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{viewStats.total}</Text>
            <Text style={styles.statLabel}>Subjects</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{viewStats.assigned}</Text>
            <Text style={styles.statLabel}>Assigned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#3b82f6' }]}>{viewStats.published}</Text>
            <Text style={styles.statLabel}>Published</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{viewStats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      )}

      {/* Subject Cards List */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={subjectsWithHomework}
          keyExtractor={(item) => item.subject.public_id}
          renderItem={renderSubjectCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <BookOpen size={48} color={Colors.gray[300]} />
              <Text style={styles.emptyText}>
                {selectedClass
                  ? 'No subjects found for this class'
                  : 'Select a class to view homework'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function getStatusBgColor(status: HomeworkStatus): string {
  switch (status) {
    case HOMEWORK_STATUS.PUBLISHED:
      return '#dcfce7';
    case HOMEWORK_STATUS.DRAFT:
      return '#fef3c7';
    case HOMEWORK_STATUS.ARCHIVED:
      return '#f3f4f6';
    default:
      return '#f3f4f6';
  }
}

function getStatusTextColor(status: HomeworkStatus): string {
  switch (status) {
    case HOMEWORK_STATUS.PUBLISHED:
      return '#166534';
    case HOMEWORK_STATUS.DRAFT:
      return '#92400e';
    case HOMEWORK_STATUS.ARCHIVED:
      return '#374151';
    default:
      return '#374151';
  }
}

const styles = StyleSheet.create({
  classSelector: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  classLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  classLoadingText: {
    fontSize: 14,
    color: Colors.gray[500],
  },
  noClassesContainer: {
    paddingVertical: 12,
  },
  noClassesText: {
    fontSize: 14,
    color: Colors.gray[500],
    textAlign: 'center',
  },
  // Dropdown styles
  classDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.gray[50],
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  classDropdownContent: {
    flex: 1,
  },
  classDropdownLabel: {
    fontSize: 12,
    color: Colors.gray[500],
    marginBottom: 2,
  },
  classDropdownValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classDropdownText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gray[800],
  },
  modalList: {
    paddingVertical: 8,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[50],
  },
  modalItemSelected: {
    backgroundColor: Colors.primary[50],
  },
  modalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalItemText: {
    fontSize: 16,
    color: Colors.gray[700],
  },
  modalItemTextSelected: {
    fontWeight: '600',
    color: Colors.primary[600],
  },
  // Legacy chip styles (kept for reference)
  classChipList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  classChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    marginRight: 8,
  },
  classChipSelected: {
    backgroundColor: Colors.primary[500],
  },
  classChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  classChipTextSelected: {
    color: '#fff',
  },
  ctBadge: {
    marginLeft: 6,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ctBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78350f',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  dateNavBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.gray[100],
  },
  dateNavBtnDisabled: {
    opacity: 0.5,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  dateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: Colors.gray[200],
  },
  dateBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.gray[800],
  },
  statLabel: {
    fontSize: 11,
    color: Colors.gray[500],
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  subjectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectInfo: {
    flex: 1,
    marginLeft: 10,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
  },
  teacherName: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 1,
  },
  teacherBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  teacherBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  homeworkContent: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  homeworkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[800],
    marginBottom: 8,
  },
  homeworkMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary[50],
  },
  submissionsBtn: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: Colors.primary[500],
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary[500],
  },
  noHomeworkContent: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    alignItems: 'center',
  },
  noHomeworkText: {
    fontSize: 13,
    color: Colors.gray[400],
    marginBottom: 10,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray[400],
    marginTop: 12,
    textAlign: 'center',
  },
});
