import { GraduationCap, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BRANDING } from '@/constants/branding';

export default function TermsOfServicePage() {
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
        <h1 className="mb-2 text-3xl font-bold">Terms and Conditions</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Effective Date: October 12, 2026 &middot; Last Updated: October 12, 2026
        </p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground">
              Welcome to {BRANDING.APP_NAME}, operated by {BRANDING.LEGAL_ENTITY_NAME} (&quot;
              EduCard&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;).
            </p>
            <p className="text-muted-foreground mt-2">
              These Terms and Conditions govern your access to and use of the EduCard website,
              mobile application, and related services.
            </p>
            <p className="text-muted-foreground mt-2">
              By accessing or using EduCard, you agree to these Terms. If you do not agree, you
              should stop using the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">1. About EduCard</h2>
            <p className="text-muted-foreground mt-2">
              EduCard is a school-management platform intended to support authorized educational and
              administrative activities, which may include student information management,
              attendance, homework, leave requests, academic records, fee-related information,
              notifications, and communication between schools, teachers, and parents.
            </p>
            <p className="text-muted-foreground mt-2">
              The features available to you depend on your account role, organization, and the
              functionality enabled for your school.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Eligibility and Authorized Use</h2>
            <p className="text-muted-foreground mt-2">
              EduCard may be used by authorized administrators, teachers, parents, and other
              permitted users.
            </p>
            <p className="text-muted-foreground mt-2">
              Users must provide accurate information when creating or maintaining accounts and must
              use the service only for lawful and authorized purposes.
            </p>
            <p className="text-muted-foreground mt-2">
              Where an account is created or managed by a school or Organization Admin, the user
              must follow the applicable access arrangements established by that organization.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Accounts and Access</h2>
            <p className="text-muted-foreground mt-2">
              Access to EduCard may be provisioned or managed by EduCard or an authorized
              Organization Admin, depending on the account type and organizational setup.
            </p>
            <p className="text-muted-foreground mt-2">
              Users are responsible for keeping their login credentials confidential and for
              activities performed through their accounts, subject to applicable law.
            </p>
            <p className="text-muted-foreground mt-2">
              Users must notify their Organization Admin or EduCard support if they suspect
              unauthorized access, credential misuse, or a security issue.
            </p>
            <p className="text-muted-foreground mt-2">
              Organization Admins are responsible for appropriately managing user access within
              their organizations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. User Responsibilities</h2>
            <p className="text-muted-foreground mt-2">When using EduCard, you agree to:</p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>Provide accurate and up-to-date information where required.</li>
              <li>Use the service only for authorized educational or administrative activities.</li>
              <li>
                Respect the privacy and confidentiality of students, parents, teachers, and other
                users.
              </li>
              <li>Access only the records and features you are authorized to use.</li>
              <li>
                Avoid unauthorized access, interference with service operations, or attempts to
                bypass security controls.
              </li>
              <li>Avoid uploading unlawful, misleading, malicious, or unauthorized content.</li>
              <li>Comply with applicable laws, school policies, and organizational procedures.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              You must not use EduCard to misuse personal information, harass other users,
              distribute harmful software, or engage in fraudulent or unlawful activity.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              5. Responsibilities of Schools and Organization Admins
            </h2>
            <p className="text-muted-foreground mt-2">
              Schools and organizations using EduCard are responsible for:
            </p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>
                Ensuring they are authorized to provide personal and educational information to the
                platform.
              </li>
              <li>Obtaining required permissions or consents under applicable law.</li>
              <li>Assigning appropriate account roles and access permissions.</li>
              <li>Managing teacher and parent accounts within their organizations.</li>
              <li>Maintaining appropriate oversight of school records and organizational data.</li>
              <li>
                Following applicable requirements for educational records, privacy, and data
                retention.
              </li>
            </ul>
            <p className="text-muted-foreground mt-2">
              EduCard provides software tools to support school-management activities but does not
              replace the school&apos;s own legal, administrative, or safeguarding responsibilities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Privacy and Personal Information</h2>
            <p className="text-muted-foreground mt-2">
              Your use of EduCard is also governed by our{' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => navigate('/privacy-policy')}
              >
                Privacy Policy
              </button>
              .
            </p>
            <p className="text-muted-foreground mt-2">
              The Privacy Policy explains how information may be collected, used, stored, shared,
              and retained.
            </p>
            <p className="text-muted-foreground mt-2">
              Users should review the Privacy Policy before using the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Account Deletion</h2>
            <p className="text-muted-foreground mt-2">
              Administrator accounts may request deletion by emailing{' '}
              <a href={`mailto:${BRANDING.CONTACT.EMAIL}`} className="text-primary hover:underline">
                {BRANDING.CONTACT.EMAIL}
              </a>
              .
            </p>
            <p className="text-muted-foreground mt-2">
              Teacher and Parent accounts are managed by the Organization Admin and should be
              deleted through that process.
            </p>
            <p className="text-muted-foreground mt-2">
              Account deletion removes account access but does not necessarily remove every school
              or organizational record associated with the account. Certain records may be retained
              for legitimate educational, administrative, accounting, or legal purposes.
            </p>
            <p className="text-muted-foreground mt-2">
              Further details are available at{' '}
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
            <h2 className="text-xl font-semibold">8. Availability and Changes to the Service</h2>
            <p className="text-muted-foreground mt-2">
              We aim to provide a reliable service but do not guarantee that EduCard will always be
              available, uninterrupted, or free from errors.
            </p>
            <p className="text-muted-foreground mt-2">
              We may update, modify, maintain, suspend, or discontinue features where reasonably
              necessary for security, maintenance, operational, technical, or business reasons,
              subject to applicable law and any separate agreement with a school or organization.
            </p>
            <p className="text-muted-foreground mt-2">
              Where reasonably practicable, we will seek to minimize disruption caused by planned
              maintenance or significant changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Suspension and Termination</h2>
            <p className="text-muted-foreground mt-2">
              Access to an account may be restricted or suspended where necessary to protect the
              service, investigate suspected misuse, address security risks, comply with legal
              obligations, or enforce these Terms.
            </p>
            <p className="text-muted-foreground mt-2">
              Where appropriate and legally permitted, the affected user or organization may be
              informed of the reason for the restriction.
            </p>
            <p className="text-muted-foreground mt-2">
              Schools and Organization Admins may also manage accounts under their organizational
              responsibilities and applicable agreements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Intellectual Property</h2>
            <p className="text-muted-foreground mt-2">
              EduCard and its associated software, branding, design, and original content are owned
              by or licensed to {BRANDING.LEGAL_ENTITY_NAME}, except for content belonging to users
              or other third parties.
            </p>
            <p className="text-muted-foreground mt-2">
              You may not copy, modify, distribute, reverse engineer, or commercially exploit
              protected parts of the service except where permitted by law or with the appropriate
              authorization.
            </p>
            <p className="text-muted-foreground mt-2">
              Information and materials submitted by schools or users remain subject to their
              respective rights and applicable agreements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">11. Third-Party Services</h2>
            <p className="text-muted-foreground mt-2">
              EduCard may rely on third-party services to support hosting, communications,
              notifications, storage, or other functionality.
            </p>
            <p className="text-muted-foreground mt-2">
              Third-party services may be subject to separate terms and privacy policies. EduCard is
              not responsible for independent third-party services beyond the responsibilities
              imposed on us by applicable law or a separate agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">12. Disclaimer and Limitation of Liability</h2>
            <p className="text-muted-foreground mt-2">
              To the extent permitted by applicable law, EduCard is provided on an &quot;as
              available&quot; basis. We do not guarantee that the service will be uninterrupted,
              error-free, or suitable for every particular purpose.
            </p>
            <p className="text-muted-foreground mt-2">
              To the extent permitted by law, {BRANDING.LEGAL_ENTITY_NAME} will not be liable for
              indirect or consequential losses arising from the use of or inability to use the
              service.
            </p>
            <p className="text-muted-foreground mt-2">
              Nothing in these Terms excludes or limits liability that cannot legally be excluded or
              limited. Any additional limitations are subject to applicable law and any separate
              agreement with the relevant school or organization.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">13. Changes to These Terms</h2>
            <p className="text-muted-foreground mt-2">
              We may revise these Terms to reflect changes in the service, business operations, or
              legal requirements.
            </p>
            <p className="text-muted-foreground mt-2">
              The updated Terms will be published on this page with a revised &quot;Last
              Updated&quot; date. Continued use of the service after an update takes effect may
              constitute acceptance where permitted by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">14. Governing Law</h2>
            <p className="text-muted-foreground mt-2">
              These Terms are subject to the laws applicable to the operation of EduCard and the
              relevant user or organization, without excluding mandatory legal protections that
              apply in a particular jurisdiction.
            </p>
            <p className="text-muted-foreground mt-2">
              Any disputes will be handled by the courts or other forums with jurisdiction under
              applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">15. Contact Us</h2>
            <p className="text-muted-foreground mt-2">
              For questions about these Terms or the EduCard service, contact:
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
              onClick={() => navigate('/privacy-policy')}
            >
              Privacy Policy
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
