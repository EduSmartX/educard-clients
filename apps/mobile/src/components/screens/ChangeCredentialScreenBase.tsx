/**
 * ChangeCredentialScreenBase - Shared OTP verification flow for changing email/phone.
 * Accepts config to customize labels, validation, colors, and API calls.
 */

import { getErrorMessage } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { type LucideIcon, ArrowLeft, KeyRound, CheckCircle, Send } from 'lucide-react-native';
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

import { useAuthStore } from '@/lib/auth-store';

export interface ChangeCredentialConfig {
  /** Screen title */
  title: string;
  /** Screen subtitle */
  subtitle: string;
  /** Header gradient colors */
  gradientColors: readonly [string, string];
  /** Icon for the input field */
  inputIcon: LucideIcon;
  /** Label for current value display */
  currentLabel: string;
  /** Current value from user profile */
  currentValue: string | undefined;
  /** Input placeholder */
  placeholder: string;
  /** Input label */
  inputLabel: string;
  /** Keyboard type */
  keyboardType: 'email-address' | 'phone-pad' | 'default';
  /** Validate the new value - return error message or null */
  validate: (value: string, currentValue?: string) => string | null;
  /** Send OTP API call */
  sendOtp: (value: string) => Promise<{ expires_in_minutes?: number }>;
  /** Success message after sending OTP */
  otpSentMessage: (value: string, expiryMinutes: number) => string;
  /** OTP sent alert title */
  otpSentTitle: string;
  /** Update API call */
  update: (value: string, otp: string) => Promise<Record<string, unknown>>;
  /** Update user store after success */
  updateStore: (user: unknown, value: string, result: Record<string, unknown>) => unknown;
  /** Success alert title */
  successTitle: string;
  /** Success alert message */
  successMessage: string;
  /** Update button label */
  updateButtonLabel: string;
}

interface Props {
  config: ChangeCredentialConfig;
}

export function ChangeCredentialScreenBase({ config }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();

  const [newValue, setNewValue] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const accentColor = config.gradientColors[0];

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

  const handleSendOtp = useCallback(async () => {
    const error = config.validate(newValue, config.currentValue);
    if (error) {
      Alert.alert('Error', error);
      return;
    }

    setIsSendingOtp(true);
    try {
      const result = await config.sendOtp(newValue);
      setIsOtpSent(true);
      const expiryMinutes = result.expires_in_minutes || 10;
      startCountdown(expiryMinutes);
      Alert.alert(config.otpSentTitle, config.otpSentMessage(newValue, expiryMinutes));
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err, 'Failed to send OTP'));
    } finally {
      setIsSendingOtp(false);
    }
  }, [newValue, config, startCountdown]);

  const handleUpdate = useCallback(async () => {
    if (otp?.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }

    setIsUpdating(true);
    try {
      const result = await config.update(newValue, otp);

      if (user) {
        const updatedUser = config.updateStore(user, newValue, result);
        useAuthStore.getState().setUser(updatedUser as typeof user);
      }

      Alert.alert(config.successTitle, config.successMessage, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err, `Failed to update`));
    } finally {
      setIsUpdating(false);
    }
  }, [newValue, otp, router, user, config]);

  const InputIcon = config.inputIcon;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[...config.gradientColors]} style={styles.header}>
        <Animated.View entering={FadeInUp.delay(100)} style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{config.title}</Text>
            <Text style={styles.headerSubtitle}>{config.subtitle}</Text>
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
        {/* Current Value Display */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.currentCard}>
          <Text style={styles.currentLabel}>{config.currentLabel}</Text>
          <Text style={styles.currentValue}>{config.currentValue || 'Not set'}</Text>
        </Animated.View>

        {/* New Value Input */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{config.inputLabel}</Text>
          <View
            style={[
              styles.inputContainer,
              focusedInput === 'value' && { borderColor: accentColor },
            ]}
          >
            <InputIcon size={20} color={focusedInput === 'value' ? accentColor : '#9ca3af'} />
            <TextInput
              style={styles.input}
              placeholder={config.placeholder}
              placeholderTextColor="#9ca3af"
              value={newValue}
              onChangeText={setNewValue}
              onFocus={() => setFocusedInput('value')}
              onBlur={() => setFocusedInput(null)}
              keyboardType={config.keyboardType}
              autoCapitalize="none"
              editable={!isOtpSent}
            />
          </View>
        </Animated.View>

        {/* Send OTP Button */}
        {!isOtpSent && (
          <Animated.View entering={FadeInDown.delay(300)}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: accentColor },
                isSendingOtp && styles.buttonDisabled,
              ]}
              onPress={() => void handleSendOtp()}
              disabled={isSendingOtp}
            >
              {isSendingOtp ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Send size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Send Verification Code</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* OTP Input */}
        {isOtpSent && (
          <>
            <Animated.View entering={FadeInDown.delay(100)} style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Verification Code</Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedInput === 'otp' && { borderColor: accentColor },
                ]}
              >
                <KeyRound size={20} color={focusedInput === 'otp' ? accentColor : '#9ca3af'} />
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
              <Text style={styles.otpHint}>Enter the code sent to {newValue}</Text>
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
                  <Text style={[styles.resendText, { color: accentColor }]}>Resend Code</Text>
                </TouchableOpacity>
              )}
            </Animated.View>

            {/* Update Button */}
            <Animated.View entering={FadeInDown.delay(300)}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: accentColor },
                  isUpdating && styles.buttonDisabled,
                ]}
                onPress={() => void handleUpdate()}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <CheckCircle size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>{config.updateButtonLabel}</Text>
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
  currentCard: {
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
  currentLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  currentValue: {
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    height: 56,
    gap: 8,
    marginTop: 8,
  },
  actionButtonText: {
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
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
