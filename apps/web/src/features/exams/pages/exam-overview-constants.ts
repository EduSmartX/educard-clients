import { Circle, CheckCircle2, AlertCircle, XCircle, FileX, TrendingUp } from 'lucide-react';
import type { ExamStatus } from '@educard/shared';

// Status colors and icons
export const STATUS_CONFIG: Record<
  ExamStatus,
  { color: string; bgColor: string; icon: typeof Circle; label: string }
> = {
  draft: { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: FileX, label: 'Draft' },
  scheduled: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Circle, label: 'Scheduled' },
  in_progress: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: AlertCircle,
    label: 'In Progress',
  },
  completed: {
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle2,
    label: 'Completed',
  },
  cancelled: { color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle, label: 'Cancelled' },
};

// Insight type style mapping
export const INSIGHT_STYLES = {
  success: {
    container: 'border-green-200 bg-green-50',
    iconColor: 'text-green-600',
    titleColor: 'text-green-800',
    descColor: 'text-green-700',
    Icon: CheckCircle2,
  },
  warning: {
    container: 'border-yellow-200 bg-yellow-50',
    iconColor: 'text-yellow-600',
    titleColor: 'text-yellow-800',
    descColor: 'text-yellow-700',
    Icon: AlertCircle,
  },
  alert: {
    container: 'border-red-200 bg-red-50',
    iconColor: 'text-red-600',
    titleColor: 'text-red-800',
    descColor: 'text-red-700',
    Icon: XCircle,
  },
  info: {
    container: 'border-blue-200 bg-blue-50',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-800',
    descColor: 'text-blue-700',
    Icon: TrendingUp,
  },
} as const;

export const CHART_COLORS = {
  passed: '#22c55e',
  failed: '#ef4444',
  absent: '#f59e0b',
  primary: '#3b82f6',
  secondary: '#8b5cf6',
};

export type InsightType = 'success' | 'warning' | 'info' | 'alert';

export interface Insight {
  type: InsightType;
  title: string;
  description: string;
}

/** Get performance insight based on pass percentage */
function getPerformanceInsight(passPercentage: number): Insight | null {
  if (passPercentage >= 80) {
    return {
      type: 'success',
      title: 'Excellent Class Performance!',
      description: `${passPercentage}% of students passed all subjects. The class is performing exceptionally well.`,
    };
  }
  if (passPercentage >= 60) {
    return {
      type: 'info',
      title: 'Good Class Performance',
      description: `${passPercentage}% pass rate. Consider additional support for struggling students.`,
    };
  }
  if (passPercentage < 50) {
    return {
      type: 'alert',
      title: 'Attention Required',
      description: `Only ${passPercentage}% pass rate. Immediate intervention recommended.`,
    };
  }
  return null;
}

/** Generate AI insights from marks overview data */
export function generateAiInsights(
  marksOverview:
    | {
        stats: { pass_percentage: number };
        subjects: {
          subject_name: string;
          pass_percentage: number;
          average_marks: number;
          absent: number;
          total_students: number;
        }[];
      }
    | undefined,
  hasMarksEntered: boolean
): Insight[] {
  if (!marksOverview || !hasMarksEntered) {
    return [];
  }

  const insights: Insight[] = [];
  const { stats, subjects } = marksOverview;

  const perfInsight = getPerformanceInsight(stats.pass_percentage);
  if (perfInsight) {
    insights.push(perfInsight);
  }

  if (subjects.length === 0) {
    return insights;
  }

  const sortedByPass = [...subjects].sort((a, b) => b.pass_percentage - a.pass_percentage);
  const bestSubject = sortedByPass[0];
  const worstSubject = sortedByPass[sortedByPass.length - 1];

  if (bestSubject.pass_percentage >= 90) {
    insights.push({
      type: 'success',
      title: `Top Performer: ${bestSubject.subject_name}`,
      description: `${bestSubject.pass_percentage}% pass rate with ${bestSubject.average_marks.toFixed(1)} average marks.`,
    });
  }

  if (worstSubject.pass_percentage < 60 && subjects.length > 1) {
    insights.push({
      type: 'warning',
      title: `Needs Improvement: ${worstSubject.subject_name}`,
      description: `Only ${worstSubject.pass_percentage}% pass rate. Consider remedial classes.`,
    });
  }

  const highAbsence = subjects.filter((s) => s.absent > s.total_students * 0.1);
  if (highAbsence.length > 0) {
    insights.push({
      type: 'warning',
      title: 'High Absence Rate',
      description: `${highAbsence.map((s) => s.subject_name).join(', ')} have more than 10% absence.`,
    });
  }

  const topAverageSubject = [...subjects].sort((a, b) => b.average_marks - a.average_marks)[0];
  insights.push({
    type: 'info',
    title: 'Highest Average Score',
    description: `${topAverageSubject.subject_name} has the highest average of ${topAverageSubject.average_marks.toFixed(1)} marks.`,
  });

  return insights;
}
