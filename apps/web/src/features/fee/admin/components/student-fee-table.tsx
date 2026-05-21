/**
 * Student Fee Table Component
 * Displays student fees using the reusable DataTable component
 */

import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/app-config';
import { DataTable, type Column, type PaginationInfo } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, CreditCard, Bell } from 'lucide-react';
import { FeeStatusBadge } from '../../components/fee-status-badge';
import { FeeAmount, FeeProgress } from '../../components/fee-amount';
import { type StudentFee, FeeStatus } from '@educard/shared';

interface StudentFeeTableProps {
  data: StudentFee[];
  isLoading?: boolean;
  onSendReminder?: (studentFee: StudentFee) => void;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function StudentFeeTable({
  data,
  isLoading,
  onSendReminder,
  pagination,
  onPageChange,
  onPageSizeChange,
}: StudentFeeTableProps) {
  const navigate = useNavigate();

  const columns: Column<StudentFee>[] = [
    {
      header: 'Student',
      accessor: (row) => (
        <div>
          <div className="font-medium">{row.student_name}</div>
          <div className="text-muted-foreground text-sm">{row.student_roll_number || '-'}</div>
        </div>
      ),
      sortable: true,
      sortKey: 'student_name',
      width: 180,
    },
    {
      header: 'Class',
      accessor: (row) => <Badge variant="outline">{row.class_name}</Badge>,
      width: 120,
    },
    {
      header: 'Fee Structure',
      accessor: (row) => (
        <div>
          <div className="font-medium">{row.fee_structure_name}</div>
          {row.academic_year && (
            <div className="text-muted-foreground text-sm">{row.academic_year}</div>
          )}
        </div>
      ),
      width: 160,
    },
    {
      header: 'Total',
      accessor: (row) => <FeeAmount amount={row.final_amount} />,
      sortable: true,
      sortKey: 'final_amount',
      className: 'text-right',
      headerClassName: 'text-right',
      width: 120,
    },
    {
      header: 'Paid',
      accessor: (row) => <FeeAmount amount={row.amount_paid} />,
      className: 'text-right',
      headerClassName: 'text-right',
      width: 100,
    },
    {
      header: 'Balance',
      accessor: (row) => <FeeAmount amount={row.balance_due} colorCode={true} />,
      className: 'text-right',
      headerClassName: 'text-right',
      width: 120,
    },
    {
      header: 'Progress',
      accessor: (row) => (
        <div className="w-28">
          <FeeProgress
            amountPaid={row.amount_paid}
            totalAmount={row.final_amount}
            paidPercentage={row.paid_percentage ?? 0}
            showLabels={false}
          />
        </div>
      ),
      width: 140,
    },
    {
      header: 'Status',
      accessor: (row) => <FeeStatusBadge status={row.status} />,
      width: 100,
    },
    {
      header: 'Due Date',
      accessor: (row) => {
        if (!row.due_date) {
          return '-';
        }
        return new Date(row.due_date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      },
      sortable: true,
      sortKey: 'due_date',
      width: 120,
    },
    {
      header: 'Actions',
      accessor: (row) => {
        const canRecordPayment = row.status !== FeeStatus.PAID;
        const canSendReminder = row.status !== FeeStatus.PAID;

        return (
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/fees/students/${row.public_id}`);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View Details</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {canRecordPayment && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(ROUTES.FEES.PAYMENT_NEW_FOR_STUDENT.replace(':id', row.public_id));
                      }}
                    >
                      <CreditCard className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Record Payment</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {canSendReminder && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSendReminder?.(row);
                      }}
                    >
                      <Bell className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Send Reminder</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
      width: 130,
    },
  ];

  return (
    <DataTable<StudentFee>
      columns={columns}
      data={data}
      isLoading={isLoading}
      emptyMessage="No fee records found."
      getRowKey={(row) => row.public_id}
      onRowClick={(row) => navigate(`/fees/students/${row.public_id}`)}
      pagination={pagination}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  );
}
