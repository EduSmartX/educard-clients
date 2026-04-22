/**
 * Admin Tab Layout
 * Bottom tab navigator for admin/principal role
 */

import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, Layers, Calendar, Settings } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '@/constants/colors';
import { getRoleThemeColors } from '@educard/shared';

// Get admin theme colors
const adminTheme = getRoleThemeColors('admin');

// Colorful icon gradients for "flying feeling"
const iconColors = {
  dashboard: {
    active: ['#667eea', '#764ba2'] as const,
    inactive: '#9ca3af',
  },
  management: {
    active: ['#f093fb', '#f5576c'] as const,
    inactive: '#9ca3af',
  },
  schedule: {
    active: ['#4facfe', '#00f2fe'] as const,
    inactive: '#9ca3af',
  },
  settings: {
    active: ['#43e97b', '#38f9d7'] as const,
    inactive: '#9ca3af',
  },
};

// Custom icon wrapper with gradient background (for light green footer)
const GradientIcon = ({
  Icon,
  gradient,
  size,
  focused,
}: {
  Icon: React.ComponentType<any>;
  gradient: readonly [string, string];
  size: number;
  focused: boolean;
}) => {
  if (!focused) {
    return <Icon size={size} color="#6b7280" strokeWidth={1.5} />;
  }

  return (
    <View style={styles.iconContainer}>
      <View style={styles.activeIconBg}>
        <Icon size={size - 2} color="#10b981" strokeWidth={2.5} />
      </View>
    </View>
  );
};

export default function AdminTabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ecfdf5', // Very light mint/green background
          borderTopWidth: 1,
          borderTopColor: '#d1fae5',
          paddingTop: 8,
          paddingBottom: bottomPadding + 8,
          height: 65 + bottomPadding,
          shadowColor: '#10b981',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarActiveTintColor: '#10b981',
          tabBarIcon: ({ focused, size }) => (
            <GradientIcon
              Icon={LayoutDashboard}
              gradient={iconColors.dashboard.active}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="management"
        options={{
          title: 'Management',
          tabBarActiveTintColor: '#10b981',
          tabBarIcon: ({ focused, size }) => (
            <GradientIcon
              Icon={Layers}
              gradient={iconColors.management.active}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarActiveTintColor: '#10b981',
          tabBarIcon: ({ focused, size }) => (
            <GradientIcon
              Icon={Calendar}
              gradient={iconColors.schedule.active}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarActiveTintColor: '#10b981',
          tabBarIcon: ({ focused, size }) => (
            <GradientIcon
              Icon={Settings}
              gradient={iconColors.settings.active}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
      {/* Hidden screens - accessible via navigation */}
      <Tabs.Screen
        name="students"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="teachers"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="subjects"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d1fae5', // Light green background for active icon
    borderWidth: 2,
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
