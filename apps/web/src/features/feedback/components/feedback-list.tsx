import { motion } from 'framer-motion';
import { FileText, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FEEDBACK_STATUS_COLORS, getFeedbackTypeOption, type Feedback } from '@educard/shared';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeedbackList } from '../hooks/use-feedback';
import { FEEDBACK_TYPE_ICONS } from './feedback-type-icons';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function FeedbackCard({ feedback }: Readonly<{ feedback: Feedback }>) {
  const option = getFeedbackTypeOption(feedback.feedback_type);
  const navigate = useNavigate();
  const Icon = FEEDBACK_TYPE_ICONS[option.icon];
  const statusStyle = FEEDBACK_STATUS_COLORS[feedback.status];

  return (
    <Card
      className="cursor-pointer border-l-4 transition-shadow hover:shadow-md"
      style={{ borderLeftColor: option.borderColor }}
      onClick={() => navigate(`/feedback/${feedback.public_id}`)}
    >
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: option.bgColor }}
          >
            <Icon className="h-5 w-5" style={{ color: option.color }} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-slate-900">{feedback.subject}</h3>
              <Badge
                variant="outline"
                style={{ color: option.color, borderColor: option.borderColor }}
              >
                {feedback.feedback_type_display}
              </Badge>
              {feedback.module_display && (
                <Badge variant="secondary">{feedback.module_display}</Badge>
              )}
              <Badge
                variant="outline"
                style={{
                  color: statusStyle?.color,
                  borderColor: statusStyle?.color,
                  backgroundColor: statusStyle?.bgColor,
                }}
              >
                {feedback.status_display}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              <span className="font-mono font-medium text-slate-500">{feedback.ticket_number}</span>{' '}
              · {feedback.user_name} · {formatDate(feedback.created_at)}
            </p>
          </div>
        </div>
        <p className="line-clamp-2 text-sm text-slate-600">{feedback.description}</p>
      </CardContent>
    </Card>
  );
}

export function FeedbackList() {
  const { data, isLoading } = useFeedbackList();
  const entries = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <Inbox className="h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">No feedback yet</p>
          <p className="text-xs text-slate-400">
            Anything you submit will show up here so you can track it.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        <FileText className="h-3.5 w-3.5" />
        {entries.length} submission{entries.length > 1 ? 's' : ''}
      </p>
      {entries.map((feedback, index) => (
        <motion.div
          key={feedback.public_id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(index * 0.04, 0.2) }}
        >
          <FeedbackCard feedback={feedback} />
        </motion.div>
      ))}
    </div>
  );
}
