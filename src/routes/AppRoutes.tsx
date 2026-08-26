import { Routes, Route, Navigate } from 'react-router-dom';

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

function DomainLanding() {
  const hostname = window.location.hostname.toLowerCase();

  // Opening dashboard.sbrfunding.com.au without a path
  // automatically opens the admin login.
  if (hostname === 'dashboard.sbrfunding.com.au') {
    return <Navigate to="/admin" replace />;
  }

  // scenarios.sbrfunding.com.au and localhost show submission form.
  return <Home />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Submission page */}
      <Route path="/" element={<DomainLanding />} />

      {/* Public portal pages */}
      <Route path="/admin" element={<Login />} />
      <Route path="/clients" element={<ClientDashboard />} />

      {/* Redirect old URLs */}
      <Route path="/login" element={<Navigate to="/admin" replace />} />
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}