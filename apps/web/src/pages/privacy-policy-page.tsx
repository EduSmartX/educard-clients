import { GraduationCap, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BRANDING } from '@/constants/branding';

export default function PrivacyPolicyPage() {
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
        <h1 className="mb-2 text-3xl font-bold">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Effective Date: October 12, 2026 &middot; Last Updated: October 12, 2026
        </p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground">
              {BRANDING.LEGAL_ENTITY_NAME} (&quot;EduCard&quot;, &quot;we&quot;, &quot;our&quot;, or
              &quot;us&quot;) respects your privacy and is committed to protecting the personal
              information processed through the EduCard website and mobile application.
            </p>
            <p className="text-muted-foreground mt-2">
              This Privacy Policy explains how we collect, use, store, disclose, and protect
              information when administrators, teachers, parents, and other authorized users access
              or use EduCard.
            </p>
            <p className="text-muted-foreground mt-2">
              By using EduCard, you acknowledge that you have read this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">1. Information We Collect</h2>
            <p className="text-muted-foreground mt-2">
              Depending on the features enabled by your school or organization and how you use the
              application, EduCard may process the following categories of information.
            </p>

            <h3 className="mt-3 text-base font-semibold">1.1 Account Information</h3>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>Name and username</li>
              <li>Email address and phone number</li>
              <li>Account role and organization association</li>
              <li>Authentication information required to provide secure account access</li>
              <li>Profile information provided by the user or organization</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Passwords, where used, should be stored in a securely protected form and not as
              readable plain text.
            </p>

            <h3 className="mt-3 text-base font-semibold">
              1.2 School and Organization Information
            </h3>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>School or organization name and related details</li>
              <li>Teacher and parent account information</li>
              <li>Student names, class, section, and related school information</li>
              <li>Information necessary to associate users with their school or organization</li>
            </ul>

            <h3 className="mt-3 text-base font-semibold">
              1.3 Educational and Administrative Records
            </h3>
            <p className="text-muted-foreground mt-2">
              Depending on the features used, EduCard may process:
            </p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>Student attendance records</li>
              <li>Homework, assignments, and submissions</li>
              <li>Leave requests and approvals</li>
              <li>Academic marks, grades, and performance information</li>
              <li>Fee records and related financial or refund information</li>
              <li>School announcements, messages, and notifications</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              These records may contain information about children and are intended to be accessed
              only for authorized educational or administrative purposes.
            </p>

            <h3 className="mt-3 text-base font-semibold">1.4 Technical Information</h3>
            <p className="text-muted-foreground mt-2">
              The application may process technical information required to operate and maintain the
              service, such as device or push-notification identifiers, application diagnostics, and
              technical logs, where those features are enabled.
            </p>
            <p className="text-muted-foreground mt-2">
              We do not intend to collect precise location information unless a specific feature
              requires it and the appropriate disclosure and permissions are provided.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. How We Use Information</h2>
            <p className="text-muted-foreground mt-2">
              We use personal information for purposes such as:
            </p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>Creating and managing user accounts</li>
              <li>Authenticating users and controlling access based on account roles</li>
              <li>Providing school-management and educational features</li>
              <li>Managing attendance, homework, leave, academic, and fee-related activities</li>
              <li>Delivering relevant notifications and school communications</li>
              <li>Responding to support requests and account-deletion requests</li>
              <li>Maintaining service reliability, security, and performance</li>
              <li>
                Detecting, investigating, and preventing unauthorized access, misuse, or fraud
              </li>
              <li>Meeting applicable legal and regulatory obligations</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              We aim to process personal information only for purposes relevant to providing and
              maintaining EduCard.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. School and Organization Responsibilities</h2>
            <p className="text-muted-foreground mt-2">
              EduCard supports schools and organizations in managing educational and administrative
              activities.
            </p>
            <p className="text-muted-foreground mt-2">
              Schools and organizations are responsible for ensuring that they have an appropriate
              legal basis, permissions, and authorizations to provide personal information to
              EduCard and to use that information for their intended purposes.
            </p>
            <p className="text-muted-foreground mt-2">
              Organization Admins are responsible for managing authorized users within their
              organizations, including teacher and parent accounts, and for ensuring that access to
              school information is appropriately controlled.
            </p>
            <p className="text-muted-foreground mt-2">
              Parents or guardians should contact their school or Organization Admin regarding the
              handling of student information associated with their school account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Sharing of Information</h2>
            <p className="text-muted-foreground mt-2">
              We do not sell personal information to third parties.
            </p>
            <p className="text-muted-foreground mt-2">
              Information may be disclosed to the following categories of recipients where
              necessary:
            </p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>
                <strong>Schools and organizations:</strong> Authorized administrators and personnel
                may access information needed for school-management activities.
              </li>
              <li>
                <strong>Service providers:</strong> Hosting, database, messaging, notification, and
                infrastructure providers may process information to operate the application.
              </li>
              <li>
                <strong>Legal and regulatory authorities:</strong> Information may be disclosed when
                required by applicable law or valid legal process.
              </li>
              <li>
                <strong>Security and protection:</strong> Information may be processed or disclosed
                when reasonably necessary to investigate security incidents, prevent misuse, or
                protect users and the service.
              </li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Service providers are expected to handle information according to their applicable
              obligations and the services they provide.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Data Storage and Security</h2>
            <p className="text-muted-foreground mt-2">
              EduCard uses technical and organizational measures intended to protect personal
              information against unauthorized access, alteration, disclosure, loss, or misuse.
            </p>
            <p className="text-muted-foreground mt-2">
              No method of electronic storage or transmission can be guaranteed to be completely
              secure. We therefore cannot promise absolute security, but we work to protect
              information appropriate to the nature of the service.
            </p>
            <p className="text-muted-foreground mt-2">
              Users should keep their login credentials confidential and promptly report suspected
              unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Data Retention</h2>
            <p className="text-muted-foreground mt-2">
              We retain personal information for as long as necessary to provide the service,
              fulfill the purposes described in this Policy, comply with applicable obligations,
              resolve disputes, and protect the legitimate interests of users and the service.
            </p>

            <h3 className="mt-3 text-base font-semibold">
              Account Deletion and the 90-Day Retention Period
            </h3>
            <p className="text-muted-foreground mt-2">
              When an account is deleted, the account&apos;s login access is removed. Personal
              information associated with the deleted account that remains in our systems for
              deletion processing or other applicable purposes is retained for{' '}
              <strong>up to 90 days after account deletion</strong>, unless a longer period is
              required or permitted for a legitimate legal obligation or another applicable
              retention requirement.
            </p>
            <p className="text-muted-foreground mt-2">
              After the applicable retention period, information will be deleted or anonymized where
              appropriate, subject to legitimate retention requirements and technical limitations
              such as secure backup lifecycle processes.
            </p>
            <p className="text-muted-foreground mt-2">
              Certain school or organizational records, including attendance, academic, homework, or
              fee records, may remain under the control of the relevant school or organization where
              necessary for legitimate educational, administrative, accounting, or legal purposes.
              Such records are not necessarily deleted solely because an individual user&apos;s
              login account is deleted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Account Deletion</h2>
            <p className="text-muted-foreground mt-2">
              EduCard provides different account-deletion procedures depending on the user&apos;s
              role.
            </p>

            <h3 className="mt-3 text-base font-semibold">Administrator Accounts</h3>
            <p className="text-muted-foreground mt-2">
              Administrators may request account deletion by emailing{' '}
              <a href={`mailto:${BRANDING.CONTACT.EMAIL}`} className="text-primary hover:underline">
                {BRANDING.CONTACT.EMAIL}
              </a>
              . The request should include the registered email address, organization name, and
              account role.
            </p>
            <p className="text-muted-foreground mt-2">
              We may request additional information to verify the requester&apos;s identity and
              authority before processing the request.
            </p>

            <h3 className="mt-3 text-base font-semibold">Teacher and Parent Accounts</h3>
            <p className="text-muted-foreground mt-2">
              Teacher and Parent accounts are managed by the Organization Admin. Users should
              contact their school&apos;s or organization&apos;s Organization Admin and request
              account deletion.
            </p>
            <p className="text-muted-foreground mt-2">
              If a user cannot contact their Organization Admin, they may email{' '}
              {BRANDING.CONTACT.EMAIL} for assistance.
            </p>
            <p className="text-muted-foreground mt-2">
              Account deletion removes the affected account&apos;s access. It does not automatically
              mean that every associated school record is erased. Any information retained after
              deletion will be handled in accordance with the retention practices described in this
              Policy and applicable requirements.
            </p>
            <p className="text-muted-foreground mt-2">
              Further instructions are available at{' '}
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
            <h2 className="text-xl font-semibold">8. Children&apos;s Information</h2>
            <p className="text-muted-foreground mt-2">
              EduCard is designed to support school-management activities and may process student
              information, including information about children.
            </p>
            <p className="text-muted-foreground mt-2">
              Schools and organizations using EduCard are responsible for obtaining any permissions,
              consents, or authorizations required under applicable law before providing or
              processing children&apos;s information.
            </p>
            <p className="text-muted-foreground mt-2">
              Access to student information should be limited to authorized users for legitimate
              educational or administrative purposes. Parents and guardians may contact the relevant
              school or Organization Admin regarding student information and applicable privacy
              rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Your Privacy Rights</h2>
            <p className="text-muted-foreground mt-2">
              Depending on applicable law and the circumstances of processing, users may have rights
              to request access to, correction of, or deletion of their personal information, or to
              raise concerns about how it is handled.
            </p>
            <p className="text-muted-foreground mt-2">
              Users should direct requests concerning school-managed records to their school or
              Organization Admin. Requests concerning administrator accounts or EduCard&apos;s
              handling of personal information may be sent to {BRANDING.CONTACT.EMAIL}.
            </p>
            <p className="text-muted-foreground mt-2">
              We may need to verify identity and authority before responding to a request.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Third-Party Services</h2>
            <p className="text-muted-foreground mt-2">
              EduCard may rely on third-party infrastructure or service providers to host, store,
              transmit, or support application data.
            </p>
            <p className="text-muted-foreground mt-2">
              Those providers may have their own privacy policies and terms governing their
              services. Where required, additional information about relevant providers and their
              data practices should be made available to users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">11. International Processing</h2>
            <p className="text-muted-foreground mt-2">
              Depending on the infrastructure and service providers used, information may be stored
              or processed in locations outside the user&apos;s location. Where applicable, such
              processing will be subject to relevant legal requirements and appropriate safeguards.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">12. Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground mt-2">
              We may update this Privacy Policy to reflect changes in EduCard&apos;s features,
              operations, service providers, or legal requirements.
            </p>
            <p className="text-muted-foreground mt-2">
              The updated version will be published on this page with a revised &quot;Last
              Updated&quot; date. Users should review this page periodically for changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">13. Contact Us</h2>
            <p className="text-muted-foreground mt-2">
              For privacy questions, data-related concerns, or administrator account-deletion
              requests, contact:
            </p>
            <div className="mt-3 rounded-lg border bg-slate-50 p-4">
              <p className="text-sm font-semibold">{BRANDING.LEGAL_ENTITY_NAME}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Email:{' '}
                <a
                  href={`mailto:${BRANDING.CONTACT.EMAIL}`}
                  className="text-primary hover:underline"
                >
                  {BRANDING.CONTACT.EMAIL}
                </a>
              </p>
              <p className="text-muted-foreground mt-1 text-sm">Website: https://educard.info</p>
            </div>
            <p className="text-muted-foreground mt-3">
              For teacher or parent account-deletion requests, please contact your Organization
              Admin first.
            </p>
          </section>
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
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              onClick={() => navigate('/contact')}
            >
              Contact Us
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
