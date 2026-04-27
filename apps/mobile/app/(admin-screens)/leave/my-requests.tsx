/**
 * My Leave Requests Screen
 * Lists the logged-in employee's leave requests with status & cancel option.
 */

import { Colors, getRoleGradient } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, Clock, CheckCircle, XCircle, Ban, Calendar } from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';

import { useMyLeaveRequests, useCancelLeaveRequest } from '@/features/leave';
import type { LeaveRequest } from '@/features/leave';
import { headerStyles, layoutStyles, emptyStyles } from '@/styles';

const empGradient = getRoleGradient('employee');

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: any }> = {
  pending: { bg: '#fef3c7', text: '#92400e', icon: Clock },
  approved: { bg: '#d1fae5', text: '#065f46', icon: CheckCircle },
  rejected: { bg: '#fee2e2', text: '#991b1b', icon: XCircle },
  cancelled: { bg: '#f3f4f6', text: '#374151', icon: Ban },
};

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function MyLeaveRequestsScreen() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const params = useMemo(() => {
    const p: Record<string, any> = { page_size: 50 };
    if (statusFilter) p.status = statusFilter;
    return p;
  }, [statusFilter]);

  const { data, isLoading, refetch } = useMyLeaveRequests(params);
  const cancelMutation = useCancelLeaveRequest();

  const requests = data?.data || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCancel = (item: LeaveRequest) => {
    Alert.alert(
      'Cancel Request',
      `Cancel leave from ${formatDate(item.start_date)} to ${formatDate(item.end_date)}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () =>
            cancelMutation.mutate(item.public_id, {
              onSuccess: () => refetch(),
              onError: () => Alert.alert('Error', 'Could not cancel the request.'),
            }),
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: LeaveRequest }) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.leaveType}>{item.leave_type_name}</Text>
            <Text style={styles.dates}>
              {formatDate(item.start_date)} → {formatDate(item.end_date)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <Icon size={12} color={cfg.text} />
            <Text style={[styles.statusText, { color: cfg.text }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.days}>
          {item.number_of_days} day{item.number_of_days !== 1 ? 's' : ''}
        </Text>
        {item.reason ? (
          <Text style={styles.reason} numberOfLines={2}>
            {item.reason}
          </Text>
        ) : null}
        {item.can_be_cancelled && item.status !== 'approved' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item)}>
            <Text style={styles.cancelBtnText}>Cancel Request</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={empGradient} style={headerStyles.header}>
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>My Leave</Text>
              <Text style={headerStyles.subtitle}>
                {requests.length} request{requests.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity
              style={headerStyles.primaryBtn}
              onPress={() => router.push('/(admin-screens)/leave/apply' as any)}
            >
              <Plus size={20} color="#7c3aed" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Status filter */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => {
          const active = f.value === statusFilter;
          return (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setStatusFilter(f.value)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <View style={emptyStyles.container}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.public_id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={emptyStyles.container}>
              <Calendar size={48} color="#94a3b8" />
              <Text style={emptyStyles.title}>No Requests</Text>
              <Text style={emptyStyles.subtitle}>You haven't applied for any leave yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  filterChipActive: { backgroundColor: '#6366f1' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  filterChipTextActive: { color: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  leaveType: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  dates: { fontSize: 12, color: '#64748b', marginTop: 2 },
  days: { fontSize: 13, fontWeight: '600', color: '#6366f1', marginTop: 6 },
  reason: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  cancelBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  cancelBtnText: { fontSize: 12, fontWeight: '600', color: '#dc2626' },
});
