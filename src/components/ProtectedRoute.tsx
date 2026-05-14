import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin }: ProtectedRouteProps) => {
  const location = useLocation();
  const userId = useAuthStore((s) => s.currentUserId);
  const users = useDataStore((s) => s.users);
  const participations = useDataStore((s) => s.participations);
  const activeSessionId = useDataStore((s) => s.activeSessionId);

  if (!userId) return <Navigate to="/" replace />;

  const user = users.find((u) => u.id === userId);
  if (!user) return <Navigate to="/" replace />;

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (user.role === 'user') {
    const hasJoined = participations.some(
      (p) => p.userId === userId && p.sessionId === activeSessionId,
    );
    if (!hasJoined && location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
};
