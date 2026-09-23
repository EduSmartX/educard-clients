/**
 * ResetPasswordsModal - reset passwords for a class's students and download the
 * credentials Excel. Mirrors the web "Reset Class Passwords" dialog.
 */

import { Colors } from '@educard/shared';
import { KeyRound, X, Eye, EyeOff } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';

import { LinearGradient } from '@/lib/linear-gradient';

import {
  resetClassPasswords,
  fetchDefaultStudentPassword,
} from '../api/students-api';
import { KeyboardAwareScrollView } from '@/lib/keyboard-aware-scroll-view';

interface ClassOption {
  value: string;
  label: string;
}

interface ResetPasswordsModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly classOptions: ClassOption[];
  readonly onSuccess?: () => void;
}

export function ResetPasswordsModal({
  visible,
  onClose,
  classOptions,
  onSuccess,
}: ResetPasswordsModalProps) {
  const [classId, setClassId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill with the organization's default student password when the modal opens.
  useEffect(() => {
    if (!visible) {
      return;
    }
    let active = true;
    fetchDefaultStudentPassword()
      .then(pwd => {
        if (active && pwd) {
          setNewPassword(prev => prev || pwd);
          setConfirmPassword(prev => prev || pwd);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [visible]);

  const resetForm = () => {
    setClassId('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!classId) {
      Alert.alert(
        'Select a class',
        'Please choose a class to reset passwords for.',
      );
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(
        'Passwords do not match',
        'The new password and confirmation must match.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await resetClassPasswords(classId, {
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      if (result.success) {
        Alert.alert(
          'Success',
          'Passwords reset. The credentials file has been downloaded.',
        );
        onSuccess?.();
        resetForm();
        onClose();
      } else {
        Alert.alert(
          'Error',
          result.message || 'Failed to reset passwords. Please try again.',
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Failed to reset passwords. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.container}>
          <View style={styles.content}>
            <LinearGradient
              colors={[Colors.accent[600], Colors.accent[500]]}
              style={styles.header}
            >
              <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                  <KeyRound size={22} color={Colors.text.inverse} />
                  <Text style={styles.headerTitle}>Reset Class Passwords</Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <X size={20} color={Colors.text.inverse} />
                </TouchableOpacity>
              </View>
              <Text style={styles.headerSubtitle}>
                Sets a new password for active students who haven&apos;t set
                their own, then downloads an Excel of their login credentials to
                share.
              </Text>
            </LinearGradient>

            <KeyboardAwareScrollView
              style={styles.body}
              containerStyle={styles.bodyContainer}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.label}>Class</Text>
              <View style={styles.chipRow}>
                {classOptions.length === 0 ? (
                  <Text style={styles.emptyText}>No classes available.</Text>
                ) : (
                  classOptions.map(opt => {
                    const selected = opt.value === classId;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => setClassId(opt.value)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            selected && styles.chipTextSelected,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>

              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(s => !s)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#64748b" />
                  ) : (
                    <Eye size={18} color="#64748b" />
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </KeyboardAwareScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleClose}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  isSubmitting && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={Colors.text.inverse} />
                ) : (
                  <Text style={styles.submitText}>Reset &amp; Download</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: { width: '100%' },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16 },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { color: Colors.text.inverse, fontSize: 18, fontWeight: '700' },
  headerSubtitle: {
    color: Colors.text.inverse,
    opacity: 0.9,
    fontSize: 12.5,
    marginTop: 8,
  },
  closeBtn: { padding: 4 },
  // Bounded height: an unconstrained ScrollView here collapses and hides the fields.
  body: { paddingHorizontal: 20, paddingTop: 16, maxHeight: 420 },
  bodyContainer: { maxHeight: 420 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    marginTop: 6,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  chipSelected: { borderColor: Colors.accent[500], backgroundColor: '#ecfdf5' },
  chipText: { fontSize: 13, color: '#334155' },
  chipTextSelected: { color: Colors.accent[600], fontWeight: '600' },
  emptyText: { fontSize: 13, color: '#94a3b8' },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
    marginBottom: 8,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    marginBottom: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
  },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 10 },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  submitBtn: {
    flex: 1.6,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.accent[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { fontSize: 15, fontWeight: '700', color: Colors.text.inverse },
});
