/**
 * Payments Page
 * Lists all fee payments with filtering
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { DatePicker } from '@/components/ui/date-picker';
import { Download, Filter, X, CreditCard, IndianRupee, Plus, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/app-config';
import { PageHeader } from '@/components/common';
import { PaymentHistoryTable } from '../components/payment-history-table';
import { usePayments } from '../../hooks/use-fee-queries';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useStudents } from '@/features/students/hooks/use-students';
import { type PaymentModeType, PAYMENT_MODE_OPTIONS } from '@educard/shared';

// Format currency with Indian abbreviations: K, L, Cr
const formatCurrency = (amount: number | string | undefined) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  }
  if (num >= 1000) {
    return `₹${(num / 1000).toFixed(1)} K`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

export function PaymentsPage() {
  const navigate = useNavigate();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [studentFilter, setStudentFilter] = useState<string>('all');
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Data for filter dropdowns
  const { data: classesData } = useClasses();
  const { data: studentsData } = useStudents(
    classFilter !== 'all'
      ? { class_assigned__public_id: classFilter, page_size: 1000, embed_images: false }
      : undefined
  );

  // Query — pass filters to API
  const { data: paymentsData, isLoading } = usePayments({
    search: searchQuery || undefined,
    class_public_id: classFilter !== 'all' ? classFilter : undefined,
    student_public_id: studentFilter !== 'all' ? studentFilter : undefined,
    payment_mode: paymentModeFilter !== 'all' ? (paymentModeFilter as PaymentModeType) : undefined,
    date_from: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
    date_to: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
    page: currentPage,
    page_size: pageSize,
  });

  const handleExport = () => {
    // TODO: Implement export
  };

  const handleDownloadReceipt = (_paymentId: string) => {
    // TODO: Implement receipt download
  };

  const clearFilters = () => {
    setSearchQuery('');
    setClassFilter('all');
    setStudentFilter('all');
    setPaymentModeFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentPage(1);
  };

  // When class changes, reset student filter and page
  const handleClassChange = (val: string) => {
    setClassFilter(val);
    setStudentFilter('all');
    setCurrentPage(1);
  };

  // Reset to page 1 when any filter changes
  const handleFilterChange = (setter: (v: string) => void) => (val: string) => {
    setter(val);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    !!searchQuery ||
    classFilter !== 'all' ||
    studentFilter !== 'all' ||
    paymentModeFilter !== 'all' ||
    !!startDate ||
    !!endDate;
  const activeFilterCount = [
    !!searchQuery,
    classFilter !== 'all',
    studentFilter !== 'all',
    paymentModeFilter !== 'all',
    !!startDate,
    !!endDate,
  ].filter(Boolean).length;

  const classesArray = classesData?.data ?? [];
  const studentsArray = studentsData?.data ?? [];

  // Calculate totals from payments — credits add, debits (refunds) subtract
  const paymentsArray = paymentsData?.data ?? [];
  const totalGrossCollected = paymentsArray
    .filter((p) => p.transaction_type !== 'debit')
    .reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0);
  const totalRefunded = paymentsArray
    .filter((p) => p.transaction_type === 'debit')
    .reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0);
  const totalCollected = totalGrossCollected - totalRefunded; // net
  const paymentCount = paymentsData?.pagination?.count ?? paymentsArray.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="View payment history and download receipts"
        actions={[
          {
            label: 'Record Payment',
            onClick: () => navigate(ROUTES.FEES.PAYMENT_NEW),
            variant: 'default' as const,
            icon: Plus,
            className: 'bg-green-600 hover:bg-green-700',
          },
          {
            label: 'Export',
            onClick: handleExport,
            variant: 'outline' as const,
            icon: Download,
          },
        ]}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Gross Collected */}
        <Card className="border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-100">Gross Collected</p>
                <p className="mt-1 text-3xl font-bold">{formatCurrency(totalGrossCollected)}</p>
                <p className="mt-1 text-xs text-emerald-200">All credit payments</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <IndianRupee className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Refunded */}
        <Card className="border-0 bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-100">Total Refunded</p>
                <p className="mt-1 text-3xl font-bold">{formatCurrency(totalRefunded)}</p>
                <p className="mt-1 text-xs text-orange-200">Refund payouts</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <IndianRupee className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Collected */}
        <Card className="border-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-violet-100">Net Collected</p>
                <p className="mt-1 text-3xl font-bold">{formatCurrency(totalCollected)}</p>
                <p className="mt-1 text-xs text-violet-200">Gross − Refunds</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <IndianRupee className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Transactions */}
        <Card className="border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">Total Transactions</p>
                <p className="mt-1 text-3xl font-bold">{paymentCount}</p>
                <p className="mt-1 text-xs text-blue-200">All payment records</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search + toggle row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search by student name..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
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
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                    <X className="h-4 w-4" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="grid gap-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Class Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Class</label>
                  <SearchableSelect
                    options={[
                      { value: 'all', label: 'All Classes' },
                      ...classesArray.map((cls) => {
                        const label =
                          cls.display_name ||
                          (cls.class_master?.name
                            ? `${cls.class_master.name} - ${cls.name}`
                            : cls.name);
                        return { value: cls.public_id, label };
                      }),
                    ]}
                    value={classFilter}
                    onValueChange={handleClassChange}
                    placeholder="All Classes"
                    searchPlaceholder="Search class..."
                  />
                </div>

                {/* Student Filter — only populated when class is selected */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Student</label>
                  <SearchableSelect
                    options={[
                      {
                        value: 'all',
                        label: classFilter === 'all' ? 'Select a class first' : 'All Students',
                      },
                      ...studentsArray.map((s) => ({
                        value: s.public_id,
                        label: s.full_name,
                      })),
                    ]}
                    value={studentFilter}
                    onValueChange={handleFilterChange(setStudentFilter)}
                    placeholder={classFilter === 'all' ? 'Select a class first' : 'All Students'}
                    searchPlaceholder="Search student..."
                    disabled={classFilter === 'all'}
                  />
                </div>

                {/* Payment Mode Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Mode</label>
                  <SearchableSelect
                    options={[
                      { value: 'all', label: 'All Modes' },
                      ...PAYMENT_MODE_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                      })),
                    ]}
                    value={paymentModeFilter}
                    onValueChange={handleFilterChange(setPaymentModeFilter)}
                    placeholder="All Modes"
                  />
                </div>

                {/* From Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Date</label>
                  <DatePicker
                    value={startDate ?? null}
                    onChange={(date) => setStartDate(date ?? undefined)}
                    maxDate={endDate}
                    placeholder="Pick a date"
                  />
                </div>

                {/* To Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">To Date</label>
                  <DatePicker
                    value={endDate ?? null}
                    onChange={(date) => setEndDate(date ?? undefined)}
                    minDate={startDate}
                    placeholder="Pick a date"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">
            Payment History ({paymentsData?.pagination?.count ?? paymentsArray.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentHistoryTable
            data={paymentsArray}
            isLoading={isLoading}
            onDownloadReceipt={handleDownloadReceipt}
            pagination={
              paymentsData?.pagination
                ? {
                    current_page: currentPage,
                    page_size: pageSize,
                    count: paymentsData.pagination.count,
                    total_pages:
                      paymentsData.pagination.total_pages ??
                      Math.ceil(paymentsData.pagination.count / pageSize),
                    has_next: currentPage < (paymentsData.pagination.total_pages ?? 1),
                    has_previous: currentPage > 1,
                    next_page:
                      currentPage < (paymentsData.pagination.total_pages ?? 1)
                        ? currentPage + 1
                        : null,
                    previous_page: currentPage > 1 ? currentPage - 1 : null,
                  }
                : undefined
            }
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
