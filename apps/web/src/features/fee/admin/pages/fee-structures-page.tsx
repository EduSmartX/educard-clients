/**
 * Fee Structures Page
 * Lists all fee structures with management actions
 */

import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Plus, Search, Filter, X } from 'lucide-react';
import { FeeStructureTable } from '../components/fee-structure-table';
import { useFeeStructures } from '../../hooks/use-fee-queries';
import { FEE_UI_TEXT } from '@educard/shared';
import { ROUTES } from '@/constants/app-config';
import { useFilterParams } from '@/hooks/use-filter-params';
import { PageHeader } from '@/components/common';
import { useClasses } from '@/features/classes/hooks/use-classes';

export function FeeStructuresPage() {
  const navigate = useNavigate();
  const {
    filters,
    search: searchQuery,
    setFilter,
    setSearch: setSearchQuery,
  } = useFilterParams({ class: 'all', status: 'all' });
  const classFilter = filters.class;
  const statusFilter = filters.status;
  const setClassFilter = (v: string) => setFilter('class', v);
  const setStatusFilter = (v: string) => setFilter('status', v);

  let isActiveFilter: boolean | undefined;
  if (statusFilter === 'active') {
    isActiveFilter = true;
  } else if (statusFilter === 'inactive') {
    isActiveFilter = false;
  }

  const { data: classesData } = useClasses();
  const { data, isLoading } = useFeeStructures({
    class_public_id: classFilter !== 'all' ? classFilter : undefined,
    is_active: isActiveFilter,
  });

  const structures = data?.data ?? [];
  const filteredStructures = searchQuery
    ? structures.filter(
        (row) =>
          row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          row.academic_year.toLowerCase().includes(searchQuery.toLowerCase()) ||
          row.class_names.some((cls) => cls.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : structures;

  const hasActiveFilters = classFilter !== 'all' || statusFilter !== 'all';
  const activeFilterCount = [classFilter !== 'all', statusFilter !== 'all'].filter(Boolean).length;

  const classesArray = classesData?.data || [];

  const clearFilters = () => {
    setClassFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={FEE_UI_TEXT.PAGE_TITLES.STRUCTURES}
        description="Manage fee structures for different classes and academic years"
        actions={[
          {
            label: FEE_UI_TEXT.BUTTONS.CREATE,
            onClick: () => navigate(ROUTES.FEES.STRUCTURES_NEW),
            variant: 'brand' as const,
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
          <div className="mb-4 flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search by name, class, academic year..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
                    <Filter className="h-3.5 w-3.5" />
                    {activeFilterCount} active
                  </span>
                )}
                {hasActiveFilters && (
                  <Button variant="ghost" size="icon" onClick={clearFilters}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Class</span>
                <SearchableSelect
                  options={[
                    { value: 'all', label: 'All Classes' },
                    ...classesArray.map((cls) => ({
                      value: cls.public_id,
                      label:
                        cls.display_name ||
                        (cls.class_master?.name
                          ? `${cls.class_master.name} - ${cls.name}`
                          : cls.name),
                    })),
                  ]}
                  value={classFilter}
                  onValueChange={setClassFilter}
                  placeholder="All Classes"
                  searchPlaceholder="Search classes..."
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium">Status</span>
                <SearchableSelect
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                  ]}
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  placeholder="All Status"
                  searchPlaceholder="Search status..."
                />
              </label>
            </div>
          </div>

          <FeeStructureTable data={filteredStructures} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
