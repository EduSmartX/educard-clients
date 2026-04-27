/**
 * Security Settings Screen
 * Change Password functionality
 */

import { Colors, getRoleGradient, getErrorMessage } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Lock, Eye, EyeOff, Shield, CheckCircle } from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { apiClient } from '@/api/client';
import {
  headerStyles,
  layoutStyles,
  bodyStyles,
  cardStyles,
  formFieldStyles,
  reqStyles,
  buttonStyles,
} from '@/styles';

const adminGradient = getRoleGradient('admin');

export default function SecurityScreen() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    oldPassword.length >= 1 && newPassword.length >= 8 && confirmPassword === newPassword;

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      Alert.alert('Success', 'Password changed successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      const msg = getErrorMessage(error, 'Failed to change password.');
      Alert.alert('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <Animated.View
          entering={FadeIn.delay(100)}
          style={headerStyles.circle1}
          pointerEvents="none"
        />
        <Animated.View
          entering={FadeIn.delay(200)}
          style={headerStyles.circle2}
          pointerEvents="none"
        />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Security</Text>
              <Text style={headerStyles.subtitle}>Change password</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={bodyStyles.scroll}
        contentContainerStyle={bodyStyles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={cardStyles.cardLarge}>
            <View style={s.cardHeader}>
              <Shield size={20} color="#7c3aed" />
              <Text style={s.cardTitle}>Change Password</Text>
            </View>

            <Text style={formFieldStyles.label}>Current Password</Text>
            <View style={formFieldStyles.passwordRow}>
              <TextInput
                style={formFieldStyles.passwordInput}
                placeholder="Enter current password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showOld}
                value={oldPassword}
                onChangeText={setOldPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowOld(!showOld)} style={formFieldStyles.eyeBtn}>
                {showOld ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
              </TouchableOpacity>
            </View>

            <Text style={formFieldStyles.label}>New Password</Text>
            <View style={formFieldStyles.passwordRow}>
              <TextInput
                style={formFieldStyles.passwordInput}
                placeholder="Enter new password (min 8 chars)"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)} style={formFieldStyles.eyeBtn}>
                {showNew ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
              </TouchableOpacity>
            </View>

            <Text style={formFieldStyles.label}>Confirm New Password</Text>
            <View style={formFieldStyles.passwordRow}>
              <TextInput
                style={formFieldStyles.passwordInput}
                placeholder="Confirm new password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirm(!showConfirm)}
                style={formFieldStyles.eyeBtn}
              >
                {showConfirm ? (
                  <EyeOff size={18} color="#94a3b8" />
                ) : (
                  <Eye size={18} color="#94a3b8" />
                )}
              </TouchableOpacity>
            </View>

            {/* Password requirements */}
            <View style={reqStyles.container}>
              <ReqItem met={newPassword.length >= 8} text="At least 8 characters" />
              <ReqItem met={/[A-Z]/.test(newPassword)} text="One uppercase letter" />
              <ReqItem met={/[0-9]/.test(newPassword)} text="One number" />
              <ReqItem
                met={newPassword === confirmPassword && confirmPassword.length > 0}
                text="Passwords match"
              />
            </View>

            <TouchableOpacity
              style={[buttonStyles.primary, !canSubmit && buttonStyles.disabled]}
              onPress={handleChangePassword}
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Lock size={16} color="#fff" />
                  <Text style={buttonStyles.primaryText}>Change Password</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function ReqItem({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={reqStyles.row}>
      <CheckCircle size={14} color={met ? '#16a34a' : '#cbd5e1'} />
      <Text style={[reqStyles.text, met && reqStyles.textMet]}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
});
