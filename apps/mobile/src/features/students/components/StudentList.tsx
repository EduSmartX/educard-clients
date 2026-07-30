/**
 * StudentList - Reusable Student List Component
 *
 * Permission Model:
 * - Admin: Full CRUD access
 * - Teacher (Class Teacher): Full CRUD for their assigned classes
 * - Teacher (Other): View-only access
 */

import {
  Colors,
  getRoleThemeColors,
  Student,
  useDebounce,
  API_CONFIG,
} from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import {
  GraduationCap,
  Upload,
  Plus,
  Download,
  KeyRound,
} from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import {
  SearchBar,
  ListHeader,
  BulkUploadModal,
  ConfirmDialog,
} from '@/components/common';
import { EntityActions } from '@/components/common/EntityActions';
import {
  LoadingState,
  ErrorState,
  EmptyState,
  ListFooter,
} from '@/components/common/ListStates';
import {
  FilterModal,
  ActiveFilters,
  useStudentFilterFields,
  getStudentFilterLabels,
} from '@/components/filters';
import { getMediaUrl } from '@/constants/config';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useActionConfirm, useDeleteConfirm } from '@/hooks';
import { useListScroll } from '@/hooks/useListScroll';
import { useScreenFilters } from '@/hooks/useScreenFilters';
import { useAuthStore } from '@/lib/auth-store';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';
import {
  layoutStyles,
  cardStyles,
  avatarStyles,
  listStyles,
  textStyles,
} from '@/styles';
import { isAdminRole, isTeacherRole } from '@/utils/role-utils';

import {
  downloadStudentTemplate,
  bulkUploadStudents,
} from '../api/students-api';
import {
  useStudents,
  useDeleteStudent,
  useRestoreStudent,
} from '../hooks/use-students';

import { ExportStudentsModal } from './ExportStudentsModal';
import { ResetPasswordsModal } from './ResetPasswordsModal';

const adminTheme = getRoleThemeColors('admin');

export interface StudentListProps {
  /** Custom back navigation handler. If not provided, uses navigation.goBack() */
  onBack?: () => void;
}

/** Get display name for a class, handling various data shapes */
function getClassDisplayName(
  classInfo:
    | {
        class_master_name?: string;
        class_master?: { name?: string };
        name?: string;
      }
    | null
    | undefined,
): string | null {
  if (!classInfo) return null;
  const masterName =
    classInfo.class_master_name || classInfo.class_master?.name;
  return masterName
    ? `${masterName} - ${classInfo.name}`
    : classInfo.name || null;
}

