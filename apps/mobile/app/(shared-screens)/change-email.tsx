/**
 * Change Email Screen
 * Allows authenticated users to change their email with OTP verification
 */

import { Mail } from 'lucide-react-native';
import { useMemo } from 'react';

import { authApi } from '@/api/auth';
import {
  ChangeCredentialScreenBase,
  type ChangeCredentialConfig,
} from '@/components/screens/ChangeCredentialScreenBase';
import { useAuthStore } from '@/lib/auth-store';

export default function ChangeEmailScreen() {
  const { user } = useAuthStore();

  const config: ChangeCredentialConfig = useMemo(
    () => ({
      title: 'Change Email',
      subtitle: 'Update your email address',
      gradientColors: ['#10b981', '#059669'] as const,
      inputIcon: Mail,
      currentLabel: 'Current Email',
      currentValue: user?.email,
      placeholder: 'Enter new email',
      inputLabel: 'New Email Address',
      keyboardType: 'email-address',
      validate: (value, currentValue) => {
        if (!value) return 'Please enter your new email address';
        const emailRegex = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        if (value.toLowerCase() === currentValue?.toLowerCase())
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
      successTitle: 'Email Updated',
      successMessage: 'Your email has been updated successfully.',
      updateButtonLabel: 'Update Email',
    }),
    [user?.email]
  );

  return <ChangeCredentialScreenBase config={config} />;
}
