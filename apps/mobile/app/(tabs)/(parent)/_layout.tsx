/**
 * Parent Tab Layout
 * Bottom tab navigator for parent role
 */

import { Tabs } from 'expo-router';
import {
  LayoutDashboard,
  GraduationCap,
  Calendar,
  CreditCard,
  Settings,
} from 'lucide-react-native';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';

function DashboardIcon({ color, size }: { color: string; size: number }) {
  return <LayoutDashboard size={size} color={color} strokeWidth={1.5} />;
}

function AcademicsIcon({ color, size }: { color: string; size: number }) {
  return <GraduationCap size={size} color={color} strokeWidth={1.5} />;
}

function AttendanceIcon({ color, size }: { color: string; size: number }) {
  return <Calendar size={size} color={color} strokeWidth={1.5} />;
}

function FeesIcon({ color, size }: { color: string; size: number }) {
  return <CreditCard size={size} color={color} strokeWidth={1.5} />;
}

function SettingsIcon({ color, size }: { color: string; size: number }) {
  return <Settings size={size} color={color} strokeWidth={1.5} />;
}

export default function ParentTabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: colors.gray[100],
          paddingTop: 8,
          paddingBottom: bottomPadding + 8,
          height: 60 + bottomPadding,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: DashboardIcon,
        }}
      />
      <Tabs.Screen
        name="academics"
        options={{
          title: 'Academics',
          tabBarIcon: AcademicsIcon,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: AttendanceIcon,
        }}
      />
      <Tabs.Screen
        name="fees"
        options={{
          title: 'Fees',
          tabBarIcon: FeesIcon,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: SettingsIcon,
        }}
      />
    </Tabs>
  );
}
