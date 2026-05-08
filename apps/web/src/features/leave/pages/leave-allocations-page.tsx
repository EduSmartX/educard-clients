/**
 * Leave Allocations Page - Refactored Modular Version
 * Main orchestrator component that handles routing and delegates to specialized components
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { USER_ROLES } from '@/constants';
import { ROUTES } from '@/constants/app-config';
import { useLeaveAllocations } from '../hooks/use-leave-allocations';
import { LeaveAllocationsList } from '../components/leave-allocations-list';
import { LeaveAllocationFormPage } from '../components/leave-allocation-form-page';
import type { LeaveAllocation } from '@/lib/api/leave-api';

type PageMode = 'list' | 'create' | 'edit' | 'view';

export default function LeaveAllocationsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  // Check if user is a teacher (read-only mode)
  const isTeacher = user?.role === USER_ROLES.TEACHER;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Determine page mode from URL
  const mode: PageMode = id
    ? window.location.pathname.endsWith('/edit')
      ? 'edit'
      : 'view'
    : window.location.pathname.endsWith('/create')
      ? 'create'
      : 'list';

  // Fetch leave allocations (only for list mode)
  const { data, isLoading, error } = useLeaveAllocations({
    searchQuery,
    filters,
    page: currentPage,
    pageSize,
    enabled: mode === 'list',
    readOnly: isTeacher,
  });

  // Navigation handlers
  const handleView = (allocation: LeaveAllocation) => {
    navigate(`${ROUTES.LEAVE.ALLOCATIONS}/${allocation.public_id}`);
  };

  const handleEdit = (allocation: LeaveAllocation) => {
    navigate(`${ROUTES.LEAVE.ALLOCATIONS}/${allocation.public_id}/edit`);
  };

  const handleCreateNew = () => {
    navigate(`${ROUTES.LEAVE.ALLOCATIONS}/create`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Render form modes (create, edit, view)
  if (mode !== 'list') {
    return <LeaveAllocationFormPage mode={mode} allocationId={id} />;
  }

  // List mode below - Don't show full page loader, let the table handle it
  const allocations = data?.data || [];
  const pagination = data?.pagination;

  return (
    <LeaveAllocationsList
      allocations={allocations}
      isLoading={isLoading}
      error={error}
      pagination={pagination}
      onCreateNew={handleCreateNew}
      onView={handleView}
      onEdit={handleEdit}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      onSearch={handleSearch}
      onFilterChange={handleFilterChange}
      readOnly={isTeacher}
    />
  );
}
