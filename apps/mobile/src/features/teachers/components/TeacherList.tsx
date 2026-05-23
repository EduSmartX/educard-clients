/**
 * TeacherList - Reusable Teacher List Component
 *
 * Used by both Admin and Teacher roles with permission-based UI
 * - Admin: Full CRUD access (Add, Edit, Delete buttons visible)
 * - Teacher: View-only access (No Add, Edit, Delete buttons)
 */

import { Colors, getRoleGradient, getRoleThemeColors, Teacher } from '@educard/shared';
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
} from 'lucide-react-native';
import { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';

import { SearchBar, ConfirmDialog } from '@/components/common';
import { BulkUploadModal } from '@/components/common/BulkUploadModal';
import { EntityActions } from '@/components/common/EntityActions';
import {
  FilterModal,
  ActiveFilters,
  TEACHER_FILTER_FIELDS,
  getTeacherFilterLabels,
} from '@/components/filters';
import { getMediaUrl } from '@/constants/config';
import { useActionConfirm, useDeleteConfirm } from '@/hooks';
import { useAuthStore } from '@/lib/auth-store';
import { layoutStyles, headerStyles, stateStyles, listStyles } from '@/styles';
import { isAdminRole } from '@/utils/role-utils';

import { downloadTeacherTemplate, bulkUploadTeachers } from '../api/teachers-api';
import { useTeachers, useDeleteTeacher, useRestoreTeacher } from '../hooks/use-teachers';

const adminTheme = getRoleThemeColors('admin');
const adminGradient = getRoleGradient('admin');

export interface TeacherListProps {
  /** Custom back navigation handler. If not provided, uses router.back() */
  onBack?: () => void;
}

export function TeacherList({ onBack }: TeacherListProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const scrollOffsetRef = useRef(0);
  const isScrollingDownRef = useRef(false);
  const lastRefreshRef = useRef(0);
  const [filters, setFilters] = useState<{
    designation?: string;
    gender?: string;
    is_deleted?: boolean;
  }>({});

  // Check if current user is admin (has full CRUD access)
  const canManage = useMemo(() => isAdminRole(user?.role), [user?.role]);

  // Filter fields - only admins can see "Deleted" filter
  const filterFields = useMemo(() => {
    if (canManage) {
      return TEACHER_FILTER_FIELDS;
    }
    return TEACHER_FILTER_FIELDS.filter((f) => f.name !== 'is_deleted');
  }, [canManage]);

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

  const deleteMutation = useDeleteTeacher();
  const { confirmDelete, dialogProps: deleteDialogProps } = useDeleteConfirm({
    entityName: 'Teacher',
    deleteMutation,
    onSuccess: () => void refetch(),
  });

  const restoreMutation = useRestoreTeacher();
  const { confirmAction: confirmReactivate, dialogProps: reactivateDialogProps } = useActionConfirm(
    {
      title: 'Reactivate Teacher',
      confirmText: 'Reactivate',
      confirmVariant: 'success',
      makeMessage: (name) => `Are you sure you want to reactivate ${name}?`,
      runAction: (id: string) => restoreMutation.mutateAsync(id),
      errorMessage: 'Failed to reactivate teacher',
      onSuccess: () => void refetch(),
    }
  );

  const isDeletedView = filters.is_deleted === true;
  const teachers = data?.teachers ?? [];
  const totalCount = data?.totalCount ?? 0;

  const onRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshRef.current < 3000) return;
    lastRefreshRef.current = now;
    void refetch();
  }, [refetch]);

  const handleSearchSubmit = useCallback(() => {
    setAppliedSearch(searchQuery.trim());
  }, [searchQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setAppliedSearch('');
  }, []);

  const handleApplyFilters = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    setShowFilters(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setShowFilters(false);
  }, []);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isRefetching && isScrollingDownRef.current) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, isRefetching, fetchNextPage]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffset = e.nativeEvent.contentOffset.y;
    isScrollingDownRef.current = currentOffset > scrollOffsetRef.current;
    scrollOffsetRef.current = currentOffset;
  }, []);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  }, [onBack, router]);

  const handleView = (teacher: Teacher) => {
    router.push({
      pathname: '/(shared-screens)/teachers/[id]',
      params: { id: teacher.public_id, ...(isDeletedView ? { is_deleted: 'true' } : {}) },
    });
  };

  const handleEdit = (teacher: Teacher) => {
    router.push({
      pathname: '/(shared-screens)/teachers/edit',
      params: { id: teacher.public_id },
    });
  };

  const renderTeacherCard = ({ item, index }: { item: Teacher; index: number }) => (
    <Animated.View entering={FadeInRight.delay(Math.min(index, 10) * 50).duration(300)}>
      <TouchableOpacity style={styles.card} onPress={() => handleView(item)} activeOpacity={0.7}>
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

        <EntityActions
          onView={() => handleView(item)}
          onEdit={isDeletedView || !canManage ? undefined : () => handleEdit(item)}
          onDelete={
            isDeletedView || !canManage
              ? undefined
              : () => confirmDelete(item.public_id, item.full_name || 'this teacher')
          }
          onReactivate={
            isDeletedView && canManage
              ? () => confirmReactivate(item.public_id, item.full_name || 'this teacher')
              : undefined
          }
          canManage={canManage}
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
            <TouchableOpacity style={headerStyles.backBtn} onPress={handleBack}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Teachers</Text>
              <Text style={headerStyles.subtitle}>{totalCount} total</Text>
            </View>
            {canManage && (
              <View style={headerStyles.actions}>
                <TouchableOpacity
                  style={headerStyles.actionBtn}
                  onPress={() => setShowBulkUpload(true)}
                >
                  <Upload size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={headerStyles.primaryBtn}
                  onPress={() => router.push('/(shared-screens)/teachers/create')}
                >
                  <Plus size={20} color={adminTheme.accent} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        visible={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        title="Bulk Upload Teachers"
        description="Upload multiple teachers at once using an Excel template"
        downloadTemplate={downloadTeacherTemplate}
        uploadFile={bulkUploadTeachers}
        templateFileName="teachers_template.xlsx"
        onUploadSuccess={() => void refetch()}
      />

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
        fields={filterFields}
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
          <TouchableOpacity style={stateStyles.retryBtn} onPress={() => void refetch()}>
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

      <ConfirmDialog {...deleteDialogProps} />
      <ConfirmDialog {...reactivateDialogProps} />
    </View>
  );
}

const styles = StyleSheet.create({
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
