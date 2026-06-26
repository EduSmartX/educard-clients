import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { sendOtps, verifyOtp } from '@/lib/api/otp-api';
import { registerOrganization } from '@/lib/api/organization-api';
import { parseOtpErrors } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils/error-handler';
import { ROUTES } from '@/constants/app-config';
import { ErrorMessages, SuccessMessages } from '@/constants';
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
} from '../utils/signup.utils';

/** Handle OTP send errors with field-level mapping */
function handleStep1Error(
  error: unknown,
  data: Step1Data,
  step1Form: ReturnType<typeof useForm<Step1Data>>,
  useSameEmail: boolean
) {
  const otpErrors = parseOtpErrors(error as AxiosError);
  if (!otpErrors.detail || otpErrors.errors.length === 0) {
    toast.error(getErrorMessage(error, 'Failed to send verification codes. Please try again.'));
    return;
  }
  otpErrors.errors.forEach((err) => {
    if (err.email === data.adminEmail) {
      step1Form.setError('adminEmail', { type: 'manual', message: err.error });
    }
    if (!useSameEmail && err.email === data.orgEmail) {
      step1Form.setError('orgEmail', { type: 'manual', message: err.error });
    }
  });
}

/** Verify a single OTP (admin or org) — extracted to reduce hook complexity */
async function performOtpVerification(params: {
  otpValue: string | undefined;
  email: string;
  setVerifying: (v: boolean) => void;
  setVerified: (v: boolean) => void;
  successMsg: string;
}) {
  const { otpValue, email, setVerifying, setVerified, successMsg } = params;
  if (!otpValue?.length || otpValue.length !== 6) {
    toast.error(ErrorMessages.AUTH.INVALID_OTP);
    return;
  }

  setVerifying(true);
  try {
    const response = await verifyOtp(email, otpValue, 'organization_registration');
    if (response.success) {
      setVerified(true);
      toast.success(successMsg);
    } else {
      toast.error(response.message || ErrorMessages.AUTH.VERIFY_OTP_FAILED);
    }
  } catch (error: unknown) {
    toast.error(getErrorMessage(error, ErrorMessages.AUTH.VERIFY_OTP_FAILED));
  } finally {
    setVerifying(false);
  }
}

/** Submit Step 1 (send OTPs) — extracted to reduce hook complexity */
async function performStep1Submit(params: {
  data: Step1Data;
  useSameEmail: boolean;
  step1Form: ReturnType<typeof useForm<Step1Data>>;
  setIsLoading: (v: boolean) => void;
  setFormData: React.Dispatch<React.SetStateAction<Partial<CompleteSignupData>>>;
  setCurrentStep: (step: SignupStep) => void;
}) {
  const { data, useSameEmail, step1Form, setIsLoading, setFormData, setCurrentStep } = params;
  setIsLoading(true);
  try {
    const emails = buildOtpSendRequests(useSameEmail, data);
    const response = await sendOtps(emails);

    if (!response.all_success) {
      const failedEmails = response.results.filter((r) => !r.success);
      toast.error(
        `${ErrorMessages.AUTH.SEND_OTP_FAILED} ${failedEmails.map((r) => r.email).join(', ')}`
      );
      return;
    }

    const updatedData = useSameEmail ? { ...data, orgEmail: data.adminEmail } : data;
    setFormData((prev) => ({ ...prev, ...updatedData }));
    toast.success(getOtpSendSuccessMessage(useSameEmail, data));
    setCurrentStep(2);
  } catch (error: unknown) {
    handleStep1Error(error, data, step1Form, useSameEmail);
  } finally {
    setIsLoading(false);
  }
}

