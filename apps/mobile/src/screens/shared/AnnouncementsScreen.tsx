/**
 * Announcements Screen — shared-stack "Announcements"
 * Lists sent announcements with delivery status and retry for failed ones.
 */

import { extractApiError, getRoleGradient } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Eye,
  Loader2,
  Megaphone,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  FilterModal,
  type FilterField,
} from '@/components/filters/FilterModal';
import { FormDatePicker } from '@/components/forms';
import {
  DELIVERY_METHOD_LABELS,
  RECIPIENT_TYPE_LABELS,
  useAnnouncements,
  useRetryAnnouncement,
  type AnnouncementListItem,
} from '@/features/announcements';
import {
  ANNOUNCEMENT_DELIVERY_METHODS,
  ANNOUNCEMENT_RECIPIENT_TYPES,
} from '@/features/announcements/types';
import { LinearGradient } from '@/lib/linear-gradient';
import { useToast } from '@/lib/toast-context';
import { useAuthStore } from '@/lib/auth-store';
import type { SharedStackNavigation } from '@/navigation/types';
import {
  cardStyles,
  dividerStyles,
  headerStyles,
  layoutStyles,
} from '@/styles';
import { isAdminRole } from '@/utils/role-utils';

const adminGradient = getRoleGradient('admin');

const ANNOUNCEMENT_FILTER_FIELDS: FilterField[] = [
  {
    name: 'delivery_methods',
    label: 'Delivery',
    type: 'select',
    icon: '📤',
    options: [
      { value: '', label: 'All' },
      { value: ANNOUNCEMENT_DELIVERY_METHODS.EMAIL, label: '✉️ Email' },
      { value: ANNOUNCEMENT_DELIVERY_METHODS.SMS, label: '💬 SMS' },
    ],
  },
  {
    name: 'recipient_type',
    label: 'Recipients',
    type: 'select',
    icon: '👥',
    options: [
      { value: '', label: 'All' },
      { value: ANNOUNCEMENT_RECIPIENT_TYPES.ALL_USERS, label: 'All Users' },
      {
        value: ANNOUNCEMENT_RECIPIENT_TYPES.ALL_STUDENTS,
        label: 'All Students',
      },
      {
        value: ANNOUNCEMENT_RECIPIENT_TYPES.ALL_TEACHERS,
        label: 'All Teachers',
      },
      { value: ANNOUNCEMENT_RECIPIENT_TYPES.ALL_PARENTS, label: 'All Parents' },
      {
        value: ANNOUNCEMENT_RECIPIENT_TYPES.SPECIFIC_CLASSES,
        label: 'Specific Classes',
      },
      {
        value: ANNOUNCEMENT_RECIPIENT_TYPES.MANUAL_EMAILS,
        label: 'Manual Emails',
      },
    ],
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    icon: '🏷️',
    options: [
      { value: '', label: 'All' },
      { value: 'sent', label: '✅ Sent' },
      { value: 'failed', label: '❌ Failed' },
      { value: 'draft', label: '📝 Draft' },
    ],
  },
];

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return format(parsed, 'dd MMM yyyy, HH:mm');
}

function statusStyles(status: AnnouncementListItem['status']) {
  if (status === 'sent') {
    return { container: s.statusSent, text: s.statusSentText, label: 'Sent' };
  }
  if (status === 'failed') {
    return {
      container: s.statusFailed,
      text: s.statusFailedText,
      label: 'Failed',
    };
  }
  return { container: s.statusDraft, text: s.statusDraftText, label: 'Draft' };
}

