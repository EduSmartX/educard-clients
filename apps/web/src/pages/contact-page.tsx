import { GraduationCap, ArrowLeft, Mail, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BRANDING } from '@/constants/branding';

export default function ContactPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="border-b px-6 py-4 lg:px-16">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <button type="button" className="flex items-center gap-2" onClick={() => navigate('/')}>
            <GraduationCap className="text-primary h-7 w-7" />
            <span className="text-lg font-bold">{BRANDING.APP_NAME}</span>
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-12 lg:px-16">
        <h1 className="mb-2 text-3xl font-bold">Contact Us</h1>
        <p className="text-muted-foreground mb-2 text-base">{BRANDING.LEGAL_ENTITY_NAME}</p>
        <p className="text-muted-foreground mb-10 text-base">
          We are here to help with questions about EduCard, account access, school-management
          features, technical issues, and privacy-related concerns. If you use EduCard as a school
          administrator, teacher, or parent, please contact us using the details below.
        </p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold">General Support</h2>
            <p className="text-muted-foreground mt-2">
              For assistance with EduCard, account-related questions, technical issues, or feedback,
              contact:
            </p>
            <div className="mt-3 flex items-start gap-3 rounded-lg border bg-slate-50 p-4">
              <Mail className="text-primary mt-0.5 h-5 w-5" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <a
                  href={`mailto:${BRANDING.CONTACT.EMAIL}`}
                  className="text-primary text-sm hover:underline"
                >
                  {BRANDING.CONTACT.EMAIL}
                </a>
                <p className="mt-2 text-sm font-medium">Website</p>
                <a
                  href="https://educard.info"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-sm hover:underline"
                >
                  https://educard.info
                </a>
              </div>
            </div>
            <p className="text-muted-foreground mt-2">
              Please describe your issue clearly so that our support team can understand your
              request and provide appropriate assistance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Account Deletion Requests</h2>

            <h3 className="mt-3 text-base font-semibold">Administrator Accounts</h3>
            <p className="text-muted-foreground mt-2">
              Administrators who want to delete their EduCard accounts can email{' '}
              <a href={`mailto:${BRANDING.CONTACT.EMAIL}`} className="text-primary hover:underline">
                {BRANDING.CONTACT.EMAIL}
              </a>
              .
            </p>
            <p className="text-muted-foreground mt-2">
              Please use the subject line: <strong>EduCard Account Deletion Request</strong>.
            </p>
            <p className="text-muted-foreground mt-2">
              Include your registered email address, organization name, and account role. We may
              request additional information to verify your identity before processing the request.
            </p>

            <h3 className="mt-3 text-base font-semibold">Teacher and Parent Accounts</h3>
            <p className="text-muted-foreground mt-2">
              Teacher and Parent accounts are managed by the Organization Admin.
            </p>
            <p className="text-muted-foreground mt-2">
              Please contact your school&apos;s or organization&apos;s Organization Admin to request
              account deletion. If you cannot contact your Organization Admin, email{' '}
              {BRANDING.CONTACT.EMAIL} for assistance.
            </p>
            <p className="text-muted-foreground mt-2">
              For additional information, visit{' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => navigate('/account-deletion')}
              >
                educard.info/account-deletion
              </button>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Privacy and Data Protection</h2>
            <p className="text-muted-foreground mt-2">
              For questions about personal information, data retention, privacy rights, or the
              handling of student information, please email {BRANDING.CONTACT.EMAIL}.
            </p>
            <p className="text-muted-foreground mt-2">
              Please do not include passwords, authentication codes, or unnecessary sensitive
              student information in your email.
            </p>
            <p className="text-muted-foreground mt-2">
              You can review our{' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => navigate('/privacy-policy')}
              >
                Privacy Policy
              </button>{' '}
              here.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Technical Support</h2>
            <p className="text-muted-foreground mt-2">
              When reporting a technical issue, please provide a description of the problem, the
              affected feature, and any relevant error message. Avoid sending confidential
              information unless it is specifically necessary and requested through an appropriate
              channel.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Our Website</h2>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
              <Globe className="text-primary h-4 w-4" />
              Visit{' '}
              <a
                href="https://educard.info"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                https://educard.info
              </a>{' '}
              to learn more about EduCard and access our published policies.
            </p>
          </section>

          <div className="rounded-lg border bg-slate-50 p-4">
            <p className="text-sm font-semibold">{BRANDING.LEGAL_ENTITY_NAME}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Email:{' '}
              <a href={`mailto:${BRANDING.CONTACT.EMAIL}`} className="text-primary hover:underline">
                {BRANDING.CONTACT.EMAIL}
              </a>
            </p>
            <p className="text-muted-foreground mt-1 text-sm">Website: https://educard.info</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-6 lg:px-16">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3">
          <p className="text-muted-foreground text-sm">{BRANDING.COPYRIGHT.TEXT}</p>
          <div className="flex gap-4">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              onClick={() => navigate('/privacy-policy')}
            >
              Privacy Policy
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              onClick={() => navigate('/terms-of-service')}
            >
              Terms of Service
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              onClick={() => navigate('/account-deletion')}
            >
              Account Deletion
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
