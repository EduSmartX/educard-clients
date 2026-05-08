/**
 * Student Table Columns Configuration
 * Following the pattern from teacher-table-columns.tsx
 */

import { Eye, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Column } from '@/components/ui/data-table';
import { formatPhoneNumber } from '@/lib/phone-utils';
import { UserAvatar } from '@/components/common/user-avatar';
import type { StudentListItem } from '../types';

interface GetColumnsOptions {
  onView: (student: StudentListItem) => void;
  onEdit: (student: StudentListItem) => void;
  onDelete: (student: StudentListItem) => void;
  isDeletedView?: boolean;
  isClassTeacher?: boolean; // NEW: Whether user is class teacher
}

export function getStudentColumns({
  onView,
  onEdit,
  onDelete,
  isDeletedView = false,
}: GetColumnsOptions): Column<StudentListItem>[] {
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
      width: 70,
    },
    {
      header: 'Class',
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.class_master_name}</span>
          <span className="text-sm text-gray-500">{row.class_name}</span>
        </div>
      ),
      sortable: true,
      sortKey: 'class_master_name',
      width: 150,
    },
    {
      header: 'Roll Number',
      accessor: 'roll_number',
      sortable: true,
      width: 150,
    },
    {
      header: 'Name',
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.full_name}</span>
          {row.email && <span className="text-sm text-gray-500">{row.email}</span>}
        </div>
      ),
      sortable: true,
      sortKey: 'full_name',
      width: 250,
    },
    {
      header: 'Admission Number',
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.admission_number || '—'}</span>
          {row.admission_date && (
            <span className="text-sm text-gray-500">
              ({new Date(row.admission_date).toLocaleDateString('en-GB')})
            </span>
          )}
        </div>
      ),
      sortable: true,
      sortKey: 'admission_number',
      width: 200,
    },
    {
      header: 'Phone',
      accessor: (row) => (
        <span className="text-gray-700">{row.phone ? formatPhoneNumber(row.phone) : '—'}</span>
      ),
      width: 150,
    },
    {
      header: 'Gender',
      accessor: (row) => {
        const gender = row.gender;
        if (!gender) {
          return <span className="text-gray-400">—</span>;
        }

        const genderLabel = gender === 'M' ? 'Male' : gender === 'F' ? 'Female' : 'Other';
        const genderColor =
          gender === 'M'
            ? 'bg-blue-100 text-blue-800'
            : gender === 'F'
              ? 'bg-pink-100 text-pink-800'
              : 'bg-gray-100 text-gray-800';

        return (
          <Badge variant="secondary" className={genderColor}>
            {genderLabel}
          </Badge>
        );
      },
      width: 120,
    },
    {
      header: 'Actions',
      accessor: (row) => {
        // Check if user can manage this student
        // For class teachers, use can_manage field; admins can manage all
        const canManage = row.can_manage ?? true; // Default true for admins

        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onView(row)} className="h-8 w-8 p-0">
              <Eye className="h-4 w-4" />
              <span className="sr-only">View</span>
            </Button>
            {!isDeletedView && canManage && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(row)} className="h-8 w-8 p-0">
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
            )}
            {canManage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(row)}
                className={
                  isDeletedView
                    ? 'h-8 w-8 p-0 text-green-600 hover:bg-green-50 hover:text-green-700'
                    : 'h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700'
                }
              >
                {isDeletedView ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                <span className="sr-only">{isDeletedView ? 'Reactivate' : 'Delete'}</span>
              </Button>
            )}
          </div>
        );
      },
      width: 150,
    },
  ];
}
