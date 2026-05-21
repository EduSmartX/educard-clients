/**
 * Fee Structures Page
 * Lists all fee structures with management actions
 */

import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { FeeStructureTable } from '../components/fee-structure-table';
import { useFeeStructures } from '../../hooks/use-fee-queries';
import { FEE_UI_TEXT } from '@educard/shared';
import { ROUTES } from '@/constants/app-config';
import { PageHeader } from '@/components/common';

export function FeeStructuresPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useFeeStructures();

  return (
    <div className="space-y-6">
      <PageHeader
        title={FEE_UI_TEXT.PAGE_TITLES.STRUCTURES}
        description="Manage fee structures for different classes and academic years"
        actions={[
          {
            label: FEE_UI_TEXT.BUTTONS.CREATE,
            onClick: () => navigate(ROUTES.FEES.STRUCTURES_NEW),
            variant: 'default' as const,
            icon: Plus,
          },
        ]}
      />

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Fee Structures</CardTitle>
        </CardHeader>
        <CardContent>
          <FeeStructureTable data={data?.data ?? []} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
