/**
 * Parent Settings Screen
 * App and account settings for parents
 */

import { useNavigation } from '@react-navigation/native';
import {
  User,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Mail,
  Phone,
  Repeat,
  Users,
} from 'lucide-react-native';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';

import { Screen, Header } from '@/components/layout';
import { Card, Avatar } from '@/components/ui';
import { colors } from '@/constants/colors';
import { useProfileImageUrl } from '@/hooks';
import { useAuthStore } from '@/lib/auth-store';
import { navigateToScreen, type MenuTarget } from '@/navigation/nav-targets';
import type { ParentTabNavigation } from '@/navigation/types';

const settingsOptions: {
  id: string;
  title: string;
  icon: typeof User;
  screen: MenuTarget;
}[] = [
  { id: 'profile', title: 'Edit Profile', icon: User, screen: 'Profile' },
  {
    id: 'security',
    title: 'Change Password',
    icon: Shield,
    screen: 'ChangePassword',
  },
  {
    id: 'change-email',
    title: 'Change Email',
    icon: Mail,
    screen: 'ChangeEmail',
  },
  {
    id: 'change-phone',
    title: 'Change Phone',
    icon: Phone,
    screen: 'ChangePhone',
  },
  {
    id: 'help',
    title: 'Help & Support',
    icon: HelpCircle,
    screen: 'HelpSupport',
  },
];

export default function ParentSettingsScreen() {
  const navigation = useNavigation<ParentTabNavigation>();
  const { user, logout } = useAuthStore();
  const { profileImageUrl } = useProfileImageUrl();
  const isStudent = user?.role === 'student';
  const roleLabel = isStudent ? 'Student' : 'Parent';

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  const handleItemPress = (screen: MenuTarget) => {
    navigateToScreen(navigation, screen);
  };

  return (
    <Screen>
      <Header title="Settings" showBack={false} light />

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-[100px]"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-4">
          <Card>
            <TouchableOpacity
              className="flex-row items-center py-2"
              onPress={() => navigation.navigate('Profile')}
            >
              {profileImageUrl ? (
                <Image
                  source={{ uri: profileImageUrl }}
                  className="h-14 w-14 rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <Avatar
                  name={user?.full_name ?? user?.first_name ?? 'P'}
                  size="lg"
                />
              )}
              <View className="ml-4 flex-1">
                <Text className="text-lg font-semibold text-gray-900">
                  {user?.full_name ?? user?.first_name ?? roleLabel}
                </Text>
                <Text className="text-gray-500">{user?.email}</Text>
                <Text className="mt-1 text-sm text-success-600">
                  {roleLabel}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          </Card>
        </View>

        <View className="px-4 pt-6">
          <Text className="mb-3 px-1 text-sm font-medium text-gray-500">
            GENERAL
          </Text>
          <Card>
            {settingsOptions.map((option, index) => {
              const OptionIcon = option.icon;
              return (
                <TouchableOpacity
                  key={option.id}
                  className={`flex-row items-center py-4 ${
                    index !== settingsOptions.length - 1
                      ? 'border-b border-gray-100'
                      : ''
                  }`}
                  onPress={() => handleItemPress(option.screen)}
                >
                  <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <OptionIcon
                      size={20}
                      color={colors.gray[600]}
                      strokeWidth={1.5}
                    />
                  </View>
                  <Text className="flex-1 text-gray-900">{option.title}</Text>
                  <ChevronRight size={20} color={colors.gray[400]} />
                </TouchableOpacity>
              );
            })}
          </Card>
        </View>

        {isStudent && (
          <View className="px-4 pt-6">
            <Text className="mb-3 px-1 text-sm font-medium text-gray-500">
              PROFILES
            </Text>
            <Card>
              <TouchableOpacity
                className="flex-row items-center border-b border-gray-100 py-4"
                onPress={() => navigation.navigate('SwitchProfile')}
              >
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  <Repeat
                    size={20}
                    color={colors.gray[600]}
                    strokeWidth={1.5}
                  />
                </View>
                <Text className="flex-1 text-gray-900">Switch Profile</Text>
                <ChevronRight size={20} color={colors.gray[400]} />
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center py-4"
                onPress={() => navigation.navigate('SyncProfiles')}
              >
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  <Users size={20} color={colors.gray[600]} strokeWidth={1.5} />
                </View>
                <Text className="flex-1 text-gray-900">Sync Profiles</Text>
                <ChevronRight size={20} color={colors.gray[400]} />
              </TouchableOpacity>
            </Card>
          </View>
        )}

        <View className="px-4 pb-8 pt-6">
          <Card>
            <TouchableOpacity
              className="flex-row items-center py-4"
              onPress={handleLogout}
            >
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-danger-100">
                <LogOut
                  size={20}
                  color={colors.danger[600]}
                  strokeWidth={1.5}
                />
              </View>
              <Text className="flex-1 font-medium text-danger-600">Logout</Text>
            </TouchableOpacity>
          </Card>
        </View>

        <View className="items-center pb-6">
          <Text className="text-sm text-gray-400">EduCard v1.0.0</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
