/**
 * Fee Dashboard Page
 * Main dashboard for fee management with stats and quick actions
 * Clean, modern design focused on overview metrics
 */

import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/common';
import {
  FileText,
  Plus,
  Users,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  IndianRupee,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { PaymentHistoryTable } from '../components/payment-history-table';
import { useFeeDashboard, useRecentPayments } from '../../hooks/use-fee-queries';
import { ROUTES } from '@/constants/app-config';

// Format currency
const formatCurrency = (amount: number | string | undefined) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  } else if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  } else if (num >= 1000) {
    return `₹${(num / 1000).toFixed(1)} K`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

export function FeeDashboardPage() {
  // Queries
  const { data: dashboard } = useFeeDashboard();
  const { data: recentPaymentsData, isLoading: isPaymentsLoading } = useRecentPayments({});

  const recentPaymentsArray = recentPaymentsData?.data ?? [];
  const collectionPercentage = dashboard?.collection_percentage ?? 0;

  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Fee Dashboard"
        description="Overview of fee collection and management"
        actions={[
          {
            label: 'Fee Structures',
            onClick: () => navigate(ROUTES.FEES.STRUCTURES),
            variant: 'outline' as const,
            icon: FileText,
          },
          {
            label: 'New Structure',
            onClick: () => navigate(ROUTES.FEES.STRUCTURES_NEW),
            variant: 'default' as const,
            icon: Plus,
          },
        ]}
      />

      {/* Main Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Collection */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-100">Total Collected</p>
                <p className="mt-2 text-3xl font-bold">
                  {formatCurrency(dashboard?.total_collected)}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">{collectionPercentage}% collected</span>
                </div>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <IndianRupee className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Pending */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-100">Total Pending</p>
                <p className="mt-2 text-3xl font-bold">
                  {formatCurrency(dashboard?.total_pending)}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{100 - collectionPercentage}% pending</span>
                </div>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <Clock className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-xl shadow-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-100">Overdue Fees</p>
                <p className="mt-2 text-3xl font-bold">{dashboard?.overdue_count ?? 0}</p>
                <div className="mt-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">Need attention</span>
                </div>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <AlertTriangle className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Students */}
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">Total Students</p>
                <p className="mt-2 text-3xl font-bold">{dashboard?.total_fees ?? 0}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">With fee records</span>
                </div>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <Users className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collection Progress */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Collection Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Collection</span>
              <span className="font-semibold">{collectionPercentage}%</span>
            </div>
            <Progress value={collectionPercentage} className="h-3" />
            <div className="grid grid-cols-2 gap-4 pt-2 sm:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {dashboard?.fully_paid_count ?? 0}
                </div>
                <div className="text-muted-foreground text-xs">Fully Paid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {dashboard?.partial_paid_count ?? 0}
                </div>
                <div className="text-muted-foreground text-xs">Partial</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {dashboard?.pending_count ?? 0}
                </div>
                <div className="text-muted-foreground text-xs">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {dashboard?.overdue_count ?? 0}
                </div>
                <div className="text-muted-foreground text-xs">Overdue</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to={ROUTES.FEES.STRUCTURES} className="group">
          <Card className="h-full border-2 border-transparent transition-all hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-xl bg-blue-100 p-3 transition-transform group-hover:scale-110">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Fee Structures</p>
                <p className="text-muted-foreground text-sm">Manage structures</p>
              </div>
              <ArrowRight className="text-muted-foreground h-5 w-5 transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>

        <Link to={ROUTES.FEES.STUDENT_FEES} className="group">
          <Card className="h-full border-2 border-transparent transition-all hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/10">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-xl bg-emerald-100 p-3 transition-transform group-hover:scale-110">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Student Fees</p>
                <p className="text-muted-foreground text-sm">
                  {dashboard?.total_fees ?? 0} records
                </p>
              </div>
              <ArrowRight className="text-muted-foreground h-5 w-5 transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>

        <Link to={ROUTES.FEES.PAYMENTS} className="group">
          <Card className="h-full border-2 border-transparent transition-all hover:border-purple-200 hover:shadow-lg hover:shadow-purple-500/10">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-xl bg-purple-100 p-3 transition-transform group-hover:scale-110">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Payments</p>
                <p className="text-muted-foreground text-sm">View all payments</p>
              </div>
              <ArrowRight className="text-muted-foreground h-5 w-5 transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>

        <Link to={`${ROUTES.FEES.STUDENT_FEES}?status=overdue`} className="group">
          <Card className="h-full border-2 border-transparent transition-all hover:border-red-200 hover:shadow-lg hover:shadow-red-500/10">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-xl bg-red-100 p-3 transition-transform group-hover:scale-110">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Overdue</p>
                <p className="text-muted-foreground text-sm">
                  {dashboard?.overdue_count ?? 0} students
                </p>
              </div>
              <ArrowRight className="text-muted-foreground h-5 w-5 transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Payments */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <CreditCard className="h-5 w-5 text-emerald-600" />
            Recent Payments
          </CardTitle>
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link to={ROUTES.FEES.PAYMENTS}>
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentPaymentsArray.length > 0 ? (
            <PaymentHistoryTable
              data={recentPaymentsArray.slice(0, 5)}
              isLoading={isPaymentsLoading}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-gray-100 p-4">
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-muted-foreground mt-4">No recent payments</p>
              <p className="text-muted-foreground text-sm">
                Payments will appear here once recorded
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
