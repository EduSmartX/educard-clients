import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { ErrorMessages, FormPlaceholders, ROUTES, BRANDING, SuccessMessages } from '@/constants';
import { authApi } from '@/lib/api/auth-api';

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
      .regex(/[0-9]/, 'Password must contain at least one number')
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
      // Send either email or username based on toggle
      const requestData = useEmail
        ? { email: formData.identifier }
        : { username: formData.identifier };

      await authApi.requestPasswordResetOtp(requestData);

      setIdentifier(formData.identifier);
      setCurrentStep('verify');
      toast.success(`${SuccessMessages.AUTH.OTP_SENT} to your ${useEmail ? 'email' : 'account'}!`);
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: {
            errors?: { email?: string; username?: string };
            message?: string;
          };
        };
        message?: string;
      };

      // Check for field-level errors first
      const fieldErrors = error?.response?.data?.errors;
      if (fieldErrors) {
        const errorMessage = fieldErrors.email || fieldErrors.username;
        if (errorMessage) {
          toast.error(errorMessage);
          return;
        }
      }

      // Fallback to generic error
      const errorMessage =
        error?.response?.data?.message || error?.message || ErrorMessages.AUTH.SEND_OTP_FAILED;
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and Reset Password
  const handleVerifyOtp = async (formData: VerifyOtpFormData) => {
    setIsLoading(true);
    try {
      // Send either email or username based on toggle
      const verifyData = {
        ...(useEmail ? { email: identifier } : { username: identifier }),
        otp: formData.otp,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword,
      };

      await authApi.verifyPasswordResetOtp(verifyData);

      setCurrentStep('success');
      toast.success(SuccessMessages.AUTH.PASSWORD_RESET_SUCCESS);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error?.message || ErrorMessages.AUTH.PASSWORD_RESET_FAILED);
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
          {/* Back Button */}
          {currentStep === 'request' && (
            <a
              href={ROUTES.AUTH.LOGIN}
              className="inline-flex items-center gap-2 font-medium text-teal-600 transition-colors hover:text-teal-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </a>
          )}

          {/* Step 1: Request OTP */}
          {currentStep === 'request' && (
            <>
              {/* Header */}
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 opacity-50 blur-xl" />
                    <div className="relative rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 p-4 text-white shadow-lg ring-4 ring-white/50">
                      <Mail className="h-8 w-8" />
                    </div>
                  </div>
                </div>
                <div>
                  <h1 className="mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-4xl font-bold text-transparent">
                    Forgot Password? 🔒
                  </h1>
                  <p className="text-base text-gray-600">
                    Don't worry! Enter your {useEmail ? 'email' : 'username'} and we'll send you an
                    OTP
                  </p>
                </div>
              </div>

              {/* Email/Username Toggle */}
              <div className="rounded-xl border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'rounded-lg p-2 transition-colors',
                        useEmail ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'
                      )}
                    >
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {useEmail ? 'Using Email Address' : 'Using Username'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {useEmail
                          ? 'We will send OTP to your email'
                          : 'Enter your registered username'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={useEmail}
                    onCheckedChange={setUseEmail}
                    className="data-[state=checked]:bg-teal-600"
                  />
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitRequest(handleRequestOtp)} className="space-y-6">
                {/* Email/Username Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="identifier"
                    className="flex items-center gap-2 text-sm font-semibold text-gray-700"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                      {useEmail ? '📧' : '👤'}
                    </span>
                    {useEmail ? 'Email Address' : 'Username'}
                  </Label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="identifier"
                      type={useEmail ? 'email' : 'text'}
                      placeholder={useEmail ? 'Enter your email address' : 'Enter your username'}
                      className={cn(
                        'h-14 w-full rounded-xl border-2 pr-4 pl-12 text-base transition-all duration-200',
                        'focus:ring-4 focus:outline-none',
                        errorsRequest.identifier
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                          : 'border-gray-200 focus:border-teal-400 focus:ring-teal-100'
                      )}
                      {...registerRequest('identifier')}
                    />
                  </div>
                  {errorsRequest.identifier && (
                    <p className="flex items-center gap-1.5 text-sm text-red-600">
                      ⚠️ {errorsRequest.identifier.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="brand"
                  size="xl"
                  className="w-full font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Send OTP
                    </>
                  )}
                </Button>
              </form>

              {/* Info Tip */}
              <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div className="flex-1">
                    <p className="text-sm text-blue-900">
                      <strong>Remember your password?</strong> Go back to{' '}
                      <a
                        href={ROUTES.AUTH.LOGIN}
                        className="font-semibold underline hover:text-blue-700"
                      >
                        sign in to {BRANDING.APP_NAME}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 2: Verify OTP and Reset Password */}
          {currentStep === 'verify' && (
            <>
              {/* Back Button */}
              <button
                onClick={() => setCurrentStep('request')}
                className="inline-flex items-center gap-2 font-medium text-teal-600 transition-colors hover:text-teal-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Send OTP
              </button>

              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 opacity-50 blur-xl" />
                    <div className="relative rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 p-4 text-white shadow-lg ring-4 ring-white/50">
                      <Mail className="h-8 w-8" />
                    </div>
                  </div>
                </div>
                <div>
                  <h2 className="mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-3xl font-bold text-transparent">
                    Verify OTP �
                  </h2>
                  <p className="text-base text-gray-600">We've sent a 6-digit OTP to</p>
                  <p className="text-lg font-semibold text-teal-600">{identifier}</p>
                </div>
              </div>

              <form onSubmit={handleSubmitVerify(handleVerifyOtp)} className="space-y-5">
                {/* OTP Input */}
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-semibold text-gray-700">
                    Enter 6-Digit Code
                  </Label>
                  <input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder={FormPlaceholders.OTP_MASK}
                    className={cn(
                      'h-16 w-full rounded-xl border-2 text-center text-2xl font-bold tracking-[0.5em] transition-all',
                      'focus:ring-4 focus:outline-none',
                      errorsVerify.otp
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                        : 'border-gray-200 focus:border-cyan-400 focus:ring-cyan-100'
                    )}
                    {...registerVerify('otp', {
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                        e.target.value = e.target.value.replace(/\D/g, '');
                      },
                    })}
                  />
                  {errorsVerify.otp && (
                    <p className="flex items-center gap-1.5 text-sm text-red-600">
                      ⚠️ {errorsVerify.otp.message}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-700">
                    New Password
                  </Label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={FormPlaceholders.ENTER_NEW_PASSWORD}
                      className={cn(
                        'h-14 w-full rounded-xl border-2 pr-12 pl-4 text-base transition-all duration-200',
                        'focus:ring-4 focus:outline-none',
                        errorsVerify.newPassword
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                          : 'border-gray-200 focus:border-teal-400 focus:ring-teal-100'
                      )}
                      {...registerVerify('newPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errorsVerify.newPassword && (
                    <p className="flex items-center gap-1.5 text-sm text-red-600">
                      ⚠️ {errorsVerify.newPassword.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder={FormPlaceholders.CONFIRM_NEW_PASSWORD}
                      className={cn(
                        'h-14 w-full rounded-xl border-2 pr-12 pl-4 text-base transition-all duration-200',
                        'focus:ring-4 focus:outline-none',
                        errorsVerify.confirmPassword
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                          : 'border-gray-200 focus:border-teal-400 focus:ring-teal-100'
                      )}
                      {...registerVerify('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errorsVerify.confirmPassword && (
                    <p className="flex items-center gap-1.5 text-sm text-red-600">
                      ⚠️ {errorsVerify.confirmPassword.message}
                    </p>
                  )}
                </div>

                {/* Password Requirements */}
                <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
                  <p className="mb-2 text-sm font-semibold text-blue-900">Password must contain:</p>
                  <ul className="space-y-1 text-xs text-blue-800">
                    <li>✓ At least 8 characters</li>
                    <li>✓ One uppercase letter (A-Z)</li>
                    <li>✓ One lowercase letter (a-z)</li>
                    <li>✓ One number (0-9)</li>
                    <li>✓ One special character (!@#$%^&*)</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  variant="brand"
                  size="xl"
                  className="w-full font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Resetting Password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>

              <div className="text-center text-sm text-gray-600">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={() => setCurrentStep('request')}
                  className="font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                >
                  Resend OTP
                </button>
              </div>
            </>
          )}

          {/* Step 4: Success */}
          {currentStep === 'success' && (
            <>
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-br from-green-400 to-emerald-500 opacity-50 blur-xl" />
                    <div className="relative rounded-full bg-gradient-to-br from-green-500 to-emerald-600 p-4 text-white shadow-lg ring-4 ring-white/50">
                      <CheckCircle2 className="h-12 w-12" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-3xl font-bold text-transparent">
                    Password Reset Successful! 🎉
                  </h2>
                  <p className="text-base text-gray-600">
                    Your password has been changed successfully.
                  </p>
                </div>

                <div className="rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6">
                  <p className="mb-3 font-medium text-green-900">
                    ✅ You can now sign in with your new password
                  </p>
                  <ul className="space-y-2 text-left text-sm text-green-800">
                    <li className="flex items-start gap-2">
                      <span>🔒</span>
                      <span>Keep your password secure and don't share it with anyone</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>💡</span>
                      <span>Use a password manager for better security</span>
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={() => navigate(ROUTES.AUTH.LOGIN)}
                  variant="brand"
                  size="xl"
                  className="w-full font-semibold"
                >
                  Go to Login
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
