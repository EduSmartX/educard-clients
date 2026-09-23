import { ArrowLeft, ExternalLink, FileText, Loader2, Paperclip } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { FEEDBACK_STATUS_COLORS, getFeedbackTypeOption } from '@educard/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common';
import { formatFileSize } from '@/lib/utils';
import { useFeedbackDetail } from '../hooks/use-feedback';
import { FeedbackStatusProgress } from '../components/feedback-status-progress';
import { FEEDBACK_TYPE_ICONS } from '../components/feedback-type-icons';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function FeedbackDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useFeedbackDetail(id);
  const feedback = data?.data;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError || !feedback) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate('/feedback?tab=history')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to feedback
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-500">
            This feedback ticket is unavailable.
          </CardContent>
        </Card>
      </div>
    );
  }

  const option = getFeedbackTypeOption(feedback.feedback_type);
  const Icon = FEEDBACK_TYPE_ICONS[option.icon];
  const statusStyle = FEEDBACK_STATUS_COLORS[feedback.status];
  const showComments = feedback.status_step >= 2 && Boolean(feedback.admin_remarks);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Feedback ticket" description={feedback.ticket_number} icon={FileText}>
        <Button variant="outline" onClick={() => navigate('/feedback?tab=history')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to feedback
        </Button>
      </PageHeader>

      <Card className="overflow-hidden border-l-4" style={{ borderLeftColor: option.borderColor }}>
        <CardHeader className="border-b bg-slate-50/70">
          <div className="flex items-start gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: option.bgColor }}
            >
              <Icon className="h-5 w-5" style={{ color: option.color }} />
            </span>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg">{feedback.subject}</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Submitted {formatDate(feedback.created_at)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
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
                color: statusStyle.color,
                borderColor: statusStyle.color,
                backgroundColor: statusStyle.bgColor,
              }}
            >
              {feedback.status_display}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-7 py-6">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">Status</h2>
            <FeedbackStatusProgress step={feedback.status_step} />
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-800">Your feedback</h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-600">
              {feedback.description}
            </p>
          </section>

          {showComments && (
            <section className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <h2 className="text-sm font-semibold text-emerald-800">Reviewer comments</h2>
              {(feedback.resolved_by_name || feedback.resolved_at) && (
                <p className="mt-1 text-xs text-emerald-700">
                  {[
                    feedback.resolved_by_name,
                    feedback.resolved_at ? formatDate(feedback.resolved_at) : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-emerald-950">
                {feedback.admin_remarks}
              </p>
            </section>
          )}

          {feedback.github_issue_url && (
            <a
              href={feedback.github_issue_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ExternalLink className="h-4 w-4" />
              Track on GitHub
              {feedback.github_issue_number ? ` #${feedback.github_issue_number}` : ''}
            </a>
          )}

          {feedback.attachments.length > 0 && (
            <section className="space-y-3 border-t pt-5">
              <h2 className="text-sm font-semibold text-slate-800">Attachments</h2>
              <div className="flex flex-wrap gap-2">
                {feedback.attachments.map((attachment) => (
                  <a
                    key={attachment.public_id}
                    href={attachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <Paperclip className="h-4 w-4" />
                    <span className="max-w-[16rem] truncate">{attachment.file_name}</span>
                    <span className="text-xs text-slate-400">
                      {formatFileSize(attachment.file_size)}
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
