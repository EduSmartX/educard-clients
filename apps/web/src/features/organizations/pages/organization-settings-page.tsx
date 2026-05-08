/**
 * Organization Settings Page
 * Manage organization information and address
 */

import { useState } from 'react';
import { Building2, MapPin } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/common';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '../hooks/queries';
import { OrganizationInfoForm } from '../components/organization-info-form';
import { OrganizationAddressForm } from '../components/organization-address-form';

export default function OrganizationSettingsPage() {
  const [activeTab, setActiveTab] = useState('info');
  const { organization: orgFromStorage } = useAuth();
  const { data: organization, isLoading } = useOrganization(orgFromStorage?.public_id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Settings"
        description="Manage your organization information and address details"
      />

      <Card className="overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-gray-50">
            <TabsTrigger
              value="info"
              className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-teal-600"
            >
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Organization Info</span>
              <span className="sm:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger
              value="address"
              className="flex items-center gap-2 data-[state=active]:border-b-2 data-[state=active]:border-teal-600"
            >
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Address</span>
              <span className="sm:hidden">Address</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-0">
            <OrganizationInfoForm organization={organization} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="address" className="mt-0">
            <OrganizationAddressForm organization={organization} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
