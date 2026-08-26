import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const isLoggedIn =
    localStorage.getItem('isAdminLoggedIn') === 'true';

  if (!isLoggedIn) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}