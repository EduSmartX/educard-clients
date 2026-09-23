/**
 * Leave Balances Section Component
 * Handles loading, empty, and populated states for leave balances display
 */
import { Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LeaveBalanceSummary } from '../types';
import { LeaveBalanceSummaryCards, LeaveBalanceTypeCards } from './leave-balance-cards';

interface LeaveBalancesSectionProps {
  balances: LeaveBalanceSummary[];
  isLoading: boolean;
  hasData: boolean;
}

export function LeaveBalancesSection({
  balances,
  isLoading,
  hasData,
}: Readonly<LeaveBalancesSectionProps>) {
  const showSkeleton = isLoading && !hasData;
  const showEmpty = !isLoading && balances.length === 0;
  const showContent = !showSkeleton && balances.length > 0;

  return (
    <div>
      <h2 className="text-primary mb-3 text-xl font-bold sm:mb-4 sm:text-2xl">Leave Balances</h2>
      {showSkeleton && (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {['skeleton-bal-1', 'skeleton-bal-2', 'skeleton-bal-3'].map((key) => (
            <Card key={key} className="w-full">
              <CardContent className="py-8">
                <Skeleton className="mb-2 h-10 w-24" />
                <Skeleton className="h-5 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {showEmpty && (
        <Card className="col-span-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="text-muted-foreground text-center">
              No leave balances found. Contact your administrator to set up your leave allocations.
            </p>
          </CardContent>
        </Card>
      )}
      {showContent && (
        <>
          <LeaveBalanceSummaryCards balances={balances} />
          <LeaveBalanceTypeCards balances={balances} />
        </>
      )}
    </div>
  );
}
