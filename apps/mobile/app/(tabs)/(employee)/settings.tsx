/**
 * Employee Settings Screen
 * App and account settings for teachers
 */

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
import { View, Text, TouchableOpacity, Alert, Image } from 'react-native';

import { Screen, Header } from '@/components/layout';
import { Card, Avatar } from '@/components/ui';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/lib/auth-store';
import { useMyProfilePhoto } from '@/hooks';
import { getMediaUrl } from '@/constants/config';

const settingsOptions = [
  { id: 'profile', title: 'Edit Profile', icon: User, route: '/(admin-screens)/profile' },
  { id: 'notifications', title: 'Notifications', icon: Bell, route: '/settings/notifications' },
  { id: 'security', title: 'Change Password', icon: Shield, route: '/(admin-screens)/change-password' },
  { id: 'appearance', title: 'Appearance', icon: Moon, route: '/settings/appearance' },
  { id: 'language', title: 'Language', icon: Globe, route: '/settings/language' },
  { id: 'help', title: 'Help & Support', icon: HelpCircle, route: '/(admin-screens)/help' },
];

export default function EmployeeSettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { data: profilePhoto } = useMyProfilePhoto();

  const profileImageUrl = getMediaUrl(profilePhoto?.thumbnail_url) || getMediaUrl(profilePhoto?.url) || getMediaUrl(user?.profile_image);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <Screen>
      <Header title="Settings" showBack={false} />

      <View className="px-4 pt-4">
        <Card>
          <TouchableOpacity
            className="flex-row items-center py-2"
            onPress={() => router.push('/(admin-screens)/profile' as any)}
          >
            {profileImageUrl ? (
              <Image 
                source={{ uri: profileImageUrl }} 
                className="h-14 w-14 rounded-full"
              />
            ) : (
              <Avatar name={user?.full_name || user?.first_name || 'T'} size="lg" />
            )}
            <View className="ml-4 flex-1">
              <Text className="text-lg font-semibold text-gray-900">
                {user?.full_name || user?.first_name || 'Teacher'}
              </Text>
              <Text className="text-gray-500">{user?.email}</Text>
              <Text className="mt-1 text-sm text-secondary-600">Teacher</Text>
            </View>
            <ChevronRight size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        </Card>
      </View>

      <View className="px-4 pt-6">
        <Text className="mb-3 px-1 text-sm font-medium text-gray-500">GENERAL</Text>
        <Card>
          {settingsOptions.map((option, index) => (
            <TouchableOpacity
              key={option.id}
              className={`flex-row items-center py-4 ${
                index !== settingsOptions.length - 1 ? 'border-b border-gray-100' : ''
              }`}
              onPress={() => router.push(option.route as any)}
            >
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <option.icon size={20} color={colors.gray[600]} strokeWidth={1.5} />
              </View>
              <Text className="flex-1 text-gray-900">{option.title}</Text>
              <ChevronRight size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          ))}
        </Card>
      </View>

      <View className="px-4 pb-8 pt-6">
        <Card>
          <TouchableOpacity className="flex-row items-center py-4" onPress={handleLogout}>
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-danger-100">
              <LogOut size={20} color={colors.danger[600]} strokeWidth={1.5} />
            </View>
            <Text className="flex-1 font-medium text-danger-600">Logout</Text>
          </TouchableOpacity>
        </Card>
      </View>

      <View className="items-center pb-6">
        <Text className="text-sm text-gray-400">EduCard v1.0.0</Text>
      </View>
    </Screen>
  );
}
