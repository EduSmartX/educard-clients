import { Colors } from '@educard/shared';
import { useMutation } from '@tanstack/react-query';
import { Send, Users, Loader } from 'lucide-react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';

import { requestProfileSyncOtp, verifyProfileSync } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { Screen } from '@/components/layout';
import { ScreenHeader } from '@/components/ui';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/lib/toast-context';

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function SyncProfilesScreen() {
  const email = useAuthStore(s => s.user?.email);
  const { showToast } = useToast();

  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [setNewPassword, setSetNewPassword] = useState(false);
  const [newPassword, setNewPassword2] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = useCallback((minutes: number) => {
    setCountdown(minutes * 60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const requestOtpMutation = useMutation({
    mutationFn: requestProfileSyncOtp,
    onSuccess: data => {
      setOtpSent(true);
      startCountdown(data.expires_in_minutes || 10);
      showToast({
        type: 'success',
        title: 'Verification code sent to your login email',
      });
    },
    onError: error => {
      showToast({
        type: 'error',
        title: 'Unable to send code',
        message: getErrorMessage(error, 'Please try again.'),
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: verifyProfileSync,
    onSuccess: data => {
      const count = data.linked_profiles_count;
      const profileWord = count === 1 ? 'profile' : 'profiles';
      showToast({
        type: 'success',
        title: 'Profiles synced',
        message:
          count > 0
            ? `${count} other student ${profileWord} linked to this email.`
            : data.message,
      });
      setOtp('');
      setOtpSent(false);
      setCountdown(0);
      setSetNewPassword(false);
      setNewPassword2('');
      setConfirmPassword('');
    },
    onError: error => {
      showToast({
        type: 'error',
        title: 'Verification failed',
        message: getErrorMessage(error, 'Please check the code and try again.'),
      });
    },
  });

  const handleSubmit = useCallback(() => {
    if (otp.trim().length !== 6) {
      showToast({ type: 'error', title: 'Enter the 6-digit code' });
      return;
    }
    if (setNewPassword) {
      if (!newPassword || newPassword.length < 8) {
        showToast({
          type: 'error',
          title: 'Password must be at least 8 characters',
        });
        return;
      }
      if (newPassword !== confirmPassword) {
        showToast({ type: 'error', title: 'Passwords do not match' });
        return;
      }
    }
    verifyMutation.mutate({
      otp: otp.trim(),
      ...(setNewPassword
        ? { new_password: newPassword, confirm_password: confirmPassword }
        : {}),
    });
  }, [
    otp,
    setNewPassword,
    newPassword,
    confirmPassword,
    verifyMutation,
    showToast,
  ]);

  const canSubmit = otpSent && !verifyMutation.isPending;

  return (
    <Screen safeArea={false} statusBarStyle="light">
      <ScreenHeader title="Sync Profiles" />

      <View style={styles.body}>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>
            Login Email:{' '}
            <Text style={styles.infoEmail}>{email || 'Not set'}</Text>
          </Text>
          <Text style={styles.infoText}>
            If more than one student account shares this email, verifying it
            here links all of them together - letting you switch between
            profiles without re-entering a password.
          </Text>
        </View>

        <View style={styles.sendRow}>
          <View style={styles.sendLeft}>
            <Text style={styles.sendTitle}>Send verification code</Text>
            <Text style={styles.sendSubtitle}>
              {otpSent ? (
                <Text style={styles.sentText}>
                  Code sent! Expires in {formatCountdown(countdown)}
                </Text>
              ) : (
                'A code will be sent to your login email'
              )}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (otpSent || requestOtpMutation.isPending) && styles.btnDisabled,
            ]}
            disabled={otpSent || requestOtpMutation.isPending}
            onPress={() => requestOtpMutation.mutate()}
          >
            {requestOtpMutation.isPending ? (
              <Loader size={16} color="#ffffff" />
            ) : (
              <>
                <Send size={16} color="#ffffff" />
                <Text style={styles.sendBtnText}>Send OTP</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {otpSent && (
          <>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>OTP Code *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit code"
                placeholderTextColor={Colors.gray[400]}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
              <Text style={styles.fieldHint}>
                Enter the code sent to your login email
              </Text>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <Text style={styles.sendTitle}>Set a new shared password</Text>
                <Text style={styles.sendSubtitle}>
                  Optionally set one password for every linked profile
                </Text>
              </View>
              <Switch
                value={setNewPassword}
                onValueChange={setSetNewPassword}
                trackColor={{
                  false: Colors.gray[300],
                  true: Colors.primary[200],
                }}
                thumbColor={
                  setNewPassword ? Colors.primary[500] : Colors.gray[400]
                }
              />
            </View>

            {setNewPassword && (
              <>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>New Password *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new password"
                    placeholderTextColor={Colors.gray[400]}
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword2}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Confirm New Password *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter new password"
                    placeholderTextColor={Colors.gray[400]}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              </>
            )}
          </>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.btnDisabled]}
          disabled={!canSubmit}
          onPress={handleSubmit}
        >
          {verifyMutation.isPending ? (
            <Loader size={18} color="#ffffff" />
          ) : (
            <Users size={18} color="#ffffff" />
          )}
          <Text style={styles.submitText}>Sync Profiles</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: 16,
  },
  infoBox: {
    borderWidth: 1,
    borderColor: Colors.info[200],
    backgroundColor: Colors.info[50],
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.info[900],
    fontWeight: '600',
  },
  infoEmail: {
    fontWeight: '400',
  },
  infoText: {
    fontSize: 12,
    color: Colors.info[700],
    marginTop: 8,
    lineHeight: 17,
  },
  sendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  sendLeft: {
    flex: 1,
    marginRight: 12,
  },
  sendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[900],
  },
  sendSubtitle: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 2,
  },
  sentText: {
    color: Colors.success[600],
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.gray[900],
    backgroundColor: '#ffffff',
  },
  fieldHint: {
    fontSize: 11,
    color: Colors.gray[500],
    marginTop: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  toggleLeft: {
    flex: 1,
    marginRight: 12,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary[600],
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
