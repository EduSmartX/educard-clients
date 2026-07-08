import { motion } from 'framer-motion';
import { ROUTES } from '@/constants/app-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/branding/logo';
import { SIGNUP_STEP_TITLES } from '../utils/signup.utils';
import { useSignupForm } from '../hooks/use-signup-form';
import { SignupStep1 } from '../components/signup-step1';
import { SignupStep2 } from '../components/signup-step2';
import { SignupStep3 } from '../components/signup-step3';
import { SignupStep4 } from '../components/signup-step4';

/** Get step circle styling class based on progress */
function getStepClass(step: number, currentStep: number): string {
  if (step < currentStep) {
    return 'scale-100 bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg';
  }
  if (step === currentStep) {
    return 'scale-110 bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg ring-4 ring-teal-100';
  }
  return 'bg-gray-200 text-gray-500';
}

export default function SignupPage() {
  const {
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
    adminResendCooldown,
    orgResendCooldown,
    step1Form,
    step2Form,
    step3Form,
    step4Form,
    handleStep1Submit,
    handleStep2Submit,
    handleStep3Submit,
    handleStep4Submit,
    handleVerifyAdminOtp,
    handleVerifyOrgOtp,
    handleResendAdminOtp,
    handleResendOrgOtp,
    goToPreviousStep,
    navigate,
    otpSentMessage,
    adminOtpLabel,
    adminOtpIcon,
    adminOtpInputClass,
    adminVerifyBtnClass,
  } = useSignupForm();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 sm:p-6 lg:p-8">
      {/* Animated background elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-teal-400/20 to-cyan-400/20 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.1, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.15, 0.08, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative mx-auto max-w-4xl"
      >
        <Card className="overflow-hidden rounded-3xl border-0 bg-white/80 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-6 px-6 pt-10 pb-8 sm:px-10">
            <div className="flex items-center justify-center">
              <Logo
                variant="icon"
                size="xl"
                withGlow
                withRing
                className="transform transition-all duration-300 hover:scale-110"
              />
            </div>

            <div className="space-y-2 text-center">
              <CardTitle className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-4xl font-extrabold text-transparent">
                Create Your Account
              </CardTitle>
              <CardDescription className="text-lg font-medium text-gray-600">
                {SIGNUP_STEP_TITLES[currentStep - 1]}
              </CardDescription>
            </div>

            {/* Progress Steps */}
            <div className="mx-auto flex max-w-2xl items-center justify-center px-4">
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4].map((step, idx) => (
                  <div key={step} className="flex items-center">
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold transition-all duration-500 ${getStepClass(step, currentStep)}`}
                      >
                        {step < currentStep ? '✓' : step}
                      </div>
                      <span className="absolute -bottom-7 text-xs font-medium whitespace-nowrap text-gray-600">
                        {['Emails', 'Verify', 'Details', 'Finish'][idx]}
                      </span>
                    </div>
                    {idx < 3 && (
                      <div
                        className={`mx-2 h-1 w-16 rounded-full transition-all duration-500 ${
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
            {currentStep === 1 && (
              <SignupStep1
                form={step1Form}
                useSameEmail={useSameEmail}
                setUseSameEmail={setUseSameEmail}
                isLoading={isLoading}
                onSubmit={handleStep1Submit}
                onNavigateLogin={() => navigate(ROUTES.AUTH.LOGIN)}
              />
            )}

            {currentStep === 2 && (
              <SignupStep2
                form={step2Form}
                formData={formData}
                useSameEmail={useSameEmail}
                adminOtpVerified={adminOtpVerified}
                orgOtpVerified={orgOtpVerified}
                verifyingAdmin={verifyingAdmin}
                verifyingOrg={verifyingOrg}
                adminResendCooldown={adminResendCooldown}
                orgResendCooldown={orgResendCooldown}
                otpSentMessage={otpSentMessage}
                adminOtpLabel={adminOtpLabel}
                adminOtpIcon={adminOtpIcon}
                adminOtpInputClass={adminOtpInputClass}
                adminVerifyBtnClass={adminVerifyBtnClass}
                onVerifyAdmin={handleVerifyAdminOtp}
                onVerifyOrg={handleVerifyOrgOtp}
                onResendAdmin={handleResendAdminOtp}
                onResendOrg={handleResendOrgOtp}
                onSubmit={handleStep2Submit}
                onBack={goToPreviousStep}
              />
            )}

            {currentStep === 3 && (
              <SignupStep3
                form={step3Form}
                includeAddress={includeAddress}
                setIncludeAddress={setIncludeAddress}
                isAddressExiting={isAddressExiting}
                setIsAddressExiting={setIsAddressExiting}
                onSubmit={handleStep3Submit}
                onBack={goToPreviousStep}
              />
            )}

            {currentStep === 4 && (
              <SignupStep4
                form={step4Form}
                formData={formData}
                isLoading={isLoading}
                onSubmit={handleStep4Submit}
                onBack={goToPreviousStep}
              />
            )}

            <div className="mt-8 border-t border-gray-100 pt-6 text-center">
              <p className="text-base text-gray-600">
                Already have an account?{' '}
                <a
                  href={ROUTES.AUTH.LOGIN}
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-bold text-transparent transition-all hover:from-teal-700 hover:to-cyan-700"
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
