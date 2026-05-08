/**
 * Teacher Table Columns Configuration for DataTable
 * Creates column definitions for the teachers list table
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, RotateCcw } from 'lucide-react';
import type { Column } from '@/components/ui/data-table';
import { formatPhoneNumber } from '@/lib/phone-utils';
import type { Teacher } from '../types';
import { createCommonColumns } from '@/components/tables/common-columns';
import { UserAvatar } from '@/components/common/user-avatar';

interface CreateColumnsParams {
  onView: (teacher: Teacher) => void;
  onEdit: (teacher: Teacher) => void;
  onDelete?: (teacher: Teacher) => void;
  isDeletedView?: boolean;
  viewMode?: 'admin' | 'employee'; // Admin = show all, Employee = hide phone & actions
}

export function createTeacherListColumns({
  onView,
  onEdit,
  onDelete,
  isDeletedView = false,
  viewMode = 'admin',
}: CreateColumnsParams): Column<Teacher>[] {
  const isEmployeeView = viewMode === 'employee';

  return [
    {
      header: 'Photo',
      accessor: (row) => (
        <UserAvatar
          thumbnailUrl={row.profile_photo_thumbnail}
          gender={row.gender}
          name={row.full_name}
          className="h-9 w-9"
        />
      ),
      width: 50,
    },
    {
      header: 'Employee ID',
      accessor: (row) => <span className="font-medium text-gray-900">{row.employee_id}</span>,
      sortable: true,
      sortKey: 'employee_id',
      width: 120,
    },
    {
      header: 'Name',
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.full_name}</span>
          <span className="text-sm text-gray-500">{row.email}</span>
        </div>
      ),
      sortable: true,
      sortKey: 'user__first_name',
      width: 250,
    },
    // Phone column - Hidden for employee view (security)
    ...(!isEmployeeView
      ? [
          {
            header: 'Phone',
            accessor: (row: Teacher) => (
              <span className="text-gray-700">
                {row.phone ? formatPhoneNumber(row.phone) : '—'}
              </span>
            ),
            width: 140,
          } as Column<Teacher>,
        ]
      : []),
    {
      header: 'Designation',
      accessor: (row) => (
        <Badge variant="secondary" className="font-medium">
          {row.designation || '—'}
        </Badge>
      ),
      sortable: true,
      sortKey: 'designation',
      width: 180,
    },
    {
      header: 'Experience',
      accessor: (row) => (
        <span className="text-gray-700">
          {row.experience_years ? `${row.experience_years} years` : '—'}
        </span>
      ),
      sortable: true,
      sortKey: 'experience_years',
      width: 120,
    },
    {
      header: 'Subjects',
      accessor: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.subjects && Array.isArray(row.subjects) && row.subjects.length > 0 ? (
            row.subjects.slice(0, 2).map((subject) => (
              <Badge key={subject.public_id} variant="outline" className="text-xs">
                {subject.name}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-gray-500">—</span>
          )}
          {row.subjects && row.subjects.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{row.subjects.length - 2}
            </Badge>
          )}
        </div>
      ),
      width: 200,
    },
    // Common columns: Created, Updated, Actions
    ...(isEmployeeView
      ? [
          // Employee view - Show only View action
          {
            header: 'Actions',
            accessor: (teacher: Teacher) => (
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(teacher);
                  }}
                  className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  title="View details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ),
            headerClassName: 'text-right',
          } as Column<Teacher>,
        ]
      : isDeletedView
        ? [
            {
              header: 'Actions',
              accessor: (teacher) => (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(teacher);
                    }}
                    className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(teacher);
                      }}
                      className="text-green-600 hover:bg-green-50 hover:text-green-700"
                      title="Restore Teacher"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ),
              headerClassName: 'text-right',
            } as Column<Teacher>,
          ]
        : createCommonColumns<Teacher>(
            { onView, onEdit, onDelete },
            {
              actionsOptions: {
                variant: 'buttons',
                align: 'right',
              },
            }
          )),
  ];
}
