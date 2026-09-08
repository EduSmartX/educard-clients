/**
 * Notifications Settings Screen
 * Server-backed per-category in-app and push preferences.
 */

import {
  extractApiError,
  getRoleGradient,
  type NotificationCategory,
  type NotificationPreferenceRow,
} from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Lock } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/features/notifications/hooks/use-notifications';
import { useAuthStore } from '@/lib/auth-store';
import { LinearGradient } from '@/lib/linear-gradient';
import { hasPushPermission, requestPushPermission } from '@/lib/push';
import { useToast } from '@/lib/toast-context';
import type { SharedStackNavigation } from '@/navigation/types';
import {
  headerStyles,
  layoutStyles,
  bodyStyles,
  cardStyles,
  dividerStyles,
  noteStyles,
} from '@/styles';

const adminGradient = getRoleGradient('admin');

type Draft = Record<string, { in_app_enabled: boolean; push_enabled: boolean }>;

function toDraft(rows: NotificationPreferenceRow[]): Draft {
  return rows.reduce<Draft>((acc, row) => {
    acc[row.category] = {
      in_app_enabled: row.in_app_enabled,
      push_enabled: row.push_enabled,
    };
    return acc;
  }, {});
}

export default function NotificationsScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const role = useAuthStore(state => state.user?.role);
  const { showToast } = useToast();
  const gradient = getRoleGradient(role ?? 'admin') ?? adminGradient;

  const { data, isLoading, isError } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [masterDraft, setMasterDraft] = useState<boolean | null>(null);

  const rows = data?.preferences ?? [];
  const effective = draft ?? toDraft(rows);
  const masterEnabled = masterDraft ?? data?.notifications_enabled ?? true;

  const persist = (next: Draft, master: boolean) => {
    setDraft(next);
    setMasterDraft(master);
    const payload = rows
      .filter(row => !row.is_locked)
      .map(row => ({
        category: row.category,
        in_app_enabled: next[row.category].in_app_enabled,
        push_enabled: next[row.category].push_enabled,
      }));

    updatePreferences.mutate(
      { notifications_enabled: master, preferences: payload },
      {
        onSuccess: () => {
          setDraft(null);
          setMasterDraft(null);
        },
        onError: (error: unknown) => {
          setDraft(null);
          setMasterDraft(null);
          showToast({
            type: 'error',
            title: 'Could not save',
            message: extractApiError(error, 'Please try again'),
          });
        },
      },
    );
  };

  const toggleMaster = async (value: boolean) => {
    if (value && !(await hasPushPermission())) {
      await requestPushPermission();
    }
    persist(effective, value);
  };

  const toggle = async (
    category: NotificationCategory,
    channel: 'in_app_enabled' | 'push_enabled',
    value: boolean,
  ) => {
    // Turning push on is pointless while the OS permission is denied.
    if (channel === 'push_enabled' && value && !(await hasPushPermission())) {
      const granted = await requestPushPermission();
      if (!granted) {
        showToast({
          type: 'info',
          title: 'Notifications are off',
          message: 'Enable notifications for EduCard in your device settings.',
        });
        return;
      }
    }

    persist(
      {
        ...effective,
        [category]: { ...effective[category], [channel]: value },
      },
      masterEnabled,
    );
  };

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
                Manage alerts & preferences
              </Text>
            </View>
            <View style={s.spacer} />
          </View>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={s.loadingText}>Loading preferences...</Text>
        </View>
      ) : (
        <ScrollView
          style={bodyStyles.scroll}
          contentContainerStyle={bodyStyles.content}
        >
          {isError && (
            <View style={noteStyles.muted}>
              <Text style={noteStyles.mutedText}>
                We could not load your preferences. Please try again later.
              </Text>
            </View>
          )}

          <Animated.View entering={FadeInDown.delay(50).springify()}>
            <View style={cardStyles.cardLarge}>
              <View style={s.row}>
                <View style={s.flex1}>
                  <Text style={s.rowTitle}>All notifications</Text>
                  <Text style={s.rowDesc}>
                    Turn off to silence every optional category
                  </Text>
                </View>
                <Switch
                  value={masterEnabled}
                  disabled={updatePreferences.isPending}
                  onValueChange={value => void toggleMaster(value)}
                  trackColor={{ false: '#e2e8f0', true: '#c4b5fd' }}
                  thumbColor={masterEnabled ? '#7c3aed' : '#94a3b8'}
                />
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View style={[cardStyles.cardLarge, !masterEnabled && s.dimmed]}>
              <View style={s.legendRow}>
                <Text style={s.legendLabel}>Category</Text>
                <Text style={s.legendChannel}>In-app</Text>
                <Text style={s.legendChannel}>Push</Text>
              </View>

              {rows.map((item, idx) => (
                <View key={item.category}>
                  {idx > 0 && <View style={dividerStyles.spaced} />}
                  <View style={s.row}>
                    <View style={s.flex1}>
                      <View style={s.titleRow}>
                        <Text style={s.rowTitle}>{item.label}</Text>
                        {item.is_locked && (
                          <View style={s.lockChip}>
                            <Lock size={10} color="#64748b" />
                            <Text style={s.lockChipText}>Always on</Text>
                          </View>
                        )}
                      </View>
                      <Text style={s.rowDesc}>{item.description}</Text>
                    </View>

                    <View style={s.switchCell}>
                      <Switch
                        value={effective[item.category]?.in_app_enabled ?? true}
                        disabled={
                          item.is_locked ||
                          !masterEnabled ||
                          updatePreferences.isPending
                        }
                        onValueChange={value =>
                          void toggle(item.category, 'in_app_enabled', value)
                        }
                        trackColor={{ false: '#e2e8f0', true: '#c4b5fd' }}
                        thumbColor={
                          effective[item.category]?.in_app_enabled
                            ? '#7c3aed'
                            : '#94a3b8'
                        }
                      />
                    </View>
                    <View style={s.switchCell}>
                      <Switch
                        value={effective[item.category]?.push_enabled ?? true}
                        disabled={
                          item.is_locked ||
                          !masterEnabled ||
                          updatePreferences.isPending
                        }
                        onValueChange={value =>
                          void toggle(item.category, 'push_enabled', value)
                        }
                        trackColor={{ false: '#e2e8f0', true: '#c4b5fd' }}
                        thumbColor={
                          effective[item.category]?.push_enabled
                            ? '#7c3aed'
                            : '#94a3b8'
                        }
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          <View style={noteStyles.muted}>
            <Text style={noteStyles.mutedText}>
              Security and account alerts are always delivered. Push also
              requires notification permission for EduCard in your device
              settings.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dimmed: { opacity: 0.55 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  rowDesc: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  spacer: { width: 40 },
  flex1: { flex: 1 },
  switchCell: { width: 56, alignItems: 'center' },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    gap: 8,
  },
  legendLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  legendChannel: {
    width: 56,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  lockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
  },
  lockChipText: { fontSize: 10, fontWeight: '600', color: '#64748b' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 13, color: '#64748b' },
});
