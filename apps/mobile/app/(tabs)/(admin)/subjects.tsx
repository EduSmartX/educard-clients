/**
 * Subjects List Screen
 * Mobile-first subject management with search and real API integration
 */

import { Colors, getRoleThemeColors, useDebounce, getErrorMessage } from '@educard/shared';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Plus, BookOpen } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';

import { SearchBar, ListHeader } from '@/components/common';
import { EntityActions } from '@/components/common/EntityActions';
import { LoadingState, ErrorState, EmptyState, ListFooter } from '@/components/common/ListStates';
import {
  FilterModal,
  ActiveFilters,
  SUBJECT_FILTER_FIELDS,
  getSubjectFilterLabels,
} from '@/components/filters';
import { FormDropdown } from '@/components/forms';
import { useClasses } from '@/features/classes';
import { useSubjects, useDeleteSubject, useRestoreSubject } from '@/features/subjects';
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm';
import { useListScroll } from '@/hooks/useListScroll';
import { layoutStyles, cardStyles, listStyles, textStyles } from '@/styles';

const adminTheme = getRoleThemeColors('admin');

export default function SubjectsScreen() {
  const router = useRouter();
  const { class_id, class_name } = useLocalSearchParams<{
    class_id?: string;
    class_name?: string;
  }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedClassId, setSelectedClassId] = useState<string>(class_id || '');

  const debouncedSearch = useDebounce(searchQuery, 300);

  const classesQuery = useClasses({ page_size: 100 });
  const classes = classesQuery.data?.classes || [];
  const classOptions = classes.map((c) => ({
    value: c.public_id,
    label: c.class_master?.name ? `${c.class_master.name} - ${c.name}` : c.display_name || c.name,
  }));

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
    search: debouncedSearch || undefined,
    class_assigned: selectedClassId || undefined,
    ...filters,
  });

  const deleteMutation = useDeleteSubject();
  const confirmDelete = useDeleteConfirm({
    entityName: 'Subject',
    deleteMutation,
    onSuccess: () => refetch(),
  });

  const restoreMutation = useRestoreSubject();
  const handleReactivate = useCallback(
    (id: string, name: string) => {
      Alert.alert('Reactivate Subject', `Are you sure you want to reactivate ${name}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reactivate',
          onPress: async () => {
            try {
              await restoreMutation.mutateAsync(id);
              refetch();
              Alert.alert('Success', `${name} reactivated successfully`);
            } catch (error) {
              Alert.alert('Error', getErrorMessage(error, 'Failed to reactivate subject'));
            }
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
    (subject: any) => {
      router.push({
        pathname: '/(admin-screens)/subjects/[id]',
        params: { id: subject.public_id, ...(isDeletedView ? { is_deleted: 'true' } : {}) },
      });
    },
    [router, isDeletedView]
  );

  const handleEdit = useCallback(
    (subject: any) => {
      router.push({
        pathname: '/(admin-screens)/subjects/edit',
        params: { id: subject.public_id },
      });
    },
    [router]
  );

  const renderSubjectCard = ({ item, index }: { item: any; index: number }) => (
    <View>
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
              {item.subject_info?.name || item.name}
            </Text>

            {(item.subject_info?.code || item.code) && (
              <Text style={textStyles.subtitle}>Code: {item.subject_info?.code || item.code}</Text>
            )}

            {item.class_info && (
              <Text style={textStyles.caption}>
                Class:{' '}
                {item.class_info.class_master?.name
                  ? `${item.class_info.class_master.name} - ${item.class_info.name}`
                  : item.class_info.class_master_name
                    ? `${item.class_info.class_master_name} - ${item.class_info.name}`
                    : item.class_info.name}
              </Text>
            )}

            {item.teacher_info?.full_name && (
              <Text style={textStyles.caption}>Teacher: {item.teacher_info.full_name}</Text>
            )}
          </View>
        </View>

        {/* Bottom — Actions */}
        <EntityActions
          onView={() => handleView(item)}
          onEdit={isDeletedView ? undefined : () => handleEdit(item)}
          onDelete={
            isDeletedView
              ? undefined
              : () =>
                  confirmDelete(
                    item.public_id,
                    item.subject_info?.name || item.name || 'this subject'
                  )
          }
          onReactivate={
            isDeletedView
              ? () =>
                  handleReactivate(
                    item.public_id,
                    item.subject_info?.name || item.name || 'this subject'
                  )
              : undefined
          }
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={layoutStyles.container}>
      {/* Header */}
      <ListHeader
        title={screenTitle}
        subtitle={`${totalCount} total`}
        role="admin"
        onBack={() => router.navigate('/(tabs)/(admin)/management')}
        actions={[
          {
            icon: Plus,
            onPress: () => router.push('/(admin-screens)/subjects/create'),
            variant: 'primary',
          },
        ]}
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

      {/* Class Filter Dropdown */}
      <View style={styles.classFilterSection}>
        <FormDropdown
          label="Filter by Class"
          placeholder="All Classes"
          searchable
          options={classOptions}
          value={selectedClassId}
          onChange={(val) => setSelectedClassId(val)}
        />
      </View>

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
  classFilterSection: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
});
