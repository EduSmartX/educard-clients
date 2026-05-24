/**
 * Fee Amount Display Component
 * Formats and displays fee amounts with currency
 */

import { cn } from '@/lib/utils';

interface FeeAmountProps {
  amount: number;
  currency?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSign?: boolean;
  colorCode?: boolean;
}

const sizeStyles = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg font-semibold',
};

export function FeeAmount({
  amount,
  currency = '₹',
  className,
  size = 'md',
  showSign = false,
  colorCode = false,
}: FeeAmountProps) {
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  let sign = '';
  if (amount < 0) {
    sign = '-';
  } else if (amount > 0 && showSign) {
    sign = '+';
  }
  let colorClass = '';
  if (colorCode) {
    if (amount < 0) {
      colorClass = 'text-red-600';
    } else if (amount > 0) {
      colorClass = 'text-green-600';
    } else {
      colorClass = 'text-gray-600';
    }
  }

  return (
    <span className={cn(sizeStyles[size], colorClass, className)}>
      {sign}
      {currency}
      {formattedAmount}
    </span>
  );
}

/**
 * Fee Balance Display - Shows balance with color coding
 */
interface FeeBalanceProps {
  balanceDue: number;
  className?: string;
}

export function FeeBalance({ balanceDue, className }: FeeBalanceProps) {
  const isPaid = balanceDue <= 0;

  return (
    <span className={cn('font-medium', isPaid ? 'text-green-600' : 'text-red-600', className)}>
      {isPaid ? (
        'Fully Paid'
      ) : (
        <>
          <FeeAmount amount={balanceDue} /> due
        </>
      )}
    </span>
  );
}

/**
 * Fee Progress Display - Shows payment progress
 */
interface FeeProgressProps {
  amountPaid: number;
  totalAmount: number;
  paidPercentage: number;
  className?: string;
  showLabels?: boolean;
}

export function FeeProgress({
  amountPaid,
  totalAmount,
  paidPercentage,
  className,
  showLabels = true,
}: FeeProgressProps) {
  const progressColor =
    paidPercentage >= 100
      ? 'bg-green-500'
      : paidPercentage >= 50
        ? 'bg-blue-500'
        : paidPercentage > 0
          ? 'bg-amber-500'
          : 'bg-gray-300';

  return (
    <div className={cn('space-y-1', className)}>
      {showLabels && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            <FeeAmount amount={amountPaid} /> paid
          </span>
          <span className="font-medium">{paidPercentage.toFixed(1)}%</span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className={cn('h-full rounded-full transition-all', progressColor)}
          style={{ width: `${Math.min(paidPercentage, 100)}%` }}
        />
      </div>
      {showLabels && (
        <div className="text-muted-foreground text-right text-xs">
          of <FeeAmount amount={totalAmount} />
        </div>
      )}
    </div>
  );
}
