/**
 * Change Phone Screen
 * Allows authenticated users to change their phone number with OTP verification
 */

import { useLocalSearchParams } from 'expo-router';
import { Phone } from 'lucide-react-native';
import { useMemo } from 'react';

import { authApi } from '@/api/auth';
import {
  ChangeCredentialScreenBase,
  type ChangeCredentialConfig,
} from '@/components/screens/ChangeCredentialScreenBase';
import { useAuthStore } from '@/lib/auth-store';

export default function ChangePhoneScreen() {
  const { user } = useAuthStore();
  const params = useLocalSearchParams<{ mode?: string; from?: string }>();
  const isVerifyMode = params.mode === 'verify' && params.from === 'dashboard';

  const config: ChangeCredentialConfig = useMemo(
    () => ({
      title: isVerifyMode ? 'Verify Phone' : 'Change Phone',
      subtitle: isVerifyMode ? 'Verify your phone number' : 'Update your phone number',
      gradientColors: ['#8b5cf6', '#7c3aed'] as const,
      inputIcon: Phone,
      currentLabel: 'Current Phone',
      currentValue: user?.phone,
      placeholder: isVerifyMode ? 'Enter your phone number' : 'Enter new phone number',
      inputLabel: isVerifyMode ? 'Phone Number' : 'New Phone Number',
      initialValue: isVerifyMode ? (user?.phone ?? '') : '',
      keyboardType: 'phone-pad',
      validate: (value, currentValue) => {
        if (!value) return 'Please enter your new phone number';
        const phoneDigits = value.replace(/\D/g, '');
        if (phoneDigits.length < 10) return 'Please enter a valid phone number';
        if (!isVerifyMode && value === currentValue)
          return 'New phone number must be different from your current number';
        return null;
      },
      sendOtp: (value) => authApi.sendOtp({ purpose: 'PHONE_VERIFICATION', phone: value }),
      otpSentTitle: 'OTP Generated',
      otpSentMessage: (_value, minutes) =>
        `A verification code has been generated. It will expire in ${minutes} minutes. SMS delivery is currently on hold pending configuration.`,
      update: (value, otp) => authApi.updatePhone({ new_phone: value, otp }),
      updateStore: (u, value, result) => ({
        ...(u as object),
        phone: (result as { phone?: string }).phone || value,
      }),
      successTitle: isVerifyMode ? 'Phone Verified' : 'Phone Updated',
      successMessage: isVerifyMode
        ? 'Your phone number has been verified successfully.'
        : 'Your phone number has been updated successfully.',
      updateButtonLabel: isVerifyMode ? 'Verify Phone' : 'Update Phone',
    }),
    [isVerifyMode, user?.phone]
  );

  return <ChangeCredentialScreenBase config={config} />;
}
