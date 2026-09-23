/**
 * Dashboard Stats Component
 * Displays homework dashboard statistics
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, Clock, TrendingUp } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import type { HomeworkDashboardStats } from '../types';

interface DashboardStatsProps {
  stats?: HomeworkDashboardStats;
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  trend?: string;
  index: number;
}

const StatCard = memo(({ title, value, icon, color, bgColor, trend, index }: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden rounded-2xl border-0 shadow-md transition-all hover:-translate-y-1 hover:shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{title}</p>
              <p className="mt-2 text-3xl font-bold" style={{ color }}>
                {value}
              </p>
              {trend && (
                <p className="mt-1 flex items-center gap-1 text-xs text-green-500">
                  <TrendingUp className="h-3 w-3" />
                  {trend}
                </p>
              )}
            </div>
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: bgColor }}
            >
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

function StatSkeleton() {
  return (
    <Card className="rounded-2xl border-0 shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

export const DashboardStats = memo(({ stats, isLoading = false }: DashboardStatsProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['s1', 's2', 's3', 's4'].map((id) => (
          <StatSkeleton key={id} />
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      title: 'Total Homework',
      value: stats.total_homework,
      icon: <BookOpen className="h-6 w-6 text-blue-500" />,
      color: '#3B82F6',
      bgColor: '#3B82F615',
    },
    {
      title: 'Published',
      value: stats.published,
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
      color: '#10B981',
      bgColor: '#10B98115',
    },
    {
      title: 'Pending Submissions',
      value: stats.pending_submissions,
      icon: <Clock className="h-6 w-6 text-amber-500" />,
      color: '#F59E0B',
      bgColor: '#F59E0B15',
    },
    {
      title: 'Completion Rate',
      value: `${stats.completion_rate}%`,
      icon: <TrendingUp className="h-6 w-6 text-purple-500" />,
      color: '#8B5CF6',
      bgColor: '#8B5CF615',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card, index) => (
        <StatCard key={card.title} {...card} index={index} />
      ))}
    </div>
  );
});

export default DashboardStats;
