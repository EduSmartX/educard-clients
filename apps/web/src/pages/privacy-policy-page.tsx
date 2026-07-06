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
        <p className="text-muted-foreground mb-8 text-sm">Last updated: July 1, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          {/* 1. Introduction */}
          <section>
            <h2 className="text-xl font-semibold">1. Introduction</h2>
            <p className="text-muted-foreground mt-2">
              Welcome to {BRANDING.APP_NAME}, a product of{' '}
              <strong>{BRANDING.LEGAL_ENTITY_NAME}</strong>. We are committed to protecting your
              personal information and your right to privacy. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you use our platform (web
              and mobile applications).
            </p>
            <p className="text-muted-foreground mt-2">
              By using our services, you consent to the data practices described in this policy. If
              you do not agree with the terms of this Privacy Policy, please do not access or use
              our platform.
            </p>
          </section>

          {/* 2. Definitions */}
          <section>
            <h2 className="text-xl font-semibold">2. Definitions</h2>
            <ul className="text-muted-foreground mt-2 list-disc space-y-2 pl-6">
              <li>
                <strong>&quot;Platform&quot;</strong> refers to {BRANDING.APP_NAME} web and mobile
                applications operated by {BRANDING.LEGAL_ENTITY_NAME}.
              </li>
              <li>
                <strong>&quot;Institution&quot;</strong> refers to schools, colleges, or educational
                organizations that register on and use the Platform.
              </li>
              <li>
                <strong>&quot;User&quot;</strong> refers to administrators, teachers, parents,
                students, or staff accessing the Platform through an Institution.
              </li>
              <li>
                <strong>&quot;Personal Data&quot;</strong> refers to any information that identifies
                or can be used to identify a User directly or indirectly.
              </li>
              <li>
                <strong>&quot;We&quot;, &quot;Us&quot;, &quot;Our&quot;</strong> refers to{' '}
                {BRANDING.LEGAL_ENTITY_NAME}.
              </li>
            </ul>
          </section>

          {/* 3. Company Information */}
          <section>
            <h2 className="text-xl font-semibold">3. Company Information</h2>
            <p className="text-muted-foreground mt-2">
              <strong>{BRANDING.LEGAL_ENTITY_NAME}</strong>
              <br />
              Address: {BRANDING.CONTACT.ADDRESS}
              <br />
              Email: {BRANDING.CONTACT.EMAIL}
              <br />
              Phone: {BRANDING.CONTACT.PHONE}
              <br />
              Website: https://educard.info
            </p>
          </section>

          {/* 4. Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold">4. Information We Collect</h2>
            <p className="text-muted-foreground mt-2">
              We collect information that you provide directly and information collected
              automatically:
            </p>
            <h3 className="mt-3 text-base font-semibold">
              4.1 Information Provided by Institutions
            </h3>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>Organization name, address, and registration details</li>
              <li>Administrator contact information (name, email, phone)</li>
              <li>Staff and teacher profiles</li>
              <li>Student records (name, class, roll number, parent details)</li>
            </ul>
            <h3 className="mt-3 text-base font-semibold">4.2 Information from Users</h3>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>Account credentials (email, phone number, password)</li>
              <li>Profile information (name, role, photo)</li>
              <li>Communication data (leave requests, notifications preferences)</li>
            </ul>
            <h3 className="mt-3 text-base font-semibold">
              4.3 Automatically Collected Information
            </h3>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>Device information (device type, operating system, browser)</li>
              <li>Usage data (pages visited, features used, timestamps)</li>
              <li>IP address and approximate location</li>
              <li>Push notification tokens (for mobile app notifications)</li>
            </ul>
          </section>

          {/* 5. How We Use Your Information */}
          <section>
            <h2 className="text-xl font-semibold">5. How We Use Your Information</h2>
            <p className="text-muted-foreground mt-2">We use collected information to:</p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>Provide and maintain our school management services</li>
              <li>Authenticate users and secure accounts (OTP verification, login)</li>
              <li>Send transactional notifications (attendance alerts, fee reminders, OTPs)</li>
              <li>Enable communication between institutions, teachers, and parents</li>
              <li>Generate reports and analytics for institutional administrators</li>
              <li>Improve and personalize user experience</li>
              <li>Ensure platform security and prevent misuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          {/* 6. Children's Privacy */}
          <section>
            <h2 className="text-xl font-semibold">6. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground mt-2">
              {BRANDING.APP_NAME} services are intended for use by educational institutions. Student
              data, including data of minors (children under 18 years), is collected and processed
              only under the authorization and direction of the respective educational institution.
            </p>
            <p className="text-muted-foreground mt-2">
              We do not knowingly collect personal information directly from children. All student
              data is managed by authorized institution administrators and parent/guardian accounts.
              Institutions are responsible for obtaining necessary consents from parents or
              guardians before entering student data into the platform.
            </p>
          </section>

          {/* 7. Data Security */}
          <section>
            <h2 className="text-xl font-semibold">7. Data Security</h2>
            <p className="text-muted-foreground mt-2">
              We implement reasonable administrative, technical, and physical safeguards designed to
              protect personal information against unauthorized access, disclosure, alteration, or
              destruction. These measures include:
            </p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>Encryption of data in transit (TLS/SSL) and at rest</li>
              <li>Secure password hashing (Argon2)</li>
              <li>Role-based access controls within the platform</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Multi-tenant data isolation between institutions</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              However, no method of electronic storage or transmission over the internet is 100%
              secure. While we strive to use commercially acceptable means to protect your data, we
              cannot guarantee absolute security.
            </p>
          </section>

          {/* 8. Data Sharing */}
          <section>
            <h2 className="text-xl font-semibold">8. Data Sharing &amp; Disclosure</h2>
            <p className="text-muted-foreground mt-2">
              We do not sell, rent, or trade your personal data to third parties. We may share
              information only in the following circumstances:
            </p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>
                <strong>Within your Institution:</strong> Data is accessible to authorized
                administrators, teachers, and parents within the same institution as per role-based
                permissions.
              </li>
              <li>
                <strong>Service Providers:</strong> Trusted third-party providers who assist in
                operating our platform (hosting, email delivery, SMS notifications) under strict
                confidentiality agreements.
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law, regulation, court order,
                or governmental authority.
              </li>
              <li>
                <strong>Safety:</strong> To protect the rights, property, or safety of{' '}
                {BRANDING.LEGAL_ENTITY_NAME}, our users, or the public.
              </li>
            </ul>
          </section>

          {/* 9. Third-Party Services */}
          <section>
            <h2 className="text-xl font-semibold">9. Third-Party Services</h2>
            <p className="text-muted-foreground mt-2">
              We may use trusted third-party infrastructure and service providers for:
            </p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>Cloud hosting and data storage</li>
              <li>Email delivery and transactional communications</li>
              <li>SMS and push notification services</li>
              <li>Analytics and performance monitoring</li>
              <li>Payment processing (where applicable)</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              These providers are bound by contractual obligations to keep personal information
              confidential and use it only for the purposes for which we disclose it to them.
            </p>
          </section>

          {/* 10. Cookies & Analytics */}
          <section>
            <h2 className="text-xl font-semibold">10. Cookies &amp; Analytics</h2>
            <p className="text-muted-foreground mt-2">
              We may use cookies, local storage, and similar technologies to:
            </p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>Maintain user sessions and authentication state</li>
              <li>Remember user preferences and settings</li>
              <li>Analyze platform usage to improve performance and features</li>
              <li>Ensure security and detect fraudulent activity</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              You can control cookie settings through your browser preferences. Disabling cookies
              may affect certain features of the platform.
            </p>
          </section>

          {/* 11. Data Retention */}
          <section>
            <h2 className="text-xl font-semibold">11. Data Retention</h2>
            <p className="text-muted-foreground mt-2">
              We retain personal data only for as long as necessary to:
            </p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>Provide the services requested by the Institution</li>
              <li>Comply with legal and regulatory obligations</li>
              <li>Resolve disputes and enforce agreements</li>
              <li>Maintain records as required by applicable educational regulations</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              When an Institution terminates their account, we will delete or anonymize their data
              within a reasonable period, unless retention is required by law. Institutions may
              request data export before account closure.
            </p>
          </section>

          {/* 12. Your Rights */}
          <section>
            <h2 className="text-xl font-semibold">12. Your Rights</h2>
            <p className="text-muted-foreground mt-2">
              Subject to applicable laws, you have the following rights regarding your personal
              data:
            </p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>
                <strong>Access:</strong> Request a copy of your personal data held by us
              </li>
              <li>
                <strong>Correction:</strong> Request correction of inaccurate or incomplete data
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your data (subject to legal retention
                requirements)
              </li>
              <li>
                <strong>Portability:</strong> Request export of your data in a machine-readable
                format
              </li>
              <li>
                <strong>Objection:</strong> Object to processing of your data for specific purposes
              </li>
              <li>
                <strong>Withdraw Consent:</strong> Withdraw consent where processing is based on
                consent
              </li>
            </ul>
            <p className="text-muted-foreground mt-2">
              To exercise any of these rights, contact us at{' '}
              <a href={`mailto:${BRANDING.CONTACT.EMAIL}`} className="text-primary hover:underline">
                {BRANDING.CONTACT.EMAIL}
              </a>
              . We will respond within 30 days of receiving your request.
            </p>
          </section>

          {/* 13. Governing Law */}
          <section>
            <h2 className="text-xl font-semibold">13. Governing Law</h2>
            <p className="text-muted-foreground mt-2">
              This Privacy Policy shall be governed by and interpreted in accordance with the laws
              of India, including the Information Technology Act, 2000 and the Digital Personal Data
              Protection Act, 2023 (as applicable). Any disputes arising from this policy shall be
              subject to the exclusive jurisdiction of courts in Madanapalle, Andhra Pradesh, India.
            </p>
          </section>

          {/* 14. Changes to This Policy */}
          <section>
            <h2 className="text-xl font-semibold">14. Changes to This Policy</h2>
            <p className="text-muted-foreground mt-2">
              We may update this Privacy Policy from time to time to reflect changes in our
              practices, technology, legal requirements, or other factors. We will notify users of
              material changes by:
            </p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>
                Posting the updated policy on this page with a new &quot;Last updated&quot; date
              </li>
              <li>
                Sending email notifications to Institution administrators for significant changes
              </li>
              <li>Displaying in-app notifications where appropriate</li>
            </ul>
          </section>

          {/* 15. Contact Us */}
          <section>
            <h2 className="text-xl font-semibold">15. Contact Us</h2>
            <p className="text-muted-foreground mt-2">
              If you have questions, concerns, or requests regarding this Privacy Policy or our data
              practices, please contact us:
            </p>
            <div className="mt-3 rounded-lg border bg-slate-50 p-4">
              <p className="text-sm font-semibold">{BRANDING.LEGAL_ENTITY_NAME}</p>
              <p className="text-muted-foreground mt-1 text-sm">{BRANDING.CONTACT.ADDRESS}</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Email:{' '}
                <a
                  href={`mailto:${BRANDING.CONTACT.EMAIL}`}
                  className="text-primary hover:underline"
                >
                  {BRANDING.CONTACT.EMAIL}
                </a>
              </p>
              <p className="text-muted-foreground mt-1 text-sm">Phone: {BRANDING.CONTACT.PHONE}</p>
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
              onClick={() => navigate('/terms-of-service')}
            >
              Terms of Service
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
