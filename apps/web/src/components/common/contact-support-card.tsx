/**
 * ContactSupportCard — shared "Help & Support" card shown on the dashboards.
 * Company name, support email/phone, and a user-manual download all come from the
 * backend app-info endpoint (no hardcoding). Renders nothing until there's data.
 */

import { HelpCircle, Mail, Phone, FileDown } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppInfo } from '@/hooks/use-app-info';

interface ContactSupportCardProps {
  className?: string;
}

export function ContactSupportCard({ className }: Readonly<ContactSupportCardProps>) {
  const { data: appInfo } = useAppInfo();

  const email = appInfo?.support_email;
  const phone = appInfo?.support_phone;
  const manualUrl = appInfo?.user_manual_url || appInfo?.website_url;

  if (!email && !phone && !manualUrl) {
    return null;
  }

  const rowClass =
    'flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-sm transition-colors hover:border-border hover:bg-muted/50';

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <HelpCircle className="h-4 w-4 text-teal-600" />
          Help &amp; Support
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {email && (
          <a href={`mailto:${email}`} className={rowClass}>
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
              <Mail className="h-4 w-4" />
            </span>
            <span className="flex flex-col">
              <span className="text-muted-foreground text-xs">Email Support</span>
              <span className="font-medium">{email}</span>
            </span>
          </a>
        )}

        {phone && (
          <a href={`tel:${phone.replace(/\s/g, '')}`} className={rowClass}>
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-green-50 text-green-600">
              <Phone className="h-4 w-4" />
            </span>
            <span className="flex flex-col">
              <span className="text-muted-foreground text-xs">Phone Support</span>
              <span className="font-medium">{phone}</span>
            </span>
          </a>
        )}

        {manualUrl && (
          <a href={manualUrl} target="_blank" rel="noopener noreferrer" className={rowClass}>
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-50 text-amber-600">
              <FileDown className="h-4 w-4" />
            </span>
            <span className="flex flex-col">
              <span className="text-muted-foreground text-xs">User Manual</span>
              <span className="font-medium">Download user guide</span>
            </span>
          </a>
        )}
      </CardContent>
    </Card>
  );
}
