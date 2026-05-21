/**
 * Homework Detail Page
 * View homework details, attachments, videos, and submissions
 */

import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Calendar,
  FileText,
  Link as LinkIcon,
  Download,
  ExternalLink,
  Pencil,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { DeleteConfirmationDialog, PageHeader } from '@/components/common';
import { cn } from '@/lib/utils';
import { getMediaUrl } from '@/lib/utils/media-utils';

import { SubmissionTable } from '../components';
import {
  useHomeworkDetail,
  useHomeworkSubmissions,
  useDeleteHomework,
  useReviewSubmission,
} from '../hooks';
import { type HomeworkSubmission } from '../types';

export default function HomeworkDetailPage() {
  const { id: publicId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Queries
  const { data: homework, isLoading: isLoadingHomework } = useHomeworkDetail(publicId);
  const { data: submissionsData, isLoading: isLoadingSubmissions } = useHomeworkSubmissions(
    publicId || ''
  );

  // Mutations
  const deleteMutation = useDeleteHomework();
  const reviewMutation = useReviewSubmission();

  // Handlers
  const handleBack = () => navigate(-1);

  const handleEdit = () => {
    if (publicId) {
      navigate(`/homework/${publicId}/edit`);
    }
  };

  const handleDelete = async () => {
    if (publicId) {
      await deleteMutation.mutateAsync(publicId);
      navigate('/homework');
    }
  };

  const handleViewSubmission = useCallback((_submission: HomeworkSubmission) => {
    // TODO: Open submission detail modal or navigate to submission detail page
  }, []);

  const handleGradeSubmission = useCallback(
    async (submissionId: string, _marks: number, feedback: string) => {
      if (!publicId) {
        return;
      }
      // TODO: Add marks support when backend supports it
      await reviewMutation.mutateAsync({
        homeworkPublicId: publicId,
        submissionId,
        data: { feedback },
      });
    },
    [publicId, reviewMutation]
  );

  if (isLoadingHomework) {
    return <HomeworkDetailSkeleton />;
  }

  if (!homework) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="mb-4 h-12 w-12 text-slate-400" />
        <h2 className="text-lg font-semibold">Homework Not Found</h2>
        <p className="mt-1 text-sm text-slate-500">
          The homework you're looking for doesn't exist.
        </p>
        <Button onClick={handleBack} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const isPublished = homework.status === 'published';
  const completionRate = homework.submission_stats
    ? Math.round(
        (homework.submission_stats.submitted / homework.submission_stats.total_students) * 100
      )
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={homework.title}
        description={`${homework.subject_name} • ${homework.class_name}`}
        actions={[
          {
            label: 'Edit',
            onClick: handleEdit,
            variant: 'outline' as const,
            icon: Pencil,
          },
        ]}
      />

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="submissions">
            Submissions
            {homework.submission_stats && (
              <Badge variant="secondary" className="ml-2">
                {homework.submission_stats.submitted}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="space-y-6 lg:col-span-2">
              {/* Description */}
              {homework.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-slate-600">{homework.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Instructions */}
              {homework.instructions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-slate-600">{homework.instructions}</p>
                  </CardContent>
                </Card>
              )}

              {/* Reference Link */}
              {homework.reference_link && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <LinkIcon className="h-5 w-5" />
                      Reference Link
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={homework.reference_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-blue-600">
                          {homework.reference_link}
                        </p>
                        <p className="text-xs text-slate-500">External resource</p>
                      </div>
                      <ExternalLink className="h-5 w-5 shrink-0 text-slate-400" />
                    </a>
                  </CardContent>
                </Card>
              )}

              {/* Attachments */}
              {homework.attachments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-5 w-5" />
                      Attachments
                      <Badge variant="secondary" className="ml-1">
                        {homework.attachments.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {homework.attachments.map((attachment) => (
                        <a
                          key={attachment.public_id}
                          href={getMediaUrl(attachment.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-slate-50"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{attachment.file_name}</p>
                            <p className="text-xs text-slate-500">
                              {(attachment.file_size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <Download className="h-5 w-5 shrink-0 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Assigned Date Card */}
              {homework.assigned_date && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                        <Calendar className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Homework For</p>
                        <p className="font-semibold">
                          {format(new Date(homework.assigned_date), 'EEEE, MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Due Date Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-xl',
                        homework.is_overdue
                          ? 'bg-red-100 text-red-600'
                          : 'bg-blue-100 text-blue-600'
                      )}
                    >
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Due Date</p>
                      <p className="font-semibold">
                        {format(new Date(homework.due_datetime), 'MMMM d, yyyy')}
                      </p>
                      <p className="text-sm text-slate-500">
                        at {format(new Date(homework.due_datetime), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  {homework.is_overdue && (
                    <Badge variant="destructive" className="mt-3 w-full justify-center">
                      Overdue
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Submission Stats */}
              {isPublished && homework.submission_stats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Submissions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-slate-500">Progress</span>
                        <span className="font-semibold">{completionRate}%</span>
                      </div>
                      <Progress value={completionRate} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="rounded-lg bg-green-50 p-3">
                        <p className="text-2xl font-bold text-green-600">
                          {homework.submission_stats.submitted}
                        </p>
                        <p className="text-xs text-green-600">Submitted</p>
                      </div>
                      <div className="rounded-lg bg-amber-50 p-3">
                        <p className="text-2xl font-bold text-amber-600">
                          {homework.submission_stats.pending}
                        </p>
                        <p className="text-xs text-amber-600">Pending</p>
                      </div>
                      <div className="rounded-lg bg-blue-50 p-3">
                        <p className="text-2xl font-bold text-blue-600">
                          {homework.submission_stats.reviewed}
                        </p>
                        <p className="text-xs text-blue-600">Reviewed</p>
                      </div>
                      <div className="rounded-lg bg-red-50 p-3">
                        <p className="text-2xl font-bold text-red-600">
                          {homework.submission_stats.late}
                        </p>
                        <p className="text-xs text-red-600">Late</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned By</span>
                    <span className="font-medium">{homework.assigned_by_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Submission Type</span>
                    <span className="font-medium capitalize">
                      {homework.submission_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Created</span>
                    <span className="font-medium">
                      {format(new Date(homework.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="mt-6">
          <SubmissionTable
            submissions={submissionsData?.submissions || []}
            isLoading={isLoadingSubmissions}
            onViewSubmission={handleViewSubmission}
            onGradeSubmission={handleGradeSubmission}
          />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Homework"
        description={`Are you sure you want to delete "${homework.title}"? This action cannot be undone and will remove all submissions.`}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}

function HomeworkDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-60 w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
