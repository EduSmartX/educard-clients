/**
 * Teachers List Screen
 * Mobile-first teacher management with search, add, edit, delete
 */

import {
  Colors,
  getRoleGradient,
  getRoleThemeColors,
  Teacher,
  getErrorMessage,
} from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Plus,
  ChevronLeft,
  Upload,
  UserCircle,
  Briefcase,
  AlertCircle,
  Mail,
  ChevronRight,
} from 'lucide-react-native';
import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  Alert,
  Dimensions,
  ActivityIndicator,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';

import { SearchBar } from '@/components/common';
import { EntityActions } from '@/components/common/EntityActions';
import {
  FilterModal,
  ActiveFilters,
  TEACHER_FILTER_FIELDS,
  getTeacherFilterLabels,
} from '@/components/filters';
import { getMediaUrl } from '@/constants/config';
import { useTeachers, useDeleteTeacher, useRestoreTeacher } from '@/features/teachers';
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm';
import { layoutStyles, headerStyles, stateStyles, listStyles } from '@/styles';

const { width } = Dimensions.get('window');
const adminTheme = getRoleThemeColors('admin');
const adminGradient = getRoleGradient('admin');

export default function TeachersScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const scrollOffsetRef = useRef(0);
  const isScrollingDownRef = useRef(false);
  const lastRefreshRef = useRef(0);
  const [filters, setFilters] = useState<{
    designation?: string;
    gender?: string;
    is_deleted?: boolean;
  }>({});

  // Only fetch when search is submitted (not on every keystroke)
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
  } = useTeachers({
    search: appliedSearch || undefined,
    ordering: 'user__first_name,user__last_name',
    ...filters,
  });

  // Delete mutation
  const deleteMutation = useDeleteTeacher();
  const confirmDelete = useDeleteConfirm({
    entityName: 'Teacher',
    deleteMutation,
    onSuccess: () => refetch(),
  });

  // Restore mutation for reactivating deleted teachers
  const restoreMutation = useRestoreTeacher();
  const handleReactivate = useCallback(
    (id: string, name: string) => {
      Alert.alert('Reactivate Teacher', `Are you sure you want to reactivate ${name}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reactivate',
          onPress: async () => {
            try {
              await restoreMutation.mutateAsync(id);
              refetch();
              Alert.alert('Success', `${name} reactivated successfully`);
            } catch (error) {
              Alert.alert('Error', getErrorMessage(error, 'Failed to reactivate teacher'));
            }
          },
        },
      ]);
    },
    [restoreMutation, refetch]
  );

  const isDeletedView = filters.is_deleted === true;

  const teachers = data?.teachers ?? [];
  const totalCount = data?.totalCount ?? 0;

  const onRefresh = useCallback(() => {
    const now = Date.now();
    // Cooldown: skip refresh if last one was less than 3 seconds ago
    if (now - lastRefreshRef.current < 3000) return;
    lastRefreshRef.current = now;
    refetch();
  }, [refetch]);

  // Submit search (called on blur or submit)
  const handleSearchSubmit = useCallback(() => {
    setAppliedSearch(searchQuery.trim());
  }, [searchQuery]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setAppliedSearch('');
  }, []);

  // Apply filters
  const handleApplyFilters = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    setShowFilters(false);
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilters({});
    setShowFilters(false);
  }, []);

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // Load more when scrolling to the end - only when scrolling DOWN
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isRefetching && isScrollingDownRef.current) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, isRefetching, fetchNextPage]);

  // Track scroll direction to prevent loadMore firing when scrolling up
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffset = e.nativeEvent.contentOffset.y;
    isScrollingDownRef.current = currentOffset > scrollOffsetRef.current;
    scrollOffsetRef.current = currentOffset;
  }, []);

  const handleView = (teacher: Teacher) => {
    router.push({
      pathname: '/(admin-screens)/teachers/[id]',
      params: { id: teacher.public_id, ...(isDeletedView ? { is_deleted: 'true' } : {}) },
    });
  };

  const handleEdit = (teacher: Teacher) => {
    router.push({
      pathname: '/(admin-screens)/teachers/edit',
      params: { id: teacher.public_id },
    });
  };

  const renderTeacherCard = ({ item, index }: { item: Teacher; index: number }) => (
    <Animated.View entering={FadeInRight.delay(Math.min(index, 10) * 50).duration(300)}>
      <TouchableOpacity style={styles.card} onPress={() => handleView(item)} activeOpacity={0.7}>
        {/* Top row — Avatar + Info */}
        <View style={styles.topRow}>
          <View style={styles.avatarSection}>
            {item.profile_photo_thumbnail ? (
              <Image
                source={{ uri: getMediaUrl(item.profile_photo_thumbnail) }}
                style={styles.avatar}
              />
            ) : (
              <LinearGradient colors={['#e0e7ff', '#c7d2fe']} style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {item.full_name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </Text>
              </LinearGradient>
            )}
            <View style={styles.statusIndicator} />
          </View>

          <View style={styles.infoSection}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {item.full_name}
              </Text>
              <View style={styles.idBadge}>
                <Text style={styles.idText}>{item.employee_id}</Text>
              </View>
            </View>

            {item.designation ? (
              <View style={styles.detailRow}>
                <Briefcase size={13} color="#6366f1" />
                <Text style={styles.designation}>{item.designation}</Text>
              </View>
            ) : null}

            {item.email ? (
              <View style={styles.detailRow}>
                <Mail size={13} color="#8b5cf6" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {item.email}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Bottom — Actions */}
        <EntityActions
          onView={() => handleView(item)}
          onEdit={isDeletedView ? undefined : () => handleEdit(item)}
          onDelete={
            isDeletedView
              ? undefined
              : () => confirmDelete(item.public_id, item.full_name || 'this teacher')
          }
          onReactivate={
            isDeletedView
              ? () => handleReactivate(item.public_id, item.full_name || 'this teacher')
              : undefined
          }
        />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={layoutStyles.container}>
      {/* Header */}
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <Animated.View entering={FadeIn.delay(100)} style={headerStyles.circle1} />
        <Animated.View entering={FadeIn.delay(200)} style={headerStyles.circle2} />

        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity
              style={headerStyles.backBtn}
              onPress={() => router.navigate('/(tabs)/(admin)/management')}
            >
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Teachers</Text>
              <Text style={headerStyles.subtitle}>{totalCount} total</Text>
            </View>
            <View style={headerStyles.actions}>
              <TouchableOpacity style={headerStyles.actionBtn}>
                <Upload size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={headerStyles.primaryBtn}
                onPress={() => router.push('/(admin-screens)/teachers/create')}
              >
                <Plus size={20} color={adminTheme.accent} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmit={handleSearchSubmit}
        onClear={handleClearSearch}
        placeholder="Search by name, ID, email..."
        onFilterPress={() => setShowFilters(true)}
        activeFilterCount={activeFilterCount}
      />

      {/* Active Filters Display */}
      <ActiveFilters
        filters={getTeacherFilterLabels(filters)}
        onRemove={(key) => setFilters((f) => ({ ...f, [key]: undefined }))}
        onClearAll={handleClearFilters}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        currentFilters={filters}
        onApply={handleApplyFilters}
        fields={TEACHER_FILTER_FIELDS}
        title="Filter Teachers"
      />

      {/* Teachers List */}
      {isLoading ? (
        <View style={stateStyles.loading}>
          <ActivityIndicator size="large" color={adminTheme.accent} />
          <Text style={stateStyles.loadingText}>Loading teachers...</Text>
        </View>
      ) : isError ? (
        <View style={stateStyles.error}>
          <AlertCircle size={48} color={Colors.error[400]} />
          <Text style={stateStyles.errorText}>Failed to load teachers</Text>
          <Text style={stateStyles.errorSubtext}>{error?.message || 'Please try again'}</Text>
          <TouchableOpacity style={stateStyles.retryBtn} onPress={() => refetch()}>
            <Text style={stateStyles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={teachers}
          renderItem={renderTeacherCard}
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
            isFetchingNextPage ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={adminTheme.accent} />
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={stateStyles.empty}>
              <UserCircle size={48} color={Colors.gray[300]} />
              <Text style={stateStyles.emptyText}>No teachers found</Text>
              <Text style={stateStyles.emptySubtext}>
                {searchQuery ? 'Try adjusting your search' : 'Add your first teacher'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// Screen-specific styles only (reusable styles imported from @/styles)
const styles = StyleSheet.create({
  // Teacher Card - Modern design
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    flexDirection: 'column',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Avatar section
  avatarSection: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366f1',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#ffffff',
  },

  // Info section
  infoSection: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  idBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  idText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366f1',
  },

  // Detail rows
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  designation: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
  },
  detailText: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },

  // Subjects
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  subjectChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subjectText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  moreChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  moreText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },

  // Infinite scroll loading indicator
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 13,
    color: Colors.gray[500],
  },
});
