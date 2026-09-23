/**
 * Student Fees Screen
 * List student fees filtered by class, status, search
 * Supports recording payments per student
 */

import { FeeStatusOptions, FeeStatus } from '@educard/shared';
import type {
  StudentFee,
  FeeStatusType,
  ReminderChannelType,
} from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { ChevronLeft, Users, Plus } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  EmptyState,
  ErrorState,
  LoadingState,
  ListFooter,
} from '@/components/common/ListStates';
import { SearchBar } from '@/components/common/SearchBar';
import { ClassFilterDropdown } from '@/components/filters';
import { FormDropdown } from '@/components/forms/FormDropdown';
import { RecordPaymentModal } from '@/features/fee/components/record-payment-modal';
import { SendReminderModal } from '@/features/fee/components/send-reminder-modal';
import { useScreenFilters } from '@/hooks/useScreenFilters';
import { LinearGradient } from '@/lib/linear-gradient';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';

import { useStudentFees, useSendFeeReminder } from '../hooks';

import { StudentFeeCard } from './StudentFeeCard';
import { styles } from './student-fees-styles';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  ...FeeStatusOptions,
];

export default function StudentFeesScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const route = useRoute<RouteProp<SharedStackParamList, 'FeeStudentFees'>>();
  const params = route.params ?? {};

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  const {
    filters: screenFilters,
    search,
    setFilter,
    setSearch,
  } = useScreenFilters('StudentFees', { status: '', class_public_id: '' });
  const statusFilter = screenFilters.status;
  const classFilter = screenFilters.class_public_id;

  // Apply an explicit class param (drilled in from a class context) once.
  useEffect(() => {
    if (params.class_public_id)
      setFilter('class_public_id', params.class_public_id);
  }, [params.class_public_id, setFilter]);

  const [paymentTarget, setPaymentTarget] = useState<StudentFee | null>(null);
  const scrollY = useRef(0);

  const queryFilters = {
    status: (statusFilter || undefined) as FeeStatusType | undefined,
    class_public_id: classFilter || undefined,
    fee_structure_public_id: params.fee_structure_public_id || undefined,
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
  } = useStudentFees(queryFilters);

  const { mutate: sendReminder, isPending: reminderPending } =
    useSendFeeReminder();

  const [reminderTarget, setReminderTarget] = useState<StudentFee | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);

  const items = data?.items ?? [];
  // Exclude refunded records by default (soft-deleted on backend, safety filter here)
  const activeItems =
    statusFilter === FeeStatus.REFUNDED
      ? items
      : items.filter(s => s.status !== FeeStatus.REFUNDED);
  const filtered = search
    ? activeItems.filter(
        s =>
          s.student_name.toLowerCase().includes(search.toLowerCase()) ||
          s.student_roll_number?.toLowerCase().includes(search.toLowerCase()),
      )
    : activeItems;

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

  const handleSendReminder = useCallback((item: StudentFee) => {
    setReminderTarget(item);
    setShowReminderModal(true);
  }, []);

  const handleReminderSend = useCallback(
    (channel: ReminderChannelType) => {
      if (!reminderTarget) return;
      sendReminder(
        {
          student_fee_public_id: reminderTarget.public_id,
          delivery_methods: [channel],
        },
        {
          onSuccess: () => {
            setShowReminderModal(false);
            setReminderTarget(null);
          },
        },
      );
    },
    [reminderTarget, sendReminder],
  );

  const handleViewDetail = useCallback(
    (id: string) => {
      navigation.navigate('FeeStudentDetail', { id });
    },
    [navigation],
  );

  const handleEdit = useCallback(
    (id: string) => {
      navigation.navigate('FeeStudentEdit', { id });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: StudentFee }) => (
      <StudentFeeCard
        item={item}
        onRecordPayment={setPaymentTarget}
        onSendReminder={handleSendReminder}
        onViewDetail={handleViewDetail}
        onEdit={handleEdit}
      />
    ),
    [handleSendReminder, handleViewDetail, handleEdit],
  );

  if (isLoading)
    return <LoadingState color="#7c3aed" message="Loading student fees..." />;
  if (isError)
    return (
      <ErrorState
        message="Failed to load student fees"
        onRetry={() => void refetch()}
      />
    );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#7c3aed', '#a78bfa']} style={styles.header}>
        <Animated.View entering={FadeIn.delay(100)} style={styles.circle1} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Student Fees</Text>
            <Text style={styles.headerSub}>
              {data?.totalCount ?? 0} records
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('FeeAssignStudent')}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Filters */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.filters}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search student name or roll..."
        />
        <View style={styles.filterRow}>
          <View style={styles.flex1}>
            <ClassFilterDropdown
              label="Class"
              value={classFilter}
              onChange={v => setFilter('class_public_id', v)}
              includeAllOption
              allOptionLabel="All Classes"
            />
          </View>
          <View style={styles.flex1}>
            <FormDropdown
              label="Status"
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={v => setFilter('status', v)}
              searchable
            />
          </View>
        </View>
      </Animated.View>

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
            tintColor="#7c3aed"
          />
        }
        ListFooterComponent={
          <ListFooter isLoading={isFetchingNextPage} color="#7c3aed" />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Users size={48} color="#cbd5e1" />}
            message="No student fees found"
            subMessage="Try adjusting your filters"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Record Payment Modal */}
      {paymentTarget && (
        <RecordPaymentModal
          studentFee={paymentTarget}
          mode={
            paymentTarget.status === FeeStatus.REFUNDING ||
            paymentTarget.status === FeeStatus.OVERPAID
              ? 'refund'
              : 'payment'
          }
          visible={!!paymentTarget}
          onClose={() => setPaymentTarget(null)}
        />
      )}

      {/* Send Reminder Modal */}
      <SendReminderModal
        visible={showReminderModal}
        onClose={() => {
          setShowReminderModal(false);
          setReminderTarget(null);
        }}
        studentFee={reminderTarget}
        onSend={handleReminderSend}
        isLoading={reminderPending}
      />
    </View>
  );
}
