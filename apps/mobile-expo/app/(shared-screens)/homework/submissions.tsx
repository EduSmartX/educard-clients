/**
 * Homework Submissions Screen
 * Lists all submissions for a specific homework with filtering
 *
 * Permissions:
 * - Admin: Can view all submissions (read-only)
 * - Class Teacher: Can view submissions for their class (read-only)
 * - Subject Teacher (assigned): Can view and review submissions
 */

import {
  Colors,
  getRoleGradient,
  SUBMISSION_STATUS,
  SUBMISSION_STATUS_COLORS,
  getSubmissionStatusLabel,
  HOMEWORK_UI,
} from '@educard/shared';
import type { HomeworkSubmission, SubmissionStatus } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Search,
  X,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  ChevronRight,
} from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useSubmissions, useHomeworkDetail } from '@/features/homework';
import { useUserProfile } from '@/hooks';
import { useAuthStore } from '@/lib/auth-store';
import { headerStyles, layoutStyles } from '@/styles';
import { isAdminRole } from '@/utils/role-utils';

const adminGradient = getRoleGradient('admin');

const STATUS_FILTERS = [
  { label: 'All', value: '', color: '#6366f1' },
  { label: HOMEWORK_UI.PENDING, value: SUBMISSION_STATUS.PENDING, color: '#94a3b8' },
  { label: HOMEWORK_UI.SUBMITTED, value: SUBMISSION_STATUS.SUBMITTED, color: '#3b82f6' },
  { label: HOMEWORK_UI.REVIEWED, value: SUBMISSION_STATUS.REVIEWED, color: '#10b981' },
];

