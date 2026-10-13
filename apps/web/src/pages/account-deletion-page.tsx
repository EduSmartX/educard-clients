import { GraduationCap, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BRANDING } from '@/constants/branding';

export default function AccountDeletionPage() {
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
        <h1 className="mb-2 text-3xl font-bold">{BRANDING.APP_NAME} Account Deletion</h1>
        <p className="text-muted-foreground mb-8 text-sm">Last updated: October 12, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground">
              {BRANDING.APP_NAME} respects your privacy and provides a process for requesting
              account deletion. The procedure depends on your account type and the organization
              associated with your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">1. How to Request Account Deletion</h2>

            <h3 className="mt-4 text-lg font-medium">Administrator Accounts</h3>
            <p className="text-muted-foreground mt-2">
              If you are an administrator who wants to delete your {BRANDING.APP_NAME} account,
              follow these steps:
            </p>
            <ol className="text-muted-foreground mt-2 list-decimal space-y-1 pl-6">
              <li>
                Send an email to{' '}
                <a
                  href={`mailto:${BRANDING.CONTACT.EMAIL}`}
                  className="text-primary hover:underline"
                >
                  {BRANDING.CONTACT.EMAIL}
                </a>
                .
              </li>
              <li>
                Use the subject line <strong>EduCard Account Deletion Request</strong>.
              </li>
              <li>Include your registered email address, organization name, and account role.</li>
              <li>Clearly state that you are requesting deletion of your EduCard account.</li>
            </ol>
            <p className="text-muted-foreground mt-2">
              We may contact you to verify your identity and authorization before processing the
              request.
            </p>

            <h3 className="mt-4 text-lg font-medium">Teacher and Parent Accounts</h3>
            <p className="text-muted-foreground mt-2">
              Teacher and Parent accounts are managed by the Organization Admin. To request
              deletion:
            </p>
            <ol className="text-muted-foreground mt-2 list-decimal space-y-1 pl-6">
              <li>Contact your school&apos;s or organization&apos;s Organization Admin.</li>
              <li>Ask the Organization Admin to delete your EduCard account.</li>
              <li>
                If you cannot contact your Organization Admin or need assistance, email{' '}
                <a
                  href={`mailto:${BRANDING.CONTACT.EMAIL}`}
                  className="text-primary hover:underline"
                >
                  {BRANDING.CONTACT.EMAIL}
                </a>
                .
              </li>
            </ol>
            <p className="text-muted-foreground mt-2">
              The Organization Admin is responsible for managing teacher and parent accounts within
              the organization.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. What Happens When Your Account Is Deleted?</h2>
            <p className="text-muted-foreground mt-2">
              {BRANDING.APP_NAME}&apos;s current account-deletion scope is account-only. When an
              account is deleted:
            </p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>Access to the deleted account is removed.</li>
              <li>The account can no longer be used to sign in.</li>
              <li>
                Personal information associated with the account is handled according to the
                applicable data-retention and deletion requirements.
              </li>
              <li>
                School or organizational records may remain where necessary for legitimate
                educational, administrative, accounting, or legal purposes.
              </li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Deleting a user&apos;s account does not automatically delete every record associated
              with that user. For example, attendance, academic, homework, or fee records may need
              to remain available to the school or organization. Information that is no longer
              required will be deleted or anonymized where appropriate, subject to applicable
              retention requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Data Retention After Account Deletion</h2>
            <p className="text-muted-foreground mt-2">
              Personal information retained in our systems following account deletion is retained
              for <strong>up to 90 days after account deletion</strong>, unless a longer period is
              required or permitted under applicable legal or legitimate retention requirements.
            </p>
            <p className="text-muted-foreground mt-2">
              Once the applicable retention period ends, information will be deleted or anonymized
              where appropriate. Certain school or organizational records may be retained separately
              by the relevant school or organization under its applicable record-retention
              requirements. Such records are not necessarily removed when an individual account is
              deleted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Verification and Processing</h2>
            <p className="text-muted-foreground mt-2">
              We may verify the identity and authority of the person submitting a deletion request
              to prevent unauthorized deletion. The time required to process a request may depend on
              verification, the account type, the Organization Admin&apos;s involvement, and any
              applicable retention obligations. If additional information is required, we will
              contact the requester using the information provided.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Need Help?</h2>
            <p className="text-muted-foreground mt-2">
              For administrator account-deletion requests or assistance with teacher and parent
              account deletion, contact:
            </p>
            <p className="text-muted-foreground mt-2">
              <strong>{BRANDING.LEGAL_ENTITY_NAME}</strong>
              <br />
              Email:{' '}
              <a href={`mailto:${BRANDING.CONTACT.EMAIL}`} className="text-primary hover:underline">
                {BRANDING.CONTACT.EMAIL}
              </a>
              <br />
              Subject: EduCard Account Deletion Request
              <br />
              Website:{' '}
              <a
                href="https://educard.info"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                https://educard.info
              </a>
            </p>
          </section>

          <section className="flex gap-4 border-t pt-6">
            <button
              type="button"
              className="text-primary text-sm hover:underline"
              onClick={() => navigate('/privacy-policy')}
            >
              Privacy Policy
            </button>
            <button
              type="button"
              className="text-primary text-sm hover:underline"
              onClick={() => navigate('/terms-of-service')}
            >
              Terms of Service
            </button>
            <button
              type="button"
              className="text-primary text-sm hover:underline"
              onClick={() => navigate('/contact')}
            >
              Contact
            </button>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-6 text-center lg:px-16">
        <p className="text-muted-foreground text-sm">{BRANDING.COPYRIGHT.TEXT}</p>
      </footer>
    </div>
  );
}
