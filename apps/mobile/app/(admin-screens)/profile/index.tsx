/**
 * Edit Profile Screen
 * Full profile editing matching web app: Photo, Personal Info, Password, Contact
 * Tabs: Profile | Password
 */

import { Colors, getRoleGradient, getErrorMessage } from '@educard/shared';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Save,
  Camera,
  User,
  Lock,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  RefreshControl,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { apiClient } from '@/api/client';
import { useMyProfilePhoto } from '@/hooks';
import { useProfileImage } from '@/hooks/useProfileImage';
import { useAuthStore } from '@/lib/auth-store';
import {
  headerStyles,
  layoutStyles,
  bodyStyles,
  cardStyles,
  formFieldStyles,
  chipStyles,
  buttonStyles,
  tabStyles,
  sectionTitleStyles,
  emptyStyles,
  reqStyles,
} from '@/styles';

const adminGradient = getRoleGradient('admin');

interface UserProfile {
  public_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role: string;
  gender: string;
  blood_group?: string;
  date_of_birth?: string;
  is_email_verified: boolean;
  notification_opt_in: boolean;
  address?: {
    street_address?: string;
    address_line_2?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  };
}

function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile', 'me'],
    queryFn: async () => {
      const res = await apiClient.get('/users/profile/me/');
      return res.data.data as UserProfile;
    },
    staleTime: 2 * 60 * 1000,
  });
}

function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const res = await apiClient.patch('/users/profile/me/', payload);
      return res.data.data as UserProfile;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
}

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

