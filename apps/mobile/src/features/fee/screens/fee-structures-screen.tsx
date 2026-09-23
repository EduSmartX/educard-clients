/**
 * Fee Structures Screen
 * List, search, create, edit, delete fee structures
 */

import type { FeeStructure, FeeStructureFilters } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
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
import {
  ErrorState,
  EmptyState,
  LoadingState,
  ListFooter,
} from '@/components/common/ListStates';
import { SearchBar } from '@/components/common/SearchBar';
import {
  ActiveFilters,
  FilterModal,
  buildFeeStructureFilterFields,
  getFeeStructureFilterLabels,
  buildClassOptions,
} from '@/components/filters';
import { useClasses } from '@/features/classes';
import { useScreenFilters } from '@/hooks/useScreenFilters';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackNavigation } from '@/navigation/types';

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
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.cardYear}>{item.academic_year}</Text>
        </View>
        <View
          style={[
            styles.activeBadge,
            item.is_active ? styles.activeBadgeOn : styles.activeBadgeOff,
          ]}
        >
          <View
            style={[
              styles.activeDot,
              item.is_active ? styles.activeDotOn : styles.activeDotOff,
            ]}
          />
          <Text
            style={[
              styles.activeText,
              item.is_active ? styles.activeTextOn : styles.activeTextOff,
            ]}
          >
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
        <Text style={styles.totalAmount}>
          ₹{Number(item.total_amount).toLocaleString('en-IN')}
        </Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnBlue]}
          onPress={() => onEdit(item.public_id)}
        >
          <FileText size={14} color="#3b82f6" />
          <Text style={[styles.actionText, styles.actionTextEditBlue]}>
            Edit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnRed]}
          onPress={() => onDelete(item)}
        >
          <Trash2 size={14} color="#dc2626" />
          <Text style={[styles.actionText, styles.actionTextRed]}>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnBlue]}
          onPress={() => onViewDetail(item.public_id)}
        >
          <Text style={[styles.actionText, styles.actionTextViewBlue]}>
            View
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnGreenAuto]}
          onPress={() => onPress(item.public_id)}
        >
          <Text style={[styles.actionText, styles.actionTextGreen]}>
            View fees
          </Text>
          <ChevronRight size={14} color="#059669" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  ),
);
StructureCard.displayName = 'StructureCard';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FeeStructuresScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);
  const {
    filters,
    search,
    setSearch,
    setAllFilters: setFilters,
  } = useScreenFilters<Record<string, unknown>>('FeeStructures', {});
  const [showFilters, setShowFilters] = useState(false);
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

  const { mutate: deleteStructure, isPending: isDeleting } =
    useDeleteFeeStructure();

  const items = data?.items ?? [];
  const filtered = search
    ? items.filter(
        s =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.academic_year.includes(search),
      )
    : items;

  const handleEndReached = useCallback(() => {
    if (scrollY.current > 0 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.current = e.nativeEvent.contentOffset.y;
    },
    [],
  );

  const handleEdit = useCallback(
    (id: string) => {
      navigation.navigate('FeeStructureForm', { id });
    },
    [navigation],
  );

  const handleDelete = useCallback((item: FeeStructure) => {
    setDeleteTarget(item);
  }, []);

  const handlePress = useCallback(
    (id: string) => {
      navigation.navigate('FeeStudentFees', { fee_structure_public_id: id });
    },
    [navigation],
  );

  const handleViewDetail = useCallback(
    (id: string) => {
      navigation.navigate('FeeStructureDetail', { id });
    },
    [navigation],
  );

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteStructure(deleteTarget.public_id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }, [deleteStructure, deleteTarget]);

  const renderItem = useCallback(
    ({ item }: { item: FeeStructure }) => (
      <StructureCard
        item={item}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewDetail={handleViewDetail}
        onPress={handlePress}
      />
    ),
    [handleEdit, handleDelete, handleViewDetail, handlePress],
  );

  if (isLoading)
    return <LoadingState color="#059669" message="Loading fee structures..." />;
  if (isError)
    return (
      <ErrorState
        message="Failed to load fee structures"
        onRetry={() => void refetch()}
      />
    );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#059669', '#10b981']} style={styles.header}>
        <Animated.View entering={FadeIn.delay(100)} style={styles.circle1} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Fee Structures</Text>
            <Text style={styles.headerSub}>
              {data?.totalCount ?? 0} structures
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('FeeStructureForm')}
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
            Object.values(filters).filter(
              v => v !== '' && v !== undefined && v !== false,
            ).length
          }
        />
      </Animated.View>

      <ActiveFilters
        filters={getFeeStructureFilterLabels(filters, classOptions)}
        onRemove={key => setFilters({ ...filters, [key]: undefined })}
        onClearAll={() => setFilters({})}
      />

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        fields={filterFields}
        currentFilters={filters}
        title="Filter Fee Structures"
        onApply={nextFilters => {
          setFilters(nextFilters);
          setShowFilters(false);
        }}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item.public_id}
        renderItem={renderItem}
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
        ListFooterComponent={
          <ListFooter isLoading={isFetchingNextPage} color="#059669" />
        }
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
  header: {
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
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
  cardTitleWrap: { flex: 1, marginLeft: 10 },
  headerTextWrap: { flex: 1, marginLeft: 8 },
  activeBadgeOn: { backgroundColor: '#dcfce7' },
  activeBadgeOff: { backgroundColor: '#fee2e2' },
  activeDotOn: { backgroundColor: '#059669' },
  activeDotOff: { backgroundColor: '#dc2626' },
  activeTextOn: { color: '#059669' },
  activeTextOff: { color: '#dc2626' },
  actionBtnBlue: { backgroundColor: '#eff6ff' },
  actionBtnRed: { backgroundColor: '#fef2f2' },
  actionBtnGreenAuto: { backgroundColor: '#f0fdf4', marginLeft: 'auto' },
  actionTextEditBlue: { color: '#3b82f6' },
  actionTextViewBlue: { color: '#2563eb' },
  actionTextRed: { color: '#dc2626' },
  actionTextGreen: { color: '#059669' },
});
