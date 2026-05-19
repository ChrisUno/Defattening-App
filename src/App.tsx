import { useEffect, useRef, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import ResultsPage from './pages/ResultsPage';
import JournalPage from './pages/JournalPage';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastViewport } from './components/ui/Toast';
import { ErrorBanner } from './components/ErrorBanner';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useAuthStore } from './store/authStore';
import { useDataStore } from './store/dataStore';

const queryClient = new QueryClient();

function AppInitializer({ children }: { children: ReactNode }) {
  const checkSession = useAuthStore((s) => s.checkSession);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useDataStore((s) => s.isHydrated);
  const hydrate = useDataStore((s) => s.hydrate);
  const hydratingRef = useRef(false);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (isAuthenticated && !isHydrated && !hydratingRef.current) {
      hydratingRef.current = true;
      hydrate().finally(() => { hydratingRef.current = false; });
    }
    if (!isAuthenticated && isHydrated) {
      useDataStore.setState({
        users: [], sessions: [], participations: [],
        weighIns: [], journals: [], activityFeed: [],
        weighInStatuses: [],
        activeSessionId: '', isHydrated: false,
      });
    }
  }, [isAuthenticated, isHydrated, hydrate]);

  if (isLoading) return <LoadingSpinner />;

  return <>{children}</>;
}

interface AppProps {
  basename?: string;
}

const App = ({ basename }: AppProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={basename}>
        <AppInitializer>
          <ErrorBanner />
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <LeaderboardPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/results"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ResultsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/journal"
              element={
                <ProtectedRoute>
                  <Layout>
                    <JournalPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastViewport />
        </AppInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
