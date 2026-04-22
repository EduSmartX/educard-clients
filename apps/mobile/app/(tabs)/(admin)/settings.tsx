/**
 * Admin Settings Screen
 * App and account settings
 */

import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  User,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Globe,
} from 'lucide-react-native';

import { Screen, Header } from '@/components/layout';
import { Card, Avatar } from '@/components/ui';
import { useAuthStore } from '@/lib/auth-store';
import { colors } from '@/constants/colors';

const settingsOptions = [
  {
    id: 'profile',
    title: 'Edit Profile',
    icon: User,
    route: '/profile',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    route: '/settings/notifications',
  },
  {
    id: 'security',
    title: 'Security',
    icon: Shield,
    route: '/settings/security',
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: Moon,
    route: '/settings/appearance',
  },
  {
    id: 'language',
    title: 'Language',
    icon: Globe,
    route: '/settings/language',
  },
  {
    id: 'help',
    title: 'Help & Support',
    icon: HelpCircle,
    route: '/settings/help',
  },
];

export default function AdminSettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  return (
    <Screen>
      <Header title="Settings" showBack={false} />

      {/* Profile Card */}
      <View className="px-4 pt-4">
        <Card>
          <TouchableOpacity
            className="flex-row items-center py-2"
            onPress={() => router.push('/(tabs)/(employee)/profile' as any)}
          >
            <Avatar name={user?.full_name || user?.first_name || 'A'} size="lg" />
            <View className="flex-1 ml-4">
              <Text className="text-gray-900 font-semibold text-lg">
                {user?.full_name || user?.first_name || 'Admin User'}
              </Text>
              <Text className="text-gray-500">{user?.email || 'admin@school.com'}</Text>
              <Text className="text-primary-600 text-sm mt-1">
                {user?.role === 'admin' ? 'Administrator' : 'Staff'}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        </Card>
      </View>

      {/* Settings Options */}
      <View className="px-4 pt-6">
        <Text className="text-sm font-medium text-gray-500 mb-3 px-1">
          GENERAL
        </Text>
        <Card>
          {settingsOptions.map((option, index) => (
            <TouchableOpacity
              key={option.id}
              className={`flex-row items-center py-4 ${
                index !== settingsOptions.length - 1 ? 'border-b border-gray-100' : ''
              }`}
              onPress={() => router.push(option.route as any)}
            >
              <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                <option.icon size={20} color={colors.gray[600]} strokeWidth={1.5} />
              </View>
              <Text className="flex-1 text-gray-900">{option.title}</Text>
              <ChevronRight size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          ))}
        </Card>
      </View>

      {/* Logout Button */}
      <View className="px-4 pt-6 pb-8">
        <Card>
          <TouchableOpacity
            className="flex-row items-center py-4"
            onPress={handleLogout}
          >
            <View className="w-10 h-10 bg-danger-100 rounded-full items-center justify-center mr-3">
              <LogOut size={20} color={colors.danger[600]} strokeWidth={1.5} />
            </View>
            <Text className="flex-1 text-danger-600 font-medium">Logout</Text>
          </TouchableOpacity>
        </Card>
      </View>

      {/* App Version */}
      <View className="items-center pb-6">
        <Text className="text-gray-400 text-sm">EduCard v1.0.0</Text>
      </View>
    </Screen>
  );
}
