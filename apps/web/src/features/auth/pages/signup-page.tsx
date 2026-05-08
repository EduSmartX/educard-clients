import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { sendOtps, verifyOtp } from '@/lib/api/otp-api';
import { registerOrganization } from '@/lib/api/organization-api';
import { parseOtpErrors } from '@/lib/api';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/utils/error-handler';
import { ROUTES } from '@/constants/app-config';
import { ErrorMessages, FormPlaceholders, SuccessMessages } from '@/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Building2,
  User,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { Logo } from '@/components/branding/logo';
import { AddressForm } from '@/components/forms/address-form';
import { PhoneInput } from '@/components/forms/phone-input';
import { ORGANIZATION_TYPES, BOARD_AFFILIATIONS } from '@/constants/organization-options';
import { AuthActionButtons } from '../components/auth-action-buttons';
import {
  createStep3Schema,
  step1Schema,
  step2Schema,
  step4Schema,
  type CompleteSignupData,
  type SignupStep,
  type Step1Data,
  type Step2Data,
  type Step3Data,
  type Step4Data,
} from '../utils/signup.schemas';
import {
  buildOrganizationRegistrationPayload,
  buildOtpSendRequests,
  getOtpSendSuccessMessage,
  getOtpVerifyBlockingMessage,
  normalizeStep3DataForSave,
  SIGNUP_STEP_TITLES,
} from '../utils/signup.utils';

