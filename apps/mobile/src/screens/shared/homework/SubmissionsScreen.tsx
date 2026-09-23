/**
 * Homework Submissions Screen
 * Lists all submissions for a specific homework with filtering.
 */

import {
  Colors,
  getRoleGradient,
  SUBMISSION_STATUS,
  HOMEWORK_UI,
} from '@educard/shared';
import type { HomeworkSubmission } from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import {
  ChevronLeft,
  Search,
  X,
  User,
  AlertTriangle,
} from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useSubmissions, useHomeworkDetail } from '@/features/homework';
import { useUserProfile } from '@/hooks';
import { useScreenFilters } from '@/hooks/useScreenFilters';
import { useAuthStore } from '@/lib/auth-store';
import { LinearGradient } from '@/lib/linear-gradient';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';
import { isAdminRole } from '@/utils/role-utils';

import { SubmissionListItem } from './SubmissionListItem';
import { styles } from './submissions-styles';

const adminGradient = getRoleGradient('admin');

const STATUS_FILTERS = [
  { label: 'All', value: '', color: '#6366f1' },
  {
    label: HOMEWORK_UI.PENDING,
    value: SUBMISSION_STATUS.PENDING,
    color: '#94a3b8',
  },
  {
    label: HOMEWORK_UI.SUBMITTED,
    value: SUBMISSION_STATUS.SUBMITTED,
    color: '#3b82f6',
  },
  {
    label: HOMEWORK_UI.REVIEWED,
    value: SUBMISSION_STATUS.REVIEWED,
    color: '#10b981',
  },
];

export default function SubmissionsScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const route =
    useRoute<RouteProp<SharedStackParamList, 'HomeworkSubmissions'>>();
  const { homework_id } = route.params;
  const { user } = useAuthStore();
  const { data: profile } = useUserProfile();
  const isAdmin = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const [refreshing, setRefreshing] = useState(false);
  const {
    filters,
    search: searchQuery,
    setFilter,
    setSearch: setSearchQuery,
  } = useScreenFilters<{ status: string }>('HomeworkSubmissions', {
    status: '',
  });
  const statusFilter = filters.status;
  const [searchText, setSearchText] = useState(searchQuery);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

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
      s =>
        s.student_name.toLowerCase().includes(q) ||
        s.student_roll_number.toLowerCase().includes(q),
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

  const handleViewSubmission = useCallback(
    (submission: HomeworkSubmission, index: number) => {
      navigation.navigate('HomeworkReview', {
        homework_id: homework_id,
        submission_id: submission.public_id,
        index: String(index),
        total: String(submissions.length),
      });
    },
    [navigation, homework_id, submissions.length],
  );

  const renderSubmissionItem = useCallback(
    ({ item, index }: { item: HomeworkSubmission; index: number }) => (
      <SubmissionListItem
        item={item}
        index={index}
        canReview={canReview}
        onView={handleViewSubmission}
      />
    ),
    [canReview, handleViewSubmission],
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
            <Text style={[styles.statValue, styles.statValueBlue]}>
              {stats.submitted}
            </Text>
            <Text style={styles.statLabel}>{HOMEWORK_UI.SUBMITTED}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, styles.statValueGreen]}>
              {stats.reviewed}
            </Text>
            <Text style={styles.statLabel}>{HOMEWORK_UI.REVIEWED}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, styles.statValueGray]}>
              {stats.pending}
            </Text>
            <Text style={styles.statLabel}>{HOMEWORK_UI.PENDING}</Text>
          </View>
        </View>
      )}

      {/* Permission Notice */}
      {!canReview && !isAdmin && (
        <View style={styles.permissionNotice}>
          <AlertTriangle size={16} color="#f59e0b" />
          <Text style={styles.permissionText}>
            {HOMEWORK_UI.ONLY_ASSIGNED_TEACHER_CAN_REVIEW}
          </Text>
        </View>
      )}

      {/* Status Filters */}
      <View style={styles.filterRow}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.filterChip,
              statusFilter === f.value && { backgroundColor: f.color },
            ]}
            onPress={() => setFilter('status', f.value)}
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
          keyExtractor={item => item.public_id}
          renderItem={renderSubmissionItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <User size={48} color={Colors.gray[300]} />
              <Text style={styles.emptyTitle}>
                {searchQuery
                  ? HOMEWORK_UI.NO_MATCHING_SUBMISSIONS
                  : HOMEWORK_UI.NO_SUBMISSIONS_YET}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? HOMEWORK_UI.NO_MATCHING_DESC
                  : HOMEWORK_UI.NO_SUBMISSIONS_DESC}
              </Text>
              {searchQuery && (
                <TouchableOpacity
                  style={styles.clearFilterBtn}
                  onPress={clearSearch}
                >
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
