import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, Building2, Mail, Phone, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common/logo';
import { ROUTES } from '@/constants/app-config';
import { BRANDING } from '@/constants/branding';
import { USER_ROLES } from '@/constants';
import { getParsedLocalStorageItem } from '@/lib/utils/storage';

interface OrgPageState {
  organizationName: string;
  organizationEmail: string | undefined;
  organizationPhone: string | undefined;
  isVerified: boolean;
  isRejected: boolean;
  userRole: string;
}

function resolveOrgPageState(locationState: Record<string, unknown>): OrgPageState {
  const storedOrg =
    getParsedLocalStorageItem<{
      name?: string;
      email?: string;
      phone?: string;
      is_verified?: boolean;
      is_rejected?: boolean;
    }>('organization') || {};

  return {
    organizationName: (locationState.organizationName as string) || storedOrg.name || 'Your Organization',
    organizationEmail: (locationState.organizationEmail as string) || storedOrg.email,
    organizationPhone: (locationState.organizationPhone as string) || storedOrg.phone,
    isVerified: (locationState.isVerified as boolean) ?? storedOrg.is_verified ?? false,
    isRejected: (locationState.isRejected as boolean) ?? storedOrg.is_rejected ?? false,
    userRole: (locationState.userRole as string) || USER_ROLES.ADMIN,
  };
}

export default function OrganizationNotApprovedPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { organizationName, organizationEmail, organizationPhone, isVerified, isRejected, userRole } =
    resolveOrgPageState(location.state || {});

  const handleLogout = () => {
    localStorage.clear();
    navigate(ROUTES.AUTH.LOGIN);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
      {/* Animated Background Orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 h-72 w-72 rounded-full bg-orange-300/30 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.2, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-20 bottom-20 h-96 w-96 rounded-full bg-amber-300/30 blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.25, 0.15, 0.25] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-300/20 blur-3xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-2xl"
      >
        <div className="space-y-8 rounded-3xl border border-white/40 bg-white/90 p-8 shadow-2xl backdrop-blur-xl">
          {/* Logo */}
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>

          {/* Status Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', bounce: 0.4 }}
            className="flex justify-center"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className={`h-24 w-24 rounded-full ${isRejected ? 'bg-gradient-to-br from-red-100 to-rose-100' : 'bg-gradient-to-br from-orange-100 to-amber-100'} flex items-center justify-center`}
              >
                {isRejected ? (
                  <XCircle className="h-12 w-12 text-red-600" strokeWidth={2} />
                ) : (
                  <Clock className="h-12 w-12 text-orange-600" strokeWidth={2} />
                )}
              </motion.div>
              <div
                className={`absolute -right-2 -bottom-2 h-10 w-10 rounded-full ${isRejected ? 'bg-red-500' : 'bg-orange-500'} flex items-center justify-center shadow-lg`}
              >
                <span className="text-2xl">{isRejected ? '❌' : '⏳'}</span>
              </div>
            </div>
          </motion.div>

          {/* Main Message */}
          <div className="space-y-4 text-center">
            <h1
              className={`bg-gradient-to-r text-4xl font-bold ${isRejected ? 'from-red-600 to-rose-600' : 'from-orange-600 to-amber-600'} bg-clip-text text-transparent`}
            >
              {isRejected ? 'Organization Rejected' : 'Organization Under Review'}
            </h1>
            <p className="text-xl font-medium text-gray-600">
              {isRejected
                ? 'Your organization is not registered with us'
                : 'Your account is pending approval'}
            </p>
          </div>

          {/* Organization Info Card */}
          <div className="space-y-4 rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
                  <Building2 className="h-8 w-8 text-white" strokeWidth={2} />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-lg font-bold text-gray-900">{organizationName}</h3>
                <div className="space-y-2">
                  {organizationEmail && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4 text-orange-500" />
                      <span>{organizationEmail}</span>
                    </div>
                  )}
                  {organizationPhone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-orange-500" />
                      <span>{organizationPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap gap-3 border-t border-orange-200 pt-4">
              <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm">
                {isVerified ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-700">Verified</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">Not Verified</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-sm">
                {isRejected ? (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700">Rejected</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-orange-700">Pending Approval</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Information Box */}
          <div
            className={`${isRejected ? 'border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-50' : 'border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50'} rounded-2xl p-6`}
          >
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 text-3xl">{isRejected ? '⚠️' : 'ℹ️'}</span>
              <div className="flex-1 space-y-3">
                {isRejected ? (
                  <>
                    <h3 className="text-lg font-bold text-gray-900">Organization Not Registered</h3>
                    <div className="text-sm text-gray-700">
                      {userRole === USER_ROLES.ADMIN ? (
                        <p>
                          The organization is unregistered with us. Please contact the{' '}
                          <strong>{BRANDING.APP_NAME} Administrator</strong> for further assistance
                          and to resolve this issue.
                        </p>
                      ) : (
                        <p>
                          Your organization has been rejected or is not registered. Please contact
                          your <strong>Organization Admin or Principal</strong> for more information
                          and next steps.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-gray-900">What happens next?</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 font-bold text-blue-500">1.</span>
                        <span>
                          Our team is currently reviewing your organization's information and
                          documents.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 font-bold text-blue-500">2.</span>
                        <span>
                          You'll receive an email notification once your organization is approved.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 font-bold text-blue-500">3.</span>
                        <span>The approval process typically takes 1-2 business days.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 font-bold text-blue-500">4.</span>
                        <span>After approval, you'll have full access to all features.</span>
                      </li>
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 text-3xl">💬</span>
              <div className="flex-1">
                <h3 className="mb-2 font-bold text-gray-900">Need Help?</h3>
                <p className="mb-4 text-sm text-gray-700">
                  {isRejected
                    ? userRole === USER_ROLES.ADMIN
                      ? `Please contact the ${BRANDING.APP_NAME} support team to understand the rejection reason and how to proceed.`
                      : 'Please reach out to your Organization Admin or Principal for assistance with this matter.'
                    : 'If you have any questions or need to expedite the approval process, please contact our support team.'}
                </p>
                <div className="flex flex-wrap gap-3">
                  {(userRole === USER_ROLES.ADMIN || !isRejected) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      onClick={() => (window.location.href = `mailto:${BRANDING.CONTACT.EMAIL}`)}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {isRejected ? `Contact ${BRANDING.APP_NAME} Admin` : 'Email Support'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <div className="pt-4">
            <Button
              onClick={handleLogout}
              variant="brandOutline"
              className="h-12 w-full text-base font-semibold"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
