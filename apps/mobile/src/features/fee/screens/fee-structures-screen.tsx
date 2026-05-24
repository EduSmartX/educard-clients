/**
 * Fee Structures Screen
 * List, search, create, edit, delete fee structures
 */

import type { FeeStructure, FeeStructureFilters } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Plus,
  FileText,
  Users,
  Calendar,
  Trash2,
  ChevronRight,
} from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { ConfirmDialog } from '@/components/common';
import { ErrorState, EmptyState, LoadingState, ListFooter } from '@/components/common/ListStates';
import { SearchBar } from '@/components/common/SearchBar';
import {
  ActiveFilters,
  FilterModal,
  buildFeeStructureFilterFields,
  getFeeStructureFilterLabels,
  buildClassOptions,
} from '@/components/filters';
import { useClasses } from '@/features/classes';
import { useAndroidBack } from '@/hooks';

import { useFeeStructures, useDeleteFeeStructure } from '../hooks';

// ─── Card ─────────────────────────────────────────────────────────────────────

interface StructureCardProps {
  item: FeeStructure;
  onEdit: (id: string) => void;
  onDelete: (item: FeeStructure) => void;
  onViewDetail: (id: string) => void;
  onPress: (id: string) => void;
}

const StructureCard = React.memo(
  ({ item, onEdit, onDelete, onViewDetail, onPress }: StructureCardProps) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item.public_id)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardIconBox}>
          <FileText size={18} color="#059669" />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.cardYear}>{item.academic_year}</Text>
        </View>
        <View
          style={[styles.activeBadge, { backgroundColor: item.is_active ? '#dcfce7' : '#fee2e2' }]}
        >
          <View
            style={[styles.activeDot, { backgroundColor: item.is_active ? '#059669' : '#dc2626' }]}
          />
          <Text style={[styles.activeText, { color: item.is_active ? '#059669' : '#dc2626' }]}>
            {item.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Users size={13} color="#64748b" />
          <Text style={styles.metaText}>{item.student_count} students</Text>
        </View>
        <View style={styles.metaItem}>
          <Calendar size={13} color="#64748b" />
          <Text style={styles.metaText}>Due {item.due_date}</Text>
        </View>
        <View style={styles.metaItem}>
          <FileText size={13} color="#64748b" />
          <Text style={styles.metaText}>{item.component_count} components</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.classNames} numberOfLines={1}>
            {item.class_names?.join(', ') || 'No classes'}
          </Text>
        </View>
        <Text style={styles.totalAmount}>₹{Number(item.total_amount).toLocaleString('en-IN')}</Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#eff6ff' }]}
          onPress={() => onEdit(item.public_id)}
        >
          <FileText size={14} color="#3b82f6" />
          <Text style={[styles.actionText, { color: '#3b82f6' }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#fef2f2' }]}
          onPress={() => onDelete(item)}
        >
          <Trash2 size={14} color="#dc2626" />
          <Text style={[styles.actionText, { color: '#dc2626' }]}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#eff6ff' }]}
          onPress={() => onViewDetail(item.public_id)}
        >
          <Text style={[styles.actionText, { color: '#2563eb' }]}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#f0fdf4', marginLeft: 'auto' }]}
          onPress={() => onPress(item.public_id)}
        >
          <Text style={[styles.actionText, { color: '#059669' }]}>View fees</Text>
          <ChevronRight size={14} color="#059669" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
);
StructureCard.displayName = 'StructureCard';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FeeStructuresScreen() {
  const router = useRouter();
  useAndroidBack('/(tabs)/(admin)/fee-dashboard');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [deleteTarget, setDeleteTarget] = useState<FeeStructure | null>(null);

  const scrollY = useRef(0);

  const { data: classesData } = useClasses({ page_size: 200 });
  const classOptions = buildClassOptions(classesData?.classes ?? []);
  const filterFields = buildFeeStructureFilterFields(classOptions);

  let isActiveFilter: boolean | undefined;
  if (filters.is_active === 'true') isActiveFilter = true;
  else if (filters.is_active === 'false') isActiveFilter = false;

  const apiFilters: FeeStructureFilters = {
    class_public_id: (filters.class_public_id as string) || undefined,
    is_active: isActiveFilter,
  };

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isRefetching,
  } = useFeeStructures(apiFilters);

  const { mutate: deleteStructure, isPending: isDeleting } = useDeleteFeeStructure();

  const items = data?.items ?? [];
  const filtered = search
    ? items.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) || s.academic_year.includes(search)
      )
    : items;

  const handleEndReached = useCallback(() => {
    if (scrollY.current > 0 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
  }, []);

  const handleEdit = useCallback(
    (id: string) => {
      router.push({ pathname: '/(tabs)/(admin)/fee-structure-form', params: { id } });
    },
    [router]
  );

  const handleDelete = useCallback((item: FeeStructure) => {
    setDeleteTarget(item);
  }, []);

  const handlePress = useCallback(
    (id: string) => {
      router.push({
        pathname: '/(tabs)/(admin)/fee-student-fees',
        params: { fee_structure_public_id: id },
      });
    },
    [router]
  );

  const handleViewDetail = useCallback(
    (id: string) => {
      router.push({ pathname: '/(tabs)/(admin)/fee-structure-detail', params: { id } });
    },
    [router]
  );

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteStructure(deleteTarget.public_id, { onSuccess: () => setDeleteTarget(null) });
  }, [deleteStructure, deleteTarget]);

  if (isLoading) return <LoadingState color="#059669" message="Loading fee structures..." />;
  if (isError)
    return <ErrorState message="Failed to load fee structures" onRetry={() => void refetch()} />;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#059669', '#10b981']} style={styles.header}>
        <Animated.View entering={FadeIn.delay(100)} style={styles.circle1} />
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push('/(tabs)/(admin)/fee-dashboard')}
          >
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.headerTitle}>Fee Structures</Text>
            <Text style={styles.headerSub}>{data?.totalCount ?? 0} structures</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(tabs)/(admin)/fee-structure-form')}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Animated.View entering={FadeInDown.delay(100)} style={styles.searchBox}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or year..."
          onFilterPress={() => setShowFilters(true)}
          activeFilterCount={
            Object.values(filters).filter((v) => v !== '' && v !== undefined && v !== false).length
          }
        />
      </Animated.View>

      <ActiveFilters
        filters={getFeeStructureFilterLabels(filters, classOptions)}
        onRemove={(key) => setFilters((prev) => ({ ...prev, [key]: undefined }))}
        onClearAll={() => setFilters({})}
      />

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        fields={filterFields}
        currentFilters={filters}
        title="Filter Fee Structures"
        onApply={(nextFilters) => {
          setFilters(nextFilters);
          setShowFilters(false);
        }}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.public_id}
        renderItem={({ item }) => (
          <StructureCard
            item={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewDetail={handleViewDetail}
            onPress={handlePress}
          />
        )}
        contentContainerStyle={styles.list}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={() => void refetch()}
            tintColor="#059669"
          />
        }
        ListFooterComponent={<ListFooter isLoading={isFetchingNextPage} color="#059669" />}
        ListEmptyComponent={
          <EmptyState
            icon={<FileText size={48} color="#cbd5e1" />}
            message="No fee structures found"
            subMessage="Tap + to create one"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete Fee Structure"
        message={`Delete "${deleteTarget?.name}"? ${deleteTarget?.student_count ?? 0} student fee records will be deleted.`}
        confirmText="Delete"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16, overflow: 'hidden' },
  circle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -50,
    right: -30,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBox: { paddingHorizontal: 16, paddingVertical: 10 },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  cardYear: { fontSize: 12, color: '#64748b', marginTop: 1 },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeDot: { width: 7, height: 7, borderRadius: 3.5 },
  activeText: { fontSize: 11, fontWeight: '600' },
  cardMeta: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#64748b' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f1f5f9',
    marginBottom: 10,
  },
  classNames: { fontSize: 12, color: '#64748b', maxWidth: 200 },
  totalAmount: { fontSize: 16, fontWeight: '800', color: '#059669' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionText: { fontSize: 12, fontWeight: '600' },
});
