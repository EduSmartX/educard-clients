/**
 * Employee Tab Layout
 * Bottom tab navigator for teacher/staff role
 * Uses same layout as Admin but with different permissions
 */

import { getRoleThemeColors } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { LayoutDashboard, Building2, User, Shield, Settings } from 'lucide-react-native';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const _employeeTheme = getRoleThemeColors('employee'); // prefixed _ - unused for now

// Icon props type
type IconProps = { size: number; color: string };

const GradientIcon = ({
  Icon,
  size,
  focused,
}: {
  Icon: React.ComponentType<IconProps>;
  size: number;
  focused: boolean;
}) => {
  if (!focused) {
    return <Icon size={size} color="#94a3b8" strokeWidth={1.5} />;
  }

  return (
    <View style={styles.iconContainer}>
      <LinearGradient
        colors={['#10b981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.activeIconBg}
      >
        <Icon size={size - 2} color="#fff" strokeWidth={2.5} />
      </LinearGradient>
    </View>
  );
};

export default function EmployeeTabLayout() {
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
          tabBarIcon: ({ focused, size }) => (
            <GradientIcon Icon={LayoutDashboard} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="management"
        options={{
          title: 'Manage',
          tabBarIcon: ({ focused, size }) => (
            <GradientIcon Icon={Building2} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-work"
        options={{
          title: 'My Work',
          tabBarIcon: ({ focused, size }) => (
            <GradientIcon Icon={User} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ focused, size }) => (
            <GradientIcon Icon={Shield} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, size }) => (
            <GradientIcon Icon={Settings} size={size} focused={focused} />
          ),
        }}
      />
      {/* Hidden screens accessible via navigation */}
      <Tabs.Screen name="classes" options={{ href: null }} />
      <Tabs.Screen name="attendance" options={{ href: null }} />
      <Tabs.Screen name="schedule" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
});
