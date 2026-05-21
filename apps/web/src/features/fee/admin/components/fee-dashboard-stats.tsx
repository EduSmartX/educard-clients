/**
 * Fee Dashboard Stats Component
 * Displays fee collection statistics with visual indicators
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FeeAmount, FeeProgress } from '../../components/fee-amount';
import type { FeeDashboard } from '@educard/shared';
import { AlertTriangle, CheckCircle2, Clock, IndianRupee, TrendingUp } from 'lucide-react';

interface FeeDashboardStatsProps {
  data: FeeDashboard;
  isLoading?: boolean;
}

export function FeeDashboardStats({ data, isLoading }: FeeDashboardStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="bg-muted h-4 w-24 rounded" />
            </CardHeader>
            <CardContent>
              <div className="bg-muted h-8 w-32 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Fees',
      value: <FeeAmount amount={data.total_amount} size="lg" />,
      description: `${data.total_fees} fee records`,
      icon: IndianRupee,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Collected',
      value: <FeeAmount amount={data.total_collected} size="lg" />,
      description: `${data.collection_percentage.toFixed(1)}% collection rate`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pending',
      value: <FeeAmount amount={data.total_pending} size="lg" />,
      description: `${data.pending_count + data.partial_paid_count} students`,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      title: 'Overdue',
      value: data.overdue_count,
      description: 'Need immediate attention',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-muted-foreground mt-1 text-xs">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Collection Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Collection Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <FeeProgress
              amountPaid={data.total_collected}
              totalAmount={data.total_amount}
              paidPercentage={data.collection_percentage}
            />
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fee Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <StatusRow
                icon={CheckCircle2}
                label="Fully Paid"
                count={data.fully_paid_count}
                total={data.total_fees}
                color="text-green-600"
              />
              <StatusRow
                icon={TrendingUp}
                label="Partially Paid"
                count={data.partial_paid_count}
                total={data.total_fees}
                color="text-blue-600"
              />
              <StatusRow
                icon={Clock}
                label="Pending"
                count={data.pending_count}
                total={data.total_fees}
                color="text-amber-600"
              />
              <StatusRow
                icon={AlertTriangle}
                label="Overdue"
                count={data.overdue_count}
                total={data.total_fees}
                color="text-red-600"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatusRowProps {
  icon: React.ElementType;
  label: string;
  count: number;
  total: number;
  color: string;
}

function StatusRow({ icon: Icon, label, count, total, color }: StatusRowProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <Icon className={`h-4 w-4 ${color}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between text-sm">
          <span>{label}</span>
          <span className="font-medium">
            {count} ({percentage.toFixed(1)}%)
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full ${color.replace('text-', 'bg-')}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
