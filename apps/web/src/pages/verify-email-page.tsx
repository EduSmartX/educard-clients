import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Mail, CheckCircle2, XCircle } from 'lucide-react';
import {
  validateVerificationToken,
  verifyEmailAndSetPassword,
} from '@/features/teachers/api/teachers-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ROUTES } from '@/constants/app-config';

interface ApiError {
  response?: {
    data?: {
      message?: string;
      errors?: {
        [key: string]: string[];
      };
    };
  };
}

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Validate token and fetch user details
  const {
    data: userDetails,
    isLoading: isValidating,
    error: validationError,
  } = useQuery({
    queryKey: ['validateToken', token],
    queryFn: () => validateVerificationToken(token!),
    enabled: !!token,
    retry: false,
  });

  // Set password mutation
  const setPasswordMutation = useMutation({
    mutationFn: (data: { token: string; password: string; confirm_password: string }) =>
      verifyEmailAndSetPassword(data),
    onSuccess: () => {
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate(ROUTES.AUTH.LOGIN);
      }, 3000);
    },
  });

  useEffect(() => {
    if (!token) {
      navigate(ROUTES.AUTH.LOGIN);
    }
  }, [token, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    // Validate password
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordMutation.mutate({
      token: token!,
      password,
      confirm_password: confirmPassword,
    });
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-50 via-teal-50 to-cyan-100 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
        <Card className="w-full max-w-lg shadow-2xl border-0">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 shadow-lg"
            >
              <Loader2 className="h-12 w-12 animate-spin text-white" />
            </motion.div>
            <p className="text-xl font-semibold text-gray-800">Validating verification link...</p>
            <p className="mt-2 text-sm text-gray-500">Please wait while we verify your account</p>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    );
  }

  // Error state - Invalid or expired token
  if (validationError || !userDetails) {
    const error = validationError as ApiError;
    const errorMessage =
      error?.response?.data?.errors?.token?.[0] ||
      error?.response?.data?.message ||
      'Invalid or expired verification link';
    
    const isExpired = errorMessage.toLowerCase().includes('expired');

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-50 via-teal-50 to-cyan-100 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
        <Card className="w-full max-w-lg shadow-2xl border-0">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', bounce: 0.4 }}
              className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-rose-500 shadow-lg"
            >
              <XCircle className="h-14 w-14 text-white" />
            </motion.div>
            <CardTitle className="text-3xl font-bold text-gray-800 mb-2">Verification Failed</CardTitle>
            <CardDescription className="text-base text-gray-600">{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-8 pb-8">
            {isExpired && (
              <Alert className="border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-sm">
                <AlertDescription className="text-sm text-amber-900">
                  <p className="font-semibold mb-2 text-base">🔗 Link Expired?</p>
                  <p>Please contact your school administrator to resend the verification link.</p>
                </AlertDescription>
              </Alert>
            )}
            <Button 
              onClick={() => navigate(ROUTES.AUTH.LOGIN)} 
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold text-base shadow-lg"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    );
  }

  // Success state - Password set successfully
  if (setPasswordMutation.isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-50 via-teal-50 to-cyan-100 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
        <Card className="w-full max-w-lg shadow-2xl border-0">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', bounce: 0.4 }}
              className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg"
            >
              <CheckCircle2 className="h-14 w-14 text-white" />
            </motion.div>
            <CardTitle className="text-3xl font-bold text-gray-800 mb-2">Success! 🎉</CardTitle>
            <CardDescription className="text-base text-gray-600">
              Your email has been verified and password has been set successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-8 pb-8">
            <Alert className="border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm">
              <AlertDescription className="text-center text-sm text-green-900">
                You can now log in with your username: <strong className="text-base">{userDetails.username}</strong>
              </AlertDescription>
            </Alert>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Redirecting to login page...</span>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    );
  }

  // Main form - Set password
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-50 via-teal-50 to-cyan-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
      <Card className="w-full max-w-lg shadow-2xl border-0">
        <CardHeader className="text-center pb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', bounce: 0.4 }}
            className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 shadow-lg"
          >
            <Mail className="h-14 w-14 text-white" />
          </motion.div>
          <CardTitle className="text-3xl font-bold text-gray-800 mb-2">Set Your Password</CardTitle>
          <CardDescription className="text-base text-gray-600">
            Welcome, <span className="font-semibold text-gray-800">{userDetails.first_name} {userDetails.last_name}</span>!
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Display */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={userDetails.email}
                disabled
                className="h-11 bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 text-gray-600"
              />
            </div>

            {/* Username Display */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold text-gray-700">Username</Label>
              <Input
                id="username"
                type="text"
                value={userDetails.username}
                disabled
                className="h-11 bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 text-gray-600"
              />
              <p className="text-xs text-teal-600 flex items-center gap-1">
                <span>💡</span>
                <span>Use this username to log in</span>
              </p>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="h-11 pr-10 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-teal-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">Must be at least 8 characters long</p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  className="h-11 pr-10 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-teal-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {(passwordError || setPasswordMutation.error) && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800">
                  {passwordError ||
                    (() => {
                      const error = setPasswordMutation.error as ApiError;
                      return (
                        error?.response?.data?.errors?.password?.[0] ||
                        error?.response?.data?.message ||
                        'Failed to set password'
                      );
                    })()}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold text-base shadow-lg transition-all duration-200"
              disabled={setPasswordMutation.isPending}
            >
              {setPasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Setting Password...
                </>
              ) : (
                'Set Password & Activate Account'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}
