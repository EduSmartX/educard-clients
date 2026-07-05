import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, UserCircle2 } from 'lucide-react';
import { authApi, isProfileSelectionResponse, type LoginCredentials } from '@/lib/api/auth-api';
import { tokenManager } from '@/lib/token-manager';
import { CommonUiText, ErrorMessages, FormPlaceholders, SuccessMessages } from '@/constants';
import { ROUTES } from '@/constants/app-config';
import { BRANDING } from '@/constants/branding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/branding';
import { getDashboardRoute } from '@/lib/utils/auth-utils';

const loginSchema = z.object({
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (tokenManager.isAuthenticated() && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const route = getDashboardRoute(user?.role);
        if (route !== '/') {
          navigate(route, { replace: true });
        }
      } catch {
        // Invalid stored user, continue to login
      }
    }
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (formData: LoginFormData) => {
    setIsLoading(true);
    setLoginError(null);
    try {
      const response = await authApi.login(formData as LoginCredentials);

      if (isProfileSelectionResponse(response)) {
        navigate(ROUTES.AUTH.SELECT_PROFILE, {
          state: {
            selectionToken: response.selection_token,
            profiles: response.profiles,
            organization: response.organization,
          },
        });
        return;
      }

      if (
        response.organization &&
        (!response.organization.is_approved || response.organization.is_rejected)
      ) {
        if (response.organization.is_rejected) {
          toast.error(ErrorMessages.AUTH.ORGANIZATION_REJECTED);
        } else {
          toast.warning(ErrorMessages.AUTH.PENDING_APPROVAL);
        }
        navigate(ROUTES.AUTH.ORGANIZATION_NOT_APPROVED, {
          state: {
            organizationName: response.organization.name,
            organizationEmail: response.organization.email,
            organizationPhone: response.organization.phone,
            isVerified: response.organization.is_verified,
            isRejected: response.organization.is_rejected,
            userRole: response.user.role,
          },
        });
        return;
      }

      toast.success(SuccessMessages.LOGIN_SUCCESS);
      navigate(getDashboardRoute(response.user.role));
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string; detail?: string } } };
      const errorMessage =
        apiError?.response?.data?.message ||
        apiError?.response?.data?.detail ||
        'Invalid username or password';
      setLoginError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      {/* Animated Background Orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 h-72 w-72 rounded-full bg-purple-300/30 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.2, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-20 bottom-20 h-96 w-96 rounded-full bg-pink-300/30 blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.25, 0.15, 0.25] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-300/20 blur-3xl"
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
        <div className="space-y-8 rounded-3xl border border-white/20 bg-white/80 p-8 shadow-2xl backdrop-blur-xl">
          {/* Logo & Title */}
          <div className="space-y-4 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', bounce: 0.4 }}
              className="flex justify-center"
            >
              <Logo variant="icon" size="xl" withGlow withRing />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h1 className="mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-4xl font-bold text-transparent">
                Welcome Back! 👋
              </h1>
              <p className="text-base text-gray-600">
                Sign in to access your {BRANDING.APP_NAME} account
              </p>
            </motion.div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Login Error Message */}
            {loginError && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">❌</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">{loginError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Username/Email Field */}
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="flex items-center gap-2 text-sm font-semibold text-gray-700"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                  1
                </span>
                <span>Username or Email</span>
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="username"
                  placeholder={FormPlaceholders.ENTER_USERNAME_OR_EMAIL}
                  className="h-14 rounded-xl border-2 border-gray-200 pl-12 text-base transition-all duration-200 focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                  error={errors.username?.message}
                  {...register('username')}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                    2
                  </span>
                  <span>Password</span>
                </Label>
                <a
                  href={ROUTES.AUTH.FORGOT_PASSWORD}
                  className="text-sm font-medium text-teal-600 transition-colors hover:text-teal-700 hover:underline"
                >
                  {CommonUiText.FORGOT_PASSWORD}
                </a>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder={FormPlaceholders.ENTER_PASSWORD}
                  className="h-14 rounded-xl border-2 border-gray-200 pl-12 text-base transition-all duration-200 focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              variant="brand"
              size="xl"
              className="w-full font-semibold"
              isLoading={isLoading}
            >
              <LogIn className="mr-2 h-5 w-5" />
              {CommonUiText.SIGN_IN}
            </Button>

            {/* Sign Up Link */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white/80 px-4 text-gray-500">New to {BRANDING.APP_NAME}?</span>
              </div>
            </div>

            <div className="text-center">
              <a
                href={ROUTES.AUTH.SIGNUP}
                className="inline-flex items-center gap-2 font-semibold text-teal-600 transition-colors hover:text-teal-700 hover:underline"
              >
                <UserCircle2 className="h-5 w-5" />
                Create an account
              </a>
            </div>
          </form>

          {/* Info Tip */}
          <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">
                  <strong>First time?</strong> Sign up to create your organization account and start
                  managing your educational institution efficiently.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
