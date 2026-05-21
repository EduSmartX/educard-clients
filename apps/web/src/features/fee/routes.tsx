/**
 * Fee Routes Configuration
 * Routes for the fee management feature
 */

import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

// Admin pages (lazy loaded)
const FeeDashboardPage = lazy(() =>
  import('./admin/pages/fee-dashboard-page').then((m) => ({ default: m.FeeDashboardPage }))
);
const FeeStructuresPage = lazy(() =>
  import('./admin/pages/fee-structures-page').then((m) => ({ default: m.FeeStructuresPage }))
);
const CreateFeeStructurePage = lazy(() =>
  import('./admin/pages/create-fee-structure-page').then((m) => ({
    default: m.CreateFeeStructurePage,
  }))
);
const EditFeeStructurePage = lazy(() =>
  import('./admin/pages/edit-fee-structure-page').then((m) => ({ default: m.EditFeeStructurePage }))
);
const StudentFeesPage = lazy(() =>
  import('./admin/pages/student-fees-page').then((m) => ({ default: m.StudentFeesPage }))
);
const StudentFeeDetailPage = lazy(() =>
  import('./admin/pages/student-fee-detail-page').then((m) => ({ default: m.StudentFeeDetailPage }))
);
const PaymentsPage = lazy(() =>
  import('./admin/pages/payments-page').then((m) => ({ default: m.PaymentsPage }))
);

// Parent pages (lazy loaded)
const ParentFeeDashboardPage = lazy(() =>
  import('./parent/pages/parent-fee-dashboard-page').then((m) => ({
    default: m.ParentFeeDashboardPage,
  }))
);
const ParentPaymentHistoryPage = lazy(() =>
  import('./parent/pages/parent-payment-history-page').then((m) => ({
    default: m.ParentPaymentHistoryPage,
  }))
);

/**
 * Admin fee routes
 */
export const adminFeeRoutes: RouteObject[] = [
  {
    path: 'fees',
    children: [
      {
        index: true,
        element: <FeeDashboardPage />,
      },
      {
        path: 'structures',
        children: [
          {
            index: true,
            element: <FeeStructuresPage />,
          },
          {
            path: 'new',
            element: <CreateFeeStructurePage />,
          },
          {
            path: ':id/edit',
            element: <EditFeeStructurePage />,
          },
        ],
      },
      {
        path: 'students',
        children: [
          {
            index: true,
            element: <StudentFeesPage />,
          },
          {
            path: ':id',
            element: <StudentFeeDetailPage />,
          },
        ],
      },
      {
        path: 'payments',
        element: <PaymentsPage />,
      },
    ],
  },
];

/**
 * Parent fee routes
 */
export const parentFeeRoutes: RouteObject[] = [
  {
    path: 'fees',
    children: [
      {
        index: true,
        element: <ParentFeeDashboardPage />,
      },
      {
        path: 'payments',
        element: <ParentPaymentHistoryPage />,
      },
    ],
  },
];
