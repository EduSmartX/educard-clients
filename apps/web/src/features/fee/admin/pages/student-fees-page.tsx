/**
 * Student Fees Page
 * Lists all student fees with filtering and management actions
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Download, Search, Filter, X, Plus } from 'lucide-react';
import { ROUTES } from '@/constants/app-config';
import { StudentFeeTable } from '../components/student-fee-table';
import { SendReminderDialog } from '../components/send-reminder-dialog';
import { useStudentFees, useFeeStructures } from '../../hooks/use-fee-queries';
import { useSendReminder } from '../../hooks/use-fee-mutations';
import {
  type StudentFee,
  type SendReminderPayload,
  type FeeStatusType,
  type FeeStructureListItem,
  FEE_STATUS_OPTIONS,
} from '@educard/shared';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { PageHeader } from '@/components/common';
import { cn } from '@/lib/utils';

export function StudentFeesPage() {
  const navigate = useNavigate();

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [structureFilter, setStructureFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Reminder dialog state
  const [selectedStudentFee, setSelectedStudentFee] = useState<StudentFee | null>(null);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);

  // Queries
  const { data: studentFeesData, isLoading } = useStudentFees({
    status: statusFilter !== 'all' ? (statusFilter as FeeStatusType) : undefined,
    class_public_id: classFilter !== 'all' ? classFilter : undefined,
    fee_structure_public_id: structureFilter !== 'all' ? structureFilter : undefined,
    page: currentPage,
    page_size: pageSize,
  });

  const { data: classesData } = useClasses();
  const { data: structuresData } = useFeeStructures();

  // Mutations
  const sendReminderMutation = useSendReminder();

  // Get data arrays
  const classesArray = classesData?.data || [];
  const structuresArray: FeeStructureListItem[] = structuresData?.data ?? [];
  const studentFeesArray: StudentFee[] = studentFeesData?.data ?? [];
  const paginationData = studentFeesData?.pagination;

  // Client-side search filter
  const filteredFees = searchQuery
    ? studentFeesArray.filter((fee) =>
        fee.student_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : studentFeesArray;

  const totalCount = paginationData?.count ?? filteredFees.length;

  const handleSendReminder = (fee: StudentFee) => {
    setSelectedStudentFee(fee);
    setIsReminderDialogOpen(true);
  };

  const handleReminderSubmit = (_studentFeeId: string, data: SendReminderPayload) => {
    sendReminderMutation.mutate(data, {
      onSuccess: () => {
        setIsReminderDialogOpen(false);
        setSelectedStudentFee(null);
      },
    });
  };

  const handleExport = () => {
    // TODO: Implement export
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setClassFilter('all');
    setStructureFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    statusFilter !== 'all' || classFilter !== 'all' || structureFilter !== 'all';
  const activeFilterCount = [
    statusFilter !== 'all',
    classFilter !== 'all',
    structureFilter !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Fees"
        description="View and manage student fee records"
        actions={[
          {
            label: 'Record Payment',
            onClick: () => navigate(ROUTES.FEES.PAYMENT_NEW),
            variant: 'brand' as const,
            icon: Plus,
          },
          {
            label: 'Export',
            onClick: handleExport,
            variant: 'secondary' as const,
            icon: Download,
          },
        ]}
      />

      {/* Search and Filters Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search Row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search by student name..."
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

            {/* Filter Panel */}
            {showFilters && (
              <div className="grid gap-4 border-t pt-4 sm:grid-cols-3">
                <label className="block space-y-2">
                  <span className="text-sm font-medium">Status</span>
                  <SearchableSelect
                    options={[
                      { value: 'all', label: 'All Status' },
                      ...FEE_STATUS_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                      })),
                    ]}
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                    placeholder="All Status"
                    searchPlaceholder="Search status..."
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">Class</span>
                  <SearchableSelect
                    options={[
                      { value: 'all', label: 'All Classes' },
                      ...classesArray.map((cls) => {
                        let label = cls.display_name;
                        if (!label) {
                          const masterName = cls.class_master?.name;
                          if (masterName) {
                            label = `${masterName} - ${cls.name}`;
                          } else {
                            label = cls.name;
                          }
                        }
                        return { value: cls.public_id, label };
                      }),
                    ]}
                    value={classFilter}
                    onValueChange={setClassFilter}
                    placeholder="All Classes"
                    searchPlaceholder="Search classes..."
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium">Fee Structure</span>
                  <SearchableSelect
                    options={[
                      { value: 'all', label: 'All Structures' },
                      ...structuresArray.map((structure) => ({
                        value: structure.public_id,
                        label: structure.name,
                      })),
                    ]}
                    value={structureFilter}
                    onValueChange={setStructureFilter}
                    placeholder="All Structures"
                    searchPlaceholder="Search structures..."
                  />
                </label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Student Fees ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentFeeTable
            data={filteredFees}
            isLoading={isLoading}
            onSendReminder={handleSendReminder}
            pagination={paginationData}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </CardContent>
      </Card>

      {/* Reminder Dialog */}
      <SendReminderDialog
        open={isReminderDialogOpen}
        onOpenChange={setIsReminderDialogOpen}
        studentFee={selectedStudentFee}
        onSubmit={handleReminderSubmit}
        isLoading={sendReminderMutation.isPending}
      />
    </div>
  );
}
