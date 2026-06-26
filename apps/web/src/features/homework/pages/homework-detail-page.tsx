/**
 * Homework Detail Page
 * View homework details, attachments, videos, and submissions
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Calendar,
  FileText,
  Link as LinkIcon,
  Download,
  ExternalLink,
  Pencil,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { DeleteConfirmationDialog } from '@/components/common';
import { cn } from '@/lib/utils';
import { getMediaUrl } from '@/lib/utils/media-utils';

import { SubmissionTable } from '../components';
import {
  useHomeworkDetail,
  useHomeworkSubmissions,
  useDeleteHomework,
  useHomeworkList,
} from '../hooks';

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

  // Fetch homework list for the same class & date to enable prev/next navigation
  const { data: homeworkList } = useHomeworkList(
    homework
      ? {
          class_public_id: homework.class_public_id,
          assigned_date: homework.assigned_date,
        }
      : undefined
  );

  // Compute prev/next homework for same class
  const { prevHomework, nextHomework } = useMemo(() => {
    if (!homeworkList || !publicId) {
      return { prevHomework: null, nextHomework: null };
    }
    const currentIndex = homeworkList.findIndex((h) => h.public_id === publicId);
    if (currentIndex === -1) {
      return { prevHomework: null, nextHomework: null };
    }
    return {
      prevHomework: currentIndex > 0 ? homeworkList[currentIndex - 1] : null,
      nextHomework: currentIndex < homeworkList.length - 1 ? homeworkList[currentIndex + 1] : null,
    };
  }, [homeworkList, publicId]);

  // Mutations
  const deleteMutation = useDeleteHomework();

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
      toast.success('Homework deleted successfully');
      navigate('/homework');
    }
  };

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
        <Button variant="outline" onClick={handleBack} className="mt-4">
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
      {/* Top Header Row: Title + Dates + Edit */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{homework.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {homework.subject_name} • {homework.class_name}
          </p>
          {!!homework.chapter && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="gap-1 text-xs">
                <BookOpen className="h-3 w-3" />
                {homework.chapter}
              </Badge>
            </div>
          )}
        </div>

        {/* Dates inline */}
        <div className="flex items-center gap-4">
          {!!homework.assigned_date && (
            <div className="flex items-center gap-2 rounded-lg border bg-green-50 px-3 py-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-[10px] font-medium text-green-600 uppercase">Homework For</p>
                <p className="text-sm font-semibold text-green-800">
                  {format(new Date(homework.assigned_date), 'EEE, MMM d, yyyy')}
                </p>
              </div>
            </div>
          )}
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2',
              homework.is_overdue ? 'bg-red-50' : 'bg-blue-50'
            )}
          >
            <Calendar
              className={cn('h-4 w-4', homework.is_overdue ? 'text-red-600' : 'text-blue-600')}
            />
            <div>
              <p
                className={cn(
                  'text-[10px] font-medium uppercase',
                  homework.is_overdue ? 'text-red-600' : 'text-blue-600'
                )}
              >
                Due Date
              </p>
              <p
                className={cn(
                  'text-sm font-semibold',
                  homework.is_overdue ? 'text-red-800' : 'text-blue-800'
                )}
              >
                {format(new Date(homework.due_datetime), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleEdit} className="gap-1">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="submissions">
            Submissions
            {!!homework.submission_stats && (
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
              {!!homework.description && (
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
              {!!homework.instructions && (
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
              {!!homework.reference_link && (
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

            {/* Sidebar - Only Submissions + Details */}
            <div className="space-y-6">
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
                <CardContent className="text-sm">
                  <dl className="space-y-3">
                    <div className="flex">
                      <dt className="w-36 shrink-0 text-slate-500">Priority</dt>
                      <dd className="font-semibold text-slate-800">
                        : {homework.priority.charAt(0).toUpperCase() + homework.priority.slice(1)}
                      </dd>
                    </div>
                    <div className="flex">
                      <dt className="w-36 shrink-0 text-slate-500">Assigned By</dt>
                      <dd className="font-semibold text-slate-800">
                        : {homework.assigned_by_name}
                      </dd>
                    </div>
                    <div className="flex">
                      <dt className="w-36 shrink-0 text-slate-500">Submission Type</dt>
                      <dd className="font-semibold text-slate-800 capitalize">
                        : {homework.submission_type.replace('_', ' ')}
                      </dd>
                    </div>
                    <div className="flex">
                      <dt className="w-36 shrink-0 text-slate-500">Status</dt>
                      <dd className="font-semibold text-slate-800 capitalize">
                        : {homework.status}
                      </dd>
                    </div>
                    <div className="flex">
                      <dt className="w-36 shrink-0 text-slate-500">Created</dt>
                      <dd className="font-semibold text-slate-800">
                        : {format(new Date(homework.created_at), 'MMM d, yyyy')}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="mt-6">
          <SubmissionTable
            submissions={submissionsData?.submissions || []}
            homeworkId={publicId || ''}
            isLoading={isLoadingSubmissions}
          />
        </TabsContent>
      </Tabs>

      {/* Prev / Next Navigation */}
      {(prevHomework || nextHomework) && (
        <div className="flex items-center justify-between border-t pt-6">
          {prevHomework ? (
            <Button
              variant="outline"
              onClick={() => navigate(`/homework/${prevHomework.public_id}`)}
              className="gap-2 border-blue-200 bg-blue-50 hover:border-blue-300 hover:bg-blue-100"
            >
              <ChevronLeft className="h-4 w-4 text-blue-600" />
              <div className="text-left">
                <p className="text-[10px] text-blue-600 uppercase">Previous</p>
                <p className="text-sm font-medium text-blue-900">{prevHomework.subject_name}</p>
              </div>
            </Button>
          ) : (
            <div />
          )}
          {nextHomework ? (
            <Button
              variant="outline"
              onClick={() => navigate(`/homework/${nextHomework.public_id}`)}
              className="gap-2 border-green-200 bg-green-50 hover:border-green-300 hover:bg-green-100"
            >
              <div className="text-right">
                <p className="text-[10px] text-green-600 uppercase">Next</p>
                <p className="text-sm font-medium text-green-900">{nextHomework.subject_name}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-green-600" />
            </Button>
          ) : (
            <div />
          )}
        </div>
      )}

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
