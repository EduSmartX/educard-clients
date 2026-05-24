/**
 * Shared Tab Icon Components
 * Reusable gradient icon components for tab bar navigation
 */

import { LinearGradient } from 'expo-linear-gradient';
import { LayoutDashboard, Building2, User, Shield, Settings } from 'lucide-react-native';
import React from 'react';
import { View, StyleSheet } from 'react-native';

// Icon props type
type IconProps = { size: number; color: string; strokeWidth?: number };

export const GradientIcon = ({
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
    <View style={tabIconStyles.iconContainer}>
      <LinearGradient
        colors={['#10b981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={tabIconStyles.activeIconBg}
      >
        <Icon size={size - 2} color="#fff" strokeWidth={2.5} />
      </LinearGradient>
    </View>
  );
};

export const DashboardIcon = ({ focused, size }: { focused: boolean; size: number }) => (
  <GradientIcon Icon={LayoutDashboard} size={size} focused={focused} />
);
export const ManageIcon = ({ focused, size }: { focused: boolean; size: number }) => (
  <GradientIcon Icon={Building2} size={size} focused={focused} />
);
export const MyWorkIcon = ({ focused, size }: { focused: boolean; size: number }) => (
  <GradientIcon Icon={User} size={size} focused={focused} />
);
export const AdminIcon = ({ focused, size }: { focused: boolean; size: number }) => (
  <GradientIcon Icon={Shield} size={size} focused={focused} />
);
export const SettingsIcon = ({ focused, size }: { focused: boolean; size: number }) => (
  <GradientIcon Icon={Settings} size={size} focused={focused} />
);

export const tabIconStyles = StyleSheet.create({
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
