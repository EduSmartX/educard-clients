/**
 * Leave Balance Cards Components
 * Displays leave balance summary totals and per-type breakdown cards
 */
import type { LeaveBalanceSummary } from '../types';
import { getLeaveTypeName } from '../utils/leave-name-helper';

// Card style palette for balance cards
const CARD_STYLES = [
  { border: 'border-green-300', bg: 'bg-green-50', text: 'text-green-700' },
  { border: 'border-blue-300', bg: 'bg-blue-50', text: 'text-blue-700' },
  { border: 'border-purple-300', bg: 'bg-purple-50', text: 'text-purple-700' },
  { border: 'border-orange-300', bg: 'bg-orange-50', text: 'text-orange-700' },
  { border: 'border-green-300', bg: 'bg-green-50', text: 'text-green-700' },
];

interface LeaveBalanceCardsProps {
  balances: LeaveBalanceSummary[];
}

export function LeaveBalanceSummaryCards({ balances }: Readonly<LeaveBalanceCardsProps>) {
  const totalAvailable = balances.reduce((sum, b) => sum + (b.available || 0), 0);
  const totalUsed = balances.reduce((sum, b) => sum + (b.used || 0), 0);
  const totalPending = balances.reduce((sum, b) => sum + (b.pending || 0), 0);

  return (
    <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-green-300 bg-green-50 px-2 py-4 shadow-sm sm:px-6 sm:py-5">
        <div className="text-2xl font-extrabold text-green-700 sm:text-4xl">
          {totalAvailable.toFixed(1)}
        </div>
        <div className="mt-1 text-center text-xs font-semibold text-green-900 sm:mt-2 sm:text-sm">
          Total Available
        </div>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-red-300 bg-red-50 px-2 py-4 shadow-sm sm:px-6 sm:py-5">
        <div className="text-2xl font-extrabold text-red-700 sm:text-4xl">{totalUsed}</div>
        <div className="mt-1 text-center text-xs font-semibold text-red-900 sm:mt-2 sm:text-sm">
          Total Used
        </div>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-yellow-300 bg-yellow-50 px-2 py-4 shadow-sm sm:px-6 sm:py-5">
        <div className="text-2xl font-extrabold text-yellow-700 sm:text-4xl">{totalPending}</div>
        <div className="mt-1 text-center text-xs font-semibold text-yellow-900 sm:mt-2 sm:text-sm">
          Pending Leaves
        </div>
      </div>
    </div>
  );
}

export function LeaveBalanceTypeCards({ balances }: Readonly<LeaveBalanceCardsProps>) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {balances.map((balance, index) => {
        const total = balance.total_allocated || 0;
        const available = balance.available || 0;
        const used = balance.used || 0;
        const pending = balance.pending || 0;
        const style = CARD_STYLES[index % CARD_STYLES.length];

        return (
          <div
            key={balance.public_id}
            className={`rounded-xl border-2 ${style.border} ${style.bg} flex flex-col items-center justify-center px-3 py-4 shadow-sm transition-shadow hover:shadow-md sm:px-6 sm:py-5`}
          >
            <div className={`mb-2 text-xs font-bold sm:text-base ${style.text} text-center`}>
              {getLeaveTypeName(balance)}
            </div>
            <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
              <div className={`text-xl font-extrabold sm:text-3xl ${style.text}`}>
                {Number.parseFloat(total.toString()).toFixed(1)}
              </div>
            </div>
            <div className="flex w-full flex-col gap-1.5 text-[10px] font-semibold sm:gap-2 sm:text-xs">
              <div className="flex justify-between">
                <span className="text-gray-700">Available:</span>
                <span className="font-bold text-green-700">{available}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Used:</span>
                <span className="font-bold text-red-700">{used}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Pending:</span>
                <span className="font-bold text-yellow-700">{pending}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
