import { Colors } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Link } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  Switch,
  ImageSourcePropType,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { getErrorMessage } from '@/api';
import { useAuthStore } from '@/lib/auth-store';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const logoImage: ImageSourcePropType =
  require('../../assets/images/educard-logo.jpg') as ImageSourcePropType;

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [useEmail, setUseEmail] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleLogin = useCallback(async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      await login({ username: username.trim(), password });
      router.replace('/');
    } catch (error) {
      // Use shared error handler to get user-friendly message
      const errorMessage = getErrorMessage(error, 'Invalid credentials. Please try again.');
      Alert.alert('Login Failed', errorMessage);
    }
  }, [username, password, login, router]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#6366f1', '#8b5cf6', '#a855f7']} style={styles.gradientBg}>
        <Animated.View entering={FadeIn.delay(200)} style={styles.circle1} />
        <Animated.View entering={FadeIn.delay(400)} style={styles.circle2} />
      </LinearGradient>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={logoImage} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.welcomeText}>Welcome Back!</Text>
          <Text style={styles.subtitleText}>Sign in to continue your journey</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.formCard}>
          {/* Email/Username Toggle */}
          <View style={styles.toggleCard}>
            <View style={styles.toggleLeft}>
              <View
                style={[
                  styles.toggleIconBox,
                  useEmail ? styles.toggleIconActive : styles.toggleIconInactive,
                ]}
              >
                {useEmail ? (
                  <Mail size={18} color={Colors.primary[600]} />
                ) : (
                  <User size={18} color={Colors.gray[500]} />
                )}
              </View>
              <View>
                <Text style={styles.toggleTitle}>
                  {useEmail ? 'Using Email' : 'Using Username'}
                </Text>
                <Text style={styles.toggleSubtitle}>
                  {useEmail ? 'Sign in with your email address' : 'Sign in with your username'}
                </Text>
              </View>
            </View>
            <Switch
              value={useEmail}
              onValueChange={(value) => {
                setUseEmail(value);
                setUsername(''); // Clear input when switching
              }}
              trackColor={{ false: Colors.gray[300], true: Colors.primary[200] }}
              thumbColor={useEmail ? Colors.primary[500] : Colors.gray[400]}
            />
          </View>

          {/* Email/Username Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>{useEmail ? 'Email Address' : 'Username'}</Text>
            <View
              style={[styles.inputContainer, focusedInput === 'username' && styles.inputFocused]}
            >
              {useEmail ? (
                <Mail
                  size={20}
                  color={focusedInput === 'username' ? Colors.primary[500] : Colors.gray[400]}
                />
              ) : (
                <User
                  size={20}
                  color={focusedInput === 'username' ? Colors.primary[500] : Colors.gray[400]}
                />
              )}
              <TextInput
                style={styles.input}
                placeholder={useEmail ? 'Enter your email' : 'Enter your username'}
                placeholderTextColor={Colors.gray[400]}
                value={username}
                onChangeText={setUsername}
                keyboardType={useEmail ? 'email-address' : 'default'}
                autoCapitalize="none"
                onFocus={() => setFocusedInput('username')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Password</Text>
            <View
              style={[styles.inputContainer, focusedInput === 'password' && styles.inputFocused]}
            >
              <Lock
                size={20}
                color={focusedInput === 'password' ? Colors.primary[500] : Colors.gray[400]}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={Colors.gray[400]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedInput('password')}
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

          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity style={styles.forgotButton}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </Link>

          <TouchableOpacity
            onPress={() => void handleLogin()}
            disabled={isLoading}
            style={styles.loginButton}
          >
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginGradient}
            >
              <Text style={styles.loginButtonText}>{isLoading ? 'Signing in...' : 'Sign In'}</Text>
              <ArrowRight size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  flex: { flex: 1 },
  gradientBg: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
  circle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle2: {
    position: 'absolute',
    top: 100,
    left: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  header: { paddingTop: 80, paddingHorizontal: 24, paddingBottom: 32, alignItems: 'center' },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: { width: 60, height: 60, borderRadius: 30 },
  welcomeText: { fontSize: 32, fontWeight: '800', color: '#ffffff', marginBottom: 8 },
  subtitleText: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  formCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },

  // Toggle styles
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary[50],
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary[100],
    padding: 14,
    marginBottom: 20,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  toggleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleIconActive: { backgroundColor: Colors.primary[100] },
  toggleIconInactive: { backgroundColor: Colors.gray[100] },
  toggleTitle: { fontSize: 14, fontWeight: '700', color: Colors.gray[800] },
  toggleSubtitle: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },

  inputWrapper: { marginBottom: 20 },
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
  forgotButton: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { fontSize: 14, color: Colors.primary[600], fontWeight: '600' },
  loginButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  loginButtonText: { fontSize: 17, fontWeight: '700', color: '#ffffff' },
  signupContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  signupText: { fontSize: 15, color: Colors.gray[600] },
  signupLink: { fontSize: 15, color: Colors.primary[600], fontWeight: '700' },
});
