/**
 * SubjectList - Reusable Subject List Component
 *
 * Permission Model:
 * - Admin: Full CRUD access
 * - Teacher (Class Teacher): Full CRUD for subjects in their assigned classes
 * - Teacher (Other): View-only access
 */

import {
  Colors,
  getRoleThemeColors,
  useDebounce,
  Subject,
} from '@educard/shared';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BookOpen, Plus, Upload } from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import {
  SearchBar,
  ListHeader,
  BulkUploadModal,
  EntityActions,
  ConfirmDialog,
  LoadingState,
  ErrorState,
  EmptyState,
  ListFooter,
} from '@/components/common';
import {
  FilterModal,
  ActiveFilters,
  SUBJECT_FILTER_FIELDS,
  getSubjectFilterLabels,
} from '@/components/filters';
import { useClasses } from '@/features/classes';
import {
  useSubjects,
  useDeleteSubject,
  useRestoreSubject,
} from '@/features/subjects';
import { useActionConfirm, useDeleteConfirm, useListScroll } from '@/hooks';
import { useScreenFilters } from '@/hooks/useScreenFilters';
import { useAuthStore } from '@/lib/auth-store';
import type { SharedStackNavigation } from '@/navigation/types';
import { layoutStyles, cardStyles, listStyles, textStyles } from '@/styles';
import { isAdminRole, isTeacherRole } from '@/utils/role-utils';

import {
  downloadSubjectTemplate,
  bulkUploadSubjects,
} from '../api/subjects-api';

const adminTheme = getRoleThemeColors('admin');

export interface SubjectListProps {
  /** Custom back navigation handler. If not provided, uses navigation.goBack() */
  onBack?: () => void;
}

