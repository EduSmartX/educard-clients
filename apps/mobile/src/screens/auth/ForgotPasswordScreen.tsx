import { Colors } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Mail, ArrowLeft, Send, KeyRound } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { KeyboardAwareScrollView } from '@/lib/keyboard-aware-scroll-view';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { authApi } from '@/api/auth';
import { SegmentedSelector } from '@/components/ui';
import { LinearGradient } from '@/lib/linear-gradient';
import type { AuthStackParamList } from '@/navigation/types';

export default function ForgotPasswordScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [channel, setChannel] = useState<'email' | 'sms' | 'both'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleSendOTP = useCallback(async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    setIsLoading(true);
    try {
      await authApi.requestPasswordResetOtp(email.trim(), channel);
      Alert.alert('Success', 'OTP sent to your email', [
        {
          text: 'OK',
          onPress: () =>
            navigation.navigate('VerifyOtp', { email: email.trim() }),
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to send OTP',
      );
    } finally {
      setIsLoading(false);
    }
  }, [email, channel, navigation]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f97316', '#ea580c', '#dc2626']}
        style={styles.gradientBg}
      />
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
      >
        <Animated.View
          entering={FadeInDown.delay(100).duration(600)}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.iconGradient}>
            <KeyRound size={36} color="#f97316" />
          </View>
          <Text style={styles.headerTitle}>Forgot Password?</Text>
          <Text style={styles.headerSubtitle}>Enter your email to reset</Text>
        </Animated.View>
        <Animated.View
          entering={FadeInUp.delay(200).duration(600)}
          style={styles.formCard}
        >
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View
              style={[
                styles.inputContainer,
                focusedInput === 'email' && styles.inputFocused,
              ]}
            >
              <Mail
                size={20}
                color={
                  focusedInput === 'email'
                    ? Colors.primary[500]
                    : Colors.gray[400]
                }
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

          <SegmentedSelector
            label="Send OTP via"
            options={['email', 'sms', 'both'] as const}
            value={channel}
            onChange={setChannel}
          />

          <TouchableOpacity
            onPress={() => {
              handleSendOTP();
            }}
            disabled={isLoading}
            style={styles.sendButton}
          >
            <LinearGradient
              colors={['#f97316', '#ea580c']}
              style={styles.sendGradient}
            >
              <Send size={20} color="#fff" />
              <Text style={styles.sendButtonText}>
                {isLoading ? 'Sending...' : 'Send OTP'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backLink}
          >
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
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
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
  headerSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.9)' },
  formCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    flexGrow: 1,
  },
  inputWrapper: { marginBottom: 24 },
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
});
