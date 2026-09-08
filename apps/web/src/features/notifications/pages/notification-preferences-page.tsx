import { BellRing } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { NotificationPreferencesPanel } from '../components/notification-preferences-panel';

export default function NotificationPreferencesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification settings"
        description="Choose what reaches your in-app inbox and your mobile device."
        icon={BellRing}
      />
      <NotificationPreferencesPanel />
    </div>
  );
}