export default function SignupPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<SignupStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CompleteSignupData>>({});

  // Use same email for both admin and organization
  const [useSameEmail, setUseSameEmail] = useState(false);

  // Include address information toggle
  const [includeAddress, setIncludeAddress] = useState(false);
  const [isAddressExiting, setIsAddressExiting] = useState(false);

  // OTP verification states
  const [adminOtpVerified, setAdminOtpVerified] = useState(false);
  const [orgOtpVerified, setOrgOtpVerified] = useState(false);
  const [verifyingAdmin, setVerifyingAdmin] = useState(false);
  const [verifyingOrg, setVerifyingOrg] = useState(false);

  // Step forms
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: formData as Step1Data,
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: formData as Step2Data,
  });

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(createStep3Schema(includeAddress)),
    defaultValues: { ...formData, country: 'India' } as Step3Data,
  });

  // Update form validation when includeAddress changes
  useEffect(() => {
    step3Form.clearErrors(); // Clear errors when toggle changes
  }, [includeAddress, step3Form]);

  const step4Form = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: { ...formData, notificationOptIn: true } as Step4Data,
  });

  // Watch adminEmail and sync to orgEmail when toggle is on
  const adminEmailValue = step1Form.watch('adminEmail');
  useEffect(() => {
    if (useSameEmail && adminEmailValue) {
      step1Form.setValue('orgEmail', adminEmailValue, { shouldValidate: true });
      step1Form.clearErrors('orgEmail');
    }
  }, [useSameEmail, adminEmailValue, step1Form]);

  // Step 1: Send OTPs to both emails
  const handleStep1Submit = async (data: Step1Data) => {
    setIsLoading(true);
    try {
      const emails = buildOtpSendRequests(useSameEmail, data);

      const response = await sendOtps(emails);

      if (response.all_success) {
        // If using same email, set orgEmail to adminEmail and mark both as sent
        const updatedData = useSameEmail ? { ...data, orgEmail: data.adminEmail } : data;

        setFormData((prev) => ({ ...prev, ...updatedData }));

        toast.success(getOtpSendSuccessMessage(useSameEmail, data));
        setCurrentStep(2);
      } else {
        const failedEmails = response.results.filter((r) => !r.success);
        toast.error(`${ErrorMessages.AUTH.SEND_OTP_FAILED} ${failedEmails.map((r) => r.email).join(', ')}`);
      }
    } catch (error: unknown) {
      // Parse OTP validation errors
      const otpErrors = parseOtpErrors(error);

      if (otpErrors.detail && otpErrors.errors.length > 0) {
        // Show field-level errors on the form
        otpErrors.errors.forEach((err) => {
          if (err.email === data.adminEmail) {
            step1Form.setError('adminEmail', {
              type: 'manual',
              message: err.error,
            });
          }
          if (!useSameEmail && err.email === data.orgEmail) {
            step1Form.setError('orgEmail', {
              type: 'manual',
              message: err.error,
            });
          }
        });
      } else {
        // Show generic error as toast
        toast.error(getErrorMessage(error, 'Failed to send verification codes. Please try again.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTPs
  const handleVerifyAdminOtp = async () => {
    const otpValue = step2Form.getValues('adminOtp');
    if (!otpValue || otpValue.length !== 6) {
      toast.error(ErrorMessages.AUTH.INVALID_OTP);
      return;
    }

    setVerifyingAdmin(true);
    try {
      const response = await verifyOtp(formData.adminEmail!, otpValue, 'organization_registration');

      if (response.success) {
        setAdminOtpVerified(true);
        toast.success(SuccessMessages.AUTH.ADMIN_EMAIL_VERIFIED);
      } else {
        toast.error(response.message || ErrorMessages.AUTH.VERIFY_OTP_FAILED);
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, ErrorMessages.AUTH.VERIFY_OTP_FAILED));
    } finally {
      setVerifyingAdmin(false);
    }
  };

  const handleVerifyOrgOtp = async () => {
    const otpValue = step2Form.getValues('orgOtp');
    if (!otpValue || otpValue.length !== 6) {
      toast.error(ErrorMessages.AUTH.INVALID_OTP);
      return;
    }

    setVerifyingOrg(true);
    try {
      const response = await verifyOtp(formData.orgEmail!, otpValue, 'organization_registration');

      if (response.success) {
        setOrgOtpVerified(true);
        toast.success(SuccessMessages.AUTH.ORG_EMAIL_VERIFIED);
      } else {
        toast.error(response.message || ErrorMessages.AUTH.VERIFY_OTP_FAILED);
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, ErrorMessages.AUTH.VERIFY_OTP_FAILED));
    } finally {
      setVerifyingOrg(false);
    }
  };

  const handleStep2Submit = (data: Step2Data) => {
    // If using same email, only need admin OTP verified
    const isVerified = useSameEmail ? adminOtpVerified : adminOtpVerified && orgOtpVerified;

    if (!isVerified) {
      toast.error(getOtpVerifyBlockingMessage(useSameEmail));
      return;
    }

    // If using same email, set orgOtp to same as adminOtp and mark as verified
    if (useSameEmail) {
      setOrgOtpVerified(true);
      step2Form.setValue('orgOtp', data.adminOtp);
    }

    setFormData((prev) => ({ ...prev, ...data }));
    toast.success(SuccessMessages.AUTH.EMAIL_VERIFICATION_COMPLETE);
    setCurrentStep(3);
  };

  // Step 3: Organization and Address details
  const handleStep3Submit = (data: Step3Data) => {
    const normalizedData = normalizeStep3DataForSave(includeAddress, data);
    setFormData((prev) => ({ ...prev, ...normalizedData }));
    setCurrentStep(4);
  };

  // Step 4: Admin info and final registration
  const handleStep4Submit = async (data: Step4Data) => {
    setIsLoading(true);
    try {
      const completeData = { ...formData, ...data } as CompleteSignupData;
      const registrationData = buildOrganizationRegistrationPayload(completeData);

      const response = await registerOrganization(registrationData);

      // Backend returns {success, message, data: {organization_info, admin_info, address_info}, code}
      if (response && response.success && response.data) {
        // Navigate to success page with registration data
        navigate(ROUTES.AUTH.REGISTRATION_SUCCESS, {
          state: {
            organizationName: response.data.organization_info.name,
            organizationType: response.data.organization_info.type,
            organizationEmail: response.data.organization_info.email,
            adminName: `${response.data.admin_info.first_name} ${response.data.admin_info.last_name}`,
            adminEmail: response.data.admin_info.email,
          },
        });
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to register. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as SignupStep);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 sm:p-6 lg:p-8">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.1, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.15, 0.08, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative max-w-4xl mx-auto"
      >
        {/* Modern Card with glassmorphism */}
        <Card className="backdrop-blur-xl bg-white/80 shadow-2xl border-0 rounded-3xl overflow-hidden">
          <CardHeader className="space-y-6 pb-8 px-6 sm:px-10 pt-10">
            {/* Logo with animation */}
            <div className="flex items-center justify-center">
              <Logo
                variant="icon"
                size="xl"
                withGlow
                withRing
                className="transform transition-all duration-300 hover:scale-110"
              />
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <CardTitle className="text-4xl font-extrabold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Create Your Account
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 font-medium">
                {SIGNUP_STEP_TITLES[currentStep - 1]}
              </CardDescription>
            </div>

            {/* Modern Progress Steps - Center Aligned */}
            <div className="flex items-center justify-center max-w-2xl mx-auto px-4">
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4].map((step, idx) => (
                  <div key={step} className="flex items-center">
                    {/* Step circle */}
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${
                          step < currentStep
                            ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg scale-100'
                            : step === currentStep
                              ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg scale-110 ring-4 ring-teal-100'
                              : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {step < currentStep ? '✓' : step}
                      </div>
                      {/* Step label */}
                      <span className="absolute -bottom-7 text-xs font-medium text-gray-600 whitespace-nowrap">
                        {['Emails', 'Verify', 'Details', 'Finish'][idx]}
                      </span>
                    </div>
                    {/* Connector line */}
                    {idx < 3 && (
                      <div
                        className={`w-16 h-1 mx-2 rounded-full transition-all duration-500 ${
                          step < currentStep
                            ? 'bg-gradient-to-r from-teal-500 to-cyan-600'
                            : 'bg-gray-200'
                        }`}
                      ></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Step 1: Email Entry */}
            {currentStep === 1 && (
              <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-6">
                {/* Section Header with Icon */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl">
                    <Mail className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Email Verification</h3>
                    <p className="text-sm text-gray-500">
                      We'll verify these aren't already registered
                    </p>
                  </div>
                </div>

                {/* Info Banner */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-xl p-4 flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-lg">💡</span>
                    </div>
                  </div>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    We'll send verification codes to confirm these emails aren't already in use.
                  </p>
                </div>

                {/* Admin Email - Modern Input */}
                <div className="space-y-2">
                  <Label
                    htmlFor="adminEmail"
                    className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                  >
                    <span className="flex items-center justify-center w-6 h-6 bg-teal-100 rounded-full text-teal-700 text-xs font-bold">
                      1
                    </span>
                    Administrator Email
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="adminEmail"
                      type="email"
                      placeholder={FormPlaceholders.ADMIN_EMAIL_EXAMPLE}
                      className={cn(
                        'h-14 pl-12 text-base border-2 border-gray-200 rounded-xl focus:border-teal-400 focus:ring-4 focus:ring-teal-50 transition-all w-full',
                        step1Form.formState.errors.adminEmail &&
                          'border-red-500 focus:border-red-500 focus:ring-red-50'
                      )}
                      {...step1Form.register('adminEmail')}
                    />
                  </div>
                  {step1Form.formState.errors.adminEmail && (
                    <p className="text-sm text-red-600 font-medium flex items-center gap-1.5 ml-1">
                      <span className="inline-block">⚠️</span>
                      {step1Form.formState.errors.adminEmail.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 ml-1 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                    Your personal admin account email
                  </p>
                </div>

                {/* Organization Email - Modern Input with Toggle */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="orgEmail"
                      className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                    >
                      <span className="flex items-center justify-center w-6 h-6 bg-cyan-100 rounded-full text-cyan-700 text-xs font-bold">
                        2
                      </span>
                      Organization Email
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="useSameEmail"
                        checked={useSameEmail}
                        onCheckedChange={(checked: boolean) => {
                          setUseSameEmail(checked);
                          if (checked) {
                            const adminEmail = step1Form.getValues('adminEmail');
                            if (adminEmail) {
                              step1Form.setValue('orgEmail', adminEmail, { shouldValidate: true });
                            }
                            step1Form.clearErrors('orgEmail');
                          } else {
                            step1Form.setValue('orgEmail', '');
                          }
                        }}
                      />
                      <Label
                        htmlFor="useSameEmail"
                        className="text-xs font-medium text-gray-600 cursor-pointer"
                      >
                        Same as admin
                      </Label>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none z-10">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="orgEmail"
                      type="email"
                      placeholder={FormPlaceholders.SCHOOL_EMAIL_EXAMPLE}
                      className={cn(
                        'h-14 pl-12 text-base border-2 rounded-xl transition-all w-full',
                        useSameEmail
                          ? 'border-purple-200 bg-purple-50/50 text-gray-500'
                          : 'border-gray-200 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-50',
                        step1Form.formState.errors.orgEmail &&
                          !useSameEmail &&
                          'border-red-500 focus:border-red-500 focus:ring-red-50'
                      )}
                      disabled={useSameEmail}
                      {...step1Form.register('orgEmail')}
                    />
                  </div>
                  {step1Form.formState.errors.orgEmail && !useSameEmail && (
                    <p className="text-sm text-red-600 font-medium flex items-center gap-1.5 ml-1">
                      <span className="inline-block">⚠️</span>
                      {step1Form.formState.errors.orgEmail.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 ml-1 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                    {useSameEmail
                      ? 'Using same email as administrator'
                      : 'Official organization email for communication'}
                  </p>
                </div>

                <AuthActionButtons
                  secondaryLabel="Back to Login"
                  primaryLabel="Send Verification Codes"
                  onSecondaryClick={() => navigate(ROUTES.AUTH.LOGIN)}
                  primaryLoading={isLoading}
                  secondaryIcon={<ArrowLeft className="mr-2 h-5 w-5" />}
                  primaryIcon={<ArrowRight className="ml-2 h-5 w-5" />}
                />
              </form>
            )}

            {/* Step 2: OTP Verification */}
            {currentStep === 2 && (
              <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-6">
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                    <ShieldCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Verify Your Emails</h3>
                    <p className="text-sm text-gray-500">Enter the codes we sent you</p>
                  </div>
                </div>

                {/* Info Banner */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-xl p-4 flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <span className="text-amber-600 text-lg">📧</span>
                    </div>
                  </div>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    {useSameEmail
                      ? `We've sent a 6-digit verification code to ${formData.adminEmail}`
                      : `We've sent 6-digit verification codes to both email addresses. Check your inbox!`}
                  </p>
                </div>

                {/* Admin OTP - Modern Card Style */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 border-2 border-gray-200 rounded-2xl p-6 space-y-4">
                  <Label
                    htmlFor="adminOtp"
                    className="text-base font-bold text-gray-800 flex items-center gap-2"
                  >
                    <span className="flex items-center justify-center w-7 h-7 bg-teal-500 text-white rounded-full text-sm">
                      {useSameEmail ? '📧' : '👤'}
                    </span>
                    {useSameEmail ? 'Email Verification Code' : 'Administrator Email Code'}
                    <span className="text-red-500">*</span>
                  </Label>

                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Input
                        id="adminOtp"
                        type="text"
                        maxLength={6}
                        placeholder={FormPlaceholders.OTP_MASK}
                        className={`h-14 text-center text-2xl font-bold tracking-[0.5em] border-2 rounded-xl transition-all ${
                          adminOtpVerified
                            ? 'border-green-300 bg-green-50 text-green-700'
                            : 'border-gray-300 focus:border-teal-400 focus:ring-4 focus:ring-teal-50'
                        }`}
                        error={step2Form.formState.errors.adminOtp?.message}
                        disabled={adminOtpVerified}
                        {...step2Form.register('adminOtp')}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleVerifyAdminOtp}
                      disabled={adminOtpVerified || verifyingAdmin}
                      isLoading={verifyingAdmin}
                      className={`h-14 min-w-[120px] rounded-xl font-semibold transition-all ${
                        adminOtpVerified
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200'
                          : 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:shadow-xl hover:scale-105'
                      }`}
                    >
                      {adminOtpVerified ? (
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          Verified
                        </span>
                      ) : (
                        'Verify'
                      )}
                    </Button>
                  </div>

                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Sent to:{' '}
                    <span className="font-medium text-gray-700">{formData.adminEmail}</span>
                  </p>
                </div>

                {/* Organization OTP - Only show if different emails */}
                {!useSameEmail && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 border-2 border-gray-200 rounded-2xl p-6 space-y-4">
                    <Label
                      htmlFor="orgOtp"
                      className="text-base font-bold text-gray-800 flex items-center gap-2"
                    >
                      <span className="flex items-center justify-center w-7 h-7 bg-cyan-500 text-white rounded-full text-sm">
                        🏢
                      </span>
                      Organization Email Code
                      <span className="text-red-500">*</span>
                    </Label>

                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Input
                          id="orgOtp"
                          type="text"
                          maxLength={6}
                          placeholder={FormPlaceholders.OTP_MASK}
                          className={`h-14 text-center text-2xl font-bold tracking-[0.5em] border-2 rounded-xl transition-all ${
                            orgOtpVerified
                              ? 'border-green-300 bg-green-50 text-green-700'
                              : 'border-gray-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-50'
                          }`}
                          error={step2Form.formState.errors.orgOtp?.message}
                          disabled={orgOtpVerified}
                          {...step2Form.register('orgOtp')}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleVerifyOrgOtp}
                        disabled={orgOtpVerified || verifyingOrg}
                        isLoading={verifyingOrg}
                        className={`h-14 min-w-[120px] rounded-xl font-semibold transition-all ${
                          orgOtpVerified
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-xl hover:scale-105'
                        }`}
                      >
                        {orgOtpVerified ? (
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" />
                            Verified
                          </span>
                        ) : (
                          'Verify'
                        )}
                      </Button>
                    </div>

                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Sent to:{' '}
                      <span className="font-medium text-gray-700">{formData.orgEmail}</span>
                    </p>
                  </div>
                )}

                {/* Success Message */}
                {((useSameEmail && adminOtpVerified) ||
                  (!useSameEmail && adminOtpVerified && orgOtpVerified)) && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-5 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-base font-bold text-green-800">
                        {useSameEmail ? 'Email Verified! 🎉' : 'Both Emails Verified! 🎉'}
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        You're all set! Click continue to proceed to the next step.
                      </p>
                    </div>
                  </div>
                )}

                <AuthActionButtons
                  secondaryLabel="Previous"
                  primaryLabel="Continue"
                  onSecondaryClick={goToPreviousStep}
                  primaryDisabled={
                    useSameEmail ? !adminOtpVerified : !adminOtpVerified || !orgOtpVerified
                  }
                  containerClassName="pt-4"
                  secondaryIcon={<ArrowLeft className="mr-2 h-5 w-5" />}
                  primaryIcon={<ArrowRight className="ml-2 h-5 w-5" />}
                />
              </form>
            )}

            {/* Step 3: Organization & Address Details */}
            {currentStep === 3 && (
              <form onSubmit={step3Form.handleSubmit(handleStep3Submit)} className="space-y-6">
                {/* Section Header with Icon */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl">
                    <Building2 className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Organization Information</h3>
                    <p className="text-sm text-gray-500">Tell us about your institution</p>
                  </div>
                </div>

                {/* Organization Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="orgName"
                    className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                  >
                    <span className="flex items-center justify-center w-6 h-6 bg-teal-100 rounded-full text-teal-700 text-xs font-bold">
                      🏢
                    </span>
                    Organization Name
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="orgName"
                    placeholder={FormPlaceholders.ENTER_SCHOOL_NAME}
                    className="h-14 text-base border-2 border-gray-200 rounded-xl focus:border-teal-400 focus:ring-4 focus:ring-teal-50 transition-all"
                    error={step3Form.formState.errors.orgName?.message}
                    {...step3Form.register('orgName')}
                  />
                </div>

                {/* Organization Type & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="orgType"
                      className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                    >
                      <span className="flex items-center justify-center w-6 h-6 bg-cyan-100 rounded-full text-cyan-700 text-xs font-bold">
                        📚
                      </span>
                      Organization Type
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={step3Form.watch('orgType')}
                      onValueChange={(value: string) =>
                        step3Form.setValue('orgType', value, { shouldValidate: true })
                      }
                    >
                      <SelectTrigger
                        id="orgType"
                        className="h-14 text-base"
                        error={step3Form.formState.errors.orgType?.message as string}
                      >
                        <SelectValue placeholder={FormPlaceholders.SELECT_OPTION} />
                      </SelectTrigger>
                      <SelectContent>
                        {ORGANIZATION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="orgPhone"
                      className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                    >
                      <span className="flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full text-purple-700 text-xs font-bold">
                        📞
                      </span>
                      Phone Number
                      <span className="text-red-500">*</span>
                    </Label>
                    <div>
                      <PhoneInput
                        id="orgPhone"
                        value={step3Form.watch('orgPhone')}
                        onChange={(value: string) =>
                          step3Form.setValue('orgPhone', value, { shouldValidate: false })
                        }
                        error={step3Form.formState.errors.orgPhone?.message as string}
                        required={false}
                        compact={false}
                      />
                    </div>
                  </div>
                </div>

                {/* Website & Board Affiliation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="orgWebsite"
                      className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                    >
                      <span className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full text-blue-700 text-xs font-bold">
                        🌐
                      </span>
                      Website
                      <span className="text-xs text-gray-500 font-normal">(Optional)</span>
                    </Label>
                    <Input
                      id="orgWebsite"
                      type="url"
                      placeholder={FormPlaceholders.WEBSITE_GENERIC_EXAMPLE}
                      className="h-14 text-base border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                      {...step3Form.register('orgWebsite')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="boardAffiliation"
                      className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                    >
                      <span className="flex items-center justify-center w-6 h-6 bg-indigo-100 rounded-full text-indigo-700 text-xs font-bold">
                        🎓
                      </span>
                      Board Affiliation
                      <span className="text-xs text-gray-500 font-normal">(Optional)</span>
                    </Label>
                    <Select
                      value={step3Form.watch('boardAffiliation') || ''}
                      onValueChange={(value: string) =>
                        step3Form.setValue('boardAffiliation', value, { shouldValidate: true })
                      }
                    >
                      <SelectTrigger id="boardAffiliation" className="h-14 text-base">
                        <SelectValue placeholder={FormPlaceholders.SELECT_OPTION} />
                      </SelectTrigger>
                      <SelectContent>
                        {BOARD_AFFILIATIONS.map((board) => (
                          <SelectItem key={board.value} value={board.value}>
                            {board.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Address Toggle */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <span className="text-amber-600 text-xl">📍</span>
                      </div>
                      <div>
                        <Label
                          htmlFor="includeAddress"
                          className="text-sm font-bold text-gray-800 cursor-pointer"
                        >
                          Add Address Information
                        </Label>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Include your organization's physical address (optional)
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="includeAddress"
                      checked={includeAddress}
                      onCheckedChange={(checked: boolean) => {
                        if (!checked) {
                          // Start exit animation
                          setIsAddressExiting(true);
                          setTimeout(() => {
                            setIncludeAddress(false);
                            setIsAddressExiting(false);
                            // Clear address fields when toggle is turned OFF
                            step3Form.setValue('streetAddress', '');
                            step3Form.setValue('addressLine2', '');
                            step3Form.setValue('city', '');
                            step3Form.setValue('state', '');
                            step3Form.setValue('zipCode', '');
                            step3Form.clearErrors(['streetAddress', 'city', 'state', 'zipCode']);
                          }, 300); // Match exit animation duration
                        } else {
                          setIncludeAddress(true);
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Address Fields - Show when toggle is ON with smooth animation */}
                {(includeAddress || isAddressExiting) && (
                  <div
                    className={`pt-2 origin-top overflow-hidden ${
                      isAddressExiting ? 'address-form-exit' : 'address-form-enter'
                    }`}
                  >
                    <AddressForm
                      form={step3Form}
                      required={includeAddress}
                      showHeader={false}
                      compact={false}
                      showLocationButton={true}
                    />
                  </div>
                )}

                <AuthActionButtons
                  secondaryLabel="Previous"
                  primaryLabel="Continue"
                  onSecondaryClick={goToPreviousStep}
                  secondaryIcon={<ArrowLeft className="mr-2 h-5 w-5" />}
                  primaryIcon={<ArrowRight className="ml-2 h-5 w-5" />}
                />
              </form>
            )}

            {/* Step 4: Admin Details & Password */}
            {currentStep === 4 && (
              <form onSubmit={step4Form.handleSubmit(handleStep4Submit)} className="space-y-5">
                <div className="flex items-center gap-2 text-teal-700 mb-4">
                  <User className="h-5 w-5" />
                  <h3 className="font-semibold">Administrator Account</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      placeholder={FormPlaceholders.FIRST_NAME_EXAMPLE}
                      className="h-12 border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                      error={step4Form.formState.errors.firstName?.message}
                      {...step4Form.register('firstName')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      placeholder={FormPlaceholders.LAST_NAME_EXAMPLE}
                      className="h-12 border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                      error={step4Form.formState.errors.lastName?.message}
                      {...step4Form.register('lastName')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-sm font-semibold text-gray-700">
                      Phone Number
                    </Label>
                    <PhoneInput
                      id="phoneNumber"
                      className="h-12 border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                      error={step4Form.formState.errors.phoneNumber?.message}
                      {...step4Form.register('phoneNumber')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm font-semibold text-gray-700">
                      Gender
                    </Label>
                    <Select
                      value={step4Form.watch('gender') || ''}
                      onValueChange={(value) => step4Form.setValue('gender', value)}
                    >
                      <SelectTrigger className="h-12 border-2 border-gray-300 focus:border-teal-500">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                        <SelectItem value="O">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {step4Form.formState.errors.gender && (
                      <p className="text-sm text-red-600">
                        {step4Form.formState.errors.gender.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={FormPlaceholders.CREATE_STRONG_PASSWORD}
                    className="h-12 border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    error={step4Form.formState.errors.password?.message}
                    {...step4Form.register('password')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={FormPlaceholders.REENTER_NEW_PASSWORD}
                    className="h-12 border-2 border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    error={step4Form.formState.errors.confirmPassword?.message}
                    {...step4Form.register('confirmPassword')}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notificationOptIn"
                    defaultChecked
                    className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    {...step4Form.register('notificationOptIn')}
                  />
                  <Label htmlFor="notificationOptIn" className="text-sm text-gray-700">
                    I want to receive email notifications about important updates
                  </Label>
                </div>

                <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
                  <h4 className="font-semibold text-teal-800 mb-4 text-base">
                    📋 Registration Summary
                  </h4>
                  <div className="space-y-2.5 text-sm font-mono">
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-700 w-48">Organization</span>
                      <span className="text-gray-700 mx-3">:</span>
                      <span className="text-gray-600 font-sans">{formData.orgName}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-700 w-48">Organization Email</span>
                      <span className="text-gray-700 mx-3">:</span>
                      <span className="text-gray-600 font-sans">{formData.orgEmail}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-700 w-48">Admin Email</span>
                      <span className="text-gray-700 mx-3">:</span>
                      <span className="text-gray-600 font-sans">{formData.adminEmail}</span>
                    </div>
                    {formData.city && formData.state && (
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-700 w-48">Location</span>
                        <span className="text-gray-700 mx-3">:</span>
                        <span className="text-gray-600 font-sans">
                          {formData.city}, {formData.state}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <AuthActionButtons
                  secondaryLabel="Previous"
                  primaryLabel="Complete Registration"
                  onSecondaryClick={goToPreviousStep}
                  secondaryDisabled={isLoading}
                  primaryLoading={isLoading}
                  containerClassName="pt-4"
                  secondaryIcon={<ArrowLeft className="mr-2 h-4 w-4" />}
                  primaryIcon={<CheckCircle2 className="ml-2 h-4 w-4" />}
                  secondaryClassName="h-12 border-gray-300"
                  primaryClassName="h-12"
                />
              </form>
            )}

            <div className="text-center mt-8 pt-6 border-t border-gray-100">
              <p className="text-base text-gray-600">
                Already have an account?{' '}
                <a
                  href={ROUTES.AUTH.LOGIN}
                  className="text-transparent bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-bold hover:from-teal-700 hover:to-cyan-700 transition-all"
                >
                  Sign in here →
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
