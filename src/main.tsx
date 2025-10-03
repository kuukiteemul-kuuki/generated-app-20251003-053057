import { enableMapSet } from "immer";
enableMapSet();
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css';
import { HomePage } from '@/pages/HomePage';
import { SuperAdminDashboard } from '@/pages/SuperAdminDashboard';
import { AssociationDashboard } from '@/pages/AssociationDashboard';
import { MembersPage } from '@/pages/MembersPage';
import { MemberView } from '@/pages/MemberView';
import { ProtectedRoute } from '@/components/ProtectedRoute';
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/super-admin",
    element: <ProtectedRoute roles={['SuperAdmin']} />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <SuperAdminDashboard /> },
    ],
  },
  {
    path: "/association/:id",
    element: <ProtectedRoute roles={['AssociationAdmin', 'Member']} />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: "dashboard", element: <AssociationDashboard /> },
      { path: "members", element: <MembersPage /> },
      { path: "member/:memberId", element: <MemberView /> },
    ],
  },
]);
// Do not touch this code
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
);