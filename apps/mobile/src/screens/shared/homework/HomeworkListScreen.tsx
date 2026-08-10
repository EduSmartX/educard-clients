/**
 * Homework List Screen (Board View)
 * Date-based, class-wise homework board.
 */

import {
  Colors,
  getRoleGradient,
  getSubjectColor,
  HOMEWORK_STATUS,
} from '@educard/shared';
import type { Homework } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
  Bell,
} from 'lucide-react-native';
import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { SearchableSelect } from '@/components/ui';
import { useNavigateWorkingDay } from '@/features/calendar';
import {
  useTeacherClasses,
  useHomeworkList,
  useDeleteHomework,
  useSendHomeworkNotification,
} from '@/features/homework';
import { useScreenFilters } from '@/hooks/useScreenFilters';
import { useAuthStore } from '@/lib/auth-store';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackNavigation } from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';
import { isAdminRole } from '@/utils/role-utils';

import { SubjectHomeworkCard } from './SubjectHomeworkCard';
import { styles } from './homework-list-styles';
import {
  formatDateYYYYMMDD,
  formatDateDisplay,
  type SubjectHomework,
} from './homework-list-utils';

const adminGradient = getRoleGradient('admin');

export default function HomeworkListScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const { user } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Start with today
  const { filters, setFilter } = useScreenFilters<{ classId: string }>(
    'HomeworkList',
    {
      classId: '',
    },
  );
  const selectedClassId = filters.classId;
  const setSelectedClassId = useCallback(
    (id: string) => setFilter('classId', id),
    [setFilter],
  );

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  const {
    data: teacherClasses = [],
    isLoading: classesLoading,
    error: classesError,
  } = useTeacherClasses();

  // Auto-select first class only when none is selected yet (persisted across visits)
  useEffect(() => {
    if (teacherClasses.length > 0 && !selectedClassId) {
      setSelectedClassId(teacherClasses[0].public_id);
    }
  }, [teacherClasses, selectedClassId, setSelectedClassId]);

  const selectedClass = useMemo(
    () => teacherClasses.find(c => c.public_id === selectedClassId),
    [teacherClasses, selectedClassId],
  );

  const classOptions = useMemo(
    () =>
      teacherClasses.map(c => ({
        value: c.public_id,
        label: c.is_class_teacher ? `${c.name} • Class Teacher` : c.name,
      })),
    [teacherClasses],
  );

  const queryParams = useMemo(() => {
    if (!selectedClass) return undefined;
    return {
      class_public_id: selectedClass.public_id,
      assigned_date: formatDateYYYYMMDD(selectedDate),
    };
  }, [selectedClass, selectedDate]);

  const {
    data: homeworkList = [],
    isLoading,
    refetch,
  } = useHomeworkList(queryParams);

  // Build subject-homework mapping
  const subjectsWithHomework: SubjectHomework[] = useMemo(() => {
    if (!selectedClass?.subjects) return [];

    return selectedClass.subjects.map(subject => {
      const homework =
        homeworkList.find(hw => hw.subject_public_id === subject.public_id) ||
        null;
      const color = getSubjectColor(subject.subject_name);
      return { subject, homework, color };
    });
  }, [selectedClass?.subjects, homeworkList]);

  // Stats for current view
  const viewStats = useMemo(() => {
    const total = subjectsWithHomework.length;
    const assigned = subjectsWithHomework.filter(s => s.homework).length;
    const published = subjectsWithHomework.filter(
      s => s.homework?.status === HOMEWORK_STATUS.PUBLISHED,
    ).length;
    return { total, assigned, published, pending: total - assigned };
  }, [subjectsWithHomework]);

  const hasPublishedHomework = viewStats.published > 0;
  const canSendNotification = useMemo(() => {
    if (!selectedClass || !hasPublishedHomework) {
      return false;
    }
    return isAdminRole(user?.role) || !!selectedClass.is_class_teacher;
  }, [selectedClass, hasPublishedHomework, user?.role]);

  // Working day navigation mutation
  const { mutateAsync: navigateWorkingDay, isPending: isNavigating } =
    useNavigateWorkingDay();

  // Check if we can navigate to next day (max 1 week from today)
  const canNavigateNext = useMemo(() => {
    const oneWeekFromToday = new Date();
    oneWeekFromToday.setDate(oneWeekFromToday.getDate() + 7);
    return selectedDate < oneWeekFromToday;
  }, [selectedDate]);

  // Past dates are view-only: no create/add
  const isPastDate = useMemo(
    () => formatDateYYYYMMDD(selectedDate) < formatDateYYYYMMDD(new Date()),
    [selectedDate],
  );

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
      // Stay on current date to avoid landing on holidays/non-working days
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

  const handleCreateHomework = useCallback(
    (subjectId?: string) => {
      if (isPastDate) return;
      const dateStr = formatDateYYYYMMDD(new Date());
      navigation.navigate('HomeworkCreate', {
        class: selectedClassId,
        date: dateStr,
        subject: subjectId,
      });
    },
    [isPastDate, selectedClassId, navigation],
  );

  const handleViewHomework = useCallback(
    (homework: Homework) =>
      navigation.navigate('HomeworkDetail', { id: homework.public_id }),
    [navigation],
  );

  const handleEditHomework = useCallback(
    (homework: Homework) =>
      navigation.navigate('HomeworkEdit', { id: homework.public_id }),
    [navigation],
  );

  const deleteMutation = useDeleteHomework();
  const handleDeleteHomework = useCallback(
    (homework: Homework) => {
      deleteMutation.mutate(homework.public_id);
    },
    [deleteMutation],
  );

  const handleViewSubmissions = useCallback(
    (homework: Homework) =>
      navigation.navigate('HomeworkSubmissions', {
        homework_id: homework.public_id,
      }),
    [navigation],
  );

  const sendNotificationMutation = useSendHomeworkNotification();
  const handleSendNotification = useCallback(() => {
    if (!selectedClass || !canSendNotification) {
      return;
    }
    sendNotificationMutation.mutate({
      class_public_id: selectedClass.public_id,
      date: formatDateYYYYMMDD(selectedDate),
    });
  }, [
    selectedClass,
    canSendNotification,
    sendNotificationMutation,
    selectedDate,
  ]);

  const isToday =
    formatDateYYYYMMDD(selectedDate) === formatDateYYYYMMDD(new Date());
  const isYesterday = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDateYYYYMMDD(selectedDate) === formatDateYYYYMMDD(yesterday);
  }, [selectedDate]);

  const renderSubjectCard = useCallback(
    ({ item, index }: { item: SubjectHomework; index: number }) => (
      <SubjectHomeworkCard
        item={item}
        index={index}
        isPastDate={isPastDate}
        onView={handleViewHomework}
        onEdit={handleEditHomework}
        onDelete={handleDeleteHomework}
        onViewSubmissions={handleViewSubmissions}
        onCreate={handleCreateHomework}
      />
    ),
    [
      isPastDate,
      handleViewHomework,
      handleEditHomework,
      handleDeleteHomework,
      handleViewSubmissions,
      handleCreateHomework,
    ],
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
              <Text style={headerStyles.title}>Homework</Text>
              <Text style={headerStyles.subtitle}>
                {selectedClass?.name || 'Select a class'}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Class Selection Dropdown */}
      <View style={styles.classSelector}>
        {classesLoading && (
          <View style={styles.classLoadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary[500]} />
            <Text style={styles.classLoadingText}>Loading classes...</Text>
          </View>
        )}
        {!classesLoading && classesError && (
          <View style={styles.noClassesContainer}>
            <Text style={styles.noClassesText}>
              Error:{' '}
              {(classesError as Error)?.message || 'Failed to load classes'}
            </Text>
          </View>
        )}
        {!classesLoading && !classesError && teacherClasses.length === 0 && (
          <View style={styles.noClassesContainer}>
            <Text style={styles.noClassesText}>
              No classes assigned. Please contact admin.
            </Text>
          </View>
        )}
        {!classesLoading && !classesError && teacherClasses.length > 0 && (
          <SearchableSelect
            label="Class"
            value={selectedClassId}
            onValueChange={setSelectedClassId}
            options={classOptions}
            placeholder="Select a class"
            searchPlaceholder="Search classes..."
            emptyText="No classes found"
          />
        )}
      </View>

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
            <View
              style={[
                styles.dateBadge,
                { backgroundColor: Colors.primary[500] },
              ]}
            >
              <Text style={[styles.dateBadgeText, styles.dateBadgeTextWhite]}>
                Today
              </Text>
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
            <ChevronRight
              size={20}
              color={canNavigateNext ? Colors.gray[600] : Colors.gray[300]}
            />
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
            <Text style={[styles.statValue, styles.statValueGreen]}>
              {viewStats.assigned}
            </Text>
            <Text style={styles.statLabel}>Assigned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.statValueBlue]}>
              {viewStats.published}
            </Text>
            <Text style={styles.statLabel}>Published</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.statValueAmber]}>
              {viewStats.pending}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      )}

      {canSendNotification && (
        <View style={styles.notificationSection}>
          <View style={styles.notificationBanner}>
            <Bell size={16} color="#1d4ed8" />
            <Text style={styles.notificationBannerText}>
              Send a consolidated notification to parents and students for all
              published homework in this class.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.sendNotificationBtn,
              sendNotificationMutation.isPending &&
                styles.sendNotificationBtnDisabled,
            ]}
            onPress={handleSendNotification}
            disabled={sendNotificationMutation.isPending}
          >
            {sendNotificationMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Bell size={16} color="#fff" />
            )}
            <Text style={styles.sendNotificationBtnText}>
              {sendNotificationMutation.isPending
                ? 'Sending...'
                : 'Send Notification'}
            </Text>
          </TouchableOpacity>
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
          keyExtractor={item => item.subject.public_id}
          renderItem={renderSubjectCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
