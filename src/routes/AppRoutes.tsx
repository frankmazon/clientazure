import { useEffect } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

import Home from '../components/layout/page';
import Dashboard from '../pages/Dashboard';
import Clients from '../pages/Clients';
import Referrers from '../pages/Referrers';
import ExportClients from '../pages/ExportClients';
import ClientDashboard from '../pages/ClientDashboard';
import Login from '../pages/Login';
import ProtectedRoute from './ProtectedRoute';

import DocumentTypePage from '@/pages/DocumentTypePage';
import ClientPortalUploads from '@/pages/ClientPortalUploads';
import ClientDocumentSearch from '@/pages/ClientDocumentSearch';

const FAVICON_PATH = '/logo/logo%20header.png';

function PageMetadata() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    // Client and referrer portal
    if (path === '/clients' || path === '/client-dashboard') {
      document.title = 'Client Dashboard | SBR Funding';
    }
    // Administrator login and dashboard pages
    else if (
      path === '/admin' ||
      path === '/login' ||
      path.startsWith('/dashboard')
    ) {
      document.title = 'Admin Dashboard | SBR Funding';
    }
    // Public client submission page
    else {
      document.title = 'Scenario | SBR Funding';
    }

    // Add or update the browser-tab logo.
    let favicon = document.querySelector<HTMLLinkElement>(
      "link[rel='icon']",
    );

    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }

    favicon.type = 'image/png';
    favicon.href = FAVICON_PATH;
  }, [location.pathname]);

  return null;
}

function DomainLanding() {
  const hostname = window.location.hostname.toLowerCase();

  // Opening the dashboard domain without a path
  // automatically opens the admin login.
  if (hostname === 'dashboard.sbrfunding.com.au') {
    return <Navigate to="/admin" replace />;
  }

  // Scenarios domain and localhost show the submission form.
  return <Home />;
}

export default function AppRoutes() {
  return (
    <>
      <PageMetadata />

      <Routes>
        {/* Submission page */}
        <Route path="/" element={<DomainLanding />} />

        {/* Public portal pages */}
        <Route path="/admin" element={<Login />} />
        <Route path="/clients" element={<ClientDashboard />} />

        {/* Redirect old URLs */}
        <Route
          path="/login"
          element={<Navigate to="/admin" replace />}
        />

        <Route
          path="/client-dashboard"
          element={<Navigate to="/clients" replace />}
        />

        {/* Protected administrator pages */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/clients"
          element={
            <ProtectedRoute>
              <Clients />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/referrers"
          element={
            <ProtectedRoute>
              <Referrers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/client-search"
          element={
            <ProtectedRoute>
              <ClientDocumentSearch />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/client-portal-uploads"
          element={
            <ProtectedRoute>
              <ClientPortalUploads />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/documents/:type"
          element={
            <ProtectedRoute>
              <DocumentTypePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/export-clients"
          element={
            <ProtectedRoute>
              <ExportClients />
            </ProtectedRoute>
          }
        />

        {/* Unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}