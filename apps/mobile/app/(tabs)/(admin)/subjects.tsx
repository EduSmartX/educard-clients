/**
 * Subjects List Screen
 * Mobile-first subject management with search and real API integration
 */

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
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Plus, BookOpen } from 'lucide-react-native';
import { Colors, getRoleThemeColors, useDebounce } from '@educard/shared';
import { useSubjects, useDeleteSubject } from '@/features/subjects';
import { SearchBar, ListHeader } from '@/components/common';
import { LoadingState, ErrorState, EmptyState, ListFooter } from '@/components/common/ListStates';
import { EntityActions } from '@/components/common/EntityActions';
import {
  FilterModal,
  ActiveFilters,
  SUBJECT_FILTER_FIELDS,
  getSubjectFilterLabels,
} from '@/components/filters';
import { layoutStyles, cardStyles, listStyles, textStyles } from '@/styles';
import { useListScroll } from '@/hooks/useListScroll';
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm';

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
    search: debouncedSearch || undefined,
    class_assigned: class_id || undefined,
    ...filters,
  });

  const deleteMutation = useDeleteSubject();
  const confirmDelete = useDeleteConfirm({ entityName: 'Subject', deleteMutation });

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
        pathname: '/(admin-screens)/subjects/[id]' as any,
        params: { id: subject.public_id },
      });
    },
    [router]
  );

  const handleEdit = useCallback(
    (subject: any) => {
      router.push({
        pathname: '/(admin-screens)/subjects/edit' as any,
        params: { id: subject.public_id },
      });
    },
    [router]
  );

  const renderSubjectCard = ({ item, index }: { item: any; index: number }) => (
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
          onEdit={() => handleEdit(item)}
          onDelete={() =>
            confirmDelete(item.public_id, item.subject_info?.name || item.name || 'this subject')
          }
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
        onBack={() => router.navigate('/(tabs)/(admin)/management' as any)}
        actions={[
          {
            icon: Plus,
            onPress: () => router.push('/(admin-screens)/subjects/create' as any),
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
