/**
 * Admin Tab Layout — Premium
 * Elevated tab bar with gradient active indicators and spring animations
 */

import { getRoleThemeColors } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { LayoutDashboard, Layers, Calendar, Settings } from 'lucide-react-native';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';

const adminTheme = getRoleThemeColors('admin');

const GradientIcon = ({
  Icon,
  size,
  focused,
}: {
  Icon: React.ComponentType<any>;
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
          tabBarIcon: ({ focused, size }) => (
            <GradientIcon Icon={LayoutDashboard} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="management"
        options={{
          title: 'Management',
          tabBarIcon: ({ focused, size }) => (
            <GradientIcon Icon={Layers} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ focused, size }) => (
            <GradientIcon Icon={Calendar} size={size} focused={focused} />
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
      <Tabs.Screen name="students" options={{ href: null }} />
      <Tabs.Screen name="staff" options={{ href: null }} />
      <Tabs.Screen name="teachers" options={{ href: null }} />
      <Tabs.Screen name="classes" options={{ href: null }} />
      <Tabs.Screen name="subjects" options={{ href: null }} />
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
