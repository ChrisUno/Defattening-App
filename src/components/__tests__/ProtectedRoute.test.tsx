import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock stores
let mockCurrentUser: any = null;
let mockHasActiveParticipation = true;
let mockIsHydrated = true;

vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector: any) => {
    const state = {
      currentUser: mockCurrentUser,
      hasActiveParticipation: mockHasActiveParticipation,
    };
    return selector(state);
  },
}));

vi.mock('../../store/dataStore', () => ({
  useDataStore: (selector: any) => {
    const state = { isHydrated: mockIsHydrated };
    return selector(state);
  },
}));

// Mock react-router
const mockNavigate = vi.fn();
let mockPathname = '/dashboard';

vi.mock('react-router', () => ({
  Navigate: (props: any) => {
    mockNavigate(props.to);
    return null;
  },
  useLocation: () => ({ pathname: mockPathname }),
}));

import { ProtectedRoute } from '../ProtectedRoute';

beforeEach(() => {
  vi.clearAllMocks();
  mockCurrentUser = null;
  mockHasActiveParticipation = true;
  mockIsHydrated = true;
  mockPathname = '/dashboard';
});

describe('ProtectedRoute', () => {
  it('redirects to / when no user', () => {
    mockCurrentUser = null;
    render(<ProtectedRoute>Content</ProtectedRoute>);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('renders children when authed', () => {
    mockCurrentUser = { role: 'user', isTempAdmin: false };
    render(<ProtectedRoute>Protected Content</ProtectedRoute>);
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects non-admin to /dashboard when requireAdmin', () => {
    mockCurrentUser = { role: 'user', isTempAdmin: false };
    render(<ProtectedRoute requireAdmin>Admin Area</ProtectedRoute>);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('allows admin when requireAdmin', () => {
    mockCurrentUser = { role: 'admin', isTempAdmin: false };
    render(<ProtectedRoute requireAdmin>Admin Area</ProtectedRoute>);
    expect(screen.getByText('Admin Area')).toBeInTheDocument();
  });

  it('allows temp admin when requireAdmin', () => {
    mockCurrentUser = { role: 'user', isTempAdmin: true };
    render(<ProtectedRoute requireAdmin>Admin Area</ProtectedRoute>);
    expect(screen.getByText('Admin Area')).toBeInTheDocument();
  });

  it('shows loading spinner when not hydrated', () => {
    mockCurrentUser = { role: 'user', isTempAdmin: false };
    mockIsHydrated = false;
    render(<ProtectedRoute>Content</ProtectedRoute>);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });
});
