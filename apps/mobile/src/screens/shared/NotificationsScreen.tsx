/**
 * Notifications Settings Screen
 * Manage notification preferences
 */

import { getRoleGradient } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { LinearGradient } from '@/lib/linear-gradient';
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

interface NotifSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export default function NotificationsScreen() {
  const navigation = useNavigation<SharedStackNavigation>();

  const [settings, setSettings] = useState<NotifSetting[]>([
    {
      id: 'push',
      title: 'Push Notifications',
      description: 'Receive push notifications on your device',
      enabled: true,
    },
    {
      id: 'leave',
      title: 'Leave Updates',
      description: 'Get notified about leave request status changes',
      enabled: true,
    },
    {
      id: 'attendance',
      title: 'Attendance Alerts',
      description: 'Daily attendance reminders and summaries',
      enabled: true,
    },
    {
      id: 'timetable',
      title: 'Timetable Changes',
      description: 'Get notified when timetable is updated',
      enabled: true,
    },
    {
      id: 'exam',
      title: 'Exam Notifications',
      description: 'Exam schedules and result announcements',
      enabled: true,
    },
    {
      id: 'announcements',
      title: 'Announcements',
      description: 'Organization-wide announcements',
      enabled: true,
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings(prev =>
      prev.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
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

      <ScrollView
        style={bodyStyles.scroll}
        contentContainerStyle={bodyStyles.content}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={cardStyles.cardLarge}>
            {settings.map((item, idx) => (
              <View key={item.id}>
                {idx > 0 && <View style={dividerStyles.spaced} />}
                <View style={s.row}>
                  <View style={s.flex1}>
                    <Text style={s.rowTitle}>{item.title}</Text>
                    <Text style={s.rowDesc}>{item.description}</Text>
                  </View>
                  <Switch
                    value={item.enabled}
                    onValueChange={() => toggleSetting(item.id)}
                    trackColor={{ false: '#e2e8f0', true: '#c4b5fd' }}
                    thumbColor={item.enabled ? '#7c3aed' : '#94a3b8'}
                  />
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        <View style={noteStyles.muted}>
          <Text style={noteStyles.mutedText}>
            Notification preferences are stored locally. Server-side
            notification settings can be managed from the web dashboard.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  rowDesc: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  spacer: { width: 40 },
  flex1: { flex: 1 },
});
