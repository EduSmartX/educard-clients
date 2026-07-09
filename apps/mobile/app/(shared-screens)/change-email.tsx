/**
 * Change Email Screen
 * Allows authenticated users to change their email with OTP verification
 */

import { Mail } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { authApi } from '@/api/auth';
import {
  ChangeCredentialScreenBase,
  type ChangeCredentialConfig,
} from '@/components/screens/ChangeCredentialScreenBase';
import { useAuthStore } from '@/lib/auth-store';

export default function ChangeEmailScreen() {
  const { user } = useAuthStore();
  const params = useLocalSearchParams<{ mode?: string; from?: string }>();
  const isVerifyMode = params.mode === 'verify' && params.from === 'dashboard';

  const config: ChangeCredentialConfig = useMemo(
    () => ({
      title: isVerifyMode ? 'Verify Email' : 'Change Email',
      subtitle: isVerifyMode ? 'Verify your email address' : 'Update your email address',
      gradientColors: ['#10b981', '#059669'] as const,
      inputIcon: Mail,
      currentLabel: 'Current Email',
      currentValue: user?.email,
      placeholder: isVerifyMode ? 'Enter your email' : 'Enter new email',
      inputLabel: isVerifyMode ? 'Email Address' : 'New Email Address',
      initialValue: isVerifyMode ? (user?.email ?? '') : '',
      keyboardType: 'email-address',
      validate: (value, currentValue) => {
        if (!value) return 'Please enter your new email address';
        const emailRegex = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        if (!isVerifyMode && value.toLowerCase() === currentValue?.toLowerCase())
          return 'New email must be different from your current email';
        return null;
      },
      sendOtp: (value) => authApi.sendOtp({ purpose: 'EMAIL_VERIFICATION', email: value }),
      otpSentTitle: 'OTP Sent',
      otpSentMessage: (value, minutes) =>
        `A verification code has been sent to ${value}. It will expire in ${minutes} minutes.`,
      update: (value, otp) => authApi.updateEmail({ new_email: value, otp }),
      updateStore: (u, value, result) => ({
        ...(u as object),
        email: (result as { email?: string }).email || value,
      }),
      successTitle: isVerifyMode ? 'Email Verified' : 'Email Updated',
      successMessage: isVerifyMode
        ? 'Your email has been verified successfully.'
        : 'Your email has been updated successfully.',
      updateButtonLabel: isVerifyMode ? 'Verify Email' : 'Update Email',
    }),
    [isVerifyMode, user?.email]
  );

  return <ChangeCredentialScreenBase config={config} />;
}
