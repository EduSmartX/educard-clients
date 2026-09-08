/**
 * Notification Inbox Screen — shared-stack "NotificationInbox"
 * Server-backed in-app inbox with unread state and read/archive actions.
 */

import {
  NOTIFICATION_CATEGORY_LABELS,
  extractApiError,
  getRoleGradient,
  type UserNotification,
} from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';
import {
  Archive,
  Bell,
  BellOff,
  CheckCheck,
  ChevronLeft,
  Settings2,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  useArchiveNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationInbox,
} from '@/features/notifications/hooks/use-notifications';
import { useAuthStore } from '@/lib/auth-store';
import { LinearGradient } from '@/lib/linear-gradient';
import { useToast } from '@/lib/toast-context';
import type { SharedStackNavigation } from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

function relativeTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return formatDistanceToNow(parsed, { addSuffix: true });
}

export default function NotificationInboxScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const role = useAuthStore(state => state.user?.role);
  const { showToast } = useToast();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const gradient = getRoleGradient(role ?? 'admin') ?? adminGradient;

  const {
    data: pages,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotificationInbox(unreadOnly ? { unread: true } : {});

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const archive = useArchiveNotification();

  const notifications = useMemo(
    () => pages?.pages.flatMap(page => page.items) ?? [],
    [pages],
  );

  const openNotification = (item: UserNotification) => {
    if (!item.is_read) {
      markRead.mutate(item.public_id);
    }
    if (item.resource_type === 'announcement' && item.resource_public_id) {
      navigation.navigate('AnnouncementDetail', {
        publicId: item.resource_public_id,
      });
    }
  };

  const onArchive = (item: UserNotification) => {
    archive.mutate(item.public_id, {
      onError: (error: unknown) => {
        showToast({
          type: 'error',
          title: 'Could not archive',
          message: extractApiError(error, 'Please try again'),
        });
      },
    });
  };

  const renderItem = ({ item }: { item: UserNotification }) => (
    <View style={[s.card, !item.is_read && s.cardUnread]}>
      <TouchableOpacity
        style={s.cardMain}
        onPress={() => openNotification(item)}
      >
        <View style={s.cardTopRow}>
          {!item.is_read && <View style={s.unreadDot} />}
          <Text
            style={[s.cardTitle, !item.is_read && s.cardTitleUnread]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={s.cardTime}>{relativeTime(item.created_at)}</Text>
        </View>
        {!!item.body && (
          <Text style={s.cardBody} numberOfLines={3}>
            {item.body}
          </Text>
        )}
        <View style={s.categoryChip}>
          <Text style={s.categoryChipText}>
            {NOTIFICATION_CATEGORY_LABELS[item.category] ?? item.category}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={s.archiveBtn}
        onPress={() => onArchive(item)}
        accessibilityLabel="Archive notification"
      >
        <Archive size={18} color="#94a3b8" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={gradient} style={headerStyles.header}>
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
            <TouchableOpacity
              style={headerStyles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Notifications</Text>
              <Text style={headerStyles.subtitle}>
                Everything addressed to you
              </Text>
            </View>
            <TouchableOpacity
              style={s.headerBtn}
              onPress={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              accessibilityLabel="Mark all as read"
            >
              <CheckCheck size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={s.headerBtn}
              onPress={() => navigation.navigate('Notifications')}
              accessibilityLabel="Notification settings"
            >
              <Settings2 size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View style={s.filterRow}>
        <TouchableOpacity
          style={[s.filterChip, !unreadOnly && s.filterChipActive]}
          onPress={() => setUnreadOnly(false)}
        >
          <Text
            style={[s.filterChipText, !unreadOnly && s.filterChipTextActive]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.filterChip, unreadOnly && s.filterChipActive]}
          onPress={() => setUnreadOnly(true)}
        >
          <Text
            style={[s.filterChipText, unreadOnly && s.filterChipTextActive]}
          >
            Unread
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={s.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.public_id}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              void fetchNextPage();
            }
          }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              {unreadOnly ? (
                <BellOff size={40} color="#cbd5e1" />
              ) : (
                <Bell size={40} color="#cbd5e1" />
              )}
              <Text style={s.emptyTitle}>
                {unreadOnly ? 'No unread notifications' : 'Nothing here yet'}
              </Text>
              <Text style={s.emptyText}>
                New notifications will appear here.
              </Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={s.footerLoader} color="#2563eb" />
            ) : null
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginLeft: 6,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  filterChipActive: { backgroundColor: '#2563eb' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  filterChipTextActive: { color: '#fff' },
  listContent: { padding: 16, gap: 10, paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardUnread: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  cardMain: { flex: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  cardTitleUnread: { fontWeight: '700' },
  cardTime: { fontSize: 11, color: '#94a3b8' },
  cardBody: { marginTop: 6, fontSize: 13, color: '#64748b', lineHeight: 18 },
  categoryChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
  },
  categoryChipText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  archiveBtn: { padding: 8, marginLeft: 6 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 13, color: '#64748b' },
  emptyWrap: { alignItems: 'center', paddingVertical: 64, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#334155' },
  emptyText: { fontSize: 13, color: '#94a3b8' },
  footerLoader: { paddingVertical: 16 },
});
