import { PageHeader } from '@/components/common';
import { OrganizationPreferencesTabbed } from '../components/organization-preferences-tabbed';

export default function PreferencesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Preferences"
        description="Configure organization-wide settings and preferences"
      />
      <OrganizationPreferencesTabbed />
    </div>
  );
}
