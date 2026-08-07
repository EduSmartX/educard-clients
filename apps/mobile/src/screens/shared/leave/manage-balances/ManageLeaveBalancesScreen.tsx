import { Colors } from '@educard/shared';
import {
  Plus,
  Pencil,
  Trash2,
  User as UserIcon,
  Users,
  Briefcase,
  PieChart,
} from 'lucide-react-native';
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DonutChart, ChartLegend } from '@/components/charts';
import { Screen, Header } from '@/components/layout';
import { FormDropdown } from '@/components/forms';
import { useManageableUsers } from '@/hooks/use-manageable-users';
import {
  useTeacherManagementContext,
  useUserLeaveBalances,
  useUserLeaveAllocations,
  useDeleteLeaveBalance,
  type LeaveBalance,
} from '@/features/leave';
import { useAuthStore } from '@/lib/auth-store';
import { isAdminRole } from '@/utils/role-utils';

import { LeaveBalanceFormModal } from './LeaveBalanceFormModal';

type UserRoleTab = 'staff' | 'student';

export default function ManageLeaveBalancesScreen() {
  const insets = useSafeAreaInsets();
  const role = useAuthStore(s => s.user?.role);
  const currentUserId = useAuthStore(s => s.user?.public_id);
  const isAdmin = isAdminRole(role);

  const { data: context, isLoading: contextLoading } =
    useTeacherManagementContext(!isAdmin);
  const hasPermission = isAdmin || !!context?.can_manage_balances;

  const [manageOwn, setManageOwn] = useState(true);
  const [userRoleTab, setUserRoleTab] = useState<UserRoleTab>('staff');
  const [selectedUserId, setSelectedUserId] = useState('');

  const effectiveUserId = manageOwn ? currentUserId : selectedUserId;

  const { data: staff = [], isLoading: staffLoading } = useManageableUsers(
    'staff',
    !manageOwn && userRoleTab === 'staff',
  );
  const { data: students = [], isLoading: studentsLoading } =
    useManageableUsers('student', !manageOwn && userRoleTab === 'student');

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

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editBalance, setEditBalance] = useState<LeaveBalance | null>(null);

  const userOptions = (userRoleTab === 'staff' ? staff : students).map(u => ({
    value: u.public_id,
    label: u.full_name,
  }));

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

  if (contextLoading) {
    return (
      <Screen>
        <Header
          title="Manage Leave Balances"
          subtitle="Assign and track leave balances"
          showBack
        />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
          <Text style={styles.loadingText}>Loading permissions...</Text>
        </View>
      </Screen>
    );
  }

  if (!hasPermission) {
    return (
      <Screen>
        <Header
          title="Manage Leave Balances"
          subtitle="Assign and track leave balances"
          showBack
        />
        <View style={styles.centerBox}>
          <Text style={styles.permTitle}>No access</Text>
          <Text style={styles.permText}>
            You don&apos;t have permission to manage leave balances. This is
            available to admins, supervisors, and class teachers.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title="Manage Leave Balances"
        subtitle="Assign and track leave balances"
        showBack
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
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

            <FormDropdown
              label={
                userRoleTab === 'staff'
                  ? 'Select Staff Member'
                  : 'Select Student'
              }
              placeholder="Select a person"
              options={userOptions}
              value={selectedUserId}
              onChange={setSelectedUserId}
              loading={userRoleTab === 'staff' ? staffLoading : studentsLoading}
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
                  This person has no leave balances allocated. Tap “Add Leave
                  Balance” below to allocate leave.
                </Text>
              </View>
            ) : (
              <>
                {/* Overview chart */}
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
                </View>

                {/* Balance list */}
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>
                    Leave Balances ({balances.length})
                  </Text>
                </View>

                {balances.map(b => {
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
                          <Text style={styles.balanceName} numberOfLines={1}>
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
                          <Text style={styles.statValueGreen}>{carried}</Text>
                          <Text style={styles.statLabel}>Carried</Text>
                        </View>
                        <View style={styles.statCell}>
                          <Text style={styles.statValueBlue}>{available}</Text>
                          <Text style={styles.statLabel}>Available</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[
            styles.footerBtn,
            !effectiveUserId && styles.footerBtnDisabled,
          ]}
          onPress={handleAdd}
          disabled={!effectiveUserId}
        >
          <Plus size={18} color="#ffffff" />
          <Text style={styles.footerBtnText}>Add Leave Balance</Text>
        </TouchableOpacity>
        {!effectiveUserId && (
          <Text style={styles.footerHint}>Select a person to continue.</Text>
        )}
      </View>

      <LeaveBalanceFormModal
        visible={modalOpen}
        mode={modalMode}
        balance={editBalance}
        availableAllocations={availableAllocations}
        userId={effectiveUserId}
        onClose={() => setModalOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 120,
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
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  footerBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.primary[600],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerBtnDisabled: {
    opacity: 0.5,
  },
  footerBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  footerHint: {
    fontSize: 12,
    textAlign: 'center',
    color: Colors.gray[500],
    marginTop: 8,
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
