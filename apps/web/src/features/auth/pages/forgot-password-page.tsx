import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ErrorMessages, ROUTES, SuccessMessages } from '@/constants';
import { authApi } from '@/lib/api/auth-api';
import { getErrorMessage } from '@/lib/utils/error-handler';
import { RequestOtpStep, VerifyOtpStep, SuccessStep } from '../components/forgot-password-steps';

// Step 1: Request OTP - Email or Username
const requestOtpSchema = z.object({
  identifier: z.string().min(3, 'Please enter your email or username'),
});

// Step 2: Verify OTP
const verifyOtpSchema = z
  .object({
    otp: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/\d/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RequestOtpFormData = z.infer<typeof requestOtpSchema>;
type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;

type Step = 'request' | 'verify' | 'success';

/** Extract error message from OTP request API response */
function getOtpRequestError(err: unknown): string {
  const error = err as {
    response?: {
      data?: {
        errors?: { email?: string; username?: string };
        message?: string;
      };
    };
    message?: string;
  };

  const fieldErrors = error?.response?.data?.errors;
  const fieldMessage = fieldErrors?.email || fieldErrors?.username;
  if (fieldMessage) {
    return fieldMessage;
  }
  return error?.response?.data?.message || error?.message || ErrorMessages.AUTH.SEND_OTP_FAILED;
}

function buildIdentifierPayload(useEmail: boolean, identifier: string) {
  return useEmail ? { email: identifier } : { username: identifier };
}

function getIdentifierLabel(useEmail: boolean) {
  return useEmail ? 'email' : 'username';
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [useEmail, setUseEmail] = useState(true); // Toggle between email/username
  const [identifier, setIdentifier] = useState(''); // Store email/username
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form for Step 1: Request OTP
  const {
    register: registerRequest,
    handleSubmit: handleSubmitRequest,
    formState: { errors: errorsRequest },
  } = useForm<RequestOtpFormData>({
    resolver: zodResolver(requestOtpSchema),
  });

  // Form for Step 2: Verify OTP and Reset Password
  const {
    register: registerVerify,
    handleSubmit: handleSubmitVerify,
    formState: { errors: errorsVerify },
  } = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
  });

  // Step 1: Request OTP
  const handleRequestOtp = async (formData: RequestOtpFormData) => {
    setIsLoading(true);
    try {
      const requestData = buildIdentifierPayload(useEmail, formData.identifier);

      await authApi.requestPasswordResetOtp(requestData);

      setIdentifier(formData.identifier);
      setCurrentStep('verify');
      toast.success(`${SuccessMessages.AUTH.OTP_SENT} to your ${getIdentifierLabel(useEmail)}!`);
    } catch (err: unknown) {
      toast.error(getOtpRequestError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and Reset Password
  const handleVerifyOtp = async (formData: VerifyOtpFormData) => {
    setIsLoading(true);
    try {
      const identifierField = buildIdentifierPayload(useEmail, identifier);
      const verifyData = {
        ...identifierField,
        otp: formData.otp,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword,
      };

      await authApi.verifyPasswordResetOtp(verifyData);

      setCurrentStep('success');
      toast.success(SuccessMessages.AUTH.PASSWORD_RESET_SUCCESS);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, ErrorMessages.AUTH.PASSWORD_RESET_FAILED));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 p-4">
      {/* Animated Background Orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 h-72 w-72 rounded-full bg-teal-300/30 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.2, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-20 bottom-20 h-96 w-96 rounded-full bg-cyan-300/30 blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.25, 0.15, 0.25] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300/20 blur-3xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-md"
      >
        <div className="space-y-6 rounded-3xl border border-white/20 bg-white/90 p-8 shadow-2xl backdrop-blur-xl">
          {currentStep === 'request' && (
            <RequestOtpStep
              useEmail={useEmail}
              setUseEmail={setUseEmail}
              onSubmit={handleSubmitRequest(handleRequestOtp)}
              register={registerRequest}
              errors={errorsRequest}
              isLoading={isLoading}
              identifierLabel={getIdentifierLabel(useEmail)}
            />
          )}

          {currentStep === 'verify' && (
            <VerifyOtpStep
              identifier={identifier}
              onBack={() => setCurrentStep('request')}
              onSubmit={handleSubmitVerify(handleVerifyOtp)}
              register={registerVerify}
              errors={errorsVerify}
              isLoading={isLoading}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
            />
          )}

          {currentStep === 'success' && (
            <SuccessStep onGoToLogin={() => navigate(ROUTES.AUTH.LOGIN)} />
          )}
        </div>
      </motion.div>
    </div>
  );
}
