/**
 * Payment Mode Badge Component
 * Displays payment mode with appropriate styling
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PaymentMode, PaymentModeLabels, type PaymentModeType } from '@educard/shared';
import { Banknote, Building2, CreditCard, FileText, Globe, QrCode } from 'lucide-react';

interface PaymentModeBadgeProps {
  mode: PaymentModeType;
  className?: string;
  showIcon?: boolean;
}

const modeStyles: Record<PaymentModeType, string> = {
  [PaymentMode.CASH]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  [PaymentMode.CHEQUE]: 'bg-slate-100 text-slate-800 border-slate-200',
  [PaymentMode.BANK_TRANSFER]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  [PaymentMode.UPI]: 'bg-purple-100 text-purple-800 border-purple-200',
  [PaymentMode.CARD]: 'bg-sky-100 text-sky-800 border-sky-200',
  [PaymentMode.ONLINE]: 'bg-teal-100 text-teal-800 border-teal-200',
};

const ModeIcons: Record<PaymentModeType, React.ReactNode> = {
  [PaymentMode.CASH]: <Banknote className="h-3 w-3" />,
  [PaymentMode.CHEQUE]: <FileText className="h-3 w-3" />,
  [PaymentMode.BANK_TRANSFER]: <Building2 className="h-3 w-3" />,
  [PaymentMode.UPI]: <QrCode className="h-3 w-3" />,
  [PaymentMode.CARD]: <CreditCard className="h-3 w-3" />,
  [PaymentMode.ONLINE]: <Globe className="h-3 w-3" />,
};

export function PaymentModeBadge({
  mode,
  className,
  showIcon = true,
}: Readonly<PaymentModeBadgeProps>) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 font-medium',
        modeStyles[mode] || modeStyles[PaymentMode.CASH],
        className
      )}
    >
      {showIcon && ModeIcons[mode]}
      {PaymentModeLabels[mode] || mode}
    </Badge>
  );
}
