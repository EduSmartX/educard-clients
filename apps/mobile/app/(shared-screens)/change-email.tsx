/**
 * Change Email Screen
 * Allows authenticated users to change their email with OTP verification
 */

import { getErrorMessage } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Mail, ArrowLeft, KeyRound, CheckCircle, Send } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { authApi } from '@/api/auth';
import { useAuthStore } from '@/lib/auth-store';

export default function ChangeEmailScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Start countdown timer (in seconds)
  const startCountdown = useCallback((minutes: number) => {
    const seconds = minutes * 60;
    setCountdown(seconds);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Send OTP to new email
  const handleSendOtp = useCallback(async () => {
    if (!newEmail) {
      Alert.alert('Error', 'Please enter your new email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (newEmail.toLowerCase() === user?.email?.toLowerCase()) {
      Alert.alert('Error', 'New email must be different from your current email');
      return;
    }

    setIsSendingOtp(true);
    try {
      const result = await authApi.sendOtp({
        purpose: 'EMAIL_VERIFICATION',
        email: newEmail,
      });
      setIsOtpSent(true);
      const expiryMinutes = result.expires_in_minutes || 10;
      startCountdown(expiryMinutes);
      Alert.alert(
        'OTP Sent',
        `A verification code has been sent to ${newEmail}. It will expire in ${expiryMinutes} minutes.`
      );
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to send OTP'));
    } finally {
      setIsSendingOtp(false);
    }
  }, [newEmail, user?.email, startCountdown]);

  // Update email with OTP verification
  const handleUpdateEmail = useCallback(async () => {
    if (otp?.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }

    setIsUpdating(true);
    try {
      const result = await authApi.updateEmail({
        new_email: newEmail,
        otp: otp,
      });

      // Update user in auth store with new email
      if (user) {
        useAuthStore.getState().setUser({
          ...user,
          email: result.email || newEmail,
        });
      }

      Alert.alert('Email Updated', 'Your email has been updated successfully.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to update email'));
    } finally {
      setIsUpdating(false);
    }
  }, [newEmail, otp, router, user]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#10b981', '#059669']} style={styles.header}>
        <Animated.View entering={FadeInUp.delay(100)} style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Change Email</Text>
            <Text style={styles.headerSubtitle}>Update your email address</Text>
          </View>
        </Animated.View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Current Email Display */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.currentEmailCard}>
            <Text style={styles.currentEmailLabel}>Current Email</Text>
            <Text style={styles.currentEmailValue}>{user?.email || 'Not set'}</Text>
          </Animated.View>

          {/* New Email Input */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.inputGroup}>
            <Text style={styles.inputLabel}>New Email Address</Text>
            <View style={[styles.inputContainer, focusedInput === 'email' && styles.inputFocused]}>
              <Mail size={20} color={focusedInput === 'email' ? '#10b981' : '#9ca3af'} />
              <TextInput
                style={styles.input}
                placeholder="Enter new email"
                placeholderTextColor="#9ca3af"
                value={newEmail}
                onChangeText={setNewEmail}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isOtpSent}
              />
            </View>
          </Animated.View>

          {/* Send OTP Button */}
          {!isOtpSent && (
            <Animated.View entering={FadeInDown.delay(300)}>
              <TouchableOpacity
                style={[styles.sendOtpButton, isSendingOtp && styles.buttonDisabled]}
                onPress={() => void handleSendOtp()}
                disabled={isSendingOtp}
              >
                {isSendingOtp ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Send size={20} color="#fff" />
                    <Text style={styles.sendOtpText}>Send Verification Code</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* OTP Input (shown after OTP is sent) */}
          {isOtpSent && (
            <>
              <Animated.View entering={FadeInDown.delay(100)} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Verification Code</Text>
                <View
                  style={[styles.inputContainer, focusedInput === 'otp' && styles.inputFocused]}
                >
                  <KeyRound size={20} color={focusedInput === 'otp' ? '#10b981' : '#9ca3af'} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="#9ca3af"
                    value={otp}
                    onChangeText={setOtp}
                    onFocus={() => setFocusedInput('otp')}
                    onBlur={() => setFocusedInput(null)}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
                <Text style={styles.otpHint}>Enter the code sent to {newEmail}</Text>
              </Animated.View>

              {/* Resend OTP */}
              <Animated.View entering={FadeInDown.delay(200)} style={styles.resendContainer}>
                {countdown > 0 ? (
                  <Text style={styles.countdownText}>
                    Resend code in {Math.floor(countdown / 60)}:
                    {String(countdown % 60).padStart(2, '0')}
                  </Text>
                ) : (
                  <TouchableOpacity onPress={() => void handleSendOtp()} disabled={isSendingOtp}>
                    <Text style={styles.resendText}>Resend Code</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>

              {/* Update Button */}
              <Animated.View entering={FadeInDown.delay(300)}>
                <TouchableOpacity
                  style={[styles.updateButton, isUpdating && styles.buttonDisabled]}
                  onPress={() => void handleUpdateEmail()}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <CheckCircle size={20} color="#fff" />
                      <Text style={styles.updateButtonText}>Update Email</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  currentEmailCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  currentEmailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  currentEmailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  inputFocused: {
    borderColor: '#10b981',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
  otpHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  sendOtpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 12,
    height: 56,
    gap: 8,
    marginTop: 8,
  },
  sendOtpText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  countdownText: {
    fontSize: 14,
    color: '#6b7280',
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 12,
    height: 56,
    gap: 8,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
