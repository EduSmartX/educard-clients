/**
 * Announcement Detail Screen
 * Full view of a sent Email/SMS announcement, including the message body.
 */

import { getRoleGradient } from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { format } from 'date-fns';
import { ChevronLeft, Mail, MessageSquare } from 'lucide-react-native';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  DELIVERY_METHOD_LABELS,
  RECIPIENT_TYPE_LABELS,
  useAnnouncementDetail,
  type AnnouncementListItem,
} from '@/features/announcements';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackParamList } from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';
import { useAuthStore } from '@/lib/auth-store';
import { isAdminRole } from '@/utils/role-utils';

const adminGradient = getRoleGradient('admin');

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return format(parsed, 'dd MMM yyyy, HH:mm');
}

/** Convert stored rich-text HTML into readable plain text for display. */
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function statusStyle(status: AnnouncementListItem['status']) {
  if (status === 'sent')
    return { bg: '#dcfce7', color: '#15803d', label: 'Sent' };
  if (status === 'failed')
    return { bg: '#fee2e2', color: '#b91c1c', label: 'Failed' };
  return { bg: '#f1f5f9', color: '#475569', label: 'Draft' };
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

function ChannelStat({
  icon,
  title,
  stat,
}: {
  icon: React.ReactNode;
  title: string;
  stat: { attempted: number; sent: number; failed: number };
}) {
  return (
    <View style={s.channelCard}>
      <View style={s.channelHead}>
        {icon}
        <Text style={s.channelTitle}>{title}</Text>
      </View>
      <View style={s.channelStats}>
        <View style={s.channelStatBox}>
          <Text style={s.channelStatValue}>{stat.attempted}</Text>
          <Text style={s.channelStatLabel}>Attempted</Text>
        </View>
        <View style={s.channelStatBox}>
          <Text style={[s.channelStatValue, s.statSent]}>{stat.sent}</Text>
          <Text style={s.channelStatLabel}>Sent</Text>
        </View>
        <View style={s.channelStatBox}>
          <Text style={[s.channelStatValue, s.statFailed]}>{stat.failed}</Text>
          <Text style={s.channelStatLabel}>Failed</Text>
        </View>
      </View>
    </View>
  );
}

export default function AnnouncementDetailScreen() {
  const navigation = useNavigation();
  const route =
    useRoute<RouteProp<SharedStackParamList, 'AnnouncementDetail'>>();
  const { publicId } = route.params;
  const role = useAuthStore(state => state.user?.role);
  const isAdmin = isAdminRole(role);
  const { data, isLoading, isError } = useAnnouncementDetail(publicId);

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  const status = data ? statusStyle(data.status) : null;
  const bodyText = data?.body_html ? htmlToText(data.body_html) : '';
  const channels = data?.delivery_stats?.channels;

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={handleBack}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Announcement</Text>
              <Text style={headerStyles.subtitle}>
                {isAdmin ? 'Full delivery details' : 'Announcement details'}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : isError || !data ? (
        <View style={s.centered}>
          <Text style={s.errorText}>Could not load this announcement.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.card}>
            <View style={s.subjectRow}>
              <Text style={s.subject}>{data.subject}</Text>
              {status && (
                <View style={[s.badge, { backgroundColor: status.bg }]}>
                  <Text style={[s.badgeText, { color: status.color }]}>
                    {status.label}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.sectionTitle}>Message</Text>
            <Text style={s.body}>{bodyText || 'No message content.'}</Text>
          </View>

          <View style={s.card}>
            <Text style={s.sectionTitle}>Details</Text>
            {isAdmin && (
              <>
                <InfoRow
                  label="Delivery"
                  value={DELIVERY_METHOD_LABELS[data.delivery_methods]}
                />
                <InfoRow
                  label="Recipients"
                  value={RECIPIENT_TYPE_LABELS[data.recipient_type]}
                />
                {!!data.manual_emails && (
                  <InfoRow label="Emails" value={data.manual_emails} />
                )}
                <InfoRow label="Sent by" value={data.sent_by_name ?? '—'} />
                <InfoRow label="Sent to" value={String(data.recipient_count)} />
              </>
            )}
            {!!data.event_name && (
              <InfoRow label="Event" value={data.event_name} />
            )}
            {!!data.event_date && (
              <InfoRow label="Event date" value={data.event_date} />
            )}
            {!!data.event_note && (
              <InfoRow label="Note" value={data.event_note} />
            )}
            <InfoRow
              label="Sent at"
              value={formatDateTime(data.sent_at ?? data.created_at)}
            />
          </View>

          {(channels?.email || channels?.sms) && (
            <View style={s.card}>
              <Text style={s.sectionTitle}>Delivery breakdown</Text>
              {channels?.email && (
                <ChannelStat
                  icon={<Mail size={16} color="#2563eb" />}
                  title="Email"
                  stat={channels.email}
                />
              )}
              {channels?.sms && (
                <ChannelStat
                  icon={<MessageSquare size={16} color="#7c3aed" />}
                  title="SMS"
                  stat={channels.sms}
                />
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: { fontSize: 14, color: '#64748b' },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eef2f7',
  },
  subjectRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  subject: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 24,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  body: { fontSize: 14, color: '#334155', lineHeight: 21 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
  },
  infoLabel: { fontSize: 13, color: '#64748b' },
  infoValue: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
    textAlign: 'right',
  },
  channelCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  channelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  channelTitle: { fontSize: 14, fontWeight: '700', color: '#334155' },
  channelStats: { flexDirection: 'row', gap: 8 },
  channelStatBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 10,
  },
  channelStatValue: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  channelStatLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  statSent: { color: '#16a34a' },
  statFailed: { color: '#dc2626' },
});
