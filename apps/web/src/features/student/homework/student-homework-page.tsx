import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getSubjectColor } from '@educard/shared';
import { PageHeader, SubjectAvatar } from '@/components/common';
import { useStudentHomework } from './hooks';

type FilterTab = 'all' | 'pending' | 'submitted' | 'overdue';

const TABS: { key: FilterTab; label: string; emoji: string }[] = [
  { key: 'all', label: 'All', emoji: '📋' },
  { key: 'pending', label: 'Pending', emoji: '⏳' },
  { key: 'submitted', label: 'Submitted', emoji: '✅' },
  { key: 'overdue', label: 'Overdue', emoji: '⚠️' },
];

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2; text: string }> = {
  not_submitted: { color: 'bg-amber-100 text-amber-700', icon: Clock, text: 'Pending' },
  submitted: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2, text: 'Submitted' },
  reviewed: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle2, text: 'Reviewed' },
  overdue: { color: 'bg-red-100 text-red-700', icon: AlertCircle, text: 'Overdue' },
};

/** Default date: before 4PM show yesterday (homework to check), after 4PM show tomorrow (homework to do tonight) */
function getDefaultDate(): Date {
  const now = new Date();
  if (now.getHours() >= 16) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatDateLabel(d: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) {
    return 'Today';
  }
  if (diff === 1) {
    return 'Tomorrow';
  }
  if (diff === -1) {
    return 'Yesterday';
  }
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatDueDateTime(dtStr: string): string {
  const dt = new Date(dtStr);
  return `${dt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })} ${dt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
}

export default function StudentHomeworkPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(getDefaultDate);
  const [filter, setFilter] = useState<FilterTab>('all');

  const dateStr = toDateStr(selectedDate);
  const { data: homework, isLoading } = useStudentHomework(dateStr);

  const goDay = (offset: number) => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + offset);
      return d;
    });
  };

  const goToday = () => setSelectedDate(getDefaultDate());

  const filtered = useMemo(() => {
    if (!homework) {
      return [];
    }
    return homework.filter((hw) => {
      const effectiveStatus = hw.is_overdue
        ? 'overdue'
        : hw.my_submission_status || 'not_submitted';
      if (filter === 'all') {
        return true;
      }
      if (filter === 'pending') {
        return effectiveStatus === 'not_submitted';
      }
      if (filter === 'submitted') {
        return effectiveStatus === 'submitted' || effectiveStatus === 'reviewed';
      }
      if (filter === 'overdue') {
        return effectiveStatus === 'overdue';
      }
      return true;
    });
  }, [homework, filter]);

  const pendingCount =
    homework?.filter((h) => !h.is_overdue && h.my_submission_status === 'not_submitted').length ??
    0;
  const overdueCount = homework?.filter((h) => h.is_overdue).length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homework"
        description={
          pendingCount > 0
            ? `${pendingCount} pending assignment${pendingCount > 1 ? 's' : ''} 📝`
            : 'All caught up! 🌟'
        }
        icon={BookOpen}
      />

      {/* Date Navigator */}
      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => goDay(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goToday}
            className="rounded-lg bg-white px-3 py-1 text-xs font-medium text-orange-600 shadow-sm hover:bg-orange-50"
          >
            Today
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">{formatDateLabel(selectedDate)}</p>
            <p className="text-xs text-gray-500">
              {selectedDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setSelectedDate(new Date(`${e.target.value}T00:00:00`))}
            className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0 text-transparent [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => goDay(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              filter === tab.key
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.emoji} {tab.label}
            {tab.key === 'overdue' && overdueCount > 0 && (
              <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {overdueCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Homework List */}
      <div className="space-y-3">
        {(() => {
          if (isLoading) {
            return Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ));
          }
          if (filtered.length === 0) {
            return (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                  <span className="text-5xl">🦋</span>
                  <p className="text-lg font-medium text-gray-600">
                    {filter === 'all'
                      ? `No homework for ${formatDateLabel(selectedDate).toLowerCase()}`
                      : `No ${filter} homework`}
                  </p>
                  <p className="text-sm text-gray-400">Try another date!</p>
                </CardContent>
              </Card>
            );
          }
          return filtered.map((hw, index) => {
            const effectiveStatus = hw.is_overdue
              ? 'overdue'
              : hw.my_submission_status || 'not_submitted';
            const config = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.not_submitted;
            const StatusIcon = config.icon;

            return (
              <motion.div
                key={hw.public_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer overflow-hidden transition-shadow hover:border-orange-200 hover:shadow-md"
                  onClick={() => navigate(`/student/homework/${hw.public_id}?date=${dateStr}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <SubjectAvatar name={hw.subject_name} size="lg" className="mt-1" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-800">{hw.title}</h3>
                          <Badge className={`shrink-0 ${config.color}`}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {config.text}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-sm">
                          <span className={`font-medium ${getSubjectColor(hw.subject_name).text}`}>
                            {hw.subject_name}
                          </span>
                          {hw.chapter && <span className="ml-2 text-gray-400">• {hw.chapter}</span>}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            Due: {formatDueDateTime(hw.due_datetime)}
                          </span>
                          <span>By: {hw.assigned_by_name}</span>
                          {hw.priority === 'high' && (
                            <Badge className="bg-red-50 text-[10px] text-red-600">
                              High Priority
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-gray-300" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          });
        })()}
      </div>
    </div>
  );
}
