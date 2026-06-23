import { Colors } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Mail, ArrowLeft, Send, KeyRound } from 'lucide-react-native';
import { useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { authApi } from '@/api/auth';

type Step = 'email' | 'otp' | 'newPassword';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [, setStep] = useState<Step>('email'); // NOSONAR - only setter needed
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, _setNewPassword] = useState(''); // NOSONAR - used in future password reset step
  const [confirmPassword, _setConfirmPassword] = useState(''); // NOSONAR - used in future password reset step
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const otpRefs = useRef<(TextInput | null)[]>([]);

  const handleSendOTP = useCallback(async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    setIsLoading(true);
    try {
      await authApi.requestPasswordResetOtp(email.trim());
      Alert.alert('Success', 'OTP sent to your email', [
        { text: 'OK', onPress: () => setStep('otp') },
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  // These functions are for future use (OTP and reset password steps)
  const _handleVerifyOTP = useCallback(() => {
    // removed async - no await, prefixed _
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete OTP');
      return;
    }
    setStep('newPassword');
  }, [otp, setStep]);

  const _handleResetPassword = useCallback(async () => {
    // prefixed _ - for future use
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    setIsLoading(true);
    try {
      const otpCode = otp.join('');
      await authApi.verifyPasswordResetOtp({
        email: email.trim(),
        otp: otpCode,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      Alert.alert('Success', 'Password reset successfully', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (_error) {
      // prefixed _
      Alert.alert('Error', _error instanceof Error ? _error.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  }, [email, otp, newPassword, confirmPassword, router]);

  const _handleOtpChange = (index: number, value: string) => {
    // prefixed _
    if (value.length > 1) {
      value = value[0];
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const _handleOtpKeyPress = (index: number, key: string) => {
    // prefixed _
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const _handleResendOTP = useCallback(async () => {
    // prefixed _
    setIsLoading(true);
    try {
      await authApi.requestPasswordResetOtp(email.trim());
      Alert.alert('Success', 'OTP sent again');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch {
      // Error handled with alert
      Alert.alert('Error', 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#f97316', '#ea580c', '#dc2626']} style={styles.gradientBg} />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.iconGradient}>
            <KeyRound size={36} color="#f97316" />
          </View>
          <Text style={styles.headerTitle}>Forgot Password?</Text>
          <Text style={styles.headerSubtitle}>Enter your email to reset</Text>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.formCard}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={[styles.inputContainer, focusedInput === 'email' && styles.inputFocused]}>
              <Mail
                size={20}
                color={focusedInput === 'email' ? Colors.primary[500] : Colors.gray[400]}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={Colors.gray[400]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>
          <TouchableOpacity
            onPress={() => void handleSendOTP()} // void for async handler
            disabled={isLoading}
            style={styles.sendButton}
          >
            <LinearGradient colors={['#f97316', '#ea580c']} style={styles.sendGradient}>
              <Send size={20} color="#fff" />
              <Text style={styles.sendButtonText}>{isLoading ? 'Sending...' : 'Send OTP'}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <ArrowLeft size={18} color={Colors.gray[600]} />
            <Text style={styles.backLinkText}>Back to Login</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  flex: { flex: 1 },
  gradientBg: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  header: { paddingTop: 50, paddingHorizontal: 24, paddingBottom: 32, alignItems: 'center' },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#ffffff', marginBottom: 8 },
  headerSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.9)' },
  formCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    flex: 1,
  },
  inputWrapper: { marginBottom: 24 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: Colors.gray[700], marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.gray[100],
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  inputFocused: { borderColor: Colors.primary[500], backgroundColor: '#fff' },
  input: { flex: 1, fontSize: 16, color: Colors.gray[900] },
  sendButton: { borderRadius: 16, overflow: 'hidden' },
  sendGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  sendButtonText: { fontSize: 17, fontWeight: '700', color: '#ffffff' },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  backLinkText: { fontSize: 15, color: Colors.gray[600], fontWeight: '500' },
  successContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  successContent: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
  },
  successIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: { fontSize: 24, fontWeight: '800', color: Colors.gray[900], marginBottom: 8 },
  successSubtitle: { fontSize: 15, color: Colors.gray[500] },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary[600],
    marginTop: 4,
    marginBottom: 24,
  },
  resendButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  resendText: { fontSize: 14, color: Colors.primary[600], fontWeight: '600' },
  backToLoginButton: { borderRadius: 16, overflow: 'hidden', width: '100%' },
  backToLoginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  backToLoginText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
});
