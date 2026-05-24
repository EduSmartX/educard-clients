/**
 * Fee Structures Page
 * Lists all fee structures with management actions
 */

import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Plus, Search, Filter, X } from 'lucide-react';
import { FeeStructureTable } from '../components/fee-structure-table';
import { useFeeStructures } from '../../hooks/use-fee-queries';
import { FEE_UI_TEXT } from '@educard/shared';
import { ROUTES } from '@/constants/app-config';
import { PageHeader } from '@/components/common';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { cn } from '@/lib/utils';

export function FeeStructuresPage() {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn('gap-2', showFilters && 'bg-accent')}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-primary text-primary-foreground ml-1 rounded-full px-2 py-0.5 text-xs">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
                {hasActiveFilters && (
                  <Button variant="ghost" size="icon" onClick={clearFilters}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Class</label>
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
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
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
                </div>
              </div>
            )}
          </div>

          <FeeStructureTable data={filteredStructures} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
