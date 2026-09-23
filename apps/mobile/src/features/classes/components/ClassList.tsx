/**
 * ClassList - Reusable Class List Component
 *
 * Permission Model:
 * - Admin: Full CRUD access (Add, Edit, Delete buttons visible)
 * - Teacher: View-only access (No Add, Edit, Delete buttons)
 */

import {
  Colors,
  getRoleThemeColors,
  Class,
  useDebounce,
} from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import {
  Plus,
  School,
  GraduationCap,
  BookOpen,
  Upload,
} from 'lucide-react-native';
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
  CLASS_FILTER_FIELDS,
  getClassFilterLabels,
} from '@/components/filters';
import { useActionConfirm, useDeleteConfirm, useListScroll } from '@/hooks';
import { useScreenFilters } from '@/hooks/useScreenFilters';
import { useAuthStore } from '@/lib/auth-store';
import type { SharedStackNavigation } from '@/navigation/types';
import { layoutStyles, listStyles } from '@/styles';
import { isAdminRole } from '@/utils/role-utils';

import { downloadClassTemplate, bulkUploadClasses } from '../api/classes-api';
import {
  useClasses,
  useDeleteClass,
  useRestoreClass,
} from '../hooks/use-classes';

const adminTheme = getRoleThemeColors('admin');

export interface ClassListProps {
  /** Custom back navigation handler. If not provided, uses navigation.goBack() */
  onBack?: () => void;
}

