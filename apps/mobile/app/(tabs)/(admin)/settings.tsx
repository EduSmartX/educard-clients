/**
 * Admin Settings Screen
 * Simplified: Organization Settings (admin) + App Settings
 *
 * Permission Model:
 * - Admin: Access to Organization Preferences, Holidays (CRUD)
 * - Teacher: App settings only (no Organization section)
 */

import { getRoleGradient } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  User,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  SlidersHorizontal,
  Calendar,
  Info,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet, Image } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { getMediaUrl } from '@/constants/config';
import { useMyProfilePhoto } from '@/hooks';
import { useAuthStore } from '@/lib/auth-store';
import { headerStyles, layoutStyles } from '@/styles';
import { isAdminRole } from '@/utils/role-utils';

const adminGradient = getRoleGradient('admin');

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  route?: string;
  action?: () => void;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export default function AdminSettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { data: profilePhoto } = useMyProfilePhoto();

  // Check if current user is admin
  const isAdmin = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  // Organization section - only for admins
  const organizationSection: SettingSection = {
    title: 'ORGANIZATION',
    items: [
      {
        id: 'preferences',
        title: 'Organization Preferences',
        subtitle: 'School settings & policies',
        icon: SlidersHorizontal,
        iconColor: '#0284c7',
        iconBg: '#e0f2fe',
        route: '/(admin-screens)/preferences',
      },
      {
        id: 'holidays',
        title: 'Holiday Calendar',
        subtitle: 'Manage holidays & events',
        icon: Calendar,
        iconColor: '#dc2626',
        iconBg: '#fee2e2',
        route: '/(admin-screens)/holidays',
      },
    ],
  };

  // App section - for all users
  const appSection: SettingSection = {
    title: 'APP',
    items: [
      {
        id: 'profile',
        title: 'Edit Profile',
        subtitle: 'Update your information',
        icon: User,
        iconColor: '#2563eb',
        iconBg: '#eff6ff',
        route: '/(admin-screens)/profile',
      },
      {
        id: 'notifications',
        title: 'Notifications',
        subtitle: 'Manage notification preferences',
        icon: Bell,
        iconColor: '#f59e0b',
        iconBg: '#fef3c7',
      },
      {
        id: 'security',
        title: 'Change Password',
        subtitle: 'Update your password',
        icon: Shield,
        iconColor: '#059669',
        iconBg: '#dcfce7',
        route: '/(admin-screens)/change-password',
      },
      {
        id: 'help',
        title: 'Help & Support',
        subtitle: 'FAQs, contact support',
        icon: HelpCircle,
        iconColor: '#64748b',
        iconBg: '#f1f5f9',
      },
    ],
  };

  // Build sections based on role
  const sections: SettingSection[] = isAdmin ? [organizationSection, appSection] : [appSection];

  const profileImageUrl =
    getMediaUrl(profilePhoto?.thumbnail_url) ??
    getMediaUrl(profilePhoto?.url) ??
    getMediaUrl(user?.profile_image);
  const initials = (user?.full_name ?? user?.first_name ?? 'A').charAt(0).toUpperCase();

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
          <Animated.View entering={FadeInDown.delay(100).springify()} style={st.headerProfile}>
            {profileImageUrl ? (
              <Image source={{ uri: profileImageUrl }} style={st.avatarImage} />
            ) : (
              <View style={st.avatarCircle}>
                <Text style={st.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={st.headerName}>{user?.full_name ?? user?.first_name ?? 'Admin'}</Text>
              <Text style={st.headerEmail}>{user?.email ?? ''}</Text>
              <View style={st.roleBadge}>
                <Text style={st.roleText}>
                  {user?.role === 'admin' ? 'Administrator' : (user?.role ?? 'Staff')}
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </LinearGradient>

      <ScrollView style={st.body} contentContainerStyle={st.bodyContent}>
        {sections.map((section, sIdx) => (
          <Animated.View
            key={section.title}
            entering={FadeInDown.delay(100 + sIdx * 80).springify()}
          >
            <Text style={st.sectionTitle}>{section.title}</Text>
            <View style={st.sectionCard}>
              {section.items.map((item, iIdx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[st.settingRow, iIdx < section.items.length - 1 && st.settingRowBorder]}
                  activeOpacity={0.6}
                  onPress={() => {
                    if (item.action) item.action();
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
                    else if (item.route) router.push(item.route as any);
                  }}
                >
                  <View style={[st.iconCircle, { backgroundColor: item.iconBg }]}>
                    <item.icon size={18} color={item.iconColor} strokeWidth={2} />
                  </View>
                  <View style={st.settingInfo}>
                    <Text style={st.settingTitle}>{item.title}</Text>
                    {item.subtitle && <Text style={st.settingSubtitle}>{item.subtitle}</Text>}
                  </View>
                  <ChevronRight size={18} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        ))}

        {/* Logout */}
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <View style={st.sectionCard}>
            <TouchableOpacity style={st.settingRow} activeOpacity={0.6} onPress={handleLogout}>
              <View style={[st.iconCircle, { backgroundColor: '#fee2e2' }]}>
                <LogOut size={18} color="#dc2626" strokeWidth={2} />
              </View>
              <View style={st.settingInfo}>
                <Text style={[st.settingTitle, { color: '#dc2626' }]}>Logout</Text>
                <Text style={st.settingSubtitle}>Sign out of your account</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* App Version */}
        <View style={st.versionRow}>
          <Info size={14} color="#cbd5e1" />
          <Text style={st.versionText}>EduCard v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  headerProfile: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 8 },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerName: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  roleText: { fontSize: 11, fontWeight: '700', color: '#fff', textTransform: 'capitalize' },

  body: { flex: 1, backgroundColor: '#f8fafc' },
  bodyContent: { padding: 16, paddingBottom: 40 },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  settingSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },

  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
    marginBottom: 16,
  },
  versionText: { fontSize: 12, color: '#cbd5e1' },
});
