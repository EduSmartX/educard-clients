import { Colors, getRoleGradient, type Student } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Pencil,
  Trash2,
  User as UserIcon,
  Users,
  Briefcase,
  PieChart,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DonutChart,
  BarChart,
  ChartLegend,
  type BarDatum,
} from '@/components/charts';
import { FormDropdown } from '@/components/forms';
import { useClasses } from '@/features/classes';
import { getStudents } from '@/features/students/api/students-api';
import { useManageableUsers } from '@/hooks/use-manageable-users';
import {
  useTeacherManagementContext,
  useUserLeaveBalances,
  useUserLeaveAllocations,
  useDeleteLeaveBalance,
  type LeaveBalance,
} from '@/features/leave';
import { useAuthStore } from '@/lib/auth-store';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackNavigation } from '@/navigation/types';
import { isAdminRole } from '@/utils/role-utils';

import { LeaveBalanceFormModal } from './LeaveBalanceFormModal';

type UserRoleTab = 'staff' | 'student';

const PAGE_SIZE = 8;
const adminGradient = getRoleGradient('admin');

function shortLabel(name: string) {
  return name.length > 8 ? `${name.slice(0, 8)}\u2026` : name;
}

export default function ManageLeaveBalancesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SharedStackNavigation>();
  const role = useAuthStore(s => s.user?.role);
  const currentUserId = useAuthStore(s => s.user?.public_id);
  const isAdmin = isAdminRole(role);

  const { data: context, isLoading: contextLoading } =
    useTeacherManagementContext(!isAdmin);
  const hasPermission = isAdmin || !!context?.can_manage_balances;

  // Default to managing another person (matches web); toggle on for own balance.
  const [manageOwn, setManageOwn] = useState(false);
  const [userRoleTab, setUserRoleTab] = useState<UserRoleTab>('staff');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [search, setSearch] = useState('');

  const effectiveUserId = manageOwn ? currentUserId : selectedUserId;
  const isStaffTab = !manageOwn && userRoleTab === 'staff';
  const isStudentTab = !manageOwn && userRoleTab === 'student';

  const { data: staff = [], isLoading: staffLoading } = useManageableUsers(
    'staff',
    isStaffTab,
  );

  // Students are chosen by class: admins load all classes, teachers use theirs.
  const { data: classesData, isLoading: classesLoading } = useClasses({
    page_size: 100,
  });
  const { data: classStudentsResp, isLoading: studentsLoading } = useQuery({
    queryKey: ['leave-balances', 'class-students', selectedClass],
    queryFn: () => getStudents({ class_id: selectedClass, page_size: 100 }),
    enabled: isStudentTab && !!selectedClass,
  });
  const students = useMemo(
    () => classStudentsResp?.data ?? [],
    [classStudentsResp],
  );

  const { data: balancesResp, isLoading: balancesLoading } =
    useUserLeaveBalances(effectiveUserId);
  const { data: allocations = [] } = useUserLeaveAllocations(effectiveUserId);
  const deleteMutation = useDeleteLeaveBalance();

  const balances = useMemo(
    () => balancesResp?.data?.balances ?? [],
    [balancesResp],
  );

  const availableAllocations = useMemo(() => {
    const allocatedIds = new Set(
      balances.map(b => b.leave_allocation.public_id),
    );
    return allocations.filter(a => !allocatedIds.has(a.public_id));
  }, [balances, allocations]);

  const totals = useMemo(
    () =>
      balances.reduce(
        (acc, b) => ({
          available: acc.available + Number(b.available),
          used: acc.used + Number(b.used),
          pending: acc.pending + Number(b.pending),
        }),
        { available: 0, used: 0, pending: 0 },
      ),
    [balances],
  );

  const chartSegments = useMemo(
    () => [
      { label: 'Available', value: totals.available, color: '#22c55e' },
      { label: 'Used', value: totals.used, color: '#ef4444' },
      { label: 'Pending', value: totals.pending, color: '#f59e0b' },
    ],
    [totals],
  );
  const chartTotal = totals.available + totals.used + totals.pending;

  const barData: BarDatum[] = useMemo(
    () =>
      balances.map(b => ({
        label: shortLabel(
          b.leave_allocation.display_name || b.leave_allocation.leave_type_name,
        ),
        value: Number(b.available),
        color: Colors.primary[500],
      })),
    [balances],
  );

  const filteredBalances = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return balances;
    return balances.filter(
      b =>
        b.leave_allocation.leave_type_name.toLowerCase().includes(q) ||
        (b.leave_allocation.display_name ?? '').toLowerCase().includes(q),
    );
  }, [balances, search]);

  const [page, setPage] = useState(1);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredBalances.length / PAGE_SIZE),
  );
  const pagedBalances = useMemo(
    () => filteredBalances.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredBalances, page],
  );
  useEffect(() => {
    setPage(1);
  }, [search, effectiveUserId]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editBalance, setEditBalance] = useState<LeaveBalance | null>(null);
  const [balancesExpanded, setBalancesExpanded] = useState(false);

  const classOptions = useMemo(() => {
    if (isAdmin) {
      return (classesData?.classes ?? []).map(c => ({
        value: c.public_id,
        label: `${c.class_master?.name ?? ''} ${c.name}`.trim(),
      }));
    }
    return (context?.class_teacher_for ?? []).map(c => ({
      value: c.public_id,
      label: c.class_master ? `${c.class_master} ${c.name}` : c.name,
    }));
  }, [isAdmin, classesData, context]);

  const userOptions = useMemo(() => {
    if (userRoleTab === 'staff') {
      return staff.map(u => ({ value: u.public_id, label: u.full_name }));
    }
    return students.map((s: Student) => ({
      value: s.user_info.public_id,
      label: `${s.full_name} (${s.roll_number})`,
    }));
  }, [userRoleTab, staff, students]);

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const handleAdd = () => {
    setModalMode('add');
    setEditBalance(null);
    setModalOpen(true);
  };

  const handleEdit = (b: LeaveBalance) => {
    setModalMode('edit');
    setEditBalance(b);
    setModalOpen(true);
  };

  const handleDelete = (b: LeaveBalance) => {
    Alert.alert(
      'Delete Leave Balance',
      `Remove "${b.leave_allocation.display_name || b.leave_allocation.leave_type_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(b.public_id),
        },
      ],
    );
  };

  const renderHeader = (withAdd: boolean) => (
    <LinearGradient
      colors={adminGradient}
      style={[styles.header, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={handleBack}>
          <ChevronLeft size={22} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Manage Leave Balances</Text>
          <Text style={styles.headerSubtitle}>
            Assign and track leave balances
          </Text>
        </View>
        {withAdd && !!effectiveUserId && (
          <TouchableOpacity style={styles.headerAddBtn} onPress={handleAdd}>
            <Plus size={16} color="#ffffff" />
            <Text style={styles.headerAddText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );

  if (contextLoading) {
    return (
      <View style={styles.container}>
        {renderHeader(false)}
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
          <Text style={styles.loadingText}>Loading permissions...</Text>
        </View>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        {renderHeader(false)}
        <View style={styles.centerBox}>
          <Text style={styles.permTitle}>No access</Text>
          <Text style={styles.permText}>
            You don&apos;t have permission to manage leave balances. This is
            available to admins, supervisors, and class teachers.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader(true)}
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Manage own balance toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <Text style={styles.toggleTitle}>Manage my own balance</Text>
            <Text style={styles.toggleSub}>
              Turn off to manage a team member
            </Text>
          </View>
          <Switch
            value={manageOwn}
            onValueChange={v => {
              setManageOwn(v);
              setSelectedUserId('');
              setSelectedClass('');
            }}
            trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
            thumbColor={manageOwn ? Colors.primary[500] : Colors.gray[400]}
          />
        </View>

        {/* User selection */}
        {!manageOwn && (
          <View style={styles.selectBox}>
            <View style={styles.roleTabs}>
              <TouchableOpacity
                style={[
                  styles.roleTab,
                  userRoleTab === 'staff' && styles.roleTabActive,
                ]}
                onPress={() => {
                  setUserRoleTab('staff');
                  setSelectedUserId('');
                  setSelectedClass('');
                }}
              >
                <Briefcase
                  size={16}
                  color={
                    userRoleTab === 'staff'
                      ? Colors.primary[600]
                      : Colors.gray[500]
                  }
                />
                <Text
                  style={[
                    styles.roleTabText,
                    userRoleTab === 'staff' && styles.roleTabTextActive,
                  ]}
                >
                  Staff
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleTab,
                  userRoleTab === 'student' && styles.roleTabActive,
                ]}
                onPress={() => {
                  setUserRoleTab('student');
                  setSelectedUserId('');
                  setSelectedClass('');
                }}
              >
                <Users
                  size={16}
                  color={
                    userRoleTab === 'student'
                      ? Colors.primary[600]
                      : Colors.gray[500]
                  }
                />
                <Text
                  style={[
                    styles.roleTabText,
                    userRoleTab === 'student' && styles.roleTabTextActive,
                  ]}
                >
                  Students
                </Text>
              </TouchableOpacity>
            </View>

            {userRoleTab === 'student' && (
              <FormDropdown
                label="Select Class"
                placeholder="First select a class"
                options={classOptions}
                value={selectedClass}
                onChange={value => {
                  setSelectedClass(value);
                  setSelectedUserId('');
                }}
                loading={classesLoading}
              />
            )}

            <FormDropdown
              label={
                userRoleTab === 'staff'
                  ? 'Select Staff Member'
                  : 'Select Student'
              }
              placeholder={
                userRoleTab === 'student' && !selectedClass
                  ? 'First select a class'
                  : 'Select a person'
              }
              options={userOptions}
              value={selectedUserId}
              onChange={setSelectedUserId}
              loading={userRoleTab === 'staff' ? staffLoading : studentsLoading}
              disabled={userRoleTab === 'student' && !selectedClass}
            />
          </View>
        )}

        {/* Balances */}
        {!effectiveUserId ? (
          <View style={styles.hintBox}>
            <UserIcon size={28} color={Colors.gray[300]} />
            <Text style={styles.hintText}>
              Select a person to view and manage their balances.
            </Text>
          </View>
        ) : balancesLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.primary[600]} />
            <Text style={styles.loadingText}>Loading leave balances...</Text>
          </View>
        ) : (
          <>
            {balances.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconWrap}>
                  <PieChart size={30} color={Colors.primary[500]} />
                </View>
                <Text style={styles.emptyTitle}>No leave balances yet</Text>
                <Text style={styles.emptyText}>
                  This person has no leave balances allocated. Tap “Add” in the
                  top-right to allocate leave.
                </Text>
              </View>
            ) : (
              <>
                {/* Overview: totals donut + per-leave bar */}
                <View style={styles.overviewCard}>
                  <Text style={styles.overviewTitle}>Leave Overview</Text>
                  <View style={styles.overviewBody}>
                    <DonutChart
                      data={chartSegments}
                      centerValue={chartTotal}
                      centerLabel="Total days"
                    />
                    <ChartLegend
                      data={chartSegments}
                      showValues
                      style={styles.legend}
                    />
                  </View>

                  {barData.length > 0 && (
                    <View style={styles.barSection}>
                      <Text style={styles.barTitle}>
                        Available days by leave
                      </Text>
                      <BarChart data={barData} height={140} />
                    </View>
                  )}
                </View>

                {/* Collapsible balances */}
                <TouchableOpacity
                  style={styles.collapseHeader}
                  onPress={() => setBalancesExpanded(e => !e)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.listTitle}>
                    Leave Balances ({filteredBalances.length})
                  </Text>
                  {balancesExpanded ? (
                    <ChevronUp size={20} color={Colors.gray[500]} />
                  ) : (
                    <ChevronDown size={20} color={Colors.gray[500]} />
                  )}
                </TouchableOpacity>

                {balancesExpanded && (
                  <>
                    {/* Search */}
                    <View style={styles.searchBox}>
                      <Search size={16} color={Colors.gray[400]} />
                      <TextInput
                        style={styles.searchInput}
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search leave type..."
                        placeholderTextColor={Colors.gray[400]}
                      />
                    </View>

                    {pagedBalances.map(b => {
                      const allocated = Number(b.total_allocated);
                      const carried = Number(b.carried_forward);
                      const used = Number(b.used);
                      const pending = Number(b.pending);
                      const available = Number(b.available);
                      const capacity = allocated + carried || 1;
                      const usedPct = Math.min(100, (used / capacity) * 100);
                      const pendingPct = Math.min(
                        100 - usedPct,
                        (pending / capacity) * 100,
                      );
                      return (
                        <View key={b.public_id} style={styles.balanceCard}>
                          <View style={styles.balanceTop}>
                            <View style={styles.balanceNameWrap}>
                              <Text
                                style={styles.balanceName}
                                numberOfLines={1}
                              >
                                {b.leave_allocation.display_name ||
                                  b.leave_allocation.leave_type_name}
                              </Text>
                              <Text style={styles.balanceMeta}>
                                {available} of {allocated + carried} days left
                              </Text>
                            </View>
                            <View style={styles.balanceActions}>
                              <TouchableOpacity
                                onPress={() => handleEdit(b)}
                                hitSlop={styles.hitSlop}
                              >
                                <Pencil size={18} color={Colors.primary[600]} />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleDelete(b)}
                                hitSlop={styles.hitSlop}
                              >
                                <Trash2 size={18} color={Colors.danger[600]} />
                              </TouchableOpacity>
                            </View>
                          </View>

                          <View style={styles.progressTrack}>
                            <View
                              style={[
                                styles.progressUsed,
                                { width: `${usedPct}%` },
                              ]}
                            />
                            <View
                              style={[
                                styles.progressPending,
                                { width: `${pendingPct}%` },
                              ]}
                            />
                          </View>

                          <View style={styles.statsRow}>
                            <View style={styles.statCell}>
                              <Text style={styles.statValue}>{allocated}</Text>
                              <Text style={styles.statLabel}>Allocated</Text>
                            </View>
                            <View style={styles.statCell}>
                              <Text style={styles.statValueRed}>{used}</Text>
                              <Text style={styles.statLabel}>Used</Text>
                            </View>
                            <View style={styles.statCell}>
                              <Text style={styles.statValueGreen}>
                                {carried}
                              </Text>
                              <Text style={styles.statLabel}>Carried</Text>
                            </View>
                            <View style={styles.statCell}>
                              <Text style={styles.statValueBlue}>
                                {available}
                              </Text>
                              <Text style={styles.statLabel}>Available</Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}

                    {totalPages > 1 && (
                      <View style={styles.pagination}>
                        <TouchableOpacity
                          style={[
                            styles.pageBtn,
                            page <= 1 && styles.pageBtnDisabled,
                          ]}
                          disabled={page <= 1}
                          onPress={() => setPage(p => Math.max(1, p - 1))}
                        >
                          <ChevronLeft
                            size={18}
                            color={
                              page <= 1 ? Colors.gray[400] : Colors.primary[600]
                            }
                          />
                        </TouchableOpacity>
                        <Text style={styles.pageText}>
                          Page {page} of {totalPages}
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.pageBtn,
                            page >= totalPages && styles.pageBtnDisabled,
                          ]}
                          disabled={page >= totalPages}
                          onPress={() =>
                            setPage(p => Math.min(totalPages, p + 1))
                          }
                        >
                          <ChevronRight
                            size={18}
                            color={
                              page >= totalPages
                                ? Colors.gray[400]
                                : Colors.primary[600]
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      <LeaveBalanceFormModal
        visible={modalOpen}
        mode={modalMode}
        balance={editBalance}
        availableAllocations={availableAllocations}
        userId={effectiveUserId}
        onClose={() => setModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  headerAddText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: {
    padding: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray[800],
    padding: 0,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  pageBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  centerBox: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: Colors.gray[500],
    marginTop: 10,
  },
  permTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: 6,
  },
  permText: {
    fontSize: 13,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 19,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    padding: 14,
  },
  toggleLeft: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[900],
  },
  toggleSub: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 2,
  },
  selectBox: {
    marginTop: 16,
  },
  roleTabs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    backgroundColor: '#ffffff',
  },
  roleTabActive: {
    borderColor: Colors.primary[400],
    backgroundColor: Colors.primary[50],
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[500],
  },
  roleTabTextActive: {
    color: Colors.primary[600],
  },
  hintBox: {
    marginTop: 20,
    alignItems: 'center',
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.gray[100],
    backgroundColor: Colors.gray[50],
  },
  hintText: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.gray[500],
    textAlign: 'center',
  },
  overviewCard: {
    marginTop: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Colors.gray[100],
    borderRadius: 16,
    padding: 16,
  },
  overviewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.gray[900],
    marginBottom: 12,
  },
  overviewBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  legend: {
    flex: 1,
  },
  barSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    paddingTop: 14,
  },
  barTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[600],
    marginBottom: 12,
  },
  emptyCard: {
    marginTop: 20,
    alignItems: 'center',
    padding: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gray[100],
    backgroundColor: '#ffffff',
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[50],
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.gray[900],
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 19,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.gray[900],
  },
  collapseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  balanceCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Colors.gray[100],
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  balanceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[900],
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 16,
    marginLeft: 12,
  },
  hitSlop: {
    top: 8,
    bottom: 8,
    left: 8,
    right: 8,
  },
  balanceNameWrap: {
    flex: 1,
    marginRight: 12,
  },
  balanceMeta: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 2,
  },
  progressTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dcfce7',
    overflow: 'hidden',
    marginTop: 12,
  },
  progressUsed: {
    height: 8,
    backgroundColor: '#ef4444',
  },
  progressPending: {
    height: 8,
    backgroundColor: '#f59e0b',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gray[800],
  },
  statValueRed: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.danger[600],
  },
  statValueGreen: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.success[600],
  },
  statValueBlue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary[600],
  },
  statLabel: {
    fontSize: 11,
    color: Colors.gray[500],
    marginTop: 2,
  },
});
