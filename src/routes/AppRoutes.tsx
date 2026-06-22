import { Routes, Route, Navigate } from 'react-router-dom';

import Home from '../components/layout/page';
import Dashboard from '../pages/Dashboard';
import Clients from '../pages/Clients';
import ExportClients from '../pages/ExportClients';
import ClientDashboard from '../pages/ClientDashboard';
import Login from '../pages/Login';
import ProtectedRoute from './ProtectedRoute';
import DocumentTypePage from '@/pages/DocumentTypePage';
import ClientPortalUploads from '@/pages/ClientPortalUploads';
import ClientDocumentSearch from '@/pages/ClientDocumentSearch';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/client-dashboard" element={<ClientDashboard />} />
      <Route path="/login" element={<Login />} />

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
        path="/dashboard/export-clients"
        element={
          <ProtectedRoute>
            <ExportClients />
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
        path="/dashboard/client-portal-uploads"
        element={
          <ProtectedRoute>
            <ClientPortalUploads />
          </ProtectedRoute>
        }
      />

      <Route
  path="/dashboard/client-search"
  element={
    <ProtectedRoute>
      <ClientDocumentSearch/>
    </ProtectedRoute>
  }
/>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