export function ClassList({ onBack }: ClassListProps) {
  const navigation = useNavigation<SharedStackNavigation>();
  const { user } = useAuthStore();
  const {
    filters,
    search: searchQuery,
    setSearch: setSearchQuery,
    setAllFilters: setFilters,
  } = useScreenFilters<Record<string, string | boolean | undefined>>(
    'Classes',
    {},
  );
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const canManage = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const filterFields = useMemo(() => {
    if (canManage) {
      return CLASS_FILTER_FIELDS;
    }
    return CLASS_FILTER_FIELDS.filter(f => f.name !== 'is_deleted');
  }, [canManage]);

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
  } = useClasses({ search: debouncedSearch || undefined, ...filters });

  const deleteMutation = useDeleteClass();
  const { confirmDelete, dialogProps: deleteDialogProps } = useDeleteConfirm({
    entityName: 'Class',
    deleteMutation,
    onSuccess: () => void refetch(),
  });

  const restoreMutation = useRestoreClass();
  const {
    confirmAction: confirmReactivate,
    dialogProps: reactivateDialogProps,
  } = useActionConfirm({
    title: 'Reactivate Class',
    confirmText: 'Reactivate',
    confirmVariant: 'success',
    makeMessage: name => `Are you sure you want to reactivate ${name}?`,
    runAction: (id: string) => restoreMutation.mutateAsync(id),
    errorMessage: 'Failed to reactivate class',
    onSuccess: () => void refetch(),
  });

  const isDeletedView = !!filters.is_deleted;
  const classes = data?.classes ?? [];
  const totalCount = data?.totalCount ?? 0;

  const { handleScroll, loadMore, onRefresh } = useListScroll({
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
    fetchNextPage: () => void fetchNextPage(),
    refetch: () => void refetch(),
  });

  const handleView = useCallback(
    (classItem: Class) => {
      navigation.navigate('ClassDetail', {
        id: classItem.public_id,
        is_deleted: isDeletedView ? 'true' : undefined,
      });
    },
    [navigation, isDeletedView],
  );

  const handleEdit = useCallback(
    (classItem: Class) => {
      navigation.navigate('ClassEdit', { id: classItem.public_id });
    },
    [navigation],
  );

  const getClassDisplayName = (classItem: Class): string => {
    const masterName = classItem.class_master?.name ?? classItem.name;
    const sectionName = classItem.name ?? classItem.section ?? '';
    if (masterName === sectionName) {
      return masterName;
    }
    return `${masterName} - ${sectionName}`;
  };

  const handleViewStudents = (classItem: Class) => {
    navigation.navigate('Students', {
      class_id: classItem.public_id,
      class_name: getClassDisplayName(classItem),
    });
  };

  const handleViewSubjects = (classItem: Class) => {
    navigation.navigate('Subjects', {
      class_id: classItem.public_id,
      class_name: getClassDisplayName(classItem),
    });
  };

  const renderClassCard = ({ item, index }: { item: Class; index: number }) => (
    <Animated.View entering={FadeInRight.delay(index * 50).duration(300)}>
      <TouchableOpacity
        style={styles.classCard}
        onPress={() => handleView(item)}
        activeOpacity={0.8}
      >
        <View style={styles.classHeader}>
          <View style={styles.iconContainer}>
            <School size={22} color="#3b82f6" />
          </View>
          <View style={styles.classInfo}>
            <Text style={styles.className} numberOfLines={1}>
              {getClassDisplayName(item)}
            </Text>
            {item.class_teacher && (
              <Text style={styles.teacherName} numberOfLines={1}>
                {item.class_teacher.full_name}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => handleViewStudents(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, styles.actionIconStudents]}>
              <GraduationCap size={16} color="#d97706" />
            </View>
            <Text style={styles.actionCount}>
              {item.student_count ?? item.students_count ?? 0}
            </Text>
            <Text style={styles.actionLabel}>Students</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => handleViewSubjects(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, styles.actionIconSubjects]}>
              <BookOpen size={16} color="#059669" />
            </View>
            <Text style={styles.actionCount}>{item.subjects_count ?? 0}</Text>
            <Text style={styles.actionLabel}>Subjects</Text>
          </TouchableOpacity>
        </View>

        <EntityActions
          onView={() => handleView(item)}
          onEdit={
            isDeletedView || !canManage ? undefined : () => handleEdit(item)
          }
          onDelete={
            isDeletedView || !canManage
              ? undefined
              : () => confirmDelete(item.public_id, getClassDisplayName(item))
          }
          onReactivate={
            isDeletedView && canManage
              ? () =>
                  confirmReactivate(item.public_id, getClassDisplayName(item))
              : undefined
          }
          canManage={canManage}
        />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={layoutStyles.container}>
      <ListHeader
        title="Classes"
        subtitle={`${totalCount} total`}
        role="admin"
        onBack={onBack}
        actions={
          canManage
            ? [
                {
                  icon: Upload,
                  onPress: () => setShowBulkUpload(true),
                },
                {
                  icon: Plus,
                  onPress: () => navigation.navigate('ClassCreate'),
                  variant: 'primary',
                },
              ]
            : []
        }
      />

      {/* Bulk Upload Modal - Admin only */}
      <BulkUploadModal
        visible={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        title="Bulk Upload Classes"
        description="Upload multiple classes at once using an Excel template"
        downloadTemplate={downloadClassTemplate}
        uploadFile={bulkUploadClasses}
        onUploadSuccess={() => void refetch()}
      />

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by name, section..."
        onFilterPress={() => setShowFilters(true)}
        activeFilterCount={Object.values(filters).filter(Boolean).length}
      />

      <ActiveFilters
        filters={getClassFilterLabels(filters)}
        onRemove={key => setFilters({ ...filters, [key]: undefined })}
        onClearAll={() => setFilters({})}
      />

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        currentFilters={filters}
        onApply={f => {
          setFilters(f as Record<string, string | boolean | undefined>);
          setShowFilters(false);
        }}
        fields={filterFields}
        title="Filter Classes"
      />

      {isLoading && (
        <LoadingState color={adminTheme.accent} message="Loading classes..." />
      )}
      {!isLoading && isError && (
        <ErrorState
          message="Failed to load classes"
          detail={error?.message}
          onRetry={() => void refetch()}
        />
      )}
      {!isLoading && !isError && (
        <FlatList
          data={classes}
          renderItem={renderClassCard}
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
              icon={<School size={48} color={Colors.gray[300]} />}
              message="No classes found"
              subMessage={
                searchQuery
                  ? 'Try adjusting your search'
                  : 'Add your first class'
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
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: 2,
  },
  teacherName: {
    fontSize: 13,
    color: Colors.gray[500],
  },
  quickActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    paddingTop: 12,
  },
  actionItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconStudents: { backgroundColor: '#fef3c7' },
  actionIconSubjects: { backgroundColor: '#d1fae5' },
  actionCount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray[800],
  },
  actionLabel: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  actionDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.gray[200],
  },
});
