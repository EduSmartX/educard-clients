import { Settings2 } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookSetsPanel } from '../components/setup/book-sets-panel';
import { IdCardTemplatesPanel } from '../components/setup/id-card-templates-panel';
import { ProductSettingsPanel } from '../components/setup/product-settings-panel';

export default function StoreSetupPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Store setup"
        description="School-wide product settings, ID card designs and class book lists"
        icon={Settings2}
      />

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Product settings</TabsTrigger>
          <TabsTrigger value="templates">ID card templates</TabsTrigger>
          <TabsTrigger value="books">Book sets</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="pt-4">
          <ProductSettingsPanel />
        </TabsContent>
        <TabsContent value="templates" className="pt-4">
          <IdCardTemplatesPanel />
        </TabsContent>
        <TabsContent value="books" className="pt-4">
          <BookSetsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
