/**
 * Change Phone Screen
 * Allows authenticated users to change their phone number with OTP verification
 */

import { getErrorMessage } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Phone, ArrowLeft, KeyRound, CheckCircle, Send } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { authApi } from '@/api/auth';
import { useAuthStore } from '@/lib/auth-store';

export default function ChangePhoneScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [newPhone, setNewPhone] = useState('');
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

  // Send OTP to new phone
  const handleSendOtp = useCallback(async () => {
    if (!newPhone) {
      Alert.alert('Error', 'Please enter your new phone number');
      return;
    }

    // Basic phone validation (at least 10 digits)
    const phoneDigits = newPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    if (newPhone === user?.phone) {
      Alert.alert('Error', 'New phone number must be different from your current number');
      return;
    }

    setIsSendingOtp(true);
    try {
      const result = await authApi.sendOtp({
        purpose: 'PHONE_VERIFICATION',
        phone: newPhone,
      });
      setIsOtpSent(true);
      const expiryMinutes = result.expires_in_minutes || 10;
      startCountdown(expiryMinutes);
      Alert.alert(
        'OTP Generated',
        `A verification code has been generated. It will expire in ${expiryMinutes} minutes. SMS delivery is currently on hold pending configuration.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to send OTP'));
    } finally {
      setIsSendingOtp(false);
    }
  }, [newPhone, user?.phone, startCountdown]);

  // Update phone with OTP verification
  const handleUpdatePhone = useCallback(async () => {
    if (otp?.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }

    setIsUpdating(true);
    try {
      const result = await authApi.updatePhone({
        new_phone: newPhone,
        otp: otp,
      });

      // Update user in auth store with new phone
      if (user) {
        useAuthStore.getState().setUser({
          ...user,
          phone: result.phone || newPhone,
        });
      }

      Alert.alert('Phone Updated', 'Your phone number has been updated successfully.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to update phone'));
    } finally {
      setIsUpdating(false);
    }
  }, [newPhone, otp, router, user]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.header}>
        <Animated.View entering={FadeInUp.delay(100)} style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Change Phone</Text>
            <Text style={styles.headerSubtitle}>Update your phone number</Text>
          </View>
        </Animated.View>
      </LinearGradient>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
        style={styles.content}
      >
        {/* Current Phone Display */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.currentPhoneCard}>
          <Text style={styles.currentPhoneLabel}>Current Phone</Text>
          <Text style={styles.currentPhoneValue}>{user?.phone || 'Not set'}</Text>
        </Animated.View>

        {/* New Phone Input */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.inputGroup}>
          <Text style={styles.inputLabel}>New Phone Number</Text>
          <View style={[styles.inputContainer, focusedInput === 'phone' && styles.inputFocused]}>
            <Phone size={20} color={focusedInput === 'phone' ? '#8b5cf6' : '#9ca3af'} />
            <TextInput
              style={styles.input}
              placeholder="Enter new phone number"
              placeholderTextColor="#9ca3af"
              value={newPhone}
              onChangeText={setNewPhone}
              onFocus={() => setFocusedInput('phone')}
              onBlur={() => setFocusedInput(null)}
              keyboardType="phone-pad"
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
              <View style={[styles.inputContainer, focusedInput === 'otp' && styles.inputFocused]}>
                <KeyRound size={20} color={focusedInput === 'otp' ? '#8b5cf6' : '#9ca3af'} />
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
              <Text style={styles.otpHint}>Enter the code sent to {newPhone}</Text>
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
                onPress={() => void handleUpdatePhone()}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <CheckCircle size={20} color="#fff" />
                    <Text style={styles.updateButtonText}>Update Phone</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          </>
        )}
      </KeyboardAwareScrollView>
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
  currentPhoneCard: {
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
  currentPhoneLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  currentPhoneValue: {
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
    borderColor: '#8b5cf6',
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
    backgroundColor: '#8b5cf6',
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
    color: '#8b5cf6',
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
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
