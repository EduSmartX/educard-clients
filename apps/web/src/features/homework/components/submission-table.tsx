/**
 * Submission Table Component
 * Displays homework submissions in a sortable table with quick actions.
 */

import { memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock, Eye, FileText, MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { HOMEWORK_UI } from '@educard/shared';

import {
  getSubmissionStatusColor,
  getSubmissionStatusLabel,
  type HomeworkSubmission,
  type SubmissionStatus,
} from '../types';

interface SubmissionTableProps {
  submissions: HomeworkSubmission[];
  homeworkId: string;
  isLoading?: boolean;
}

const TABLE_HEADERS = {
  STUDENT: 'Student',
  STATUS: 'Status',
  SUBMITTED: 'Submitted',
  REVIEWED_BY: 'Reviewed By',
  ACTIONS: 'Actions',
} as const;

const SKELETON_ROWS = 5;

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('');
}

const StatusBadge = memo(({ status }: { status: SubmissionStatus }) => {
  const color = getSubmissionStatusColor(status);
  const label = getSubmissionStatusLabel(status);

  return (
    <Badge
      variant="outline"
      className="border-0 px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}15`, color }}
    >
      {label}
    </Badge>
  );
});

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...new Array(SKELETON_ROWS)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export const SubmissionTable = memo(
  ({ submissions, homeworkId, isLoading = false }: SubmissionTableProps) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleReviewClick = (submission: HomeworkSubmission) => {
      const returnUrl = encodeURIComponent(location.pathname + location.search);
      navigate(
        `/homework/${homeworkId}/submissions/${submission.public_id}/review?returnUrl=${returnUrl}`
      );
    };

    if (isLoading) {
      return <TableSkeleton />;
    }

    if (submissions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12 text-center">
          <FileText className="mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-900">{HOMEWORK_UI.NO_SUBMISSIONS_YET}</h3>
          <p className="mt-1 text-sm text-slate-500">{HOMEWORK_UI.NO_SUBMISSIONS_DESC}</p>
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="w-[250px]">{TABLE_HEADERS.STUDENT}</TableHead>
              <TableHead>{TABLE_HEADERS.STATUS}</TableHead>
              <TableHead>{TABLE_HEADERS.SUBMITTED}</TableHead>
              <TableHead>{TABLE_HEADERS.REVIEWED_BY}</TableHead>
              <TableHead className="text-right">{TABLE_HEADERS.ACTIONS}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.public_id} className="hover:bg-slate-50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs">
                        {getInitials(submission.student_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-900">{submission.student_name}</p>
                      <p className="text-xs text-slate-500">
                        {HOMEWORK_UI.ROLL}: {submission.student_roll_number}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={submission.status} />
                    {!!submission.is_late && (
                      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600">
                        {HOMEWORK_UI.LATE}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Clock className="h-4 w-4" />
                    {format(new Date(submission.submitted_at), 'MMM d, h:mm a')}
                  </div>
                </TableCell>
                <TableCell>
                  {submission.reviewed_by_name ? (
                    <div className="text-sm">
                      <p className="font-medium text-slate-900">{submission.reviewed_by_name}</p>
                      {!!submission.reviewed_at && (
                        <p className="text-xs text-slate-500">
                          {format(new Date(submission.reviewed_at), 'MMM d')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReviewClick(submission)}
                      title="View submission"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={submission.status === 'reviewed' ? 'outline' : 'default'}
                      onClick={() => handleReviewClick(submission)}
                      className="gap-1.5"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {submission.status === 'reviewed' ? 'Edit' : 'Review'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
);

export default SubmissionTable;
