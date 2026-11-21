import { Settings2 } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookSetsPanel } from '../components/setup/book-sets-panel';
import { IdCardTemplatesPanel } from '../components/setup/id-card-templates-panel';
import { ProductSettingsPanel } from '../components/setup/product-settings-panel';

/** Same light-blue selected state as the catalog's category filter. */
const SELECTED_TAB_CLASS =
  'data-[state=active]:bg-sky-100 data-[state=active]:text-sky-800 data-[state=active]:shadow-none';

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
          <TabsTrigger value="products" className={SELECTED_TAB_CLASS}>
            Product settings
          </TabsTrigger>
          <TabsTrigger value="templates" className={SELECTED_TAB_CLASS}>
            ID card templates
          </TabsTrigger>
          <TabsTrigger value="books" className={SELECTED_TAB_CLASS}>
            Book sets
          </TabsTrigger>
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
