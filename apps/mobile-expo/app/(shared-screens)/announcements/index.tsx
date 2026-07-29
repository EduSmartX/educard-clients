import { extractApiError, getRoleGradient } from '@educard/shared';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Loader2, Megaphone, RotateCcw } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  DELIVERY_METHOD_LABELS,
  RECIPIENT_TYPE_LABELS,
  useAnnouncements,
  useRetryAnnouncement,
  type AnnouncementListItem,
} from '@/features/announcements';
import { useToast } from '@/lib/toast-context';
import { cardStyles, dividerStyles, headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

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
    return { container: s.statusFailed, text: s.statusFailedText, label: 'Failed' };
  }
  return { container: s.statusDraft, text: s.statusDraftText, label: 'Draft' };
}

export default function AnnouncementsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { data = [], isLoading, refetch, isRefetching } = useAnnouncements();
  const retryMutation = useRetryAnnouncement();
  const [retryingId, setRetryingId] = useState<string | null>(null);

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
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Sent announcements</Text>
              <Text style={headerStyles.subtitle}>View status and retry failed deliveries</Text>
            </View>
            <View style={{ width: 40 }} />
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
            data={data}
            keyExtractor={(item) => item.public_id}
            contentContainerStyle={s.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
            }
            ListEmptyComponent={
              <View style={s.emptyState}>
                <Megaphone size={20} color="#94a3b8" />
                <Text style={s.emptyTitle}>No announcements yet</Text>
                <Text style={s.emptyText}>Create an announcement from web to start delivery.</Text>
              </View>
            }
            renderItem={({ item, index }) => {
              const status = statusStyles(item.status);
              const retrying = retryMutation.isPending && retryingId === item.public_id;
              return (
                <Animated.View entering={FadeInDown.delay(40 * (index + 1)).springify()}>
                  <View style={cardStyles.cardLarge}>
                    <View style={s.rowTop}>
                      <Text style={s.subject}>{item.subject}</Text>
                      <View style={[s.statusBadge, status.container]}>
                        <Text style={[s.statusLabel, status.text]}>{status.label}</Text>
                      </View>
                    </View>

                    <View style={dividerStyles.spaced} />

                    <Text style={s.metaLine}>
                      Delivery: {DELIVERY_METHOD_LABELS[item.delivery_methods]}
                    </Text>
                    <Text style={s.metaLine}>
                      Recipients: {RECIPIENT_TYPE_LABELS[item.recipient_type]}
                    </Text>
                    <Text style={s.metaLine}>
                      Sent: {formatDateTime(item.sent_at ?? item.created_at)}
                    </Text>

                    {(() => {
                      const stats = item.delivery_stats?.recipients;
                      const totalUsers = stats?.target_users;
                      const verifiedUsers = stats?.eligible_users;
                      return (
                        <View style={s.statsRow}>
                          <View style={s.statBox}>
                            <Text style={s.statValue}>{totalUsers ?? '—'}</Text>
                            <Text style={s.statLabel}>Total users</Text>
                          </View>
                          <View style={s.statBox}>
                            <Text style={s.statValue}>{verifiedUsers ?? '—'}</Text>
                            <Text style={s.statLabel}>Verified</Text>
                          </View>
                          <View style={s.statBox}>
                            <Text style={[s.statValue, s.statValueAccent]}>
                              {item.recipient_count}
                            </Text>
                            <Text style={s.statLabel}>Sent to</Text>
                          </View>
                        </View>
                      );
                    })()}

                    {item.status === 'failed' && (
                      <View style={s.retryRow}>
                        <TouchableOpacity
                          style={[s.retryButton, retrying && s.retryButtonDisabled]}
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
    </View>
  );
}

const s = StyleSheet.create({
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
