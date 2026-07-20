/**
 * Forgot Password - Step components
 * Extracted to reduce cognitive complexity of ForgotPasswordPage
 */

import { Mail, ArrowLeft, Send, CheckCircle2, Eye, EyeOff, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ChannelRadioGroup } from '@/components/ui/channel-radio-group';
import { cn } from '@/lib/utils';
import { FormPlaceholders, ROUTES, BRANDING } from '@/constants';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';

type OtpChannel = 'email' | 'sms' | 'both';

interface RequestStepProps {
  useEmail: boolean;
  setUseEmail: (v: boolean) => void;
  channel: OtpChannel;
  setChannel: (v: OtpChannel) => void;
  onSubmit: (e: React.FormEvent) => void;
  register: UseFormRegister<{ identifier: string }>;
  errors: FieldErrors<{ identifier: string }>;
  isLoading: boolean;
  identifierLabel: string;
}

export function RequestOtpStep({
  useEmail,
  setUseEmail,
  channel,
  setChannel,
  onSubmit,
  register,
  errors,
  isLoading,
  identifierLabel,
}: RequestStepProps) {
  return (
    <>
      <a
        href={ROUTES.AUTH.LOGIN}
        className="inline-flex items-center gap-2 font-medium text-teal-600 transition-colors hover:text-teal-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Login
      </a>

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
            Don't worry! Enter your {identifierLabel} and we'll send you an OTP
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
                {useEmail ? 'We will send OTP to your email' : 'Enter your registered username'}
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
      <form onSubmit={onSubmit} className="space-y-6">
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
                errors.identifier
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                  : 'border-gray-200 focus:border-teal-400 focus:ring-teal-100'
              )}
              {...register('identifier')}
            />
          </div>
          {!!errors.identifier && (
            <p className="flex items-center gap-1.5 text-sm text-red-600">
              ⚠️ {errors.identifier.message}
            </p>
          )}
        </div>

        {/* OTP Delivery Channel */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Smartphone className="h-4 w-4 text-teal-600" />
            Send OTP via
          </Label>
          <ChannelRadioGroup
            value={channel}
            onValueChange={(v: string) => setChannel(v as OtpChannel)}
          />
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
              <a href={ROUTES.AUTH.LOGIN} className="font-semibold underline hover:text-blue-700">
                sign in to {BRANDING.APP_NAME}
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

interface VerifyStepProps {
  identifier: string;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  register: UseFormRegister<{ otp: string; newPassword: string; confirmPassword: string }>;
  errors: FieldErrors<{ otp: string; newPassword: string; confirmPassword: string }>;
  isLoading: boolean;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (v: boolean) => void;
}

export function VerifyOtpStep({
  identifier,
  onBack,
  onSubmit,
  register,
  errors,
  isLoading,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
}: VerifyStepProps) {
  const passwordInputType = showPassword ? 'text' : 'password';
  const confirmPasswordInputType = showConfirmPassword ? 'text' : 'password';

  return (
    <>
      <button
        onClick={onBack}
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
            Verify OTP 🔑
          </h2>
          <p className="text-base text-gray-600">We've sent a 6-digit OTP to</p>
          <p className="text-lg font-semibold text-teal-600">{identifier}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* OTP Input */}
        <div className="space-y-2">
          <Label htmlFor="otp" className="text-sm font-semibold text-gray-700">
            Enter 6-Digit Code
          </Label>
          <input
            id="otp"
            type="text"
            maxLength={6}
            placeholder="000000"
            className={cn(
              'h-16 w-full rounded-xl border-2 text-center text-2xl font-bold tracking-[0.5em] transition-all',
              'focus:ring-4 focus:outline-none',
              errors.otp
                ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                : 'border-gray-200 focus:border-cyan-400 focus:ring-cyan-100'
            )}
            {...register('otp', {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                e.target.value = e.target.value.replaceAll(/\D/g, '');
              },
            })}
          />
          {!!errors.otp && (
            <p className="flex items-center gap-1.5 text-sm text-red-600">
              ⚠️ {errors.otp.message}
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
              type={passwordInputType}
              placeholder="Enter new password"
              className={cn(
                'h-14 w-full rounded-xl border-2 pr-12 pl-4 text-base transition-all duration-200',
                'focus:ring-4 focus:outline-none',
                errors.newPassword
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                  : 'border-gray-200 focus:border-teal-400 focus:ring-teal-100'
              )}
              {...register('newPassword')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {!!errors.newPassword && (
            <p className="flex items-center gap-1.5 text-sm text-red-600">
              ⚠️ {errors.newPassword.message}
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
              type={confirmPasswordInputType}
              placeholder={FormPlaceholders.CONFIRM_PASSWORD}
              className={cn(
                'h-14 w-full rounded-xl border-2 pr-12 pl-4 text-base transition-all duration-200',
                'focus:ring-4 focus:outline-none',
                errors.confirmPassword
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                  : 'border-gray-200 focus:border-teal-400 focus:ring-teal-100'
              )}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {!!errors.confirmPassword && (
            <p className="flex items-center gap-1.5 text-sm text-red-600">
              ⚠️ {errors.confirmPassword.message}
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
          onClick={onBack}
          className="font-semibold text-teal-600 hover:text-teal-700 hover:underline"
        >
          Resend OTP
        </button>
      </div>
    </>
  );
}

interface SuccessStepProps {
  onGoToLogin: () => void;
}

export function SuccessStep({ onGoToLogin }: SuccessStepProps) {
  return (
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
        <p className="text-base text-gray-600">Your password has been changed successfully.</p>
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

      <Button onClick={onGoToLogin} variant="brand" size="xl" className="w-full font-semibold">
        Go to Login
      </Button>
    </div>
  );
}
