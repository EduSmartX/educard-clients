import {
  GraduationCap,
  Calendar,
  CreditCard,
  LayoutDashboard,
  Settings,
} from 'lucide-react-native';
import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import ParentAcademicsScreen from '@/screens/parent/ParentAcademicsScreen';
import ParentAttendanceScreen from '@/screens/parent/ParentAttendanceScreen';
import ParentDashboardScreen from '@/screens/parent/ParentDashboardScreen';
import ParentFeesScreen from '@/screens/parent/ParentFeesScreen';
import ParentSettingsScreen from '@/screens/parent/ParentSettingsScreen';
import type { ParentTabParamList } from '@/navigation/types';

const Tab = createBottomTabNavigator<ParentTabParamList>();

type TabIconProps = { color: string; size: number };

function DashboardTabIcon({ color, size }: TabIconProps) {
  return <LayoutDashboard size={size} color={color} strokeWidth={1.5} />;
}
function AcademicsTabIcon({ color, size }: TabIconProps) {
  return <GraduationCap size={size} color={color} strokeWidth={1.5} />;
}
function AttendanceTabIcon({ color, size }: TabIconProps) {
  return <Calendar size={size} color={color} strokeWidth={1.5} />;
}
function FeesTabIcon({ color, size }: TabIconProps) {
  return <CreditCard size={size} color={color} strokeWidth={1.5} />;
}
function SettingsTabIcon({ color, size }: TabIconProps) {
  return <Settings size={size} color={color} strokeWidth={1.5} />;
}

export function ParentTabsNavigator() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(
    insets.bottom,
    Platform.OS === 'android' ? 12 : 0,
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          display: 'none',
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
      <Tab.Screen
        name="Dashboard"
        component={ParentDashboardScreen}
        options={{ title: 'Dashboard', tabBarIcon: DashboardTabIcon }}
      />
      <Tab.Screen
        name="Academics"
        component={ParentAcademicsScreen}
        options={{ title: 'Academics', tabBarIcon: AcademicsTabIcon }}
      />
      <Tab.Screen
        name="Attendance"
        component={ParentAttendanceScreen}
        options={{ title: 'Attendance', tabBarIcon: AttendanceTabIcon }}
      />
      <Tab.Screen
        name="Fees"
        component={ParentFeesScreen}
        options={{ title: 'Fees', tabBarIcon: FeesTabIcon }}
      />
      <Tab.Screen
        name="Settings"
        component={ParentSettingsScreen}
        options={{ title: 'Settings', tabBarIcon: SettingsTabIcon }}
      />
    </Tab.Navigator>
  );
}
