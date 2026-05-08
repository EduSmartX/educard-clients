/**
 * Teacher Table Columns Configuration
 */

import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Teacher } from '../types';

interface GetColumnsOptions {
  onView: (teacher: Teacher) => void;
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
  isDeletedView?: boolean;
}

export function getTeacherColumns({
  onView,
  onEdit,
  onDelete,
  isDeletedView = false,
}: GetColumnsOptions): ColumnDef<Teacher>[] {
  return [
    {
      accessorKey: 'employee_id',
      header: 'Employee ID',
      cell: ({ row }) => (
        <span className="font-medium text-gray-900">{row.original.employee_id}</span>
      ),
    },
    {
      id: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.original.user.full_name}</span>
          <span className="text-sm text-gray-500">{row.original.user.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'user.phone',
      header: 'Phone',
      cell: ({ row }) => <span className="text-gray-700">{row.original.user.phone || '—'}</span>,
    },
    {
      accessorKey: 'designation',
      header: 'Designation',
      cell: ({ row }) => <span className="text-gray-700">{row.original.designation || '—'}</span>,
    },
    {
      id: 'subjects',
      header: 'Subjects',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.subjects.length > 0 ? (
            row.original.subjects.slice(0, 3).map((subject) => (
              <Badge key={subject.public_id} variant="secondary" className="text-xs">
                {subject.name}
              </Badge>
            ))
          ) : (
            <span className="text-gray-400 text-sm">No subjects</span>
          )}
          {row.original.subjects.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{row.original.subjects.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(row.original)}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">View</span>
          </Button>
          {!isDeletedView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(row.original)}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(row.original)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">{isDeletedView ? 'Restore' : 'Delete'}</span>
          </Button>
        </div>
      ),
    },
  ];
}