type Tab = 'profile' | 'password';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: profilePhoto, refetch: refetchPhoto } = useMyProfilePhoto();
  const { data: profile, isLoading, refetch } = useUserProfile();
  const updateProfile = useUpdateProfile();
  const { pickAndUpload, isUploading, localUri } = useProfileImage({
    userPublicId: user?.id,
    onSuccess: () => refetchPhoto(),
  });

  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [refreshing, setRefreshing] = useState(false);

  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [dob, setDob] = useState('');

  // Address state
  const [street, setStreet] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setPhone(profile.phone || '');
      setGender(profile.gender || '');
      setBloodGroup(profile.blood_group || '');
      setDob(profile.date_of_birth || '');
      setStreet(profile.address?.street_address || '');
      setAddressLine2(profile.address?.address_line_2 || '');
      setCity(profile.address?.city || '');
      setAddrState(profile.address?.state || '');
      setZipCode(profile.address?.zip_code || '');
      setCountry(profile.address?.country || '');
    }
  }, [profile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleSaveProfile = () => {
    const payload: Record<string, any> = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      gender: gender || undefined,
      blood_group: bloodGroup || undefined,
      date_of_birth: dob || undefined,
    };
    if (street || city || addrState || zipCode || country) {
      payload.address = {
        street_address: street.trim(),
        address_line_2: addressLine2.trim(),
        city: city.trim(),
        state: addrState.trim(),
        zip_code: zipCode.trim(),
        country: country.trim(),
      };
    }
    updateProfile.mutate(payload, {
      onSuccess: () => Alert.alert('Success', 'Profile updated successfully!'),
      onError: (err) => Alert.alert('Error', getErrorMessage(err, 'Failed to update profile.')),
    });
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setIsChangingPw(true);
    try {
      await apiClient.post('/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      Alert.alert('Success', 'Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err, 'Failed to change password.'));
    } finally {
      setIsChangingPw(false);
    }
  };

  const photoUrl = localUri || profilePhoto?.thumbnail_url || (profilePhoto as any)?.url;
  const initials = (profile?.full_name || user?.full_name || 'U').charAt(0).toUpperCase();

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <Animated.View
          entering={FadeIn.delay(100)}
          style={headerStyles.circle1}
          pointerEvents="none"
        />
        <Animated.View
          entering={FadeIn.delay(200)}
          style={headerStyles.circle2}
          pointerEvents="none"
        />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Edit Profile</Text>
              <Text style={headerStyles.subtitle}>Update your information</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={tabStyles.row}>
        <TouchableOpacity
          style={[tabStyles.tab, activeTab === 'profile' && tabStyles.tabActive]}
          onPress={() => setActiveTab('profile')}
        >
          <User size={16} color={activeTab === 'profile' ? '#7c3aed' : '#94a3b8'} />
          <Text style={[tabStyles.tabText, activeTab === 'profile' && tabStyles.tabTextActive]}>
            Profile
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[tabStyles.tab, activeTab === 'password' && tabStyles.tabActive]}
          onPress={() => setActiveTab('password')}
        >
          <Lock size={16} color={activeTab === 'password' ? '#7c3aed' : '#94a3b8'} />
          <Text style={[tabStyles.tabText, activeTab === 'password' && tabStyles.tabTextActive]}>
            Password
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={emptyStyles.container}>
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      ) : activeTab === 'profile' ? (
        <ScrollView
          style={bodyStyles.scroll}
          contentContainerStyle={bodyStyles.contentLarge}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7c3aed']} />
          }
        >
          {/* Photo */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={s.photoSection}>
            <TouchableOpacity onPress={pickAndUpload} disabled={isUploading} activeOpacity={0.7}>
              <View style={s.avatarWrap}>
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={s.avatar} />
                ) : (
                  <View style={s.avatarPlaceholder}>
                    <Text style={s.avatarText}>{initials}</Text>
                  </View>
                )}
                <View style={s.cameraBtn}>
                  {isUploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Camera size={14} color="#fff" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
            <Text style={s.photoName}>{profile?.full_name || user?.full_name || 'User'}</Text>
            <Text style={s.photoEmail}>{profile?.email || user?.email || ''}</Text>
          </Animated.View>

          {/* Personal Info */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text style={sectionTitleStyles.labelCompact}>PERSONAL INFORMATION</Text>
            <View style={cardStyles.cardSection}>
              <View style={formFieldStyles.fieldRow}>
                <View style={{ flex: 1 }}>
                  <Text style={formFieldStyles.label}>First Name</Text>
                  <TextInput
                    style={formFieldStyles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First name"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={formFieldStyles.label}>Last Name</Text>
                  <TextInput
                    style={formFieldStyles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last name"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>
              <Text style={formFieldStyles.label}>Phone</Text>
              <TextInput
                style={formFieldStyles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone number"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
              />
              <Text style={formFieldStyles.label}>Gender</Text>
              <View style={chipStyles.row}>
                {GENDER_OPTIONS.map((g) => (
                  <TouchableOpacity
                    key={g.value}
                    style={[chipStyles.chip, gender === g.value && chipStyles.chipActive]}
                    onPress={() => setGender(g.value)}
                  >
                    <Text
                      style={[chipStyles.chipText, gender === g.value && chipStyles.chipTextActive]}
                    >
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={formFieldStyles.label}>Blood Group</Text>
              <View style={chipStyles.row}>
                {BLOOD_GROUPS.map((bg) => (
                  <TouchableOpacity
                    key={bg}
                    style={[chipStyles.chipSmall, bloodGroup === bg && chipStyles.chipActive]}
                    onPress={() => setBloodGroup(bg)}
                  >
                    <Text
                      style={[chipStyles.chipText, bloodGroup === bg && chipStyles.chipTextActive]}
                    >
                      {bg}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={formFieldStyles.label}>Date of Birth</Text>
              <TextInput
                style={formFieldStyles.input}
                value={dob}
                onChangeText={setDob}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </Animated.View>

          {/* Address */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text style={sectionTitleStyles.labelCompact}>ADDRESS</Text>
            <View style={cardStyles.cardSection}>
              <Text style={formFieldStyles.label}>Street Address</Text>
              <TextInput
                style={formFieldStyles.input}
                value={street}
                onChangeText={setStreet}
                placeholder="Street address"
                placeholderTextColor="#94a3b8"
              />
              <Text style={formFieldStyles.label}>Address Line 2</Text>
              <TextInput
                style={formFieldStyles.input}
                value={addressLine2}
                onChangeText={setAddressLine2}
                placeholder="Apt, suite, etc."
                placeholderTextColor="#94a3b8"
              />
              <View style={formFieldStyles.fieldRow}>
                <View style={{ flex: 1 }}>
                  <Text style={formFieldStyles.label}>City</Text>
                  <TextInput
                    style={formFieldStyles.input}
                    value={city}
                    onChangeText={setCity}
                    placeholder="City"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={formFieldStyles.label}>State</Text>
                  <TextInput
                    style={formFieldStyles.input}
                    value={addrState}
                    onChangeText={setAddrState}
                    placeholder="State"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>
              <View style={formFieldStyles.fieldRow}>
                <View style={{ flex: 1 }}>
                  <Text style={formFieldStyles.label}>ZIP Code</Text>
                  <TextInput
                    style={formFieldStyles.input}
                    value={zipCode}
                    onChangeText={setZipCode}
                    placeholder="ZIP"
                    placeholderTextColor="#94a3b8"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={formFieldStyles.label}>Country</Text>
                  <TextInput
                    style={formFieldStyles.input}
                    value={country}
                    onChangeText={setCountry}
                    placeholder="Country"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>
            </View>
          </Animated.View>

          <TouchableOpacity
            style={[buttonStyles.primary, updateProfile.isPending && buttonStyles.disabled]}
            onPress={handleSaveProfile}
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Save size={16} color="#fff" />
                <Text style={buttonStyles.primaryText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView
          style={bodyStyles.scroll}
          contentContainerStyle={bodyStyles.contentLarge}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View style={cardStyles.cardSection}>
              <Text style={formFieldStyles.label}>Current Password</Text>
              <View style={formFieldStyles.passwordRow}>
                <TextInput
                  style={formFieldStyles.passwordInput}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  placeholder="Current password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showOld}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowOld(!showOld)}
                  style={formFieldStyles.eyeBtn}
                >
                  {showOld ? (
                    <EyeOff size={18} color="#94a3b8" />
                  ) : (
                    <Eye size={18} color="#94a3b8" />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={formFieldStyles.label}>New Password</Text>
              <View style={formFieldStyles.passwordRow}>
                <TextInput
                  style={formFieldStyles.passwordInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="New password (min 8 chars)"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showNew}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowNew(!showNew)}
                  style={formFieldStyles.eyeBtn}
                >
                  {showNew ? (
                    <EyeOff size={18} color="#94a3b8" />
                  ) : (
                    <Eye size={18} color="#94a3b8" />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={formFieldStyles.label}>Confirm New Password</Text>
              <TextInput
                style={formFieldStyles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                autoCapitalize="none"
              />
              <View style={reqStyles.container}>
                <ReqItem met={newPassword.length >= 8} text="At least 8 characters" />
                <ReqItem met={/[A-Z]/.test(newPassword)} text="One uppercase letter" />
                <ReqItem met={/[0-9]/.test(newPassword)} text="One number" />
                <ReqItem
                  met={newPassword === confirmPassword && confirmPassword.length > 0}
                  text="Passwords match"
                />
              </View>
              <TouchableOpacity
                style={[
                  buttonStyles.primary,
                  { marginTop: 20 },
                  (isChangingPw || newPassword.length < 8 || newPassword !== confirmPassword) &&
                    buttonStyles.disabled,
                ]}
                onPress={handleChangePassword}
                disabled={isChangingPw || newPassword.length < 8 || newPassword !== confirmPassword}
              >
                {isChangingPw ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Lock size={16} color="#fff" />
                    <Text style={buttonStyles.primaryText}>Change Password</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
}

function ReqItem({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={reqStyles.row}>
      <CheckCircle size={14} color={met ? '#16a34a' : '#cbd5e1'} />
      <Text style={[reqStyles.text, met && reqStyles.textMet]}>{text}</Text>
    </View>
  );
}

// Screen-specific styles only — shared styles imported from @/styles
const s = StyleSheet.create({
  photoSection: { alignItems: 'center', marginBottom: 20, marginTop: 8 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#e2e8f0' },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: '#fff' },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#f8fafc',
  },
  photoName: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 10 },
  photoEmail: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
});
