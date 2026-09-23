import { CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AttendanceStatsCardsProps {
  stats: {
    total_present?: number;
    total_absent?: number;
    total_leaves?: number;
  };
  isLoading?: boolean;
}

export function AttendanceStatsCards({
  stats,
  isLoading = false,
}: Readonly<AttendanceStatsCardsProps>) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {['skeleton-1', 'skeleton-2', 'skeleton-3'].map((key) => (
          <Card key={key} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 rounded bg-gray-200"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Present',
      value: stats.total_present || 0,
      icon: CheckCircle2,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
    },
    {
      title: 'Total Absent',
      value: stats.total_absent || 0,
      icon: XCircle,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200',
    },
    {
      title: 'Total Leaves',
      value: stats.total_leaves || 0,
      icon: Calendar,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className={`${stat.bgColor} border ${stat.borderColor}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`rounded-full p-3 ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
