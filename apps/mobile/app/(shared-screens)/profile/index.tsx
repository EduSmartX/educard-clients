/**
 * Edit Profile Screen
 * Edit personal information, profile photo, and address
 *
 * Features:
 * - Profile photo with upload
 * - Personal info form with dropdowns for Gender & Blood Group
 * - Collapsible address section
 * - Email/Phone shown as read-only (OTP update not implemented in mobile)
 */

import { getRoleGradient, GENDER_OPTIONS, BLOOD_GROUP_OPTIONS } from '@educard/shared';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Save, Camera, ChevronDown, ChevronUp, MapPin } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { FormInput, FormDropdown, FormDatePicker, KeyboardAwareForm } from '@/components/forms';
import { getMediaUrl } from '@/constants/config';
import { useMyProfilePhoto, useUserProfile, useUpdateProfile } from '@/hooks';
import { useProfileImage } from '@/hooks/useProfileImage';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/lib/toast-context';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

type FieldErrors = Record<string, string>;

export default function ProfileScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const { data: profilePhoto, isLoading: photoLoading, dataUpdatedAt } = useMyProfilePhoto();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const updateMutation = useUpdateProfile();
  const [addressExpanded, setAddressExpanded] = useState(false);
  const [formLoaded, setFormLoaded] = useState(false);

  const {
    pickAndUpload,
    isUploading: isPhotoUploading,
    localUri: localPhotoUri,
  } = useProfileImage({
    userPublicId: user?.public_id,
    onSuccess: () => {
      // Photo updated - cache will be invalidated by the hook
    },
  });

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

  const genderOptions = GENDER_OPTIONS.map((g) => ({ value: g.value, label: g.label }));
  const bloodGroupOptions = BLOOD_GROUP_OPTIONS.map((b) => ({ value: b.value, label: b.label }));

  const updateField = useCallback(
    (field: string, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const n = { ...prev };
          delete n[field];
          return n;
        });
      }
    },
    [errors]
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
        showToast({ type: 'success', title: 'Success', message: 'Profile updated successfully!' });
        router.back();
      },
    });
  }, [form, validateForm, updateMutation, router]);

  const isLoading = profileLoading || photoLoading;
  const isSaving = updateMutation.isPending;

  // Profile image - add cache busting for server images
  const serverPhotoUrl = getMediaUrl(profilePhoto?.thumbnail_url) ?? getMediaUrl(profilePhoto?.url);
  const cacheBustedPhotoUrl = serverPhotoUrl
    ? `${serverPhotoUrl}${serverPhotoUrl.includes('?') ? '&' : '?'}v=${dataUpdatedAt || Date.now()}`
    : undefined;
  const photoUrl = localPhotoUri ?? cacheBustedPhotoUrl;
  const initials = (profile?.full_name ?? profile?.first_name ?? user?.full_name ?? 'U')
    .charAt(0)
    .toUpperCase();

  if (isLoading) {
    return (
      <View style={layoutStyles.container}>
        <LinearGradient colors={adminGradient} style={headerStyles.header}>
          <View style={headerStyles.content}>
            <View style={headerStyles.topRow}>
              <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
                <ChevronLeft size={24} color="#fff" />
              </TouchableOpacity>
              <View style={headerStyles.titleContainer}>
                <Text style={headerStyles.title}>Edit Profile</Text>
              </View>
              <View style={{ width: 40 }} />
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
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
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
        <Animated.View entering={FadeInDown.delay(100).springify()} style={s.avatarSection}>
          <TouchableOpacity
            style={s.avatarWrapper}
            onPress={pickAndUpload}
            disabled={isPhotoUploading}
          >
            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                style={s.avatarImage}
                contentFit="cover"
                transition={200}
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
          <Text style={s.userName}>{profile?.full_name ?? user?.full_name ?? 'User'}</Text>
          <Text style={s.userRole}>{profile?.role ?? user?.role ?? 'Staff'}</Text>
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
                    onChangeText={(v) => updateField('first_name', v)}
                    placeholder="First name"
                    error={errors.first_name}
                    required
                  />
                </View>
                <View style={s.halfField}>
                  <FormInput
                    label="Last Name"
                    value={form.last_name}
                    onChangeText={(v) => updateField('last_name', v)}
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
                    onChange={(v) => updateField('gender', v)}
                    placeholder="Select gender"
                  />
                </View>
                <View style={s.halfField}>
                  <FormDropdown
                    label="Blood Group"
                    options={bloodGroupOptions}
                    value={form.blood_group}
                    onChange={(v) => updateField('blood_group', v)}
                    placeholder="Select blood group"
                  />
                </View>
              </View>

              <FormDatePicker
                label="Date of Birth"
                value={form.date_of_birth}
                onChange={(v) => updateField('date_of_birth', v)}
                maxYear={new Date().getFullYear()}
              />
            </View>
          </View>
        </Animated.View>

        {/* Address Section */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
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
                  onChangeText={(v) => updateField('street_address', v)}
                  placeholder="Enter street address"
                />
                <FormInput
                  label="Address Line 2"
                  value={form.address_line_2}
                  onChangeText={(v) => updateField('address_line_2', v)}
                  placeholder="Apartment, suite, etc. (optional)"
                />
                <View style={s.row}>
                  <View style={s.halfField}>
                    <FormInput
                      label="City"
                      value={form.city}
                      onChangeText={(v) => updateField('city', v)}
                      placeholder="City"
                    />
                  </View>
                  <View style={s.halfField}>
                    <FormInput
                      label="State"
                      value={form.state}
                      onChangeText={(v) => updateField('state', v)}
                      placeholder="State"
                    />
                  </View>
                </View>
                <View style={s.row}>
                  <View style={s.halfField}>
                    <FormInput
                      label="Zip Code"
                      value={form.postal_code}
                      onChangeText={(v) => updateField('postal_code', v)}
                      placeholder="Zip Code"
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={s.halfField}>
                    <FormInput
                      label="Country"
                      value={form.country}
                      onChangeText={(v) => updateField('country', v)}
                      placeholder="Country"
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Spacer for bottom */}
        <View style={{ height: 40 }} />
      </KeyboardAwareForm>
    </View>
  );
}

const s = StyleSheet.create({
  body: { flex: 1, backgroundColor: '#f8fafc' },
  bodyContent: { padding: 16 },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
  },

  saveBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },

  avatarSection: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: { fontSize: 40, fontWeight: '700', color: '#fff' },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  userRole: { fontSize: 14, color: '#64748b', textTransform: 'capitalize', marginTop: 4 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
    padding: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formFields: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },

  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
  },

  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  readOnlyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readOnlyLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  readOnlyValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
  },

  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  addressHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressFields: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
});
