/**
 * Submission Review Page
 *
 * Allows teachers to review homework submissions with:
 * - Compact two-column layout showing homework and student info
 * - Previous/Next navigation between submissions
 * - Optional feedback input (only for assigned teacher)
 * - Read-only view for admins and class teachers
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  FileText,
  MessageSquare,
  Send,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  BookOpen,
  Hash,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { getSubjectColor, HOMEWORK_UI } from '@educard/shared';
import { ROUTES } from '@/constants/app-config';
import { useUserProfile } from '@/features/profile/hooks/queries';

import {
  useSubmissionDetail,
  useReviewSubmission,
  useHomeworkDetail,
  useHomeworkSubmissions,
} from '../hooks';
import {
  getSubmissionStatusColor,
  getSubmissionStatusLabel,
  type SubmissionStatus,
} from '../types';

const DEFAULT_RETURN_URL = '/homework/submissions';
const DEFAULT_COLOR = '#6366f1';

function StatusBadge({ status, isLate }: { status: SubmissionStatus; isLate?: boolean }) {
  const color = getSubmissionStatusColor(status);
  const label = getSubmissionStatusLabel(status);

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className="border-0 px-3 py-1 text-sm font-medium"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {label}
      </Badge>
      {isLate && (
        <Badge variant="destructive" className="px-2 py-0.5 text-xs">
          {HOMEWORK_UI.LATE}
        </Badge>
      )}
    </div>
  );
}

function AttachmentCard({
  name,
  type,
  size,
  onView,
  onDownload,
}: {
  name: string;
  type: string;
  size?: number;
  onView?: () => void;
  onDownload?: () => void;
}) {
  const formatSize = (bytes?: number) => {
    if (!bytes) {
      return '';
    }
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center justify-between rounded-lg border bg-white p-3">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-50 p-2">
          <FileText className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">
            {type} {size ? `• ${formatSize(size)}` : ''}
          </p>
        </div>
      </div>
      <div className="flex gap-1">
        {onView && (
          <Button variant="ghost" size="sm" onClick={onView}>
            <Eye className="h-4 w-4" />
          </Button>
        )}
        {onDownload && (
          <Button variant="ghost" size="sm" onClick={onDownload}>
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-40" />
      <Skeleton className="h-32" />
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function SubmissionReviewPage() {
  const { homeworkId, submissionId } = useParams<{ homeworkId: string; submissionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const returnUrl = searchParams.get('returnUrl') || DEFAULT_RETURN_URL;

  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: userProfile } = useUserProfile();
  const {
    data: submission,
    isLoading: isLoadingSubmission,
    error: submissionError,
  } = useSubmissionDetail(homeworkId || '', submissionId || '');
  const { data: homework, isLoading: isLoadingHomework } = useHomeworkDetail(homeworkId || '');
  const { data: submissionsData } = useHomeworkSubmissions(homeworkId || '');
  const reviewMutation = useReviewSubmission();

  const canReview = useMemo(() => {
    if (!homework || !userProfile) {
      return false;
    }
    // Both assigned teacher and subject teacher can review
    const isAssignedTeacher = userProfile.teacher_public_id === homework.assigned_by_public_id;
    const isSubjectTeacher = userProfile.teacher_public_id === homework.subject_teacher_public_id;
    return isAssignedTeacher || isSubjectTeacher;
  }, [homework, userProfile]);

  const navigation = useMemo(() => {
    const submissions = submissionsData?.submissions;
    if (!submissions?.length || !submissionId) {
      return { prev: null, next: null, current: 0, total: 0 };
    }

    const currentIndex = submissions.findIndex((s) => s.public_id === submissionId);
    if (currentIndex === -1) {
      return { prev: null, next: null, current: 0, total: submissions.length };
    }

    return {
      prev: currentIndex > 0 ? submissions[currentIndex - 1] : null,
      next: currentIndex < submissions.length - 1 ? submissions[currentIndex + 1] : null,
      current: currentIndex + 1,
      total: submissions.length,
    };
  }, [submissionsData, submissionId]);

  const handleGoBack = useCallback(() => {
    navigate(returnUrl);
  }, [navigate, returnUrl]);

  const navigateToSubmission = useCallback(
    (newSubmissionId: string) => {
      const url = ROUTES.HOMEWORK_SUBMISSION_REVIEW.replace(
        ':homeworkId',
        homeworkId || ''
      ).replace(':submissionId', newSubmissionId);
      navigate(`${url}?returnUrl=${encodeURIComponent(returnUrl)}`);
    },
    [homeworkId, navigate, returnUrl]
  );

  const handleSubmitReview = useCallback(async () => {
    if (!homeworkId || !submissionId) {
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewMutation.mutateAsync({
        homeworkPublicId: homeworkId,
        submissionId,
        data: { feedback: feedback.trim() },
      });
      if (navigation.next) {
        navigateToSubmission(navigation.next.public_id);
      } else {
        navigate(returnUrl);
      }
    } catch {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  }, [
    homeworkId,
    submissionId,
    feedback,
    reviewMutation,
    navigation.next,
    navigateToSubmission,
    navigate,
    returnUrl,
  ]);

  const isLoading = isLoadingSubmission || isLoadingHomework;
  const isReviewed = submission?.status === 'reviewed';
  const subjectColor = homework ? getSubjectColor(homework.subject_name) : null;

  useEffect(() => {
    if (submission?.feedback) {
      setFeedback(submission.feedback);
    }
  }, [submission?.feedback]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (submissionError || !submission) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
          <h3 className="text-lg font-semibold text-slate-900">
            {HOMEWORK_UI.SUBMISSION_NOT_FOUND}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{HOMEWORK_UI.SUBMISSION_NOT_FOUND_DESC}</p>
          <Button className="mt-4" onClick={handleGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {HOMEWORK_UI.GO_BACK}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={handleGoBack} className="mb-3 -ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {HOMEWORK_UI.BACK_TO_SUBMISSIONS}
        </Button>

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">{HOMEWORK_UI.REVIEW_SUBMISSION}</h1>
          {navigation.total > 0 && (
            <span className="text-sm text-slate-500">
              {navigation.current} of {navigation.total} submissions
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {homework && (
            <Card className="overflow-hidden">
              <div
                className="h-1.5"
                style={{ backgroundColor: subjectColor?.hex || DEFAULT_COLOR }}
              />
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{ backgroundColor: subjectColor?.bg, color: subjectColor?.text }}
                      >
                        {homework.subject_name}
                      </Badge>
                      <span className="text-xs text-slate-500">{homework.class_name}</span>
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">{homework.title}</h2>
                    {homework.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                        {homework.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {HOMEWORK_UI.DUE}:{' '}
                        {format(new Date(homework.due_datetime), 'MMM d, h:mm a')}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {homework.assigned_by_name}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end border-l pl-4">
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-medium text-slate-900">{submission.student_name}</p>
                        <p className="flex items-center justify-end gap-1 text-xs text-slate-500">
                          <Hash className="h-3 w-3" />
                          {HOMEWORK_UI.ROLL}: {submission.student_roll_number}
                        </p>
                      </div>
                      <Avatar className="h-10 w-10 border border-slate-200">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">
                          {getInitials(submission.student_name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="mt-2 text-right">
                      <StatusBadge status={submission.status} isLate={submission.is_late} />
                    </div>
                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      {format(new Date(submission.submitted_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {submission.notes && (
            <Card>
              <CardHeader className="px-4 py-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="h-4 w-4" />
                  {HOMEWORK_UI.STUDENT_NOTES}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pt-0 pb-4">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-sm whitespace-pre-wrap text-slate-700">{submission.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {submission.attachments && submission.attachments.length > 0 && (
            <Card>
              <CardHeader className="px-4 py-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  {HOMEWORK_UI.ATTACHMENTS} ({submission.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pt-0 pb-4">
                <div className="space-y-2">
                  {submission.attachments.map((attachment) => (
                    <AttachmentCard
                      key={attachment.public_id}
                      name={attachment.file_name}
                      type={attachment.file_type}
                      size={attachment.file_size}
                      onView={() => window.open(attachment.url, '_blank')}
                      onDownload={() => {
                        const link = document.createElement('a');
                        link.href = attachment.url;
                        link.download = attachment.file_name;
                        link.click();
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader className="px-4 py-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4" />
                {isReviewed
                  ? HOMEWORK_UI.REVIEW_FEEDBACK
                  : canReview
                    ? HOMEWORK_UI.SUBMIT_REVIEW
                    : HOMEWORK_UI.REVIEW_FEEDBACK}
              </CardTitle>
              <CardDescription className="text-xs">
                {isReviewed
                  ? HOMEWORK_UI.FEEDBACK_PROVIDED
                  : canReview
                    ? HOMEWORK_UI.FEEDBACK_IS_OPTIONAL
                    : HOMEWORK_UI.ONLY_ASSIGNED_TEACHER_CAN_REVIEW}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pt-0 pb-4">
              <div className="space-y-3">
                {isReviewed && submission.reviewed_by_name && (
                  <div className="rounded-lg bg-green-50 p-3 text-xs">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="font-medium">
                        {HOMEWORK_UI.REVIEWED_BY} {submission.reviewed_by_name}
                      </span>
                    </div>
                    {submission.reviewed_at && (
                      <p className="mt-1 ml-6 text-green-600">
                        {format(new Date(submission.reviewed_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    )}
                  </div>
                )}

                {!canReview && !isReviewed && (
                  <div className="rounded-lg bg-amber-50 p-3 text-xs">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">{HOMEWORK_UI.VIEW_ONLY}</span>
                    </div>
                    <p className="mt-1 ml-6 text-amber-600">
                      Only {homework?.assigned_by_name} can review this submission.
                    </p>
                  </div>
                )}

                <Textarea
                  placeholder={
                    canReview
                      ? HOMEWORK_UI.FEEDBACK_PLACEHOLDER
                      : HOMEWORK_UI.FEEDBACK_PLACEHOLDER_READONLY
                  }
                  value={feedback || submission.feedback || ''}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="resize-none text-sm"
                  disabled={isSubmitting || !canReview}
                  readOnly={!canReview}
                />

                {canReview && (
                  <Button
                    onClick={handleSubmitReview}
                    disabled={isSubmitting}
                    className="w-full"
                    size="sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {HOMEWORK_UI.SUBMITTING}
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        {isReviewed ? HOMEWORK_UI.UPDATE_REVIEW : HOMEWORK_UI.SUBMIT_REVIEW}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t pt-4">
        <Button
          variant="outline"
          onClick={() => navigation.prev && navigateToSubmission(navigation.prev.public_id)}
          disabled={!navigation.prev}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          {HOMEWORK_UI.PREVIOUS_STUDENT}
        </Button>

        <span className="text-sm text-slate-500">
          {navigation.current} / {navigation.total}
        </span>

        <Button
          variant="outline"
          onClick={() => navigation.next && navigateToSubmission(navigation.next.public_id)}
          disabled={!navigation.next}
        >
          {HOMEWORK_UI.NEXT_STUDENT}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
