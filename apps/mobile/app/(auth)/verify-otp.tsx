/**
 * Verify OTP Screen
 * Screen for verifying OTP during password reset
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { requestPasswordResetOtp, parseApiError } from '@/api';

export default function VerifyOTPScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value[value.length - 1];
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    // proper type instead of any
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    // removed async - no await
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    // Navigate to reset password screen with OTP
    // OTP will be verified together with new password
    router.push({
      pathname: '/(auth)/reset-password',
      params: { email, otp: otpCode },
    });
  };

  const handleResendOtp = async () => {
    if (!email) return;

    setIsLoading(true);
    try {
      await requestPasswordResetOtp(email);
      Alert.alert('Success', 'OTP sent again to your email');
      setError('');
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      const apiError = parseApiError(err);
      Alert.alert('Error', apiError.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark-outline" size={48} color="#10b981" />
            </View>
            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{'\n'}
              <Text style={styles.email}>{email}</Text>
            </Text>
          </View>

          {/* OTP Input */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref: TextInput | null) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled,
                  error && styles.otpInputError,
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={isLoading}
          >
            <Text style={styles.verifyButtonText}>{isLoading ? 'Verifying...' : 'Verify OTP'}</Text>
          </TouchableOpacity>

          {/* Resend OTP */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            <TouchableOpacity onPress={() => void handleResendOtp()}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  email: {
    fontWeight: '600',
    color: '#1f2937',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  otpInputFilled: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  otpInputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  verifyButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#6b7280',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
});
