import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { RequireAuth, PublicOnly } from '../components/navigation/RouteGuards';
import { LandingPage } from '../features/landing/LandingPage';
import { LoginPage } from '../features/auth/LoginPage';
import { RoleDashboard } from '../features/dashboard/RoleDashboard';
import { ApplicationsListPage } from '../features/applications/ApplicationsListPage';
import { ApplicationCreatePage } from '../features/applications/ApplicationCreatePage';
import { ApplicationDetailPage } from '../features/applications/ApplicationDetailPage';
import { OfficerQueuePage } from '../features/officer/OfficerQueuePage';
import { EvidenceReviewPage } from '../features/officer/EvidenceReviewPage';
import { ReportPage } from '../features/reports/ReportPage';
import { VerifierPage } from '../features/verifier/VerifierPage';
import { AdminUsersPage } from '../features/admin/AdminUsersPage';
import { AdminChecklistsPage } from '../features/admin/AdminChecklistsPage';
import { AuditPage } from '../features/audit/AuditPage';
import { AlertsPage } from '../features/alerts/AlertsPage';
import {
  Forbidden403,
  NotFound404,
  ServerError500,
  Unauthorized401,
} from '../components/feedback/ErrorPages';

export const router = createBrowserRouter([
  // Public Landing Page (Static, calls no business API)
  {
    path: '/',
    element: <LandingPage />,
  },

  // Public Login Route
  {
    path: '/login',
    element: (
      <PublicOnly>
        <LoginPage />
      </PublicOnly>
    ),
  },

  // Protected Application Shell & Workspaces
  {
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      {
        path: '/app',
        element: <RoleDashboard />,
      },
      {
        path: '/applications',
        element: <ApplicationsListPage />,
      },
      {
        path: '/applications/new',
        element: <ApplicationCreatePage />,
      },
      {
        path: '/applications/:id',
        element: <ApplicationDetailPage />,
      },
      {
        path: '/applications/:id/upload',
        element: <ApplicationDetailPage />,
      },
      {
        path: '/applications/:id/rectify',
        element: <ApplicationDetailPage />,
      },
      {
        path: '/applications/:id/review',
        element: <EvidenceReviewPage />,
      },
      {
        path: '/officer/queue',
        element: <OfficerQueuePage />,
      },
      {
        path: '/verifications',
        element: <VerifierPage />,
      },
      {
        path: '/alerts',
        element: <AlertsPage />,
      },
      {
        path: '/reports/:id',
        element: <ReportPage />,
      },
      {
        path: '/admin/users',
        element: <AdminUsersPage />,
      },
      {
        path: '/admin/checklists',
        element: <AdminChecklistsPage />,
      },
      {
        path: '/audit',
        element: <AuditPage />,
      },
    ],
  },

  // Dedicated Error Pages
  {
    path: '/401',
    element: <Unauthorized401 />,
  },
  {
    path: '/403',
    element: <Forbidden403 />,
  },
  {
    path: '/500',
    element: <ServerError500 />,
  },
  {
    path: '*',
    element: <NotFound404 />,
  },
]);
