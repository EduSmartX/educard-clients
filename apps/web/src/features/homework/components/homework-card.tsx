/**
 * Homework Card Component
 * Displays a single homework item with floating card design
 */

import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  FileText,
  Video,
  Users,
  AlertCircle,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Send,
  Archive,
} from 'lucide-react';
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';
import { motion } from 'framer-motion';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import {
  getPriorityColor,
  getStatusLabel,
  type Homework,
  type HomeworkPriority,
  type HomeworkStatus,
} from '../types';

interface HomeworkCardProps {
  homework: Homework;
  onView?: (homework: Homework) => void;
  onEdit?: (homework: Homework) => void;
  onDelete?: (homework: Homework) => void;
  onPublish?: (homework: Homework) => void;
  onArchive?: (homework: Homework) => void;
  showActions?: boolean;
  className?: string;
}

// Subject icon mapping
const SUBJECT_ICONS: Record<string, string> = {
  english: '📚',
  mathematics: '🔢',
  science: '🔬',
  hindi: 'अ',
  social: '🌍',
  computer: '💻',
  art: '🎨',
  music: '🎵',
  physical: '⚽',
  default: '📖',
};

function getSubjectIcon(subjectName: string): string {
  const name = subjectName.toLowerCase();
  for (const [key, icon] of Object.entries(SUBJECT_ICONS)) {
    if (name.includes(key)) {
      return icon;
    }
  }
  return SUBJECT_ICONS.default;
}

function formatDueDate(dueDate: string, _dueTime: string | null): string {
  const date = new Date(dueDate);

  if (isToday(date)) {
    return 'Today';
  }
  if (isTomorrow(date)) {
    return 'Tomorrow';
  }
  if (isPast(date)) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  return format(date, 'MMM d, yyyy');
}

const PriorityBadge = memo(({ priority }: { priority: HomeworkPriority }) => {
  const color = getPriorityColor(priority);
  const labels: Record<HomeworkPriority, string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  return (
    <Badge
      variant="outline"
      className="border-0 px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `${color}15`,
        color,
      }}
    >
      {labels[priority]}
    </Badge>
  );
});

const StatusBadge = memo(({ status }: { status: HomeworkStatus }) => {
  const colors: Record<HomeworkStatus, { bg: string; text: string }> = {
    draft: { bg: '#94A3B815', text: '#64748B' },
    published: { bg: '#3B82F615', text: '#3B82F6' },
    archived: { bg: '#6B728015', text: '#6B7280' },
  };

  const { bg, text } = colors[status];

  return (
    <Badge
      variant="outline"
      className="border-0 px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: bg, color: text }}
    >
      {getStatusLabel(status)}
    </Badge>
  );
});

export const HomeworkCard = memo(
  ({
    homework,
    onView,
    onEdit,
    onDelete,
    onPublish,
    onArchive,
    showActions = true,
    className,
  }: HomeworkCardProps) => {
    const navigate = useNavigate();

    const completionRate = useMemo(() => {
      const stats = homework.submission_stats;
      if (!stats || stats.total_students === 0) {
        return 0;
      }
      return Math.round((stats.submitted / stats.total_students) * 100);
    }, [homework.submission_stats]);

    const handleCardClick = () => {
      if (onView) {
        onView(homework);
      } else {
        navigate(`/admin/homework/${homework.public_id}`);
      }
    };

    const isDraft = homework.status === 'draft';
    const isOverdue = homework.is_overdue && homework.status === 'published';

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className={className}
      >
        <Card
          className={cn(
            'group cursor-pointer overflow-hidden rounded-2xl border-0 bg-white shadow-md transition-all hover:shadow-xl',
            'dark:bg-slate-900',
            isOverdue && 'ring-2 ring-red-200'
          )}
          onClick={handleCardClick}
        >
          <CardContent className="p-5">
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-start gap-3">
                {/* Subject Icon */}
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                  style={{
                    backgroundColor: `${getPriorityColor(homework.priority)}15`,
                  }}
                >
                  {getSubjectIcon(homework.subject_name)}
                </div>

                {/* Title & Subject */}
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-1 text-base font-semibold text-slate-900 dark:text-white">
                    {homework.title}
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-500">{homework.subject_name}</p>
                </div>
              </div>

              {/* Actions & Badge */}
              <div className="flex items-center gap-2">
                <PriorityBadge priority={homework.priority} />

                {showActions && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => onView?.(homework)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {isDraft && (
                        <>
                          <DropdownMenuItem onClick={() => onEdit?.(homework)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onPublish?.(homework)}>
                            <Send className="mr-2 h-4 w-4" />
                            Publish
                          </DropdownMenuItem>
                        </>
                      )}
                      {homework.status === 'published' && (
                        <DropdownMenuItem onClick={() => onArchive?.(homework)}>
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => onDelete?.(homework)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Description */}
            {homework.description && (
              <p className="mb-4 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                {homework.description}
              </p>
            )}

            {/* Meta Info */}
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              {homework.attachment_count > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {homework.attachment_count} files
                </span>
              )}
              {homework.video_count > 0 && (
                <span className="flex items-center gap-1">
                  <Video className="h-4 w-4" />
                  {homework.video_count} videos
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {homework.submission_stats?.total_students || 0} students
              </span>
            </div>

            {/* Progress Bar */}
            {homework.status === 'published' && (
              <div className="mb-4">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Submissions</span>
                  <span className="font-medium text-slate-700">
                    {homework.submission_stats?.submitted || 0}/
                    {homework.submission_stats?.total_students || 0}
                  </span>
                </div>
                <Progress
                  value={completionRate}
                  className="h-2"
                  style={
                    {
                      '--progress-background':
                        completionRate >= 80
                          ? '#10B981'
                          : completionRate >= 50
                            ? '#F59E0B'
                            : '#EF4444',
                    } as React.CSSProperties
                  }
                />
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <StatusBadge status={homework.status} />
                <span className="text-xs text-slate-400">{homework.class_name}</span>
              </div>

              <div
                className={cn(
                  'flex items-center gap-1.5 text-sm font-medium',
                  isOverdue ? 'text-red-500' : 'text-slate-600'
                )}
              >
                {isOverdue ? <AlertCircle className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                <span>{formatDueDate(homework.due_date, homework.due_time)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
);

export default HomeworkCard;
