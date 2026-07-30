/**
 * Edit Profile Screen
 * Edit personal information, profile photo, and address.
 * Email/Phone are read-only (OTP update handled via change-email/phone screens).
 */

import {
  getRoleGradient,
  GENDER_OPTIONS,
  BLOOD_GROUP_OPTIONS,
} from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  Save,
  Mail,
  Phone,
  Camera,
  ChevronDown,
  ChevronUp,
  MapPin,
  Info,
  User,
} from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  FormInput,
  FormDropdown,
  FormDatePicker,
  KeyboardAwareForm,
} from '@/components/forms';
import { getMediaUrl } from '@/constants/config';
import { useMyProfilePhoto, useUserProfile, useUpdateProfile } from '@/hooks';
import { useProfileImage } from '@/hooks/useProfileImage';
import { useAuthStore } from '@/lib/auth-store';
import { LinearGradient } from '@/lib/linear-gradient';
import { useToast } from '@/lib/toast-context';
import type { SharedStackNavigation } from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';

import { s } from './profile-styles';

const adminGradient = getRoleGradient('admin');

type FieldErrors = Record<string, string>;

export default function ProfileScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const {
    data: profilePhoto,
    isLoading: photoLoading,
    dataUpdatedAt,
  } = useMyProfilePhoto();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const updateMutation = useUpdateProfile();
  const [addressExpanded, setAddressExpanded] = useState(false);
  const [formLoaded, setFormLoaded] = useState(false);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  const {
    pickAndUpload,
    isUploading: isPhotoUploading,
    localUri: localPhotoUri,
  } = useProfileImage({ userPublicId: user?.public_id });

  // Form state
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    gender: '',
    blood_group: '',
    date_of_birth: '',
    street_address: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  // Pre-populate form when profile loads
  useEffect(() => {
    if (profile && !formLoaded) {
      const addr = profile.address;
      setForm({
        first_name: profile.first_name ?? '',
        last_name: profile.last_name ?? '',
        gender: profile.gender ?? '',
        blood_group: profile.blood_group ?? '',
        date_of_birth: profile.date_of_birth ?? '',
        street_address: addr?.street_address ?? '',
        address_line_2: addr?.address_line_2 ?? '',
        city: addr?.city ?? '',
        state: addr?.state ?? '',
        postal_code: addr?.zip_code ?? '',
        country: addr?.country ?? '',
      });
      setFormLoaded(true);
    }
  }, [profile, formLoaded]);

  const genderOptions = GENDER_OPTIONS.map(g => ({
    value: g.value,
    label: g.label,
  }));
  const bloodGroupOptions = BLOOD_GROUP_OPTIONS.map(b => ({
    value: b.value,
    label: b.label,
  }));

  const updateField = useCallback(
    (field: string, value: string) => {
      setForm(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => {
          const n = { ...prev };
          delete n[field];
          return n;
        });
      }
    },
    [errors],
  );

  const validateForm = useCallback(() => {
    const fieldErrors: FieldErrors = {};

    if (!form.first_name.trim()) {
      fieldErrors.first_name = 'First name is required';
    }
    if (!form.last_name.trim()) {
      fieldErrors.last_name = 'Last name is required';
    }

    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    const payload = {
      first_name: form.first_name,
      last_name: form.last_name,
      gender: form.gender || undefined,
      blood_group: form.blood_group || undefined,
      date_of_birth: form.date_of_birth || undefined,
      address: {
        street_address: form.street_address || undefined,
        address_line_2: form.address_line_2 || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        zip_code: form.postal_code || undefined,
        country: form.country || undefined,
        address_type: 'user_current',
      },
    };

    updateMutation.mutate(payload, {
      onSuccess: () => {
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Profile updated successfully!',
        });
        handleBack();
      },
    });
  }, [form, validateForm, updateMutation, handleBack, showToast]);

  const isLoading = profileLoading || photoLoading;
  const isSaving = updateMutation.isPending;

  // Profile image - add cache busting for server images
  const serverPhotoUrl =
    getMediaUrl(profilePhoto?.thumbnail_url) ?? getMediaUrl(profilePhoto?.url);
  const cacheSeparator = serverPhotoUrl?.includes('?') ? '&' : '?';
  const cacheVersion = dataUpdatedAt || Date.now();
  const cacheBustedPhotoUrl = serverPhotoUrl
    ? `${serverPhotoUrl}${cacheSeparator}v=${cacheVersion}`
    : undefined;
  const photoUrl = localPhotoUri ?? cacheBustedPhotoUrl;
  const displayName =
    profile?.full_name || profile?.first_name || user?.full_name || 'U';
  const initials = displayName.charAt(0).toUpperCase();

  if (isLoading) {
    return (
      <View style={layoutStyles.container}>
        <LinearGradient colors={adminGradient} style={headerStyles.header}>
          <View style={headerStyles.content}>
            <View style={headerStyles.topRow}>
              <TouchableOpacity
                style={headerStyles.backBtn}
                onPress={handleBack}
              >
                <ChevronLeft size={24} color="#fff" />
              </TouchableOpacity>
              <View style={headerStyles.titleContainer}>
                <Text style={headerStyles.title}>Edit Profile</Text>
              </View>
              <View style={s.spacer} />
            </View>
          </View>
        </LinearGradient>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={s.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

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
            <TouchableOpacity style={headerStyles.backBtn} onPress={handleBack}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Edit Profile</Text>
              <Text style={headerStyles.subtitle}>Update your information</Text>
            </View>
            <TouchableOpacity
              style={[s.saveBtn, isSaving && s.saveBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Save size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAwareForm style={s.body} contentContainerStyle={s.bodyContent}>
        {/* Avatar Section */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={s.avatarSection}
        >
          <TouchableOpacity
            style={s.avatarWrapper}
            onPress={pickAndUpload}
            disabled={isPhotoUploading}
          >
            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                style={s.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={s.avatarCircle}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={s.cameraIcon}>
              {isPhotoUploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Camera size={16} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={s.userName}>
            {profile?.full_name ?? user?.full_name ?? 'User'}
          </Text>
          <Text style={s.userRole}>
            {profile?.role ?? user?.role ?? 'Staff'}
          </Text>
        </Animated.View>

        {/* Personal Information */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={s.card}>
            <Text style={s.cardTitle}>Personal Information</Text>
            <View style={s.formFields}>
              <View style={s.row}>
                <View style={s.halfField}>
                  <FormInput
                    label="First Name"
                    value={form.first_name}
                    onChangeText={v => updateField('first_name', v)}
                    placeholder="First name"
                    error={errors.first_name}
                    required
                  />
                </View>
                <View style={s.halfField}>
                  <FormInput
                    label="Last Name"
                    value={form.last_name}
                    onChangeText={v => updateField('last_name', v)}
                    placeholder="Last name"
                    error={errors.last_name}
                    required
                  />
                </View>
              </View>

              <View style={s.row}>
                <View style={s.halfField}>
                  <FormDropdown
                    label="Gender"
                    options={genderOptions}
                    value={form.gender}
                    onChange={v => updateField('gender', v)}
                    placeholder="Select gender"
                  />
                </View>
                <View style={s.halfField}>
                  <FormDropdown
                    label="Blood Group"
                    options={bloodGroupOptions}
                    value={form.blood_group}
                    onChange={v => updateField('blood_group', v)}
                    placeholder="Select blood group"
                  />
                </View>
              </View>

              <FormDatePicker
                label="Date of Birth"
                value={form.date_of_birth}
                onChange={v => updateField('date_of_birth', v)}
                maxYear={new Date().getFullYear()}
              />
            </View>
          </View>
        </Animated.View>

        {/* Contact Information (Read-only) */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <View style={s.card}>
            <Text style={s.cardTitle}>Contact Information</Text>
            <View style={s.infoNote}>
              <Info size={14} color="#f59e0b" />
              <Text style={s.infoNoteText}>
                Email and phone can only be updated via OTP verification on the
                web dashboard.
              </Text>
            </View>
            {/* Username */}
            <View style={s.readOnlyField}>
              <View style={s.readOnlyIcon}>
                <User size={16} color="#64748b" />
              </View>
              <View style={s.flex1}>
                <Text style={s.readOnlyLabel}>Username</Text>
                <Text style={s.readOnlyValue}>{profile?.username ?? '—'}</Text>
              </View>
            </View>
            <View style={s.divider} />
            {/* Email */}
            <View style={s.readOnlyField}>
              <View style={s.readOnlyIcon}>
                <Mail size={16} color="#64748b" />
              </View>
              <View style={s.flex1}>
                <Text style={s.readOnlyLabel}>Email</Text>
                <Text style={s.readOnlyValue}>
                  {profile?.email ?? user?.email ?? '—'}
                </Text>
              </View>
            </View>
            <View style={s.divider} />
            {/* Phone */}
            <View style={s.readOnlyField}>
              <View style={s.readOnlyIcon}>
                <Phone size={16} color="#64748b" />
              </View>
              <View style={s.flex1}>
                <Text style={s.readOnlyLabel}>Phone</Text>
                <Text style={s.readOnlyValue}>
                  {profile?.phone ?? user?.phone ?? '—'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Address Section */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <View style={s.card}>
            <TouchableOpacity
              style={s.addressHeader}
              onPress={() => setAddressExpanded(!addressExpanded)}
              activeOpacity={0.7}
            >
              <View style={s.addressHeaderLeft}>
                <MapPin size={18} color="#6366f1" />
                <Text style={s.addressHeaderTitle}>Address Information</Text>
              </View>
              {addressExpanded ? (
                <ChevronUp size={20} color="#6b7280" />
              ) : (
                <ChevronDown size={20} color="#6b7280" />
              )}
            </TouchableOpacity>

            {addressExpanded && (
              <View style={s.addressFields}>
                <FormInput
                  label="Street Address"
                  value={form.street_address}
                  onChangeText={v => updateField('street_address', v)}
                  placeholder="Enter street address"
                />
                <FormInput
                  label="Address Line 2"
                  value={form.address_line_2}
                  onChangeText={v => updateField('address_line_2', v)}
                  placeholder="Apartment, suite, etc. (optional)"
                />
                <View style={s.row}>
                  <View style={s.halfField}>
                    <FormInput
                      label="City"
                      value={form.city}
                      onChangeText={v => updateField('city', v)}
                      placeholder="City"
                    />
                  </View>
                  <View style={s.halfField}>
                    <FormInput
                      label="State"
                      value={form.state}
                      onChangeText={v => updateField('state', v)}
                      placeholder="State"
                    />
                  </View>
                </View>
                <View style={s.row}>
                  <View style={s.halfField}>
                    <FormInput
                      label="Zip Code"
                      value={form.postal_code}
                      onChangeText={v => updateField('postal_code', v)}
                      placeholder="Zip Code"
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={s.halfField}>
                    <FormInput
                      label="Country"
                      value={form.country}
                      onChangeText={v => updateField('country', v)}
                      placeholder="Country"
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Spacer for bottom */}
        <View style={s.bottomSpacer} />
      </KeyboardAwareForm>
    </View>
  );
}