/** Submit Step 4 (final registration) — extracted to reduce hook complexity */
async function performStep4Submit(params: {
  data: Step4Data;
  formData: Partial<CompleteSignupData>;
  setIsLoading: (v: boolean) => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const { data, formData, setIsLoading, navigate } = params;
  setIsLoading(true);
  try {
    const completeData = { ...formData, ...data } as CompleteSignupData;
    const registrationData = buildOrganizationRegistrationPayload(completeData);
    const response = await registerOrganization(registrationData);

    if (!response?.success || !response.data) {
      return;
    }
    navigate(ROUTES.AUTH.REGISTRATION_SUCCESS, {
      state: {
        organizationName: response.data.organization_info.name,
        organizationType: response.data.organization_info.type,
        organizationEmail: response.data.organization_info.email,
        adminName: `${response.data.admin_info.first_name} ${response.data.admin_info.last_name}`,
        adminEmail: response.data.admin_info.email,
      },
    });
  } catch (error: unknown) {
    toast.error(getErrorMessage(error, 'Failed to register. Please try again.'));
  } finally {
    setIsLoading(false);
  }
}

export function useSignupForm() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<SignupStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CompleteSignupData>>({});

  const [useSameEmail, setUseSameEmail] = useState(false);
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

  useEffect(() => {
    step3Form.clearErrors();
  }, [includeAddress, step3Form]);

  const step4Form = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      ...formData,
      notificationOptIn: true,
      canTeachSubject: true,
      employeeId: '',
    } as Step4Data,
  });

  // Watch adminEmail and sync to orgEmail when toggle is on
  const adminEmailValue = step1Form.watch('adminEmail');
  useEffect(() => {
    if (useSameEmail && adminEmailValue) {
      step1Form.setValue('orgEmail', adminEmailValue, { shouldValidate: true });
      step1Form.clearErrors('orgEmail');
    }
  }, [useSameEmail, adminEmailValue, step1Form]);

  // Step 1: Send OTPs
  const handleStep1Submit = async (data: Step1Data) => {
    await performStep1Submit({
      data,
      useSameEmail,
      step1Form,
      setIsLoading,
      setFormData,
      setCurrentStep,
    });
  };

  // Step 2: Verify OTPs
  const handleVerifyOtp = async (type: 'admin' | 'org') => {
    const config = {
      admin: {
        otpField: 'adminOtp' as const,
        email: formData.adminEmail!,
        setVerifying: setVerifyingAdmin,
        setVerified: setAdminOtpVerified,
        successMsg: SuccessMessages.AUTH.ADMIN_EMAIL_VERIFIED,
      },
      org: {
        otpField: 'orgOtp' as const,
        email: formData.orgEmail!,
        setVerifying: setVerifyingOrg,
        setVerified: setOrgOtpVerified,
        successMsg: SuccessMessages.AUTH.ORG_EMAIL_VERIFIED,
      },
    };
    const { otpField, email, setVerifying, setVerified, successMsg } = config[type];
    const otpValue = step2Form.getValues(otpField);
    await performOtpVerification({ otpValue, email, setVerifying, setVerified, successMsg });
  };

  const handleVerifyAdminOtp = () => handleVerifyOtp('admin');
  const handleVerifyOrgOtp = () => handleVerifyOtp('org');

  const handleStep2Submit = (data: Step2Data) => {
    const isVerified = useSameEmail ? adminOtpVerified : adminOtpVerified && orgOtpVerified;
    if (!isVerified) {
      toast.error(getOtpVerifyBlockingMessage(useSameEmail));
      return;
    }

    if (useSameEmail) {
      setOrgOtpVerified(true);
      step2Form.setValue('orgOtp', data.adminOtp);
    }

    setFormData((prev) => ({ ...prev, ...data }));
    toast.success(SuccessMessages.AUTH.EMAIL_VERIFICATION_COMPLETE);
    setCurrentStep(3);
  };

  // Step 3: Organization details
  const handleStep3Submit = (data: Step3Data) => {
    const normalizedData = normalizeStep3DataForSave(includeAddress, data);
    setFormData((prev) => ({ ...prev, ...normalizedData }));
    setCurrentStep(4);
  };

  // Step 4: Final registration
  const handleStep4Submit = async (data: Step4Data) => {
    await performStep4Submit({ data, formData, setIsLoading, navigate });
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as SignupStep);
    }
  };

  // Pre-computed conditional values for Step 2
  const otpSentMessage = useSameEmail
    ? `We've sent a 6-digit verification code to ${formData.adminEmail}`
    : `We've sent 6-digit verification codes to both email addresses. Check your inbox!`;
  const adminOtpLabel = useSameEmail ? 'Email Verification Code' : 'Administrator Email Code';
  const adminOtpIcon = useSameEmail ? '📧' : '👤';
  const adminOtpInputClass = adminOtpVerified
    ? 'border-green-300 bg-green-50 text-green-700'
    : 'border-gray-300 focus:border-teal-400 focus:ring-4 focus:ring-teal-50';
  const adminVerifyBtnClass = adminOtpVerified
    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200'
    : 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:scale-105 hover:shadow-xl';

  return {
    // State
    currentStep,
    isLoading,
    formData,
    useSameEmail,
    setUseSameEmail,
    includeAddress,
    setIncludeAddress,
    isAddressExiting,
    setIsAddressExiting,
    adminOtpVerified,
    orgOtpVerified,
    verifyingAdmin,
    verifyingOrg,

    // Forms
    step1Form,
    step2Form,
    step3Form,
    step4Form,

    // Handlers
    handleStep1Submit,
    handleStep2Submit,
    handleStep3Submit,
    handleStep4Submit,
    handleVerifyAdminOtp,
    handleVerifyOrgOtp,
    goToPreviousStep,
    navigate,

    // Computed
    otpSentMessage,
    adminOtpLabel,
    adminOtpIcon,
    adminOtpInputClass,
    adminVerifyBtnClass,
  };
}
