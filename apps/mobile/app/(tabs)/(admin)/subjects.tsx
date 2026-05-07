/**
 * Subjects List Screen
 * Mobile-first subject management with search and real API integration
 * 
 * Permission Model:
 * - Admin: Full CRUD access
 * - Teacher (Class Teacher): Full CRUD for subjects in their assigned classes
 * - Teacher (Other): View-only access
 */

import { Colors, getRoleThemeColors, useDebounce, getErrorMessage, Subject } from '@educard/shared';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Plus, BookOpen } from 'lucide-react-native';
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
  SUBJECT_FILTER_FIELDS,
  getSubjectFilterLabels,
} from '@/components/filters';
import { useClasses } from '@/features/classes';
import { useSubjects, useDeleteSubject, useRestoreSubject } from '@/features/subjects';
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm';
import { useListScroll } from '@/hooks/useListScroll';
import { useAuthStore } from '@/lib/auth-store';
import { layoutStyles, cardStyles, listStyles, textStyles } from '@/styles';
import { isAdminRole, isTeacherRole } from '@/utils/role-utils';

const adminTheme = getRoleThemeColors('admin');

export default function SubjectsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { class_id, class_name } = useLocalSearchParams<{
    class_id?: string;
    class_name?: string;
  }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  // Check user role for permissions
  const isAdmin = useMemo(() => isAdminRole(user?.role), [user?.role]);
  const isTeacher = useMemo(() => isTeacherRole(user?.role), [user?.role]);

  // Fetch classes to check if teacher has managed classes
  const { data: classesData } = useClasses({ page_size: 100, for_subject_form: true });
  const managedClasses = classesData?.classes ?? [];
  
  // Teachers who manage at least one class can create subjects
  const isClassTeacher = isTeacher && managedClasses.length > 0;
  const canCreateSubjects = isAdmin || isClassTeacher;

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
  const confirmDelete = useDeleteConfirm({
    entityName: 'Subject',
    deleteMutation,
    onSuccess: () => {
      void refetch();
    },
  });

  const restoreMutation = useRestoreSubject();
  const handleReactivate = useCallback(
    (id: string, name: string) => {
      Alert.alert('Reactivate Subject', `Are you sure you want to reactivate ${name}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reactivate',
          onPress: () => {
            void (async () => {
              try {
                await restoreMutation.mutateAsync(id);
                void refetch();
                Alert.alert('Success', `${name} reactivated successfully`);
              } catch (err) {
                Alert.alert('Error', getErrorMessage(err, 'Failed to reactivate subject'));
              }
            })();
          },
        },
      ]);
    },
    [restoreMutation, refetch]
  );

  const isDeletedView = !!filters.is_deleted;

  const subjects = data?.subjects ?? [];
  const totalCount = data?.totalCount ?? 0;
  const screenTitle = class_name ? `Subjects - ${class_name}` : 'Subjects';

  const { handleScroll, loadMore, onRefresh } = useListScroll({
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
    fetchNextPage,
    refetch,
  });

  const handleView = useCallback(
    (subject: Subject) => {
      router.push({
        pathname: '/(admin-screens)/subjects/[id]',
        params: { id: subject.public_id, ...(isDeletedView ? { is_deleted: 'true' } : {}) },
      });
    },
    [router, isDeletedView]
  );

  const handleEdit = useCallback(
    (subject: Subject) => {
      router.push({
        pathname: '/(admin-screens)/subjects/edit',
        params: { id: subject.public_id },
      });
    },
    [router]
  );

  const renderSubjectCard = ({ item, index }: { item: Subject; index: number }) => (
    <Animated.View entering={FadeInRight.delay(index * 50).duration(300)}>
      <TouchableOpacity
        style={[cardStyles.card, styles.subjectCard]}
        onPress={() => handleView(item)}
        activeOpacity={0.7}
      >
        {/* Top row — Icon + Info */}
        <View style={styles.topRow}>
          <View style={styles.iconContainer}>
            <BookOpen size={24} color={Colors.success[500]} />
          </View>

          <View style={styles.subjectInfo}>
            <Text style={textStyles.title} numberOfLines={1}>
              {item.subject_info?.name ?? item.name}
            </Text>

            {(item.subject_info?.code ?? item.code) && (
              <Text style={textStyles.subtitle}>Code: {item.subject_info?.code ?? item.code}</Text>
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
              <Text style={textStyles.caption}>Teacher: {item.teacher_info.full_name}</Text>
            )}
          </View>
        </View>

        {/* Bottom — Actions (respect can_manage from backend for subjects) */}
        <EntityActions
          onView={() => handleView(item)}
          onEdit={isDeletedView ? undefined : () => handleEdit(item)}
          onDelete={
            isDeletedView
              ? undefined
              : () =>
                  confirmDelete(
                    item.public_id,
                    item.subject_info?.name ?? item.name ?? 'this subject'
                  )
          }
          onReactivate={
            isDeletedView
              ? () =>
                  handleReactivate(
                    item.public_id,
                    item.subject_info?.name ?? item.name ?? 'this subject'
                  )
              : undefined
          }
          canManage={(item as any).can_manage ?? isAdmin}
        />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={layoutStyles.container}>
      {/* Header */}
      <ListHeader
        title={screenTitle}
        subtitle={`${totalCount} total`}
        role="admin"
        onBack={() => router.navigate('/(tabs)/(admin)/management')}
        actions={canCreateSubjects ? [
          {
            icon: Plus,
            onPress: () => router.push('/(admin-screens)/subjects/create'),
            variant: 'primary' as const,
          },
        ] : []}
      />

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by name, code..."
        onFilterPress={() => setShowFilters(true)}
        activeFilterCount={Object.values(filters).filter(Boolean).length}
      />

      {/* Active Filters */}
      <ActiveFilters
        filters={getSubjectFilterLabels(filters)}
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
        fields={SUBJECT_FILTER_FIELDS}
        title="Filter Subjects"
      />

      {/* Subjects List */}
      {isLoading ? (
        <LoadingState color={adminTheme.accent} message="Loading subjects..." />
      ) : isError ? (
        <ErrorState
          message="Failed to load subjects"
          detail={error?.message}
          onRetry={() => refetch()}
        />
      ) : (
        <FlatList
          data={subjects}
          renderItem={renderSubjectCard}
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
              icon={<BookOpen size={48} color={Colors.gray[300]} />}
              message="No subjects found"
              subMessage={searchQuery ? 'Try adjusting your search' : 'Add your first subject'}
            />
          }
        />
      )}
    </View>
  );
}

// Screen-specific styles only
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
