/**
 * Change Phone Screen
 * Allows authenticated users to change their phone number with OTP verification
 */

import { useMemo } from 'react';
import { Phone } from 'lucide-react-native';

import { authApi } from '@/api/auth';
import {
  ChangeCredentialScreenBase,
  type ChangeCredentialConfig,
} from '@/components/screens/ChangeCredentialScreenBase';
import { useAuthStore } from '@/lib/auth-store';

export default function ChangePhoneScreen() {
  const { user } = useAuthStore();

  const config: ChangeCredentialConfig = useMemo(
    () => ({
      title: 'Change Phone',
      subtitle: 'Update your phone number',
      gradientColors: ['#8b5cf6', '#7c3aed'] as const,
      inputIcon: Phone,
      currentLabel: 'Current Phone',
      currentValue: user?.phone,
      placeholder: 'Enter new phone number',
      inputLabel: 'New Phone Number',
      keyboardType: 'phone-pad',
      validate: (value, currentValue) => {
        if (!value) return 'Please enter your new phone number';
        const phoneDigits = value.replace(/\D/g, '');
        if (phoneDigits.length < 10) return 'Please enter a valid phone number';
        if (value === currentValue)
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
      successTitle: 'Phone Updated',
      successMessage: 'Your phone number has been updated successfully.',
      updateButtonLabel: 'Update Phone',
    }),
    [user?.phone]
  );

  return <ChangeCredentialScreenBase config={config} />;
}
