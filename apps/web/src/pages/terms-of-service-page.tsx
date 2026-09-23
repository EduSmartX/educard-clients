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
        <h1 className="mb-2 text-3xl font-bold">Terms &amp; Conditions</h1>
        <p className="text-muted-foreground mb-8 text-sm">Last updated: July 1, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          {/* 1. Acceptance of Terms */}
          <section>
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground mt-2">
              By accessing or using {BRANDING.APP_NAME} (&quot;Platform&quot;), a product of{' '}
              <strong>{BRANDING.LEGAL_ENTITY_NAME}</strong> (&quot;Company&quot;, &quot;We&quot;,
              &quot;Us&quot;), you (&quot;User&quot;, &quot;You&quot;) agree to be bound by these
              Terms &amp; Conditions. If you are using the Platform on behalf of an educational
              institution, you represent that you have the authority to bind that institution to
              these terms.
            </p>
            <p className="text-muted-foreground mt-2">
              If you do not agree to these terms, please do not access or use our services.
            </p>
          </section>

          {/* 2. Definitions */}
          <section>
            <h2 className="text-xl font-semibold">2. Definitions</h2>
            <ul className="text-muted-foreground mt-2 list-disc space-y-2 pl-6">
              <li>
                <strong>&quot;Platform&quot;</strong> — The {BRANDING.APP_NAME} web application,
                mobile applications, APIs, and all related services.
              </li>
              <li>
                <strong>&quot;Institution&quot;</strong> — Any school, college, or educational
                organization that registers an account on the Platform.
              </li>
              <li>
                <strong>&quot;Administrator&quot;</strong> — An authorized person managing an
                Institution&apos;s account on the Platform.
              </li>
              <li>
                <strong>&quot;End User&quot;</strong> — Teachers, parents, students, or staff who
                access the Platform through an Institution&apos;s account.
              </li>
              <li>
                <strong>&quot;Content&quot;</strong> — Any data, text, records, or materials
                uploaded or entered into the Platform by Users.
              </li>
            </ul>
          </section>

          {/* 3. Description of Service */}
          <section>
            <h2 className="text-xl font-semibold">3. Description of Service</h2>
            <p className="text-muted-foreground mt-2">
              {BRANDING.APP_NAME} is a multi-tenant school management platform that provides tools
              for:
            </p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>Student enrollment and records management</li>
              <li>Attendance tracking with automated notifications</li>
              <li>Fee management and payment tracking</li>
              <li>Leave management with approval workflows</li>
              <li>Exam and marks management</li>
              <li>Homework assignment and submission tracking</li>
              <li>Timetable management</li>
              <li>Communication between institutions, teachers, and parents</li>
              <li>Holiday calendar and academic year management</li>
            </ul>
          </section>

          {/* 4. User Accounts & Registration */}
          <section>
            <h2 className="text-xl font-semibold">4. User Accounts &amp; Registration</h2>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>
                You must provide accurate, current, and complete information during registration
              </li>
              <li>
                You are responsible for maintaining the confidentiality of your account credentials
              </li>
              <li>You must notify us immediately of any unauthorized access to your account</li>
              <li>One organization account per institution is permitted</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>We reserve the right to suspend accounts that violate these terms</li>
            </ul>
          </section>

          {/* 5. Institution Responsibilities */}
          <section>
            <h2 className="text-xl font-semibold">5. Institution Responsibilities</h2>
            <p className="text-muted-foreground mt-2">Institutions using the Platform agree to:</p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>Obtain necessary consents from parents/guardians before entering student data</li>
              <li>Ensure accuracy of all data entered into the platform</li>
              <li>Manage user access and permissions appropriately within their organization</li>
              <li>Comply with applicable data protection and education regulations</li>
              <li>
                Not use the platform for any purpose other than educational institution management
              </li>
              <li>Safeguard login credentials provided to staff, teachers, and parents</li>
            </ul>
          </section>

          {/* 6. User Responsibilities */}
          <section>
            <h2 className="text-xl font-semibold">6. User Responsibilities</h2>
            <p className="text-muted-foreground mt-2">All users agree to:</p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>Use the platform only for its intended educational management purposes</li>
              <li>Keep login credentials secure and not share them with unauthorized persons</li>
              <li>Report any security vulnerabilities or unauthorized access promptly</li>
              <li>Respect the privacy of other users on the platform</li>
              <li>Comply with their Institution&apos;s policies regarding platform use</li>
            </ul>
          </section>

          {/* 7. Prohibited Activities */}
          <section>
            <h2 className="text-xl font-semibold">7. Prohibited Activities</h2>
            <p className="text-muted-foreground mt-2">You agree NOT to:</p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>Use the service for any unlawful or fraudulent purpose</li>
              <li>Upload false, misleading, or harmful information</li>
              <li>Attempt to gain unauthorized access to other accounts or systems</li>
              <li>Interfere with, disrupt, or overload the service or its servers</li>
              <li>Reverse engineer, decompile, or attempt to extract source code</li>
              <li>Use automated scripts, bots, or scrapers to access the platform</li>
              <li>Transmit viruses, malware, or any destructive code</li>
              <li>
                Resell, sublicense, or commercially exploit the platform without authorization
              </li>
              <li>Harvest or collect personal information of other users without consent</li>
            </ul>
          </section>

          {/* 8. Intellectual Property */}
          <section>
            <h2 className="text-xl font-semibold">8. Intellectual Property</h2>
            <p className="text-muted-foreground mt-2">
              The Platform, including its design, code, features, logos, and documentation, is the
              intellectual property of {BRANDING.LEGAL_ENTITY_NAME} and is protected by applicable
              copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-muted-foreground mt-2">
              You are granted a limited, non-exclusive, non-transferable license to use the Platform
              for its intended purpose. This license does not include the right to modify,
              distribute, or create derivative works from the Platform.
            </p>
          </section>

          {/* 9. Data Ownership */}
          <section>
            <h2 className="text-xl font-semibold">9. Data Ownership</h2>
            <p className="text-muted-foreground mt-2">
              All data entered by an Institution remains the property of that Institution.{' '}
              {BRANDING.LEGAL_ENTITY_NAME} does not claim ownership over any user content or
              institutional data stored on the Platform. We act as a data processor on behalf of the
              Institution (data controller).
            </p>
            <p className="text-muted-foreground mt-2">
              Institutions may request export of their data at any time. Upon account termination,
              data will be retained for a reasonable period to allow export, after which it will be
              permanently deleted.
            </p>
          </section>

          {/* 10. Service Availability */}
          <section>
            <h2 className="text-xl font-semibold">10. Service Availability</h2>
            <p className="text-muted-foreground mt-2">
              We strive to maintain high availability of the Platform but do not guarantee
              uninterrupted, error-free access. The service may be temporarily unavailable due to:
            </p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>Scheduled maintenance (communicated in advance when possible)</li>
              <li>Emergency security patches or critical updates</li>
              <li>Circumstances beyond our reasonable control (force majeure)</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              We will make reasonable efforts to minimize disruption and communicate planned
              downtime to affected users.
            </p>
          </section>

          {/* 11. Payment Terms */}
          <section>
            <h2 className="text-xl font-semibold">11. Payment Terms</h2>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>Subscription fees (if applicable) are billed according to the selected plan</li>
              <li>All fees are quoted in Indian Rupees (INR) unless otherwise stated</li>
              <li>Payment is due as per the billing cycle agreed upon during registration</li>
              <li>Failure to pay within the grace period may result in service suspension</li>
              <li>
                Refunds are processed as per our refund policy communicated at the time of purchase
              </li>
              <li>We reserve the right to modify pricing with 30 days advance notice</li>
            </ul>
          </section>

          {/* 12. Termination */}
          <section>
            <h2 className="text-xl font-semibold">12. Termination</h2>
            <p className="text-muted-foreground mt-2">
              <strong>By You:</strong> You may terminate your account at any time by contacting us
              at {BRANDING.CONTACT.EMAIL}. We recommend exporting your data before requesting
              account closure.
            </p>
            <p className="text-muted-foreground mt-2">
              <strong>By Us:</strong> We may terminate or suspend access to our service immediately,
              without prior notice, for:
            </p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>Breach of these Terms &amp; Conditions</li>
              <li>Non-payment of fees beyond the grace period</li>
              <li>Fraudulent or illegal activities</li>
              <li>Actions that harm other users or the Platform</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Upon termination, your right to use the service will cease. Data will be retained for
              30 days to allow export, after which it will be permanently deleted.
            </p>
          </section>

          {/* 13. Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold">13. Limitation of Liability</h2>
            <p className="text-muted-foreground mt-2">
              To the maximum extent permitted by applicable law:
            </p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>
                {BRANDING.LEGAL_ENTITY_NAME} shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages arising from your use of or inability to
                use the Platform.
              </li>
              <li>
                We are not liable for any loss of data caused by factors beyond our reasonable
                control, including but not limited to hardware failures, natural disasters, or
                third-party service outages.
              </li>
              <li>
                Our total liability for any claims under these terms shall not exceed the amount
                paid by you (if any) in the 12 months preceding the claim.
              </li>
            </ul>
          </section>

          {/* 14. Disclaimer of Warranties */}
          <section>
            <h2 className="text-xl font-semibold">14. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground mt-2">
              The Platform is provided &quot;as is&quot; and &quot;as available&quot; without
              warranties of any kind, either express or implied, including but not limited to
              implied warranties of merchantability, fitness for a particular purpose, and
              non-infringement. We do not warrant that the service will be uninterrupted, secure, or
              error-free.
            </p>
          </section>

          {/* 15. Indemnification */}
          <section>
            <h2 className="text-xl font-semibold">15. Indemnification</h2>
            <p className="text-muted-foreground mt-2">
              You agree to indemnify, defend, and hold harmless {BRANDING.LEGAL_ENTITY_NAME}, its
              officers, directors, employees, and agents from any claims, liabilities, damages,
              losses, or expenses arising from your use of the Platform, violation of these terms,
              or infringement of any third-party rights.
            </p>
          </section>

          {/* 16. Governing Law & Jurisdiction */}
          <section>
            <h2 className="text-xl font-semibold">16. Governing Law &amp; Jurisdiction</h2>
            <p className="text-muted-foreground mt-2">
              These Terms &amp; Conditions shall be governed by and construed in accordance with the
              laws of India. Any disputes arising out of or relating to these terms shall be subject
              to the exclusive jurisdiction of the courts located in Madanapalle, Annamayya
              District, Andhra Pradesh, India.
            </p>
          </section>

          {/* 17. Severability */}
          <section>
            <h2 className="text-xl font-semibold">17. Severability</h2>
            <p className="text-muted-foreground mt-2">
              If any provision of these terms is found to be unenforceable or invalid, that
              provision shall be limited or eliminated to the minimum extent necessary so that the
              remaining terms shall remain in full force and effect.
            </p>
          </section>

          {/* 18. Changes to Terms */}
          <section>
            <h2 className="text-xl font-semibold">18. Changes to Terms</h2>
            <p className="text-muted-foreground mt-2">
              We reserve the right to modify these Terms &amp; Conditions at any time. Material
              changes will be communicated through:
            </p>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-6">
              <li>Email notification to Institution administrators</li>
              <li>Prominent notice on the Platform</li>
              <li>Updated &quot;Last updated&quot; date on this page</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Continued use of the Platform after changes constitutes acceptance of the updated
              terms.
            </p>
          </section>

          {/* 19. Contact */}
          <section>
            <h2 className="text-xl font-semibold">19. Contact Information</h2>
            <p className="text-muted-foreground mt-2">
              For questions or concerns regarding these Terms &amp; Conditions, please contact:
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
              onClick={() => navigate('/privacy-policy')}
            >
              Privacy Policy
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