export function SubjectList({ onBack }: SubjectListProps) {
  const navigation = useNavigation<SharedStackNavigation>();
  const route = useRoute();
  const { user } = useAuthStore();
  const { class_id, class_name } = (route.params ?? {}) as {
    class_id?: string;
    class_name?: string;
  };
  const {
    filters,
    search: searchQuery,
    setSearch: setSearchQuery,
    setAllFilters: setFilters,
  } = useScreenFilters<Record<string, unknown>>('Subjects', {});
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const isAdmin = useMemo(() => isAdminRole(user?.role), [user?.role]);
  const isTeacher = useMemo(() => isTeacherRole(user?.role), [user?.role]);

  const { data: classesData } = useClasses({
    page_size: 100,
    for_subject_form: true,
  });
  const managedClasses = classesData?.classes ?? [];

  const isClassTeacher = isTeacher && managedClasses.length > 0;
  const canCreateSubjects = isAdmin || isClassTeacher;

  const subjectFilterFields = useMemo(() => {
    if (isAdmin || isClassTeacher) return SUBJECT_FILTER_FIELDS;
    return SUBJECT_FILTER_FIELDS.filter(f => f.name !== 'is_deleted');
  }, [isAdmin, isClassTeacher]);

  const debouncedSearch = useDebounce(searchQuery, 300);

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
  } = useSubjects({
    search: debouncedSearch ?? undefined,
    class_assigned: class_id ?? undefined,
    ...(filters as Record<string, string | boolean | undefined>),
  });

  const deleteMutation = useDeleteSubject();
  const { confirmDelete, dialogProps: deleteDialogProps } = useDeleteConfirm({
    entityName: 'Subject',
    deleteMutation,
    onSuccess: () => void refetch(),
  });

  const restoreMutation = useRestoreSubject();
  const {
    confirmAction: confirmReactivate,
    dialogProps: reactivateDialogProps,
  } = useActionConfirm({
    title: 'Reactivate Subject',
    confirmText: 'Reactivate',
    confirmVariant: 'success',
    makeMessage: name => `Are you sure you want to reactivate ${name}?`,
    runAction: (id: string) => restoreMutation.mutateAsync(id),
    errorMessage: 'Failed to reactivate subject',
    onSuccess: () => void refetch(),
  });

  const isDeletedView = !!filters.is_deleted;
  const subjects = data?.subjects ?? [];
  const totalCount = data?.totalCount ?? 0;
  const screenTitle = class_name ? `Subjects - ${class_name}` : 'Subjects';

  const { handleScroll, loadMore, onRefresh } = useListScroll({
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
    fetchNextPage: () => void fetchNextPage(),
    refetch: () => void refetch(),
  });

  const handleView = useCallback(
    (subject: Subject) => {
      navigation.navigate('SubjectDetail', {
        id: subject.public_id,
        is_deleted: isDeletedView ? 'true' : undefined,
      });
    },
    [navigation, isDeletedView],
  );

  const handleEdit = useCallback(
    (subject: Subject) => {
      navigation.navigate('SubjectEdit', { id: subject.public_id });
    },
    [navigation],
  );

  const renderSubjectCard = ({
    item,
    index,
  }: {
    item: Subject;
    index: number;
  }) => (
    <Animated.View entering={FadeInRight.delay(index * 50).duration(300)}>
      <TouchableOpacity
        style={[cardStyles.card, styles.subjectCard]}
        onPress={() => handleView(item)}
        activeOpacity={0.7}
      >
        <View style={styles.topRow}>
          <View style={styles.iconContainer}>
            <BookOpen size={24} color={Colors.success[500]} />
          </View>

          <View style={styles.subjectInfo}>
            <Text style={textStyles.title} numberOfLines={1}>
              {item.subject_info?.name ?? item.name}
            </Text>

            {(item.subject_info?.code ?? item.code) && (
              <Text style={textStyles.subtitle}>
                Code: {item.subject_info?.code ?? item.code}
              </Text>
            )}

            {item.class_info && (
              <Text style={textStyles.caption}>
                Class:{' '}
                {item.class_info.class_master_name
                  ? `${item.class_info.class_master_name} - ${item.class_info.name}`
                  : item.class_info.name}
              </Text>
            )}

            {item.teacher_info?.full_name && (
              <Text style={textStyles.caption}>
                Teacher: {item.teacher_info.full_name}
              </Text>
            )}
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
                    item.public_id,
                    item.subject_info?.name ?? item.name ?? 'this subject',
                  )
          }
          onReactivate={
            isDeletedView
              ? () =>
                  confirmReactivate(
                    item.public_id,
                    item.subject_info?.name ?? item.name ?? 'this subject',
                  )
              : undefined
          }
          canManage={
            (item as Subject & { can_manage?: boolean }).can_manage ?? isAdmin
          }
        />
      </TouchableOpacity>
    </Animated.View>
  );

  // Info message for class teachers
  const bulkUploadInfoMessage = isTeacher
    ? 'As a Class Teacher, you can only upload subjects for classes you are assigned to.'
    : undefined;

  return (
    <View style={layoutStyles.container}>
      <ListHeader
        title={screenTitle}
        subtitle={`${totalCount} total`}
        role="admin"
        onBack={onBack}
        actions={
          canCreateSubjects
            ? [
                { icon: Upload, onPress: () => setShowBulkUpload(true) },
                {
                  icon: Plus,
                  onPress: () => navigation.navigate('SubjectCreate'),
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
        title="Bulk Upload Subjects"
        description="Upload multiple subjects at once using an Excel template"
        downloadTemplate={downloadSubjectTemplate}
        uploadFile={bulkUploadSubjects}
        customInfoMessage={bulkUploadInfoMessage}
        onUploadSuccess={() => void refetch()}
      />

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by name, code..."
        onFilterPress={() => setShowFilters(true)}
        activeFilterCount={Object.values(filters).filter(Boolean).length}
      />

      <ActiveFilters
        filters={getSubjectFilterLabels(filters)}
        onRemove={key => setFilters({ ...filters, [key]: undefined })}
        onClearAll={() => setFilters({})}
      />

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        currentFilters={filters}
        onApply={f => {
          setFilters(f);
          setShowFilters(false);
        }}
        fields={subjectFilterFields}
        title="Filter Subjects"
      />

      {isLoading && (
        <LoadingState color={adminTheme.accent} message="Loading subjects..." />
      )}
      {!isLoading && isError && (
        <ErrorState
          message="Failed to load subjects"
          detail={error?.message}
          onRetry={() => void refetch()}
        />
      )}
      {!isLoading && !isError && (
        <FlatList
          data={subjects}
          renderItem={renderSubjectCard}
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
              icon={<BookOpen size={48} color={Colors.gray[300]} />}
              message="No subjects found"
              subMessage={
                searchQuery
                  ? 'Try adjusting your search'
                  : 'Add your first subject'
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
  subjectCard: { flexDirection: 'column' },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.success[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  subjectInfo: { flex: 1 },
});