export default function AnnouncementsScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const role = useAuthStore(state => state.user?.role);
  const isAdmin = isAdminRole(role);
  const { showToast } = useToast();
  const { data = [], isLoading, refetch, isRefetching } = useAnnouncements();
  const retryMutation = useRetryAnnouncement();
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const activeFilterCount =
    (filters.delivery_methods ? 1 : 0) +
    (filters.recipient_type ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (fromDate ? 1 : 0) +
    (toDate ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return data.filter(item => {
      if (
        q &&
        !item.subject.toLowerCase().includes(q) &&
        !item.event_name.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (
        filters.delivery_methods &&
        item.delivery_methods !== filters.delivery_methods
      ) {
        return false;
      }
      if (
        filters.recipient_type &&
        item.recipient_type !== filters.recipient_type
      ) {
        return false;
      }
      if (filters.status && item.status !== filters.status) return false;
      const when = (item.sent_at ?? item.created_at)?.slice(0, 10);
      if (fromDate && when && when < fromDate) return false;
      if (toDate && when && when > toDate) return false;
      return true;
    });
  }, [data, filters, fromDate, toDate, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setFilters({});
    setFromDate('');
    setToDate('');
    setSearchQuery('');
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const onRetry = (publicId: string) => {
    setRetryingId(publicId);
    retryMutation.mutate(publicId, {
      onSuccess: () => {
        showToast({
          type: 'success',
          title: 'Retry queued',
          message: 'Failed announcement is queued for delivery.',
        });
      },
      onError: (error: unknown) => {
        showToast({
          type: 'error',
          title: 'Retry failed',
          message: extractApiError(error, 'Could not retry announcement'),
        });
      },
      onSettled: () => {
        setRetryingId(null);
      },
    });
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
            <TouchableOpacity style={headerStyles.backBtn} onPress={handleBack}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Sent announcements</Text>
              <Text style={headerStyles.subtitle}>
                View status and retry failed deliveries
              </Text>
            </View>
            <TouchableOpacity
              style={s.filterBtn}
              onPress={() => setShowFilterModal(true)}
            >
              <SlidersHorizontal size={18} color="#fff" />
              {activeFilterCount > 0 && (
                <View style={s.filterBadge}>
                  <Text style={s.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity
                style={s.addBtn}
                onPress={() => navigation.navigate('AnnouncementCreate')}
                accessibilityLabel="Add announcement"
              >
                <Text style={s.addBtnText}>+</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <View style={s.body}>
        {isLoading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={s.loadingText}>Loading announcements...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={item => item.public_id}
            contentContainerStyle={s.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => void refetch()}
              />
            }
            ListHeaderComponent={
              <View style={s.filterBar}>
                <View style={s.searchWrap}>
                  <Search size={16} color="#94a3b8" />
                  <TextInput
                    style={s.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search by subject or event..."
                    placeholderTextColor="#94a3b8"
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      hitSlop={8}
                    >
                      <X size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={s.dateRow}>
                  <View style={s.dateCol}>
                    <FormDatePicker
                      label="From"
                      value={fromDate}
                      onChange={setFromDate}
                      placeholder="Start date"
                    />
                  </View>
                  <View style={s.dateCol}>
                    <FormDatePicker
                      label="To"
                      value={toDate}
                      onChange={setToDate}
                      placeholder="End date"
                    />
                  </View>
                </View>
                {activeFilterCount > 0 && (
                  <TouchableOpacity style={s.clearBtn} onPress={clearFilters}>
                    <X size={14} color="#dc2626" />
                    <Text style={s.clearBtnText}>
                      Clear filters ({activeFilterCount})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            ListEmptyComponent={
              <View style={s.emptyState}>
                <Megaphone size={20} color="#94a3b8" />
                <Text style={s.emptyTitle}>
                  {data.length === 0 ? 'No announcements yet' : 'No matches'}
                </Text>
                <Text style={s.emptyText}>
                  {data.length === 0
                    ? 'Create an announcement from web to start delivery.'
                    : 'Try adjusting or clearing your filters.'}
                </Text>
              </View>
            }
            renderItem={({ item, index }) => {
              if (!isAdmin) {
                return (
                  <Animated.View
                    entering={FadeInDown.delay(40 * (index + 1)).springify()}
                  >
                    <TouchableOpacity
                      style={cardStyles.cardLarge}
                      onPress={() =>
                        navigation.navigate('AnnouncementDetail', {
                          publicId: item.public_id,
                        })
                      }
                    >
                      <View style={s.rowTop}>
                        <View style={s.titleWrap}>
                          <Text style={s.subject}>{item.subject}</Text>
                          {!!item.event_name && (
                            <Text style={s.deliveryTag}>{item.event_name}</Text>
                          )}
                          <Text style={s.metaLine}>
                            {formatDateTime(item.sent_at ?? item.created_at)}
                          </Text>
                        </View>
                        <Eye size={18} color="#2563eb" />
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              }
              const status = statusStyles(item.status);
              const retrying =
                retryMutation.isPending && retryingId === item.public_id;
              const stats = item.delivery_stats?.recipients;
              const totalUsers = stats?.target_users;
              const verifiedUsers = stats?.eligible_users;
              const isOpen = expandedIds.has(item.public_id);
              return (
                <Animated.View
                  entering={FadeInDown.delay(40 * (index + 1)).springify()}
                >
                  <View style={cardStyles.cardLarge}>
                    <View style={s.rowTop}>
                      <View style={s.titleWrap}>
                        <Text style={s.subject}>{item.subject}</Text>
                        <Text style={s.deliveryTag}>
                          {DELIVERY_METHOD_LABELS[item.delivery_methods]}
                        </Text>
                      </View>
                      <View style={[s.statusBadge, status.container]}>
                        <Text style={[s.statusLabel, status.text]}>
                          {status.label}
                        </Text>
                      </View>
                    </View>

                    <View style={s.actionsRow}>
                      <TouchableOpacity
                        style={s.viewBtn}
                        onPress={() =>
                          navigation.navigate('AnnouncementDetail', {
                            publicId: item.public_id,
                          })
                        }
                      >
                        <Eye size={15} color="#2563eb" />
                        <Text style={s.viewBtnText}>View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.expandBtn}
                        onPress={() => toggleExpand(item.public_id)}
                      >
                        <Text style={s.expandBtnText}>
                          {isOpen ? 'Hide' : 'Details'}
                        </Text>
                        {isOpen ? (
                          <ChevronUp size={16} color="#64748b" />
                        ) : (
                          <ChevronDown size={16} color="#64748b" />
                        )}
                      </TouchableOpacity>
                    </View>

                    {isOpen && (
                      <>
                        <View style={dividerStyles.spaced} />

                        <Text style={s.metaLine}>
                          Recipients:{' '}
                          {RECIPIENT_TYPE_LABELS[item.recipient_type]}
                        </Text>
                        <Text style={s.metaLine}>
                          Sent:{' '}
                          {formatDateTime(item.sent_at ?? item.created_at)}
                        </Text>

                        <View style={s.statsRow}>
                          <View style={s.statBox}>
                            <Text style={s.statValue}>{totalUsers ?? '—'}</Text>
                            <Text style={s.statLabel}>Total users</Text>
                          </View>
                          <View style={s.statBox}>
                            <Text style={s.statValue}>
                              {verifiedUsers ?? '—'}
                            </Text>
                            <Text style={s.statLabel}>Verified</Text>
                          </View>
                          <View style={s.statBox}>
                            <Text style={[s.statValue, s.statValueAccent]}>
                              {item.recipient_count}
                            </Text>
                            <Text style={s.statLabel}>Sent to</Text>
                          </View>
                        </View>
                      </>
                    )}

                    {item.status === 'failed' && (
                      <View style={s.retryRow}>
                        <TouchableOpacity
                          style={[
                            s.retryButton,
                            retrying && s.retryButtonDisabled,
                          ]}
                          disabled={retrying}
                          onPress={() => onRetry(item.public_id)}
                        >
                          {retrying ? (
                            <Loader2 size={14} color="#ffffff" />
                          ) : (
                            <RotateCcw size={14} color="#ffffff" />
                          )}
                          <Text style={s.retryButtonText}>
                            {retrying ? 'Retrying...' : 'Retry failed'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </Animated.View>
              );
            }}
          />
        )}
      </View>

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={f => {
          setFilters(f);
          setShowFilterModal(false);
        }}
        fields={ANNOUNCEMENT_FILTER_FIELDS}
        currentFilters={filters}
        title="Filter announcements"
      />
    </View>
  );
}

const s = StyleSheet.create({
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  addBtn: {
    width: 40,
    height: 40,
    marginLeft: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  addBtnText: {
    color: '#4f46e5',
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '500',
  },
  filterBar: { marginBottom: 4 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#0f172a', padding: 0 },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateCol: { flex: 1 },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  clearBtnText: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
  titleWrap: { flex: 1, gap: 4 },
  deliveryTag: { fontSize: 12, color: '#7c3aed', fontWeight: '600' },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  viewBtnText: { color: '#2563eb', fontSize: 13, fontWeight: '700' },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  expandBtnText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  body: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 13,
  },
  emptyState: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  subject: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusSent: {
    backgroundColor: '#dcfce7',
  },
  statusSentText: {
    color: '#15803d',
  },
  statusFailed: {
    backgroundColor: '#fee2e2',
  },
  statusFailedText: {
    color: '#b91c1c',
  },
  statusDraft: {
    backgroundColor: '#e2e8f0',
  },
  statusDraftText: {
    color: '#334155',
  },
  metaLine: {
    color: '#334155',
    fontSize: 13,
    marginBottom: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  statValueAccent: {
    color: '#1d4ed8',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  retryRow: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryButtonDisabled: {
    opacity: 0.7,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