export default function SubmissionsScreen() {
  const router = useRouter();
  const { homework_id } = useLocalSearchParams<{ homework_id: string }>();
  const { user } = useAuthStore();
  const { data: profile } = useUserProfile();
  const isAdmin = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: homework } = useHomeworkDetail(homework_id ?? '');

  const queryParams = useMemo(() => {
    const params: Record<string, string | boolean> = {};
    if (statusFilter) params.status = statusFilter;
    return params;
  }, [statusFilter]);

  const {
    data: submissionsData,
    isLoading,
    refetch,
  } = useSubmissions(homework_id ?? '', queryParams);

  const submissions = useMemo(() => {
    const list = submissionsData?.submissions ?? [];
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (s) =>
        s.student_name.toLowerCase().includes(q) || s.student_roll_number.toLowerCase().includes(q)
    );
  }, [submissionsData, searchQuery]);

  const stats = submissionsData?.stats;

  const canReview = useMemo(() => {
    if (!homework || !profile) return false;
    if (isAdmin) return false;
    return homework.assigned_by_public_id === profile.teacher_public_id;
  }, [homework, profile, isAdmin]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const handleSearch = () => {
    setSearchQuery(searchText.trim());
  };

  const clearSearch = () => {
    setSearchText('');
    setSearchQuery('');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewSubmission = (submission: HomeworkSubmission, index: number) => {
    router.push(
      `/(shared-screens)/homework/review?homework_id=${homework_id}&submission_id=${submission.public_id}&index=${index}&total=${submissions.length}`
    );
  };

  const renderSubmissionItem = ({ item, index }: { item: HomeworkSubmission; index: number }) => {
    const statusColor = SUBMISSION_STATUS_COLORS[item.status as SubmissionStatus];
    const isPending = item.status === SUBMISSION_STATUS.PENDING;
    const isReviewed = item.status === SUBMISSION_STATUS.REVIEWED;

    return (
      <Animated.View entering={FadeInDown.delay(index * 40).duration(400)}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleViewSubmission(item, index)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.studentAvatar}>
              <User size={18} color={Colors.gray[400]} />
            </View>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{item.student_name}</Text>
              <Text style={styles.rollNumber}>
                {HOMEWORK_UI.ROLL}: {item.student_roll_number}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getSubmissionStatusLabel(item.status as SubmissionStatus)}
              </Text>
            </View>
          </View>

          {!isPending && (
            <View style={styles.cardDetails}>
              <View style={styles.detailItem}>
                <Clock size={14} color={Colors.gray[400]} />
                <Text style={styles.detailText}>{formatDate(item.submitted_at)}</Text>
              </View>
              {!!item.is_late && (
                <View style={styles.lateBadge}>
                  <AlertTriangle size={12} color="#dc2626" />
                  <Text style={styles.lateText}>{HOMEWORK_UI.LATE}</Text>
                </View>
              )}
            </View>
          )}

          {isReviewed && item.reviewed_by_name && (
            <View style={styles.reviewInfo}>
              <CheckCircle size={14} color="#10b981" />
              <Text style={styles.reviewText}>
                {HOMEWORK_UI.REVIEWED_BY} {item.reviewed_by_name}
              </Text>
            </View>
          )}

          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                canReview && !isReviewed ? styles.reviewBtn : styles.viewBtn,
              ]}
              onPress={() => handleViewSubmission(item, index)}
            >
              <Eye size={16} color={canReview && !isReviewed ? '#fff' : Colors.primary[500]} />
              <Text
                style={[
                  styles.actionBtnText,
                  canReview && !isReviewed ? styles.reviewBtnText : styles.viewBtnText,
                ]}
              >
                {canReview && !isReviewed ? 'Review' : 'View'}
              </Text>
            </TouchableOpacity>
            <ChevronRight size={20} color={Colors.gray[300]} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

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
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>{HOMEWORK_UI.SUBMISSIONS}</Text>
              <Text style={headerStyles.subtitle} numberOfLines={1}>
                {homework?.title ?? 'Loading...'}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Stats Summary */}
      {stats && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total_students}</Text>
            <Text style={styles.statLabel}>{HOMEWORK_UI.TOTAL_STUDENTS}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#3b82f6' }]}>{stats.submitted}</Text>
            <Text style={styles.statLabel}>{HOMEWORK_UI.SUBMITTED}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.reviewed}</Text>
            <Text style={styles.statLabel}>{HOMEWORK_UI.REVIEWED}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#94a3b8' }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>{HOMEWORK_UI.PENDING}</Text>
          </View>
        </View>
      )}

      {/* Permission Notice */}
      {!canReview && !isAdmin && (
        <View style={styles.permissionNotice}>
          <AlertTriangle size={16} color="#f59e0b" />
          <Text style={styles.permissionText}>{HOMEWORK_UI.ONLY_ASSIGNED_TEACHER_CAN_REVIEW}</Text>
        </View>
      )}

      {/* Status Filters */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterChip, statusFilter === f.value && { backgroundColor: f.color }]}
            onPress={() => setStatusFilter(f.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === f.value && styles.filterChipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={16} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder={HOMEWORK_UI.SEARCH_STUDENTS}
            placeholderTextColor="#94a3b8"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchText ? (
            <TouchableOpacity onPress={clearSearch}>
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Submissions List */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={submissions}
          keyExtractor={(item) => item.public_id}
          renderItem={renderSubmissionItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <User size={48} color={Colors.gray[300]} />
              <Text style={styles.emptyTitle}>
                {searchQuery ? HOMEWORK_UI.NO_MATCHING_SUBMISSIONS : HOMEWORK_UI.NO_SUBMISSIONS_YET}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery ? HOMEWORK_UI.NO_MATCHING_DESC : HOMEWORK_UI.NO_SUBMISSIONS_DESC}
              </Text>
              {searchQuery && (
                <TouchableOpacity style={styles.clearFilterBtn} onPress={clearSearch}>
                  <Text style={styles.clearFilterBtnText}>Clear search</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gray[800],
  },
  statLabel: {
    fontSize: 10,
    color: Colors.gray[500],
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.gray[200],
  },
  permissionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#fcd34d',
  },
  permissionText: {
    fontSize: 12,
    color: '#92400e',
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.gray[100],
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  filterChipTextActive: {
    color: '#fff',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray[800],
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  rollNumber: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  lateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  lateText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#dc2626',
  },
  reviewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  reviewText: {
    fontSize: 11,
    color: '#10b981',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewBtn: {
    backgroundColor: Colors.primary[50],
  },
  reviewBtn: {
    backgroundColor: Colors.primary[500],
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  viewBtnText: {
    color: Colors.primary[500],
  },
  reviewBtnText: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[600],
    marginTop: 16,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.gray[400],
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  clearFilterBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
  },
  clearFilterBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary[500],
  },
});
