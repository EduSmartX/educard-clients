/**
 * Leave Feature Routes Configuration
 * Add these routes to your App.tsx or router configuration
 */

// Import the pages
import LeaveAllocationsListPage from '@/features/leave/pages/leave-allocations-page';
import LeaveDashboardPage from '@/features/leave/pages/leave-dashboard-page';
import LeaveRequestFormPage from '@/features/leave/pages/leave-request-form-page';

// Add these routes to your router configuration
// Example using React Router v6/v7:

export const leaveRoutes = [
  // Leave Allocations (Admin)
  {
    path: '/admin/leave/allocations',
    element: <LeaveAllocationsListPage />,
  },

  // Leave Management (All Users)
  {
    path: '/leave/dashboard',
    element: <LeaveDashboardPage />,
  },
  {
    path: '/leave/requests/new',
    element: <LeaveRequestFormPage />,
  },
  {
    path: '/leave/requests/:id',
    element: <LeaveRequestFormPage />,
  },
  {
    path: '/leave/requests/:id/edit',
    element: <LeaveRequestFormPage />,
  },
];

// Ensure your ROUTES constant includes:
export const ROUTES = {
  ADMIN: {
    LEAVE: {
      ALLOCATIONS: '/admin/leave/allocations',
    },
  },
  LEAVE: {
    DASHBOARD: '/leave/dashboard',
    REQUESTS: {
      NEW: '/leave/requests/new',
      VIEW: (id: string) => `/leave/requests/${id}`,
      EDIT: (id: string) => `/leave/requests/${id}/edit`,
    },
  },
};
