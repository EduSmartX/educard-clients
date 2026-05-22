/**
 * Change Password Screen
 * Allows authenticated users to change their password
 * After successful password change, user is logged out and redirected to login
 */

import { Colors } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Lock, Eye, EyeOff, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { authApi } from '@/api/auth';
import { useAuthStore } from '@/lib/auth-store';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleChangePassword = useCallback(async () => {
    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    if (oldPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from old password');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      // Show success message and logout
      Alert.alert(
        'Password Changed',
        'Your password has been changed successfully. Please login again with your new password.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Logout and redirect to login
              void logout().then(() => {
                router.replace('/(auth)/login');
              });
            },
          },
        ]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [oldPassword, newPassword, confirmPassword, logout, router]);

  const renderPasswordInput = (
    label: string,
    value: string,
    setValue: (val: string) => void,
    showPassword: boolean,
    setShowPassword: (val: boolean) => void,
    inputKey: string,
    placeholder: string
  ) => (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputContainer, focusedInput === inputKey && styles.inputFocused]}>
        <Lock
          size={20}
          color={focusedInput === inputKey ? Colors.primary[500] : Colors.gray[400]}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.gray[400]}
          value={value}
          onChangeText={setValue}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocusedInput(inputKey)}
          onBlur={() => setFocusedInput(null)}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          {showPassword ? (
            <EyeOff size={20} color={Colors.gray[400]} />
          ) : (
            <Eye size={20} color={Colors.gray[400]} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#10b981', '#059669', '#047857']} style={styles.gradientBg} />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
        style={styles.flex}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.iconGradient}>
            <KeyRound size={36} color="#10b981" />
          </View>
          <Text style={styles.headerTitle}>Change Password</Text>
          <Text style={styles.headerSubtitle}>
            Enter your current password and choose a new one
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.formCard}>
          {renderPasswordInput(
            'Current Password',
            oldPassword,
            setOldPassword,
            showOldPassword,
            setShowOldPassword,
            'old',
            'Enter current password'
          )}

          {renderPasswordInput(
            'New Password',
            newPassword,
            setNewPassword,
            showNewPassword,
            setShowNewPassword,
            'new',
            'Enter new password'
          )}

          {renderPasswordInput(
            'Confirm New Password',
            confirmPassword,
            setConfirmPassword,
            showConfirmPassword,
            setShowConfirmPassword,
            'confirm',
            'Confirm new password'
          )}

          {/* Password Requirements */}
          <View style={styles.requirements}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <View style={styles.requirementRow}>
              <CheckCircle
                size={14}
                color={newPassword.length >= 8 ? Colors.success[500] : Colors.gray[300]}
              />
              <Text
                style={[styles.requirementText, newPassword.length >= 8 && styles.requirementMet]}
              >
                At least 8 characters
              </Text>
            </View>
            <View style={styles.requirementRow}>
              <CheckCircle
                size={14}
                color={
                  newPassword === confirmPassword && newPassword.length > 0
                    ? Colors.success[500]
                    : Colors.gray[300]
                }
              />
              <Text
                style={[
                  styles.requirementText,
                  newPassword === confirmPassword &&
                    newPassword.length > 0 &&
                    styles.requirementMet,
                ]}
              >
                Passwords match
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={() => void handleChangePassword()}
            disabled={isLoading}
            style={styles.submitButton}
          >
            <LinearGradient colors={['#10b981', '#059669']} style={styles.submitGradient}>
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Changing Password...' : 'Change Password'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Back link */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <ArrowLeft size={18} color={Colors.gray[600]} />
            <Text style={styles.backLinkText}>Back to Settings</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  flex: { flex: 1 },
  gradientBg: { position: 'absolute', top: 0, left: 0, right: 0, height: '45%' },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  header: {
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    flex: 1,
  },
  inputWrapper: { marginBottom: 20 },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: 8,
  },
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
  inputFocused: {
    borderColor: Colors.primary[500],
    backgroundColor: '#fff',
  },
  input: { flex: 1, fontSize: 16, color: Colors.gray[900] },
  requirements: {
    backgroundColor: Colors.gray[50],
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[600],
    marginBottom: 8,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  requirementText: {
    fontSize: 13,
    color: Colors.gray[500],
  },
  requirementMet: {
    color: Colors.success[600],
  },
  submitButton: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  backLinkText: {
    fontSize: 15,
    color: Colors.gray[600],
    fontWeight: '500',
  },
});