export function StudentList({ onBack }: StudentListProps) {
  const navigation = useNavigation<SharedStackNavigation>();
  const route = useRoute<RouteProp<SharedStackParamList, 'Students'>>();
  const { user } = useAuthStore();
  const { class_id, class_name } = route.params ?? {};
  const {
    filters,
    search: searchQuery,
    setSearch: setSearchQuery,
    setAllFilters: setFilters,
  } = useScreenFilters<Record<string, unknown>>('Students', {});
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showResetPasswords, setShowResetPasswords] = useState(false);

  const isAdmin = useMemo(() => isAdminRole(user?.role), [user?.role]);
  const isTeacher = useMemo(() => isTeacherRole(user?.role), [user?.role]);

  const debouncedSearch = useDebounce(searchQuery, 300);
  const allStudentFilterFields = useStudentFilterFields();
  const { data: classesData } = useClasses({
    page_size: API_CONFIG.DROPDOWN_PAGE_SIZE,
  });
  const managedClasses = useMemo(
    () => classesData?.classes ?? [],
    [classesData?.classes],
  );
  const isClassTeacher = isTeacher && managedClasses.length > 0;

  const studentFilterFields = useMemo(() => {
    if (isAdmin || isClassTeacher) {
      return allStudentFilterFields;
    }
    return allStudentFilterFields.filter(f => f.name !== 'is_deleted');
  }, [isAdmin, isClassTeacher, allStudentFilterFields]);

  const canCreateStudents = isAdmin || isClassTeacher;

  const classOptions = useMemo(() => {
    return managedClasses.map(c => ({
      value: c.public_id,
      label: `${c.class_master?.name ?? ''} - ${c.name}`.trim(),
    }));
  }, [managedClasses]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useStudents({
    search: debouncedSearch || undefined,
    class_id: (filters.class_id as string) ?? class_id ?? undefined,
    ...(filters as Record<string, string | boolean | undefined>),
  });

  const deleteMutation = useDeleteStudent();
  const { confirmDelete, dialogProps: deleteDialogProps } = useDeleteConfirm<{
    publicId: string;
    classId: string;
  }>({
    entityName: 'Student',
    deleteMutation,
    onSuccess: () => void refetch(),
  });

  const restoreMutation = useRestoreStudent();
  const {
    confirmAction: confirmReactivate,
    dialogProps: reactivateDialogProps,
  } = useActionConfirm<{
    publicId: string;
    classId: string | undefined;
  }>({
    title: 'Reactivate Student',
    confirmText: 'Reactivate',
    confirmVariant: 'success',
    makeMessage: name => `Are you sure you want to reactivate ${name}?`,
    runAction: ({ publicId, classId }) =>
      restoreMutation.mutateAsync({ publicId, classId }),
    errorMessage: 'Failed to reactivate student',
    onSuccess: () => void refetch(),
  });

  const isDeletedView = !!filters.is_deleted;
  const students = data?.students ?? [];
  const totalCount = data?.totalCount ?? 0;
  const screenTitle = class_name ? `Students - ${class_name}` : 'Students';

  const { handleScroll, loadMore, onRefresh } = useListScroll({
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
    fetchNextPage: () => void fetchNextPage(),
    refetch: () => void refetch(),
  });

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [onBack, navigation]);

  const handleView = useCallback(
    (s: Student) => {
      navigation.navigate('StudentDetail', {
        id: s.public_id,
        is_deleted: isDeletedView ? 'true' : undefined,
      });
    },
    [navigation, isDeletedView],
  );

  const handleEdit = useCallback(
    (s: Student) => {
      navigation.navigate('StudentEdit', { id: s.public_id });
    },
    [navigation],
  );

  const renderStudentCard = useCallback(
    ({ item, index }: { item: Student; index: number }) => {
      const userInfo = item.user_info;
      const fullName =
        item.full_name ??
        userInfo?.full_name ??
        `${userInfo?.first_name ?? ''} ${userInfo?.last_name ?? ''}`.trim();
      const rollNumber = item.roll_number;
      const admissionNumber = item.admission_number;
      const classInfo = item.class_info;
      const className = getClassDisplayName(classInfo);

      const initials = fullName
        ? fullName
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
        : '?';

      return (
        <Animated.View
          entering={FadeInRight.delay(Math.min(index, 10) * 50).duration(300)}
        >
          <TouchableOpacity
            style={[cardStyles.card, styles.studentCard]}
            onPress={() => handleView(item)}
            activeOpacity={0.7}
          >
            <View style={styles.topRow}>
              <View style={avatarStyles.container}>
                {item.profile_photo_thumbnail ? (
                  <Image
                    source={{ uri: getMediaUrl(item.profile_photo_thumbnail) }}
                    style={[avatarStyles.medium, styles.avatarGrad]}
                  />
                ) : (
                  <View style={[avatarStyles.medium, styles.avatarGrad]}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                )}
              </View>

              <View style={styles.studentInfo}>
                <Text style={textStyles.title} numberOfLines={1}>
                  {fullName || 'Unnamed Student'}
                </Text>
                {rollNumber ? (
                  <Text style={textStyles.subtitle}>Roll No: {rollNumber}</Text>
                ) : null}
                <View style={styles.metaRow}>
                  {className ? (
                    <View style={styles.classTag}>
                      <Text style={styles.classText}>🏫 {className}</Text>
                    </View>
                  ) : null}
                  {admissionNumber ? (
                    <Text style={styles.admText}>Adm: {admissionNumber}</Text>
                  ) : null}
                </View>
              </View>
            </View>

            <EntityActions
              onView={() => handleView(item)}
              onEdit={isDeletedView ? undefined : () => handleEdit(item)}
              onDelete={
                isDeletedView
                  ? undefined
                  : () =>
                      confirmDelete(
                        {
                          publicId: item.public_id,
                          classId: item.class_info?.public_id,
                        },
                        fullName || 'this student',
                      )
              }
              onReactivate={
                isDeletedView
                  ? () =>
                      confirmReactivate(
                        {
                          publicId: item.public_id,
                          classId: item.class_info?.public_id,
                        },
                        fullName ?? 'this student',
                      )
                  : undefined
              }
              canManage={
                (item as { can_manage?: boolean }).can_manage ?? isAdmin
              }
            />
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [
      handleView,
      handleEdit,
      confirmDelete,
      confirmReactivate,
      isDeletedView,
      isAdmin,
    ],
  );

  // Info message for class teachers
  const bulkUploadInfoMessage = isTeacherRole(user?.role)
    ? 'As a Class Teacher, you can only upload students to classes you are assigned to.'
    : undefined;

  return (
    <View style={layoutStyles.container}>
      <ListHeader
        title={screenTitle}
        subtitle={`${totalCount} total`}
        role="admin"
        onBack={handleBack}
        actions={
          canCreateStudents
            ? [
                { icon: Download, onPress: () => setShowExport(true) },
                { icon: KeyRound, onPress: () => setShowResetPasswords(true) },
                ...(canCreateStudents
                  ? [{ icon: Upload, onPress: () => setShowBulkUpload(true) }]
                  : []),
                {
                  icon: Plus,
                  onPress: () => navigation.navigate('StudentCreate'),
                  variant: 'primary' as const,
                },
              ]
            : []
        }
      />

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        visible={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        title="Bulk Upload Students"
        description="Upload multiple students at once using an Excel template"
        downloadTemplate={() => downloadStudentTemplate(false)}
        uploadFile={(uri, name) => bulkUploadStudents(uri, name, false)}
        customInfoMessage={bulkUploadInfoMessage}
        onUploadSuccess={() => void refetch()}
      />

      {/* Export Students Modal */}
      <ExportStudentsModal
        visible={showExport}
        onClose={() => setShowExport(false)}
      />

      {/* Reset Class Passwords Modal */}
      <ResetPasswordsModal
        visible={showResetPasswords}
        onClose={() => setShowResetPasswords(false)}
        classOptions={classOptions}
        onSuccess={() => void refetch()}
      />

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by name, admission no..."
        onFilterPress={() => setShowFilters(true)}
        activeFilterCount={Object.values(filters).filter(Boolean).length}
      />

      <ActiveFilters
        filters={getStudentFilterLabels(filters, classOptions)}
        onRemove={key => setFilters({ ...filters, [key]: undefined })}
        onClearAll={() => setFilters({})}
      />

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        currentFilters={filters}
        onApply={(f: Record<string, unknown>) => {
          setFilters(f);
          setShowFilters(false);
        }}
        fields={studentFilterFields}
        title="Filter Students"
      />

      {isLoading && (
        <LoadingState color={adminTheme.accent} message="Loading students..." />
      )}
      {!isLoading && isError && (
        <ErrorState
          message="Failed to load students"
          detail={error?.message}
          onRetry={() => void refetch()}
        />
      )}
      {!isLoading && !isError && (
        <FlatList
          data={students}
          renderItem={renderStudentCard}
          keyExtractor={item => item.public_id}
          contentContainerStyle={listStyles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={onRefresh}
              colors={[adminTheme.accent]}
              tintColor={adminTheme.accent}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ListFooterComponent={
            <ListFooter
              isLoading={isFetchingNextPage}
              color={adminTheme.accent}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<GraduationCap size={48} color={Colors.gray[300]} />}
              message="No students found"
              subMessage={
                searchQuery
                  ? 'Try adjusting your search'
                  : 'Add your first student'
              }
            />
          }
        />
      )}

      <ConfirmDialog {...deleteDialogProps} />
      <ConfirmDialog {...reactivateDialogProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  studentCard: { flexDirection: 'column' },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  studentInfo: { flex: 1, gap: 2 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  classTag: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  classText: { fontSize: 11, color: Colors.primary[600], fontWeight: '500' },
  admText: { fontSize: 11, color: Colors.gray[500], fontWeight: '500' },
  avatarGrad: {
    backgroundColor: Colors.accent[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: Colors.accent[500] },
});
