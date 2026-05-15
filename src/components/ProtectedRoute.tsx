import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin }: ProtectedRouteProps) => {
  const location = useLocation();
  const currentUser = useAuthStore((s) => s.currentUser);
  const hasActiveParticipation = useAuthStore((s) => s.hasActiveParticipation);
  const isHydrated = useDataStore((s) => s.isHydrated);

  if (!currentUser) return <Navigate to="/" replace />;

  if (requireAdmin && currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (!isHydrated) return <LoadingSpinner />;

  if (currentUser.role === 'user' && !hasActiveParticipation && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
