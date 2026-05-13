/**
 * ClassList - Reusable Class List Component
 *
 * Permission Model:
 * - Admin: Full CRUD access (Add, Edit, Delete buttons visible)
 * - Teacher: View-only access (No Add, Edit, Delete buttons)
 */

import { Colors, getRoleThemeColors, Class, useDebounce, getErrorMessage } from '@educard/shared';
import { useRouter } from 'expo-router';
import { Plus, School, GraduationCap, BookOpen } from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { SearchBar, ListHeader } from '@/components/common';
import { EntityActions } from '@/components/common/EntityActions';
import { LoadingState, ErrorState, EmptyState, ListFooter } from '@/components/common/ListStates';
import {
  FilterModal,
  ActiveFilters,
  CLASS_FILTER_FIELDS,
  getClassFilterLabels,
} from '@/components/filters';
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm';
import { useListScroll } from '@/hooks/useListScroll';
import { useAuthStore } from '@/lib/auth-store';
import { layoutStyles, listStyles } from '@/styles';
import { isAdminRole } from '@/utils/role-utils';

import { useClasses, useDeleteClass, useRestoreClass } from '../hooks/use-classes';

const adminTheme = getRoleThemeColors('admin');

export interface ClassListProps {
  /** Custom back navigation handler. If not provided, uses router.back() */
  onBack?: () => void;
}

export function ClassList({ onBack }: ClassListProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, string | boolean | undefined>>({});

  const canManage = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const filterFields = useMemo(() => {
    if (canManage) {
      return CLASS_FILTER_FIELDS;
    }
    return CLASS_FILTER_FIELDS.filter((f) => f.name !== 'is_deleted');
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
  const confirmDelete = useDeleteConfirm({
    entityName: 'Class',
    deleteMutation,
    onSuccess: () => void refetch(),
  });

  const restoreMutation = useRestoreClass();
  const handleReactivate = useCallback(
    (id: string, name: string) => {
      Alert.alert('Reactivate Class', `Are you sure you want to reactivate ${name}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reactivate',
          onPress: () => {
            void restoreMutation
              .mutateAsync(id)
              .then(() => {
                void refetch();
                Alert.alert('Success', `${name} reactivated successfully`);
              })
              .catch((err: unknown) => {
                Alert.alert('Error', getErrorMessage(err, 'Failed to reactivate class'));
              });
          },
        },
      ]);
    },
    [restoreMutation, refetch]
  );

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

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  }, [onBack, router]);

  const handleView = useCallback(
    (classItem: Class) => {
      router.push({
        pathname: '/(shared-screens)/classes/[id]',
        params: { id: classItem.public_id, ...(isDeletedView ? { is_deleted: 'true' } : {}) },
      });
    },
    [router, isDeletedView]
  );

  const handleEdit = useCallback(
    (classItem: Class) => {
      router.push({
        pathname: '/(shared-screens)/classes/edit',
        params: { id: classItem.public_id },
      });
    },
    [router]
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
    router.push({
      pathname: '/(shared-screens)/students',
      params: { class_id: classItem.public_id, class_name: getClassDisplayName(classItem) },
    });
  };

  const handleViewSubjects = (classItem: Class) => {
    router.push({
      pathname: '/(shared-screens)/subjects',
      params: { class_id: classItem.public_id, class_name: getClassDisplayName(classItem) },
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
            <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
              <GraduationCap size={16} color="#d97706" />
            </View>
            <Text style={styles.actionCount}>{item.student_count ?? item.students_count ?? 0}</Text>
            <Text style={styles.actionLabel}>Students</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => handleViewSubjects(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#d1fae5' }]}>
              <BookOpen size={16} color="#059669" />
            </View>
            <Text style={styles.actionCount}>{item.subjects_count ?? 0}</Text>
            <Text style={styles.actionLabel}>Subjects</Text>
          </TouchableOpacity>
        </View>

        <EntityActions
          onView={() => handleView(item)}
          onEdit={isDeletedView || !canManage ? undefined : () => handleEdit(item)}
          onDelete={
            isDeletedView || !canManage
              ? undefined
              : () => confirmDelete(item.public_id, getClassDisplayName(item))
          }
          onReactivate={
            isDeletedView && canManage
              ? () => handleReactivate(item.public_id, getClassDisplayName(item))
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
        onBack={handleBack}
        actions={
          canManage
            ? [
                {
                  icon: Plus,
                  onPress: () => router.push('/(shared-screens)/classes/create'),
                  variant: 'primary',
                },
              ]
            : []
        }
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
        onRemove={(key) => setFilters((f) => ({ ...f, [key]: undefined }))}
        onClearAll={() => setFilters({})}
      />

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        currentFilters={filters}
        onApply={(f) => {
          setFilters(f as Record<string, string | boolean | undefined>);
          setShowFilters(false);
        }}
        fields={filterFields}
        title="Filter Classes"
      />

      {isLoading ? (
        <LoadingState color={adminTheme.accent} message="Loading classes..." />
      ) : isError ? (
        <ErrorState
          message="Failed to load classes"
          detail={error?.message}
          onRetry={() => void refetch()}
        />
      ) : (
        <FlatList
          data={classes}
          renderItem={renderClassCard}
          keyExtractor={(item) => item.public_id}
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
            <ListFooter isLoading={isFetchingNextPage} color={adminTheme.accent} />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<School size={48} color={Colors.gray[300]} />}
              message="No classes found"
              subMessage={searchQuery ? 'Try adjusting your search' : 'Add your first class'}
            />
          }
        />
      )}
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
