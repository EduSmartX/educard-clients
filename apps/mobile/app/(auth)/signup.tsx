import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Mail,
  Building2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Shield,
  User,
  Lock,
  Eye,
  EyeOff,
  Phone,
} from 'lucide-react-native';
import { Colors, APP_INFO, ORGANIZATION_TYPES, BOARD_AFFILIATIONS, SIGNUP_STEP_LABELS, SIGNUP_STEP_TITLES } from '@educard/shared';
import type { SignupStep } from '@educard/shared';
import { useModal } from '@/components/ui';
import { sendOtps, verifyOtp, parseApiError, registerOrganization } from '@/api';
import type { OrganizationRegistrationData } from '@/api';
import { AddressForm, type AddressData } from '@/components/forms';

export default function SignupScreen() {
  const router = useRouter();
  const modal = useModal();
  const [currentStep, setCurrentStep] = useState<SignupStep>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Emails
  const [adminEmail, setAdminEmail] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [useSameEmail, setUseSameEmail] = useState(false);

  // Step 2: OTP Verification
  const [adminOtp, setAdminOtp] = useState('');
  const [orgOtp, setOrgOtp] = useState('');
  const [adminOtpVerified, setAdminOtpVerified] = useState(false);
  const [orgOtpVerified, setOrgOtpVerified] = useState(false);

  // Step 3: Organization Details
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('');
  const [boardAffiliation, setBoardAffiliation] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgAddress, setOrgAddress] = useState<AddressData>({
    streetAddress: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
  });

  // Helper to update address fields
  const handleAddressChange = useCallback((field: keyof AddressData, value: string) => {
    setOrgAddress(prev => ({ ...prev, [field]: value }));
  }, []);

  // Step 4: Admin Details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Email validation
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Step 1: Send OTPs
  const handleStep1Submit = useCallback(async () => {
    if (!adminEmail.trim() || !isValidEmail(adminEmail)) {
      modal.error('Error', 'Please enter a valid administrator email');
      return;
    }
    if (!useSameEmail && (!orgEmail.trim() || !isValidEmail(orgEmail))) {
      modal.error('Error', 'Please enter a valid organization email');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare emails to send OTPs
      const emailsToSend = useSameEmail
        ? [{ email: adminEmail, category: 'admin' as const, purpose: 'organization_registration' }]
        : [
            { email: adminEmail, category: 'admin' as const, purpose: 'organization_registration' },
            { email: orgEmail, category: 'organization' as const, purpose: 'organization_registration' },
          ];

      // Call API to send OTPs
      const response = await sendOtps(emailsToSend);
      
      if (!response.all_success) {
        // Check for individual failures
        const failedEmail = response.results.find(r => !r.success);
        modal.error('Error', failedEmail?.message || 'Failed to send verification codes');
        return;
      }
      
      if (useSameEmail) {
        setOrgEmail(adminEmail);
      }
      
      modal.success(
        'Verification Codes Sent',
        useSameEmail
          ? `Code sent to ${adminEmail}`
          : `Codes sent to ${adminEmail} and ${orgEmail}`,
        () => setCurrentStep(2)
      );
    } catch (error) {
      const apiError = parseApiError(error);
      modal.error('Error', apiError.message || 'Failed to send verification codes');
    } finally {
      setIsLoading(false);
    }
  }, [adminEmail, orgEmail, useSameEmail, modal]);

  // Step 2: Verify OTPs
  const handleVerifyAdminOtp = useCallback(async () => {
    if (adminOtp.length !== 6) {
      modal.error('Error', 'Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      // Call API to verify OTP
      const response = await verifyOtp(adminEmail, adminOtp, 'organization_registration');
      
      if (!response.success) {
        modal.error('Error', response.message || 'Invalid verification code');
        return;
      }
      
      setAdminOtpVerified(true);
      if (useSameEmail) {
        setOrgOtpVerified(true);
      }
      modal.success('Success', 'Email verified!');
    } catch (error) {
      const apiError = parseApiError(error);
      modal.error('Error', apiError.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  }, [adminOtp, adminEmail, useSameEmail, modal]);

  const handleVerifyOrgOtp = useCallback(async () => {
    if (orgOtp.length !== 6) {
      modal.error('Error', 'Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      // Call API to verify OTP
      const response = await verifyOtp(orgEmail, orgOtp, 'organization_registration');
      
      if (!response.success) {
        modal.error('Error', response.message || 'Invalid verification code');
        return;
      }
      
      setOrgOtpVerified(true);
      modal.success('Success', 'Organization email verified!');
    } catch (error) {
      const apiError = parseApiError(error);
      modal.error('Error', apiError.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  }, [orgOtp, orgEmail, modal]);

  const handleStep2Submit = useCallback(() => {
    const isVerified = useSameEmail ? adminOtpVerified : adminOtpVerified && orgOtpVerified;
    if (!isVerified) {
      modal.error('Error', 'Please verify all email addresses');
      return;
    }
    setCurrentStep(3);
  }, [useSameEmail, adminOtpVerified, orgOtpVerified, modal]);

  // Step 3: Organization Details
  const handleStep3Submit = useCallback(() => {
    if (!orgName.trim()) {
      modal.error('Error', 'Please enter organization name');
      return;
    }
    if (!orgType) {
      modal.error('Error', 'Please select organization type');
      return;
    }
    setCurrentStep(4);
  }, [orgName, orgType, modal]);

  // Step 4: Final Registration
  const handleStep4Submit = useCallback(async () => {
    if (!firstName.trim() || !lastName.trim()) {
      modal.error('Error', 'Please enter your name');
      return;
    }
    if (!password || password.length < 8) {
      modal.error('Error', 'Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      modal.error('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare registration data matching backend API structure
      const registrationData: OrganizationRegistrationData = {
        organization_info: {
          name: orgName.trim(),
          type: orgType, // Already lowercase from picker
          email: useSameEmail ? adminEmail : orgEmail,
          phone_number: orgPhone.trim() || '',
          board_affiliation: boardAffiliation || undefined, // Already lowercase from picker
        },
        admin_info: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: adminEmail,
          password: password,
          password2: confirmPassword,
          notification_opt_in: true,
          phone: phoneNumber.trim() || undefined,
        },
      };

      // Add address info if any field is filled
      const hasAddress = orgAddress.streetAddress || orgAddress.city || orgAddress.state || orgAddress.zipCode;
      if (hasAddress) {
        registrationData.address_info = {
          street_address: orgAddress.streetAddress || '',
          address_line_2: orgAddress.addressLine2 || undefined,
          city: orgAddress.city || '',
          state: orgAddress.state || '',
          zip_code: orgAddress.zipCode || '',
          country: orgAddress.country || 'India',
        };
      }

      // Call the registration API
      const response = await registerOrganization(registrationData);
      
      if (response.success) {
        modal.success(
          'Registration Submitted! 🎉',
          `Thank you for registering "${orgName}"!\n\n${APP_INFO.NAME} team will verify your organization details and approve your account.\n\nYou will receive an email notification once approved. After approval, you'll have full access to all features.`,
          () => router.replace('/(auth)/login')
        );
      } else {
        modal.error('Registration Failed', response.message || 'Please try again.');
      }
    } catch (error) {
      const apiError = parseApiError(error);
      modal.error('Registration Failed', apiError.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [
    firstName, lastName, password, confirmPassword, 
    orgName, orgType, orgEmail, orgPhone, boardAffiliation, orgAddress,
    adminEmail, useSameEmail, phoneNumber,
    router, modal
  ]);

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as SignupStep);
    } else {
      router.back();
    }
  };

  // Progress Steps Component
  const ProgressSteps = () => (
    <View style={styles.progressContainer}>
      {SIGNUP_STEP_LABELS.map((title, idx) => {
        const step = idx + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;

        return (
          <View key={step} style={styles.stepWrapper}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  isCompleted && styles.stepCompleted,
                  isCurrent && styles.stepCurrent,
                ]}
              >
                {isCompleted ? (
                  <CheckCircle2 size={16} color="#fff" />
                ) : (
                  <Text style={[styles.stepNumber, (isCompleted || isCurrent) && styles.stepNumberActive]}>
                    {step}
                  </Text>
                )}
              </View>
              <Text style={[styles.stepLabel, isCurrent && styles.stepLabelActive]}>{title}</Text>
            </View>
            {idx < 3 && (
              <View style={[styles.stepLine, isCompleted && styles.stepLineCompleted]} />
            )}
          </View>
        );
      })}
    </View>
  );

  // Render Step Content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  // Step 1: Email Entry
  const renderStep1 = () => (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.stepContent}>
      {/* Admin Email */}
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Administrator Email *</Text>
        <View style={[styles.inputContainer, focusedInput === 'adminEmail' && styles.inputFocused]}>
          <Mail size={20} color={focusedInput === 'adminEmail' ? Colors.primary[500] : Colors.gray[400]} />
          <TextInput
            style={styles.input}
            placeholder="admin@yourschool.edu"
            placeholderTextColor={Colors.gray[400]}
            value={adminEmail}
            onChangeText={setAdminEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setFocusedInput('adminEmail')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>
      </View>

      {/* Same Email Toggle */}
      <TouchableOpacity
        style={styles.toggleContainer}
        onPress={() => {
          setUseSameEmail(!useSameEmail);
          if (!useSameEmail) setOrgEmail(adminEmail);
        }}
      >
        <View style={[styles.checkbox, useSameEmail && styles.checkboxChecked]}>
          {useSameEmail && <CheckCircle2 size={16} color="#fff" />}
        </View>
        <Text style={styles.toggleText}>Use same email for organization</Text>
      </TouchableOpacity>

      {/* Organization Email */}
      {!useSameEmail && (
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Organization Email *</Text>
          <View style={[styles.inputContainer, focusedInput === 'orgEmail' && styles.inputFocused]}>
            <Building2 size={20} color={focusedInput === 'orgEmail' ? Colors.primary[500] : Colors.gray[400]} />
            <TextInput
              style={styles.input}
              placeholder="contact@yourschool.edu"
              placeholderTextColor={Colors.gray[400]}
              value={orgEmail}
              onChangeText={setOrgEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocusedInput('orgEmail')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/(auth)/login')}>
          <ArrowLeft size={20} color={Colors.gray[600]} />
          <Text style={styles.secondaryButtonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
          onPress={handleStep1Submit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>Verify</Text>
              <ArrowRight size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // Step 2: OTP Verification
  const renderStep2 = () => (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.stepContent}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: Colors.success[50] }]}>
          <Shield size={24} color={Colors.success[600]} />
        </View>
        <View>
          <Text style={styles.sectionTitle}>Verify OTP</Text>
        </View>
      </View>

      {/* Admin OTP */}
      <View style={styles.otpCard}>
        <Text style={styles.otpLabel}>
          {useSameEmail ? 'Verification Code' : 'Admin Email Code'}
        </Text>
        <View style={styles.otpRow}>
          <TextInput
            style={[styles.otpInput, adminOtpVerified && styles.otpInputVerified]}
            placeholder="000000"
            placeholderTextColor={Colors.gray[400]}
            value={adminOtp}
            onChangeText={setAdminOtp}
            keyboardType="number-pad"
            maxLength={6}
            editable={!adminOtpVerified}
          />
          <TouchableOpacity
            style={[styles.verifyButton, adminOtpVerified && styles.verifyButtonSuccess]}
            onPress={handleVerifyAdminOtp}
            disabled={adminOtpVerified || isLoading}
          >
            {adminOtpVerified ? (
              <CheckCircle2 size={20} color="#fff" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify</Text>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.otpHint}>{adminEmail}</Text>
      </View>

      {/* Organization OTP */}
      {!useSameEmail && (
        <View style={styles.otpCard}>
          <Text style={styles.otpLabel}>Organization Email Code</Text>
          <View style={styles.otpRow}>
            <TextInput
              style={[styles.otpInput, orgOtpVerified && styles.otpInputVerified]}
              placeholder="000000"
              placeholderTextColor={Colors.gray[400]}
              value={orgOtp}
              onChangeText={setOrgOtp}
              keyboardType="number-pad"
              maxLength={6}
              editable={!orgOtpVerified}
            />
            <TouchableOpacity
              style={[styles.verifyButton, orgOtpVerified && styles.verifyButtonSuccess]}
              onPress={handleVerifyOrgOtp}
              disabled={orgOtpVerified || isLoading}
            >
              {orgOtpVerified ? (
                <CheckCircle2 size={20} color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify</Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.otpHint}>{orgEmail}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={goBack}>
          <ArrowLeft size={20} color={Colors.gray[600]} />
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, !(useSameEmail ? adminOtpVerified : adminOtpVerified && orgOtpVerified) && styles.buttonDisabled]}
          onPress={handleStep2Submit}
          disabled={!(useSameEmail ? adminOtpVerified : adminOtpVerified && orgOtpVerified)}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
          <ArrowRight size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // Step 3: Organization Details
  const renderStep3 = () => (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.stepContent}>
      {/* Organization Name */}
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Organization Name *</Text>
        <View style={[styles.inputContainer, focusedInput === 'orgName' && styles.inputFocused]}>
          <Building2 size={20} color={focusedInput === 'orgName' ? Colors.primary[500] : Colors.gray[400]} />
          <TextInput
            style={styles.input}
            placeholder="ABC International School"
            placeholderTextColor={Colors.gray[400]}
            value={orgName}
            onChangeText={setOrgName}
            onFocus={() => setFocusedInput('orgName')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>
      </View>

      {/* Organization Type */}
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Organization Type *</Text>
        <View style={styles.pickerRow}>
          {ORGANIZATION_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[styles.pickerOption, orgType === type.value && styles.pickerOptionSelected]}
              onPress={() => setOrgType(type.value)}
            >
              <Text style={[styles.pickerOptionText, orgType === type.value && styles.pickerOptionTextSelected]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Board Affiliation */}
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Board Affiliation</Text>
        <View style={styles.pickerRow}>
          {BOARD_AFFILIATIONS.map((board) => (
            <TouchableOpacity
              key={board.value}
              style={[styles.pickerOption, boardAffiliation === board.value && styles.pickerOptionSelected]}
              onPress={() => setBoardAffiliation(board.value)}
            >
              <Text style={[styles.pickerOptionText, boardAffiliation === board.value && styles.pickerOptionTextSelected]}>
                {board.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Organization Phone */}
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Organization Phone</Text>
        <View style={[styles.inputContainer, focusedInput === 'orgPhone' && styles.inputFocused]}>
          <Phone size={20} color={focusedInput === 'orgPhone' ? Colors.primary[500] : Colors.gray[400]} />
          <TextInput
            style={styles.input}
            placeholder="+91 98765 43210"
            placeholderTextColor={Colors.gray[400]}
            value={orgPhone}
            onChangeText={setOrgPhone}
            keyboardType="phone-pad"
            onFocus={() => setFocusedInput('orgPhone')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>
      </View>

      {/* Organization Address - Using reusable AddressForm component */}
      <AddressForm
        values={orgAddress}
        onChange={handleAddressChange}
        required={false}
        showHeader={true}
        showLocationButton={true}
      />

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={goBack}>
          <ArrowLeft size={20} color={Colors.gray[600]} />
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={handleStep3Submit}>
          <Text style={styles.primaryButtonText}>Continue</Text>
          <ArrowRight size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // Step 4: Admin Details
  const renderStep4 = () => (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.stepContent}>
      {/* Name Row */}
      <View style={styles.row}>
        <View style={[styles.inputWrapper, styles.halfWidth]}>
          <Text style={styles.inputLabel}>First Name *</Text>
          <View style={[styles.inputContainer, focusedInput === 'firstName' && styles.inputFocused]}>
            <User size={18} color={focusedInput === 'firstName' ? Colors.primary[500] : Colors.gray[400]} />
            <TextInput
              style={styles.input}
              placeholder="John"
              placeholderTextColor={Colors.gray[400]}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              onFocus={() => setFocusedInput('firstName')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
        </View>
        <View style={[styles.inputWrapper, styles.halfWidth]}>
          <Text style={styles.inputLabel}>Last Name *</Text>
          <View style={[styles.inputContainer, focusedInput === 'lastName' && styles.inputFocused]}>
            <User size={18} color={focusedInput === 'lastName' ? Colors.primary[500] : Colors.gray[400]} />
            <TextInput
              style={styles.input}
              placeholder="Doe"
              placeholderTextColor={Colors.gray[400]}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              onFocus={() => setFocusedInput('lastName')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
        </View>
      </View>

      {/* Phone */}
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <View style={[styles.inputContainer, focusedInput === 'phone' && styles.inputFocused]}>
          <Phone size={20} color={focusedInput === 'phone' ? Colors.primary[500] : Colors.gray[400]} />
          <TextInput
            style={styles.input}
            placeholder="+91 98765 43210"
            placeholderTextColor={Colors.gray[400]}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            onFocus={() => setFocusedInput('phone')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>
      </View>

      {/* Password */}
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Password *</Text>
        <View style={[styles.inputContainer, focusedInput === 'password' && styles.inputFocused]}>
          <Lock size={20} color={focusedInput === 'password' ? Colors.primary[500] : Colors.gray[400]} />
          <TextInput
            style={styles.input}
            placeholder="Create a strong password"
            placeholderTextColor={Colors.gray[400]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            onFocus={() => setFocusedInput('password')}
            onBlur={() => setFocusedInput(null)}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={20} color={Colors.gray[400]} /> : <Eye size={20} color={Colors.gray[400]} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirm Password */}
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Confirm Password *</Text>
        <View style={[styles.inputContainer, focusedInput === 'confirmPassword' && styles.inputFocused]}>
          <Lock size={20} color={focusedInput === 'confirmPassword' ? Colors.primary[500] : Colors.gray[400]} />
          <TextInput
            style={styles.input}
            placeholder="Confirm your password"
            placeholderTextColor={Colors.gray[400]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            onFocus={() => setFocusedInput('confirmPassword')}
            onBlur={() => setFocusedInput(null)}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            {showConfirmPassword ? <EyeOff size={20} color={Colors.gray[400]} /> : <Eye size={20} color={Colors.gray[400]} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={goBack}>
          <ArrowLeft size={20} color={Colors.gray[600]} />
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, styles.successButton, isLoading && styles.buttonDisabled]}
          onPress={handleStep4Submit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>Complete Registration</Text>
              <CheckCircle2 size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#f0fdfa', '#ecfeff', '#f5f3ff']} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header with Logo */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.gray[600]} />
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/educard-logo.jpg')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.subtitle}>{SIGNUP_STEP_TITLES[currentStep - 1]}</Text>
          </Animated.View>

          {/* Progress Steps */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <ProgressSteps />
          </Animated.View>

          {/* Form Card */}
          <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.formCard}>
            {renderStepContent()}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      <modal.ModalComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 20 },

  // Header
  header: { alignItems: 'center', marginBottom: 24 },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  logo: { width: 60, height: 60, borderRadius: 30 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.gray[900], marginBottom: 4, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: Colors.gray[500], fontWeight: '400' },

  // Progress Steps
  progressContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', marginBottom: 24 },
  stepWrapper: { flexDirection: 'row', alignItems: 'flex-start' },
  stepItem: { alignItems: 'center' },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCompleted: { backgroundColor: Colors.primary[500] },
  stepCurrent: {
    backgroundColor: Colors.primary[500],
    borderWidth: 3,
    borderColor: Colors.primary[100],
    transform: [{ scale: 1.1 }],
  },
  stepNumber: { fontSize: 14, fontWeight: '700', color: Colors.gray[500] },
  stepNumberActive: { color: '#fff' },
  stepLabel: { fontSize: 11, color: Colors.gray[500], fontWeight: '500' },
  stepLabelActive: { color: Colors.primary[600], fontWeight: '700' },
  stepLine: { width: 24, height: 3, backgroundColor: Colors.gray[200], marginHorizontal: 4, marginTop: 16 },
  stepLineCompleted: { backgroundColor: Colors.primary[500] },

  // Form Card
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  stepContent: { gap: 20 },

  // Section Header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: Colors.gray[900], letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: 13, color: Colors.gray[500] },

  // Inputs
  inputWrapper: { marginBottom: 0 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.gray[600], marginBottom: 8, letterSpacing: 0.2, textTransform: 'uppercase' },
  stepBadge: {
    backgroundColor: Colors.primary[100],
    color: Colors.primary[700],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    marginRight: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    paddingHorizontal: 16,
    height: 54,
    gap: 12,
  },
  inputFocused: { borderColor: Colors.primary[500], backgroundColor: '#fff', borderWidth: 2 },
  input: { flex: 1, fontSize: 16, color: Colors.gray[900], fontWeight: '500' },
  inputHint: { fontSize: 11, color: Colors.gray[400], marginTop: 6 },

  // Toggle
  toggleContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.primary[500], borderColor: Colors.primary[500] },
  toggleText: { fontSize: 14, color: Colors.gray[700], fontWeight: '500' },

  // OTP
  otpCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
  },
  otpLabel: { fontSize: 13, fontWeight: '600', color: Colors.gray[600], marginBottom: 12, letterSpacing: 0.2, textTransform: 'uppercase' },
  otpRow: { flexDirection: 'row', gap: 12 },
  otpInput: {
    flex: 1,
    height: 54,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 6,
    color: Colors.gray[900],
  },
  otpInputVerified: { borderColor: Colors.success[400], backgroundColor: Colors.success[50] },
  verifyButton: {
    paddingHorizontal: 24,
    height: 54,
    backgroundColor: Colors.primary[500],
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonSuccess: { backgroundColor: Colors.success[500] },
  verifyButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  otpHint: { fontSize: 12, color: Colors.gray[400], marginTop: 10 },

  // Picker
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pickerOption: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
  },
  pickerOptionSelected: { backgroundColor: Colors.primary[50], borderColor: Colors.primary[500] },
  pickerOptionText: { fontSize: 14, fontWeight: '500', color: Colors.gray[600] },
  pickerOptionTextSelected: { color: Colors.primary[700], fontWeight: '600' },

  // Rows
  row: { flexDirection: 'row', gap: 12 },
  halfWidth: { flex: 1 },

  // Buttons
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: Colors.gray[100],
    borderRadius: 14,
  },
  secondaryButtonText: { fontSize: 15, fontWeight: '600', color: Colors.gray[700] },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: Colors.primary[500],
    borderRadius: 14,
    shadowColor: Colors.primary[600],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  successButton: { backgroundColor: Colors.success[500], shadowColor: Colors.success[600] },
  primaryButtonText: { fontSize: 15, fontWeight: '600', color: '#fff', letterSpacing: 0.3 },
  buttonDisabled: { opacity: 0.5 },
});
