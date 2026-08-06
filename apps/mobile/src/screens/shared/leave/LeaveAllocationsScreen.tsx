/**
 * Leave Allocations Screen
 * Lists all leave allocations grouped by leave type with collapsible sections.
 * Includes filters (leave type, role), add/edit/delete support.
 */

import { Colors, getRoleGradient } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  Plus,
  FileText,
  Trash2,
  Calendar,
  Edit3,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Users,
} from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { ConfirmDialog } from '@/components/common';
import { getLeaveTypeColor, getLeaveTypeBg } from '@/constants/leave-colors';
import { useScreenFilters } from '@/hooks/useScreenFilters';
import {
  useLeaveAllocations,
  useEmployeeLeaveAllocations,
  useDeleteLeaveAllocation,
  type LeaveAllocation,
} from '@/features/leave';
import { useAuthStore } from '@/lib/auth-store';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackNavigation } from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';
import { isAdminRole } from '@/utils/role-utils';

import { styles } from './leave-allocations-styles';

const adminGradient = getRoleGradient('admin');

interface GroupedSection {
  title: string;
  data: LeaveAllocation[];
}

export default function LeaveAllocationsScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const { user } = useAuthStore();
  const canManage = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const [refreshing, setRefreshing] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [showFilters, setShowFilters] = useState(false);
  const { filters, setFilter } = useScreenFilters<{
    leaveType: string;
    role: string;
  }>('LeaveAllocations', { leaveType: '', role: '' });
  const filterLeaveType = filters.leaveType;
  const filterRole = filters.role;
  const setFilterLeaveType = useCallback(
    (v: string) => setFilter('leaveType', v),
    [setFilter],
  );
  const setFilterRole = useCallback(
    (v: string) => setFilter('role', v),
    [setFilter],
  );
  const [deleteTarget, setDeleteTarget] = useState<LeaveAllocation | null>(
    null,
  );
  const [rolesModal, setRolesModal] = useState<{
    visible: boolean;
    roles: string;
    title: string;
  }>({
    visible: false,
    roles: '',
    title: '',
  });

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  // Use admin endpoint for admins, employee endpoint for others
  const adminQuery = useLeaveAllocations({ page_size: 100 });
  const employeeQuery = useEmployeeLeaveAllocations({ page_size: 100 });

  const { data, isLoading, refetch } = canManage ? adminQuery : employeeQuery;
  const deleteMutation = useDeleteLeaveAllocation();

  const allocations = useMemo(() => data?.data ?? [], [data?.data]);

  // Extract unique leave types for filter
  const leaveTypeOptions = useMemo(() => {
    const types = Array.from(
      new Set(allocations.map(a => a.leave_type_name)),
    ).filter(Boolean);
    return types.map(t => ({ value: t, label: t }));
  }, [allocations]);

  // Extract unique roles for filter
  const roleOptions = useMemo(() => {
    const roles = Array.from(
      new Set(
        allocations
          .filter(a => !a.applies_to_all_roles && a.roles)
          .flatMap(a => a.roles.split(',').map((r: string) => r.trim())),
      ),
    ).filter(Boolean);
    return roles.map(r => ({ value: r, label: r }));
  }, [allocations]);

  // Filter allocations
  const filteredAllocations = useMemo(() => {
    let filtered = allocations;
    if (filterLeaveType) {
      filtered = filtered.filter(a => a.leave_type_name === filterLeaveType);
    }
    if (filterRole) {
      filtered = filtered.filter(
        a => a.applies_to_all_roles || a.roles?.includes(filterRole),
      );
    }
    return filtered;
  }, [allocations, filterLeaveType, filterRole]);

  // Group allocations by leave type
  const sections: GroupedSection[] = useMemo(() => {
    const groups: Record<string, LeaveAllocation[]> = {};
    filteredAllocations.forEach(a => {
      const key = a.leave_type_name || 'Unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    });
    return Object.entries(groups).map(([title, items]) => ({
      title,
      data: items,
    }));
  }, [filteredAllocations]);

  const activeFilterCount = (filterLeaveType ? 1 : 0) + (filterRole ? 1 : 0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const toggleGroup = (title: string) => {
    setCollapsedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const clearFilters = () => {
    setFilterLeaveType('');
    setFilterRole('');
  };

  const handleDelete = (item: LeaveAllocation) => {
    setDeleteTarget(item);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.public_id, {
        onSuccess: () => {
          setDeleteTarget(null);
          void refetch();
        },
        onError: () => {
          setDeleteTarget(null);
        },
      });
    }
  };

  const handleEdit = (item: LeaveAllocation) => {
    navigation.navigate('LeaveAllocationEdit', { id: item.public_id });
  };

  const handleAdd = () => {
    navigation.navigate('LeaveAllocationCreate');
  };

  const renderSectionHeader = ({ section }: { section: GroupedSection }) => {
    const isCollapsed = collapsedGroups[section.title];
    const color = getLeaveTypeColor(section.title);
    const bgColor = getLeaveTypeBg(section.title);

    return (
      <TouchableOpacity
        style={[
          styles.sectionHeader,
          { backgroundColor: bgColor, borderLeftColor: color },
        ]}
        onPress={() => toggleGroup(section.title)}
        activeOpacity={0.7}
      >
        <View style={styles.sectionLeft}>
          <View style={[styles.sectionDot, { backgroundColor: color }]} />
          <Text style={[styles.sectionTitle, { color }]}>{section.title}</Text>
        </View>
        <View style={styles.sectionRight}>
          <View style={[styles.sectionBadge, { backgroundColor: color }]}>
            <Text style={styles.sectionBadgeText}>{section.data.length}</Text>
          </View>
          {isCollapsed ? (
            <ChevronDown size={20} color={color} />
          ) : (
            <ChevronUp size={20} color={color} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({
    item,
    index,
    section,
  }: {
    item: LeaveAllocation;
    index: number;
    section: GroupedSection;
  }) => {
    if (collapsedGroups[section.title]) return null;

    return (
      <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: getLeaveTypeBg(item.leave_type_name) },
              ]}
            >
              <FileText
                size={18}
                color={getLeaveTypeColor(item.leave_type_name)}
              />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.name ?? item.leave_type_name}
              </Text>
              <Text style={styles.cardSubtitle}>
                {item.applies_to_all_roles
                  ? 'All Roles'
                  : `${item.roles?.split(',').length ?? 0} role(s) assigned`}
              </Text>
            </View>
            {/* Edit/Delete buttons - only for admin */}
            {canManage && (
              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => handleEdit(item)}
                  style={styles.actionBtn}
                >
                  <Edit3 size={16} color="#7c3aed" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  style={styles.actionBtn}
                >
                  <Trash2 size={16} color={Colors.danger[500]} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{item.total_days}</Text>
              <Text style={styles.statLabel}>Total Days</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {item.max_carry_forward_days}
              </Text>
              <Text style={styles.statLabel}>Carry Forward</Text>
            </View>
            {item.applies_to_all_roles ? (
              <View style={[styles.stat, styles.statAllRoles]}>
                <Text style={[styles.statValue, styles.statValueGreen]}>
                  All
                </Text>
                <Text style={styles.statLabel}>Roles</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.stat, styles.statViewRoles]}
                onPress={() =>
                  setRolesModal({
                    visible: true,
                    roles: item.roles ?? '',
                    title: item.name ?? item.leave_type_name,
                  })
                }
                activeOpacity={0.7}
              >
                <Users size={16} color="#7c3aed" />
                <Text style={[styles.statLabel, styles.statLabelPurple]}>
                  View Roles
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.dateRow}>
            <Calendar size={14} color={Colors.gray[400]} />
            <Text style={styles.dateText}>
              {item.effective_from ?? 'No start'} →{' '}
              {item.effective_to ?? 'Ongoing'}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderFilterChip = (
    label: string,
    value: string,
    options: { value: string; label: string }[],
    onSelect: (v: string) => void,
  ) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipScroll}
    >
      <TouchableOpacity
        style={[styles.chip, !value && styles.chipActive]}
        onPress={() => onSelect('')}
      >
        <Text style={[styles.chipText, !value && styles.chipTextActive]}>
          All {label}
        </Text>
      </TouchableOpacity>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.chip, value === opt.value && styles.chipActive]}
          onPress={() => onSelect(value === opt.value ? '' : opt.value)}
        >
          <Text
            style={[
              styles.chipText,
              value === opt.value && styles.chipTextActive,
            ]}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <Animated.View
          entering={FadeIn.delay(100)}
          style={headerStyles.circle1}
          pointerEvents="none"
        />
        <Animated.View
          entering={FadeIn.delay(200)}
          style={headerStyles.circle2}
          pointerEvents="none"
        />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={handleBack}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Leave Policies</Text>
              <Text style={headerStyles.subtitle}>
                {filteredAllocations.length} polic
                {filteredAllocations.length !== 1 ? 'ies' : 'y'}
              </Text>
            </View>
            <View style={headerStyles.actions}>
              <TouchableOpacity
                style={[
                  headerStyles.actionBtn,
                  showFilters && styles.actionBtnActive,
                ]}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Filter size={18} color="#fff" />
                {activeFilterCount > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>
                      {activeFilterCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {/* Add button - only for admin */}
              {canManage && (
                <TouchableOpacity
                  style={headerStyles.primaryBtn}
                  onPress={handleAdd}
                >
                  <Plus size={20} color="#7c3aed" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Filters */}
      {showFilters && (
        <Animated.View
          entering={FadeInDown.duration(250)}
          style={styles.filterContainer}
        >
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filters</Text>
            {activeFilterCount > 0 && (
              <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
                <X size={14} color="#7c3aed" />
                <Text style={styles.clearBtnText}>Clear all</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.filterLabel}>Leave Type</Text>
          {renderFilterChip(
            'Types',
            filterLeaveType,
            leaveTypeOptions,
            setFilterLeaveType,
          )}
          {roleOptions.length > 0 && (
            <>
              <Text style={[styles.filterLabel, styles.filterLabelSpaced]}>
                Role
              </Text>
              {renderFilterChip(
                'Roles',
                filterRole,
                roleOptions,
                setFilterRole,
              )}
            </>
          )}
        </Animated.View>
      )}

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Loading leave policies...</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.public_id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FileText size={48} color={Colors.gray[300]} />
              <Text style={styles.emptyTitle}>No leave allocations found</Text>
              <Text style={styles.emptySubtitle}>
                {activeFilterCount > 0
                  ? 'Try clearing filters to view all leave policies.'
                  : 'No leave policy has been created yet.'}
              </Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity onPress={clearFilters}>
                  <Text style={styles.emptyLink}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Roles Modal */}
      <Modal
        visible={rolesModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setRolesModal(p => ({ ...p, visible: false }))}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRolesModal(p => ({ ...p, visible: false }))}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Users size={20} color="#7c3aed" />
              <Text style={styles.modalTitle}>Applicable Roles</Text>
            </View>
            <Text style={styles.modalSubtitle}>{rolesModal.title}</Text>
            <ScrollView
              style={styles.modalRolesList}
              showsVerticalScrollIndicator
            >
              {rolesModal.roles
                .split(',')
                .map(r => r.trim())
                .filter(Boolean)
                .map((role, i) => (
                  <View key={`role-${role}-${i}`} style={styles.modalRoleChip}>
                    <View style={styles.modalRoleDot} />
                    <Text style={styles.modalRoleText}>{role}</Text>
                  </View>
                ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setRolesModal(p => ({ ...p, visible: false }))}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete Allocation"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name ?? deleteTarget.leave_type_name}"?`
            : ''
        }
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </View>
  );
}
