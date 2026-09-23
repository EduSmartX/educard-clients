/**
 * Payment Filter Configuration
 * Filter fields for the Payments list screen — mirrors web app filters.
 */

import type { FilterField } from './FilterModal';
import type { FilterLabel } from './SharedFilterFields';

export const PAYMENT_MODE_FILTER_FIELD: FilterField = {
  name: 'payment_mode',
  label: 'Payment Mode',
  type: 'select',
  icon: '💳',
  options: [
    { value: '', label: 'All Modes' },
    { value: 'cash', label: '💵 Cash' },
    { value: 'online', label: '🌐 Online' },
    { value: 'cheque', label: '📝 Cheque' },
    { value: 'bank_transfer', label: '🏦 Bank Transfer' },
    { value: 'upi', label: '📱 UPI' },
    { value: 'dd', label: '📄 Demand Draft' },
  ],
};

export const TRANSACTION_TYPE_FILTER_FIELD: FilterField = {
  name: 'transaction_type',
  label: 'Transaction Type',
  type: 'select',
  icon: '↕️',
  options: [
    { value: '', label: 'All Types' },
    { value: 'credit', label: '⬆️ Payment (Credit)' },
    { value: 'debit', label: '⬇️ Refund (Debit)' },
  ],
};

export const PAYMENT_FILTER_FIELDS: FilterField[] = [
  PAYMENT_MODE_FILTER_FIELD,
  TRANSACTION_TYPE_FILTER_FIELD,
];

export interface PaymentFiltersState {
  payment_mode?: string;
  transaction_type?: string;
  date_from?: string;
  date_to?: string;
}

export function getPaymentFilterLabels(filters: PaymentFiltersState): FilterLabel[] {
  const result: FilterLabel[] = [];

  const modeLabels: Record<string, string> = {
    cash: 'Cash',
    online: 'Online',
    cheque: 'Cheque',
    bank_transfer: 'Bank Transfer',
    upi: 'UPI',
    dd: 'Demand Draft',
  };

  if (filters.payment_mode) {
    result.push({
      key: 'payment_mode',
      label: modeLabels[filters.payment_mode] ?? filters.payment_mode,
      value: filters.payment_mode,
    });
  }

  if (filters.transaction_type) {
    result.push({
      key: 'transaction_type',
      label: filters.transaction_type === 'credit' ? 'Payments' : 'Refunds',
      value: filters.transaction_type,
    });
  }

  if (filters.date_from) {
    result.push({
      key: 'date_from',
      label: `From: ${filters.date_from}`,
      value: filters.date_from,
    });
  }

  if (filters.date_to) {
    result.push({ key: 'date_to', label: `To: ${filters.date_to}`, value: filters.date_to });
  }

  return result;
}
