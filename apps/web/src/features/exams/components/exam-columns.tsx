/**
 * Exam Table Columns Configuration
 * Matches the Exam interface: session_name, subject_name, class_name, status, etc.
 */

import { Eye, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Column } from '@/components/ui/data-table';
import {
  EXAM_STATUS_LABELS,
  EXAM_SESSION_TYPE_LABELS,
  type Exam,
  type ExamStatus,
  type ExamSessionType,
} from '../types';
import { format } from 'date-fns';

interface CreateColumnsParams {
  onView: (exam: Exam) => void;
  onEdit?: (exam: Exam) => void;
  onDelete?: (exam: Exam) => void;
  isDeletedView?: boolean;
}

const statusBadgeClass: Record<ExamStatus, string> = {
  draft: 'bg-gray-50 text-gray-700 border-gray-200',
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const sessionTypeBadgeClass: Record<ExamSessionType, string> = {
  unit_test: 'bg-purple-50 text-purple-700 border-purple-200',
  quarterly: 'bg-blue-50 text-blue-700 border-blue-200',
  half_yearly: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  annual: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  custom: 'bg-gray-50 text-gray-700 border-gray-200',
};

export function createExamColumns({
  onView,
  onEdit,
  onDelete,
  isDeletedView = false,
}: CreateColumnsParams): Column<Exam>[] {
  return [
    {
      header: 'Session',
      accessor: (row) => (
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-gray-900">{row.session_name}</span>
          <Badge
            variant="outline"
            className={`text-xs font-medium w-fit ${sessionTypeBadgeClass[row.session_type] || ''}`}
          >
            {EXAM_SESSION_TYPE_LABELS[row.session_type] || row.session_type}
          </Badge>
        </div>
      ),
      sortable: true,
      sortKey: 'session_name',
      width: 180,
    },
    {
      header: 'Session Duration',
      accessor: (row) => {
        if (!row.session_start_date && !row.session_end_date) {
          return <span className="text-gray-400 italic text-sm">Not set</span>;
        }
        return (
          <div className="flex flex-col gap-0.5 text-sm">
            {row.session_start_date && (
              <span className="text-gray-700">
                {format(new Date(row.session_start_date), 'dd MMM yyyy')}
              </span>
            )}
            {row.session_end_date && (
              <span className="text-xs text-gray-500">
                to {format(new Date(row.session_end_date), 'dd MMM yyyy')}
              </span>
            )}
          </div>
        );
      },
      width: 140,
    },
    {
      header: 'Subject',
      accessor: (row) => (
        <span className="font-medium text-gray-900">{row.subject_name}</span>
      ),
      sortable: true,
      sortKey: 'subject_name',
      width: 150,
    },
    {
      header: 'Class',
      accessor: (row) => (
        <Badge variant="secondary" className="text-xs font-medium">
          {row.class_name}
        </Badge>
      ),
      sortable: true,
      sortKey: 'class_name',
      width: 120,
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge
          variant="outline"
          className={`text-xs font-medium ${statusBadgeClass[row.status] || ''}`}
        >
          {EXAM_STATUS_LABELS[row.status] || row.status}
        </Badge>
      ),
      sortable: true,
      sortKey: 'status',
      width: 110,
    },
    {
      header: 'Exam Date',
      accessor: (row) => {
        if (!row.date) {
          return <span className="text-gray-400 italic">Not set</span>;
        }
        return (
          <div className="flex flex-col gap-0.5 text-sm">
            <span className="text-gray-700">{format(new Date(row.date), 'dd MMM yyyy')}</span>
            {row.start_time && row.end_time && (
              <span className="text-xs text-gray-500">
                {row.start_time.slice(0, 5)} - {row.end_time.slice(0, 5)}
              </span>
            )}
          </div>
        );
      },
      sortable: true,
      sortKey: 'date',
      width: 130,
    },
    {
      header: 'Marks',
      accessor: (row) => (
        <div className="flex flex-col gap-0.5 text-sm">
          <span className="font-medium text-gray-700">Max: {row.max_marks}</span>
          <span className="text-xs text-gray-500">Pass: {row.passing_marks}</span>
        </div>
      ),
      width: 90,
    },
    {
      header: 'Actions',
      accessor: (exam) => (
        <div className="flex items-center gap-1">
          {isDeletedView ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(exam);
              }}
              title="Restore"
            >
              <RotateCcw className="h-4 w-4 text-green-600" />
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(exam);
                }}
                title="View"
              >
                <Eye className="h-4 w-4" />
              </Button>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(exam);
                  }}
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(exam);
                  }}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </>
          )}
        </div>
      ),
      width: 100,
    },
  ];
}
