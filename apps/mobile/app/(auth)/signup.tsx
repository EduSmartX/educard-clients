import {
  Colors,
  APP_INFO,
  ORGANIZATION_TYPES,
  BOARD_AFFILIATIONS,
  GENDER_OPTIONS,
  SIGNUP_STEP_TITLES,
} from '@educard/shared';
import type { SignupStep } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Mail,
  Building2,
  ArrowLeft,
  ArrowRight,
  Shield,
  User,
  Lock,
  Eye,
  EyeOff,
  Phone,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ImageSourcePropType,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { sendOtps, verifyOtp, parseApiError, registerOrganization } from '@/api';
import type { OrganizationRegistrationData } from '@/api';
import { AddressForm, type AddressData } from '@/components/forms';
import { useModal } from '@/components/ui';

import { ProgressSteps, isValidPhone, getIconColor } from './signup-components';
import { styles } from './signup-styles';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const logoImage: ImageSourcePropType =
  require('../../assets/images/educard-logo.jpg') as ImageSourcePropType;

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
    setOrgAddress((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Step 4: Admin Details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [canTeachSubject, setCanTeachSubject] = useState(true);
  const [employeeId, setEmployeeId] = useState('');
  const [gender, setGender] = useState('');

  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Dropdown states
  const [showOrgTypeDropdown, setShowOrgTypeDropdown] = useState(false);
  const [showBoardDropdown, setShowBoardDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);

  // Field errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Email validation
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Clear error on field change
  const clearError = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

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
            {
              email: orgEmail,
              category: 'organization' as const,
              purpose: 'organization_registration',
            },
          ];

      // Call API to send OTPs
      const response = await sendOtps(emailsToSend);

      if (!response.all_success) {
        // Check for individual failures
        const failedEmail = response.results.find((r) => !r.success);
        modal.error('Error', failedEmail?.message ?? 'Failed to send verification codes'); // ?? instead of ||
        return;
      }

      if (useSameEmail) {
        setOrgEmail(adminEmail);
      }

      modal.success(
        'Verification Codes Sent',
        useSameEmail ? `Code sent to ${adminEmail}` : `Codes sent to ${adminEmail} and ${orgEmail}`,
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
    const newErrors: Record<string, string> = {};

    if (!orgName.trim()) {
      newErrors.orgName = 'Organization name is required';
    }
    if (!orgType) {
      newErrors.orgType = 'Please select organization type';
    }
    if (orgPhone && !isValidPhone(orgPhone)) {
      newErrors.orgPhone = 'Phone must be a valid 10-digit mobile number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setCurrentStep(4);
  }, [orgName, orgType, orgPhone]);

  // Step 4: Final Registration
  const handleStep4Submit = useCallback(async () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (phoneNumber && !isValidPhone(phoneNumber)) {
      newErrors.phoneNumber = 'Phone must be a valid 10-digit mobile number';
    }
    if (!password || password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (canTeachSubject && !employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required';
    }
    if (canTeachSubject && !gender) {
      newErrors.gender = 'Gender is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

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
          can_teach_subject: canTeachSubject,
          phone: phoneNumber.trim() || undefined,
          gender: gender || undefined,
        },
      };

      // Add teacher info when the admin can also teach a subject
      if (canTeachSubject) {
        registrationData.teacher_info = {
          employee_id: employeeId.trim(),
        };
      }

      // Add address info if any field is filled
      const hasAddress =
        orgAddress.streetAddress || orgAddress.city || orgAddress.state || orgAddress.zipCode;
      if (hasAddress) {
        registrationData.address_info = {
          street_address: orgAddress.streetAddress ?? '', // ?? instead of ||
          address_line_2: orgAddress.addressLine2 ?? undefined,
          city: orgAddress.city ?? '',
          state: orgAddress.state ?? '',
          zip_code: orgAddress.zipCode ?? '',
          country: orgAddress.country ?? 'India',
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
      modal.error(
        'Registration Failed',
        apiError.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    firstName,
    lastName,
    password,
    confirmPassword,
    canTeachSubject,
    employeeId,
    gender,
    orgName,
    orgType,
    orgEmail,
    orgPhone,
    boardAffiliation,
    orgAddress,
    adminEmail,
    useSameEmail,
    phoneNumber,
    router,
    modal,
  ]);

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as SignupStep);
    } else {
      router.back();
    }
  };

  // Progress Steps Component
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
          <Mail
            size={20}
            color={focusedInput === 'adminEmail' ? Colors.primary[500] : Colors.gray[400]}
          />
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
            <Building2
              size={20}
              color={focusedInput === 'orgEmail' ? Colors.primary[500] : Colors.gray[400]}
            />
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
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.replace('/(auth)/login')}
        >
          <ArrowLeft size={20} color={Colors.gray[600]} />
          <Text style={styles.secondaryButtonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
          onPress={() => void handleStep1Submit()} // void for async handler
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
            onPress={() => void handleVerifyAdminOtp()} // void for async handler
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
              onPress={() => void handleVerifyOrgOtp()} // void for async handler
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
          style={[
            styles.primaryButton,
            !(useSameEmail ? adminOtpVerified : adminOtpVerified && orgOtpVerified) &&
              styles.buttonDisabled,
          ]}
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
  const renderStep3 = () => {
    const selectedOrgType = ORGANIZATION_TYPES.find((t) => t.value === orgType);
    const selectedBoard = BOARD_AFFILIATIONS.find((b) => b.value === boardAffiliation);

    return (
      <Animated.View entering={FadeInUp.duration(400)} style={styles.stepContent}>
        {/* Organization Name */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Organization Name *</Text>
          <View
            style={[
              styles.inputContainer,
              focusedInput === 'orgName' && styles.inputFocused,
              errors.orgName && styles.inputError,
            ]}
          >
            <Building2
              size={20}
              color={getIconColor(!!errors.orgName, focusedInput === 'orgName')}
            />
            <TextInput
              style={styles.input}
              placeholder="ABC International School"
              placeholderTextColor={Colors.gray[400]}
              value={orgName}
              onChangeText={(v) => {
                setOrgName(v);
                clearError('orgName');
              }}
              onFocus={() => setFocusedInput('orgName')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
          {!!errors.orgName && (
            <View style={styles.errorRow}>
              <AlertCircle size={14} color="#ef4444" />
              <Text style={styles.errorText}>{errors.orgName}</Text>
            </View>
          )}
        </View>

        {/* Organization Type - Dropdown */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Organization Type *</Text>
          <TouchableOpacity
            style={[styles.dropdownButton, errors.orgType && styles.inputError]}
            onPress={() => setShowOrgTypeDropdown(true)}
          >
            <Text style={selectedOrgType ? styles.dropdownText : styles.dropdownPlaceholder}>
              {selectedOrgType?.label || 'Select organization type'}
            </Text>
            <ChevronDown size={20} color={Colors.gray[400]} />
          </TouchableOpacity>
          {!!errors.orgType && (
            <View style={styles.errorRow}>
              <AlertCircle size={14} color="#ef4444" />
              <Text style={styles.errorText}>{errors.orgType}</Text>
            </View>
          )}
        </View>

        {/* Board Affiliation - Dropdown */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Board Affiliation</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowBoardDropdown(true)}
          >
            <Text style={selectedBoard ? styles.dropdownText : styles.dropdownPlaceholder}>
              {selectedBoard?.label || 'Select board affiliation'}
            </Text>
            <ChevronDown size={20} color={Colors.gray[400]} />
          </TouchableOpacity>
        </View>

        {/* Organization Phone */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Organization Phone</Text>
          <View
            style={[
              styles.inputContainer,
              focusedInput === 'orgPhone' && styles.inputFocused,
              errors.orgPhone && styles.inputError,
            ]}
          >
            <Phone size={20} color={getIconColor(!!errors.orgPhone, focusedInput === 'orgPhone')} />
            <TextInput
              style={styles.input}
              placeholder="9876543210"
              placeholderTextColor={Colors.gray[400]}
              value={orgPhone}
              onChangeText={(v) => {
                const digits = v.replace(/\D/g, '').slice(0, 10);
                setOrgPhone(digits);
                clearError('orgPhone');
              }}
              keyboardType="phone-pad"
              maxLength={10}
              onFocus={() => setFocusedInput('orgPhone')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
          {!!errors.orgPhone && (
            <View style={styles.errorRow}>
              <AlertCircle size={14} color="#ef4444" />
              <Text style={styles.errorText}>{errors.orgPhone}</Text>
            </View>
          )}
        </View>

        {/* Organization Address - Using reusable AddressForm component */}
        <AddressForm
          values={orgAddress}
          onChange={handleAddressChange}
          required={false}
          showHeader={true}
          showLocationButton={true}
        />

        {/* Organization Type Dropdown Modal */}
        <Modal visible={showOrgTypeDropdown} transparent animationType="fade">
          <TouchableOpacity
            style={styles.dropdownOverlay}
            activeOpacity={1}
            onPress={() => setShowOrgTypeDropdown(false)}
          >
            <View style={styles.dropdownModal}>
              <Text style={styles.dropdownTitle}>Select Organization Type</Text>
              <FlatList
                data={ORGANIZATION_TYPES}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      orgType === item.value && styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setOrgType(item.value);
                      clearError('orgType');
                      setShowOrgTypeDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        orgType === item.value && styles.dropdownItemTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Board Affiliation Dropdown Modal */}
        <Modal visible={showBoardDropdown} transparent animationType="fade">
          <TouchableOpacity
            style={styles.dropdownOverlay}
            activeOpacity={1}
            onPress={() => setShowBoardDropdown(false)}
          >
            <View style={styles.dropdownModal}>
              <Text style={styles.dropdownTitle}>Select Board Affiliation</Text>
              <FlatList
                data={BOARD_AFFILIATIONS}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      boardAffiliation === item.value && styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setBoardAffiliation(item.value);
                      setShowBoardDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        boardAffiliation === item.value && styles.dropdownItemTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>

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
  };

  // Step 4: Admin Details
  const renderStep4 = () => (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.stepContent}>
      {/* Name Row */}
      <View style={styles.row}>
        <View style={[styles.inputWrapper, styles.halfWidth]}>
          <Text style={styles.inputLabel}>First Name *</Text>
          <View
            style={[
              styles.inputContainer,
              focusedInput === 'firstName' && styles.inputFocused,
              errors.firstName && styles.inputError,
            ]}
          >
            <User
              size={18}
              color={getIconColor(!!errors.firstName, focusedInput === 'firstName')}
            />
            <TextInput
              style={styles.input}
              placeholder="John"
              placeholderTextColor={Colors.gray[400]}
              value={firstName}
              onChangeText={(v) => {
                setFirstName(v);
                clearError('firstName');
              }}
              autoCapitalize="words"
              onFocus={() => setFocusedInput('firstName')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
          {!!errors.firstName && (
            <View style={styles.errorRow}>
              <AlertCircle size={12} color="#ef4444" />
              <Text style={styles.errorTextSmall}>{errors.firstName}</Text>
            </View>
          )}
        </View>
        <View style={[styles.inputWrapper, styles.halfWidth]}>
          <Text style={styles.inputLabel}>Last Name *</Text>
          <View
            style={[
              styles.inputContainer,
              focusedInput === 'lastName' && styles.inputFocused,
              errors.lastName && styles.inputError,
            ]}
          >
            <User size={18} color={getIconColor(!!errors.lastName, focusedInput === 'lastName')} />
            <TextInput
              style={styles.input}
              placeholder="Doe"
              placeholderTextColor={Colors.gray[400]}
              value={lastName}
              onChangeText={(v) => {
                setLastName(v);
                clearError('lastName');
              }}
              autoCapitalize="words"
              onFocus={() => setFocusedInput('lastName')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
          {!!errors.lastName && (
            <View style={styles.errorRow}>
              <AlertCircle size={12} color="#ef4444" />
              <Text style={styles.errorTextSmall}>{errors.lastName}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Phone */}
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <View
          style={[
            styles.inputContainer,
            focusedInput === 'phone' && styles.inputFocused,
            errors.phoneNumber && styles.inputError,
          ]}
        >
          <Phone size={20} color={getIconColor(!!errors.phoneNumber, focusedInput === 'phone')} />
          <TextInput
            style={styles.input}
            placeholder="9876543210"
            placeholderTextColor={Colors.gray[400]}
            value={phoneNumber}
            onChangeText={(v) => {
              const digits = v.replace(/\D/g, '').slice(0, 10);
              setPhoneNumber(digits);
              clearError('phoneNumber');
            }}
            keyboardType="phone-pad"
            maxLength={10}
            onFocus={() => setFocusedInput('phone')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>
        {!!errors.phoneNumber && (
          <View style={styles.errorRow}>
            <AlertCircle size={14} color="#ef4444" />
            <Text style={styles.errorText}>{errors.phoneNumber}</Text>
          </View>
        )}
      </View>

      {/* Password */}
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Password *</Text>
        <View
          style={[
            styles.inputContainer,
            focusedInput === 'password' && styles.inputFocused,
            errors.password && styles.inputError,
          ]}
        >
          <Lock size={20} color={getIconColor(!!errors.password, focusedInput === 'password')} />
          <TextInput
            style={styles.input}
            placeholder="Create a strong password"
            placeholderTextColor={Colors.gray[400]}
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              clearError('password');
            }}
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
        {!!errors.password && (
          <View style={styles.errorRow}>
            <AlertCircle size={14} color="#ef4444" />
            <Text style={styles.errorText}>{errors.password}</Text>
          </View>
        )}
      </View>

      {/* Confirm Password */}
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Confirm Password *</Text>
        <View
          style={[
            styles.inputContainer,
            focusedInput === 'confirmPassword' && styles.inputFocused,
            errors.confirmPassword && styles.inputError,
          ]}
        >
          <Lock
            size={20}
            color={getIconColor(!!errors.confirmPassword, focusedInput === 'confirmPassword')}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm your password"
            placeholderTextColor={Colors.gray[400]}
            value={confirmPassword}
            onChangeText={(v) => {
              setConfirmPassword(v);
              clearError('confirmPassword');
            }}
            secureTextEntry={!showConfirmPassword}
            onFocus={() => setFocusedInput('confirmPassword')}
            onBlur={() => setFocusedInput(null)}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            {showConfirmPassword ? (
              <EyeOff size={20} color={Colors.gray[400]} />
            ) : (
              <Eye size={20} color={Colors.gray[400]} />
            )}
          </TouchableOpacity>
        </View>
        {!!errors.confirmPassword && (
          <View style={styles.errorRow}>
            <AlertCircle size={14} color="#ef4444" />
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          </View>
        )}
      </View>

      {/* Can Teach Subject Toggle */}
      <TouchableOpacity
        style={styles.toggleContainer}
        onPress={() => setCanTeachSubject(!canTeachSubject)}
      >
        <View style={[styles.checkbox, canTeachSubject && styles.checkboxChecked]}>
          {canTeachSubject && <CheckCircle2 size={16} color="#fff" />}
        </View>
        <Text style={styles.toggleText}>I can also teach a subject (create my teacher profile)</Text>
      </TouchableOpacity>

      {canTeachSubject && (
        <>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Employee ID *</Text>
            <View
              style={[
                styles.inputContainer,
                focusedInput === 'employeeId' && styles.inputFocused,
                errors.employeeId && styles.inputError,
              ]}
            >
              <Shield
                size={18}
                color={getIconColor(!!errors.employeeId, focusedInput === 'employeeId')}
              />
              <TextInput
                style={styles.input}
                placeholder="EMP-001"
                placeholderTextColor={Colors.gray[400]}
                value={employeeId}
                onChangeText={(v) => {
                  setEmployeeId(v);
                  clearError('employeeId');
                }}
                autoCapitalize="characters"
                onFocus={() => setFocusedInput('employeeId')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
            {!!errors.employeeId && (
              <View style={styles.errorRow}>
                <AlertCircle size={12} color="#ef4444" />
                <Text style={styles.errorTextSmall}>{errors.employeeId}</Text>
              </View>
            )}
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Gender *</Text>
            <TouchableOpacity
              style={[styles.dropdownButton, errors.gender && styles.inputError]}
              onPress={() => setShowGenderDropdown(true)}
            >
              <Text style={gender ? styles.dropdownText : styles.dropdownPlaceholder}>
                {GENDER_OPTIONS.find((g) => g.value === gender)?.label || 'Select gender'}
              </Text>
              <ChevronDown size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
            {!!errors.gender && (
              <View style={styles.errorRow}>
                <AlertCircle size={12} color="#ef4444" />
                <Text style={styles.errorTextSmall}>{errors.gender}</Text>
              </View>
            )}
          </View>
        </>
      )}

      {/* Gender Dropdown Modal */}
      <Modal visible={showGenderDropdown} transparent animationType="fade">
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setShowGenderDropdown(false)}
        >
          <View style={styles.dropdownModal}>
            <Text style={styles.dropdownTitle}>Select Gender</Text>
            <FlatList
              data={[...GENDER_OPTIONS]}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    gender === item.value && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    setGender(item.value);
                    clearError('gender');
                    setShowGenderDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      gender === item.value && styles.dropdownItemTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>


      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={goBack}>
          <ArrowLeft size={20} color={Colors.gray[600]} />
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, styles.successButton, isLoading && styles.buttonDisabled]}
          onPress={() => void handleStep4Submit()} // void for async handler
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

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
      >
        {/* Header with Logo */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.gray[600]} />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Image source={logoImage} style={styles.logo} resizeMode="contain" />
          </View>

          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>{SIGNUP_STEP_TITLES[currentStep - 1]}</Text>
        </Animated.View>

        {/* Progress Steps */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <ProgressSteps currentStep={currentStep} />
        </Animated.View>

        {/* Form Card */}
        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.formCard}>
          {renderStepContent()}
        </Animated.View>
      </KeyboardAwareScrollView>
      <modal.ModalComponent />
    </View>
  );
}
