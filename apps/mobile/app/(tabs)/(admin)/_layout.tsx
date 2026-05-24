/**
 * Admin Tab Layout
 */

import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DashboardIcon,
  ManageIcon,
  MyWorkIcon,
  AdminIcon,
  SettingsIcon,
} from '@/components/navigation/tab-icons';

export default function AdminTabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: bottomPadding + 8,
          height: 68 + bottomPadding,
          shadowColor: '#059669',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 16,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 4,
          letterSpacing: 0.2,
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
        name="management"
        options={{
          title: 'Manage',
          tabBarIcon: ManageIcon,
        }}
      />
      <Tabs.Screen
        name="my-work"
        options={{
          title: 'My Work',
          tabBarIcon: MyWorkIcon,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: AdminIcon,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: SettingsIcon,
        }}
      />
      {/* Hidden screens accessible via navigation */}
      <Tabs.Screen name="schedule" options={{ href: null }} />
      <Tabs.Screen name="students" options={{ href: null }} />
      <Tabs.Screen name="staff" options={{ href: null }} />
      <Tabs.Screen name="teachers" options={{ href: null }} />
      <Tabs.Screen name="classes" options={{ href: null }} />
      <Tabs.Screen name="subjects" options={{ href: null }} />
      <Tabs.Screen name="create-class" options={{ href: null }} />
      <Tabs.Screen name="create-student" options={{ href: null }} />
      <Tabs.Screen name="create-subject" options={{ href: null }} />
      <Tabs.Screen name="create-teacher" options={{ href: null }} />
      <Tabs.Screen name="view-class" options={{ href: null }} />
      <Tabs.Screen name="view-student" options={{ href: null }} />
      <Tabs.Screen name="view-subject" options={{ href: null }} />
      <Tabs.Screen name="view-teacher" options={{ href: null }} />
      {/* Fee Management screens */}
      <Tabs.Screen name="fee-dashboard" options={{ href: null }} />
      <Tabs.Screen name="fee-structures" options={{ href: null }} />
      <Tabs.Screen name="fee-structure-detail" options={{ href: null }} />
      <Tabs.Screen name="fee-structure-form" options={{ href: null }} />
      <Tabs.Screen name="fee-student-fees" options={{ href: null }} />
      <Tabs.Screen name="fee-student-detail" options={{ href: null }} />
      <Tabs.Screen name="fee-student-edit" options={{ href: null }} />
      <Tabs.Screen name="fee-payments" options={{ href: null }} />
      <Tabs.Screen name="fee-assign-student" options={{ href: null }} />
    </Tabs>
  );
}
