/**
 * Payment History Table Component
 * Displays payment history using the reusable DataTable component
 */

import { useNavigate } from 'react-router-dom';
import { DataTable, type Column, type PaginationInfo } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import { ROUTES } from '@/constants/app-config';
import { PaymentModeBadge } from '../../components/payment-mode-badge';
import { FeeAmount } from '../../components/fee-amount';
import { type FeePayment, TransactionType } from '@educard/shared';

interface PaymentHistoryTableProps {
  data: FeePayment[];
  isLoading?: boolean;
  onDownloadReceipt?: (paymentId: string) => void;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

// Cell renderers extracted outside parent component
function TypeCell({ row }: Readonly<{ row: FeePayment }>) {
  const isCredit = !row.transaction_type || row.transaction_type === TransactionType.CREDIT;
  return (
    <Badge
      variant="outline"
      className={
        isCredit
          ? 'gap-1 border-green-200 bg-green-50 text-green-700'
          : 'gap-1 border-red-200 bg-red-50 text-red-700'
      }
    >
      {isCredit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isCredit ? 'Credit' : 'Refund'}
    </Badge>
  );
}

function StudentCell({ row }: Readonly<{ row: FeePayment }>) {
  return (
    <div>
      <div className="font-medium">{row.student_name}</div>
      <div className="text-muted-foreground text-sm">{row.fee_structure_name ?? '-'}</div>
    </div>
  );
}

function AmountCell({ row }: Readonly<{ row: FeePayment }>) {
  const isDebit = row.transaction_type === TransactionType.DEBIT;
  return (
    <span className={isDebit ? 'font-medium text-red-600' : 'font-medium text-green-600'}>
      {isDebit ? '-' : '+'}
      <FeeAmount amount={row.amount} />
    </span>
  );
}

function RemarksCell({ row }: Readonly<{ row: FeePayment }>) {
  if (!row.remarks) {
    return <span className="text-muted-foreground">-</span>;
  }
  return (
    <span className="block max-w-[200px] truncate" title={row.remarks}>
      {row.remarks}
    </span>
  );
}

interface PaymentActionsCellProps {
  row: FeePayment;
  onRecordPayment: (studentFeeId: string) => void;
  onDownloadReceipt?: (paymentId: string) => void;
}

function PaymentActionsCell({
  row,
  onRecordPayment,
  onDownloadReceipt,
}: Readonly<PaymentActionsCellProps>) {
  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
              onClick={(e) => {
                e.stopPropagation();
                onRecordPayment(row.student_fee_public_id);
              }}
            >
              <TrendingUp className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Record Payment / Refund</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              onClick={(e) => {
                e.stopPropagation();
                onDownloadReceipt?.(row.public_id);
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download Receipt</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export function PaymentHistoryTable({
  data,
  isLoading,
  onDownloadReceipt,
  pagination,
  onPageChange,
  onPageSizeChange,
}: PaymentHistoryTableProps) {
  const navigate = useNavigate();

  const columns: Column<FeePayment>[] = [
    {
      header: 'Type',
      accessor: (row) => <TypeCell row={row} />,
      width: 100,
    },
    {
      header: 'Receipt No.',
      accessor: (row) => <span className="font-mono text-sm">{row.receipt_number || '-'}</span>,
      sortable: true,
      sortKey: 'receipt_number',
      width: 130,
    },
    {
      header: 'Student',
      accessor: (row) => <StudentCell row={row} />,
      sortable: true,
      sortKey: 'student_name',
      width: 180,
    },
    {
      header: 'Class',
      accessor: (row) => <span className="text-sm text-gray-700">{row.class_name || '-'}</span>,
      width: 120,
    },
    {
      header: 'Amount',
      accessor: (row) => <AmountCell row={row} />,
      sortable: true,
      sortKey: 'amount',
      className: 'text-right',
      headerClassName: 'text-right',
      width: 120,
    },
    {
      header: 'Mode',
      accessor: (row) => <PaymentModeBadge mode={row.payment_mode} />,
      width: 120,
    },
    {
      header: 'Transaction ID',
      accessor: (row) =>
        row.transaction_id ? (
          <span className="font-mono text-sm">{row.transaction_id}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
      width: 150,
    },
    {
      header: 'Date',
      accessor: (row) => {
        if (!row.payment_date) {
          return '-';
        }
        return new Date(row.payment_date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      },
      sortable: true,
      sortKey: 'payment_date',
      width: 120,
    },
    {
      header: 'Collected By',
      accessor: (row) => row.received_by_name || 'System',
      width: 130,
    },
    {
      header: 'Remarks',
      accessor: (row) => <RemarksCell row={row} />,
      width: 160,
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <PaymentActionsCell
          row={row}
          onRecordPayment={(id) => navigate(ROUTES.FEES.PAYMENT_NEW_FOR_STUDENT.replace(':id', id))}
          onDownloadReceipt={onDownloadReceipt}
        />
      ),
      width: 100,
    },
  ];

  return (
    <DataTable<FeePayment>
      columns={columns}
      data={data}
      isLoading={isLoading}
      emptyMessage="No payments found."
      getRowKey={(row) => row.public_id}
      pagination={pagination}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  );
}
