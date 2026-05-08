import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Mail, Clock, Settings, Users, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/branding/logo';
import { ROUTES } from '@/constants/app-config';
import { BRANDING } from '@/constants/branding';

interface RegistrationData {
  organizationName: string;
  organizationType: string;
  organizationEmail: string;
  adminName: string;
  adminEmail: string;
}

export default function RegistrationSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const registrationData = location.state as RegistrationData;

  // Redirect to login if no registration data
  useEffect(() => {
    if (!registrationData) {
      navigate(ROUTES.AUTH.LOGIN);
    }
  }, [registrationData, navigate]);

  if (!registrationData) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-3xl"
      >
      <Card className="shadow-2xl">
        <CardContent className="p-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-8 text-center text-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', bounce: 0.4 }}
              className="mb-4 flex justify-center"
            >
              <div className="rounded-full bg-white p-4">
                <CheckCircle2 className="h-16 w-16 text-teal-600" />
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-2 text-3xl font-bold"
            >
              Registration Successful! 🎉
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-lg text-teal-50"
            >
              Welcome to {BRANDING.APP_NAME}, {registrationData.adminName}
            </motion.p>
          </div>

          {/* Content */}
          <div className="space-y-6 p-8">
            {/* Success Message */}
            <div className="text-center">
              <p className="text-lg text-gray-700">
                <strong>Congratulations!</strong> Your organization{' '}
                <strong className="text-teal-600">"{registrationData.organizationName}"</strong> has
                been successfully registered with {BRANDING.APP_NAME}.
              </p>
            </div>

            {/* Organization Details */}
            <div className="rounded-lg border-2 border-teal-200 bg-teal-50 p-6">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-teal-800">
                <Mail className="h-5 w-5" />
                Organization Details
              </h3>
              <div className="space-y-2.5 font-mono text-sm">
                <div className="flex items-center">
                  <span className="w-48 font-semibold text-gray-700">Name</span>
                  <span className="mx-3 text-gray-700">:</span>
                  <span className="font-sans text-gray-600">
                    {registrationData.organizationName}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-48 font-semibold text-gray-700">Type</span>
                  <span className="mx-3 text-gray-700">:</span>
                  <span className="font-sans text-gray-600 capitalize">
                    {registrationData.organizationType}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-48 font-semibold text-gray-700">Organization Email</span>
                  <span className="mx-3 text-gray-700">:</span>
                  <span className="font-sans text-gray-600">
                    {registrationData.organizationEmail}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-48 font-semibold text-gray-700">Admin</span>
                  <span className="mx-3 text-gray-700">:</span>
                  <span className="font-sans text-gray-600">
                    {registrationData.adminName} ({registrationData.adminEmail})
                  </span>
                </div>
              </div>
            </div>

            {/* What's Next Section */}
            <div className="rounded-lg border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 p-6">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-cyan-800">
                <Clock className="h-5 w-5" />
                What's Next?
              </h3>
              <p className="mb-4 text-gray-700">
                Your organization registration has been received successfully. Our team will review
                your application and verify the details.
              </p>
              <div className="mb-4 rounded-lg bg-white p-4">
                <p className="mb-3 font-semibold text-gray-800">
                  Once {BRANDING.APP_NAME} approves your organization, you will be notified via
                  email and you can:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3 text-gray-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
                    <span>
                      <strong>Access your organization dashboard</strong> - View analytics and
                      manage your institution
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-700">
                    <Settings className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600" />
                    <span>
                      <strong>Set organization preferences</strong> - Configure academic year,
                      terms, and grading systems
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-700">
                    <Users className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                    <span>
                      <strong>Add team members</strong> - Invite teachers, staff, and manage
                      permissions
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-700">
                    <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />
                    <span>
                      <strong>Configure leave allocations</strong> - Set up leave policies for staff
                      and teachers
                    </span>
                  </li>
                </ul>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-800">
                  <strong>⏱️ Verification Timeline:</strong> This verification process typically
                  takes 24-48 hours. You will receive a confirmation email once your organization is
                  approved.
                </p>
              </div>
            </div>

            {/* Email Confirmation */}
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="text-sm text-gray-700">
                  <strong>Check your email!</strong> We've sent a confirmation email to{' '}
                  <strong className="text-blue-600">{registrationData.adminEmail}</strong> and{' '}
                  <strong className="text-blue-600">{registrationData.organizationEmail}</strong>{' '}
                  with all the details.
                </p>
              </div>
            </div>

            {/* Need Help Section */}
            <div className="border-t pt-4 text-center">
              <h4 className="mb-2 font-semibold text-gray-800">Need Help?</h4>
              <p className="mb-4 text-sm text-gray-600">
                If you have any questions or need assistance, please contact our support team.
              </p>
              <div className="flex flex-col justify-center gap-2 text-sm sm:flex-row">
                <a
                  href={`mailto:${BRANDING.CONTACT.EMAIL}`}
                  className="font-medium text-teal-600 hover:text-teal-700"
                >
                  📧 {BRANDING.CONTACT.EMAIL}
                </a>
                <span className="hidden text-gray-400 sm:inline">|</span>
                <span className="text-gray-600">📞 {BRANDING.CONTACT.PHONE}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <Button
                onClick={() => navigate(ROUTES.AUTH.LOGIN)}
                variant="brand"
                className="h-12 flex-1 font-semibold"
              >
                Go to Login
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="brandOutline"
                className="h-12 flex-1 font-semibold"
              >
                Back to Home
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="rounded-b-lg bg-gray-800 p-6 text-center text-sm text-white">
            <div className="mb-3 flex justify-center">
              <Logo size="sm" />
            </div>
            <p className="text-gray-400">
              This is an automated message. For support, contact us at{' '}
              <a
                href={`mailto:${BRANDING.CONTACT.EMAIL}`}
                className="text-teal-400 hover:text-teal-300"
              >
                {BRANDING.CONTACT.EMAIL}
              </a>
            </p>
            <p className="mt-2 text-gray-500">{BRANDING.COPYRIGHT.TEXT}</p>
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}
