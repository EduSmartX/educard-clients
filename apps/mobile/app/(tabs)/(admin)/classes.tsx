/**
 * Classes List Screen
 * Mobile-first class management with search and real API integration
 * 
 * Permission Model:
 * - Admin: Full CRUD access (Add, Edit, Delete buttons visible)
 * - Teacher: View-only access (No Add, Edit, Delete buttons)
 */

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
import { useRouter } from 'expo-router';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Plus, School, GraduationCap, BookOpen } from 'lucide-react-native';
import { Colors, getRoleThemeColors, Class, useDebounce, getErrorMessage } from '@educard/shared';
import { useClasses, useDeleteClass, useRestoreClass } from '@/features/classes';
import { SearchBar, ListHeader } from '@/components/common';
import { LoadingState, ErrorState, EmptyState, ListFooter } from '@/components/common/ListStates';
import { EntityActions } from '@/components/common/EntityActions';
import {
  FilterModal,
  ActiveFilters,
  CLASS_FILTER_FIELDS,
  getClassFilterLabels,
} from '@/components/filters';
import { layoutStyles, listStyles } from '@/styles';
import { useListScroll } from '@/hooks/useListScroll';
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm';
import { useAuthStore } from '@/lib/auth-store';
import { isAdminRole } from '@/utils/role-utils';

const adminTheme = getRoleThemeColors('admin');

export default function ClassesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Check if current user is admin (has full CRUD access)
  const canManage = useMemo(() => isAdminRole(user?.role), [user?.role]);

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
  const confirmDelete = useDeleteConfirm({ entityName: 'Class', deleteMutation, onSuccess: () => refetch() });

  const restoreMutation = useRestoreClass();
  const handleReactivate = useCallback(
    (id: string, name: string) => {
      Alert.alert('Reactivate Class', `Are you sure you want to reactivate ${name}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reactivate',
          onPress: async () => {
            try {
              await restoreMutation.mutateAsync(id);
              refetch();
              Alert.alert('Success', `${name} reactivated successfully`);
            } catch (error) {
              Alert.alert('Error', getErrorMessage(error, 'Failed to reactivate class'));
            }
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
    fetchNextPage,
    refetch,
  });

  const handleView = useCallback(
    (classItem: Class) => {
      router.push({
        pathname: '/(admin-screens)/classes/[id]' as any,
        params: { id: classItem.public_id, ...(isDeletedView ? { is_deleted: 'true' } : {}) },
      });
    },
    [router, isDeletedView]
  );

  const handleEdit = useCallback(
    (classItem: Class) => {
      router.push({
        pathname: '/(admin-screens)/classes/edit' as any,
        params: { id: classItem.public_id },
      });
    },
    [router]
  );

  // Helper to get class display name (Master Class - Section)
  const getClassDisplayName = (classItem: Class): string => {
    const masterName = classItem.class_master?.name || classItem.name;
    const sectionName = classItem.name || classItem.section || '';
    // If master name equals section name, just show one
    if (masterName === sectionName) {
      return masterName;
    }
    return `${masterName} - ${sectionName}`;
  };

  // Navigate to students filtered by class
  const handleViewStudents = (classItem: Class) => {
    router.push({
      pathname: '/(tabs)/(admin)/students',
      params: { class_id: classItem.public_id, class_name: getClassDisplayName(classItem) },
    });
  };

  // Navigate to subjects filtered by class
  const handleViewSubjects = (classItem: Class) => {
    router.push({
      pathname: '/(tabs)/(admin)/subjects',
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
        {/* Top Row - Class Info */}
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

        {/* Middle Row - Quick Stats */}
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

        {/* Bottom — Actions (Edit/Delete only for admin) */}
        <EntityActions
          onView={() => handleView(item)}
          onEdit={isDeletedView || !canManage ? undefined : () => handleEdit(item)}
          onDelete={isDeletedView || !canManage ? undefined : () => confirmDelete(item.public_id, getClassDisplayName(item))}
          onReactivate={isDeletedView && canManage ? () => handleReactivate(item.public_id, getClassDisplayName(item)) : undefined}
          canManage={canManage}
        />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={layoutStyles.container}>
      {/* Header */}
      <ListHeader
        title="Classes"
        subtitle={`${totalCount} total`}
        role="admin"
        onBack={() => router.navigate('/(tabs)/(admin)/management' as any)}
        actions={canManage ? [
          {
            icon: Plus,
            onPress: () => router.push('/(admin-screens)/classes/create' as any),
            variant: 'primary',
          },
        ] : []}
      />

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by name, section..."
        onFilterPress={() => setShowFilters(true)}
        activeFilterCount={Object.values(filters).filter(Boolean).length}
      />

      {/* Active Filters */}
      <ActiveFilters
        filters={getClassFilterLabels(filters)}
        onRemove={(key) => setFilters((f) => ({ ...f, [key]: undefined }))}
        onClearAll={() => setFilters({})}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        currentFilters={filters}
        onApply={(f: Record<string, any>) => {
          setFilters(f);
          setShowFilters(false);
        }}
        fields={CLASS_FILTER_FIELDS}
        title="Filter Classes"
      />

      {/* Classes List */}
      {isLoading ? (
        <LoadingState color={adminTheme.accent} message="Loading classes..." />
      ) : isError ? (
        <ErrorState
          message="Failed to load classes"
          detail={error?.message}
          onRetry={() => refetch()}
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

// Screen-specific styles only
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
