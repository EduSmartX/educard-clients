import { GraduationCap, ArrowLeft, Mail, Phone, MapPin, Globe } from 'lucide-react';
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
        <p className="text-muted-foreground mb-10 text-base">
          Have questions about {BRANDING.APP_NAME}? We&apos;d love to hear from you.
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Company Info */}
          <div className="space-y-6">
            <div>
              <h2 className="mb-4 text-xl font-semibold">{BRANDING.LEGAL_ENTITY_NAME}</h2>
              <p className="text-muted-foreground">
                A unified platform connecting students, educators, and parents through intelligent
                tools for learning, communication, and administration.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="text-primary mt-0.5 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a
                    href={`mailto:${BRANDING.CONTACT.EMAIL}`}
                    className="text-primary text-sm hover:underline"
                  >
                    {BRANDING.CONTACT.EMAIL}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="text-primary mt-0.5 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-muted-foreground text-sm">{BRANDING.CONTACT.PHONE}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Globe className="text-primary mt-0.5 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Website</p>
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

              <div className="flex items-start gap-3">
                <MapPin className="text-primary mt-0.5 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-muted-foreground text-sm">{BRANDING.CONTACT.ADDRESS}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Support Info */}
          <div className="rounded-xl border bg-slate-50 p-6">
            <h3 className="mb-4 text-lg font-semibold">Get Support</h3>
            <div className="space-y-4">
              <div className="rounded-lg border bg-white p-4">
                <h4 className="font-medium">General Inquiries</h4>
                <p className="text-muted-foreground mt-1 text-sm">
                  For general questions about our platform, pricing, or features.
                </p>
                <a
                  href={`mailto:${BRANDING.CONTACT.EMAIL}`}
                  className="text-primary mt-2 inline-block text-sm hover:underline"
                >
                  {BRANDING.CONTACT.EMAIL}
                </a>
              </div>

              <div className="rounded-lg border bg-white p-4">
                <h4 className="font-medium">Technical Support</h4>
                <p className="text-muted-foreground mt-1 text-sm">
                  For technical issues, bugs, or help with using the platform.
                </p>
                <a
                  href={`mailto:${BRANDING.CONTACT.EMAIL}`}
                  className="text-primary mt-2 inline-block text-sm hover:underline"
                >
                  {BRANDING.CONTACT.EMAIL}
                </a>
              </div>

              <div className="rounded-lg border bg-white p-4">
                <h4 className="font-medium">Partnership & Sales</h4>
                <p className="text-muted-foreground mt-1 text-sm">
                  Interested in partnering with us or need a demo?
                </p>
                <a
                  href={`mailto:${BRANDING.CONTACT.EMAIL}`}
                  className="text-primary mt-2 inline-block text-sm hover:underline"
                >
                  {BRANDING.CONTACT.EMAIL}
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-6 text-center lg:px-16">
        <p className="text-muted-foreground text-sm">{BRANDING.COPYRIGHT.TEXT}</p>
      </footer>
    </div>
  );
}
