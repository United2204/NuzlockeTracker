import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { OfflineBanner } from './components/OfflineBanner';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { RunsPage } from './pages/RunsPage';
import { NewRunPage } from './pages/NewRunPage';
import { RunDetailPage } from './pages/RunDetailPage';
import { TeamPage } from './pages/TeamPage';
import { RunStatsPage } from './pages/RunStatsPage';
import { ProfilePage } from './pages/ProfilePage';
import { FeedPage } from './pages/FeedPage';
import { PublicProfilePage } from './pages/PublicProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { OAuth2CallbackPage } from './pages/OAuth2CallbackPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { useSyncFlush } from './hooks/useSyncFlush';
import { ToastProvider } from './components/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function SyncManager() {
  useSyncFlush();
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
        <BrowserRouter>
          <OfflineBanner />
          <SyncManager />
          <Routes>
            <Route path="/login"           element={<LoginPage />} />
            <Route path="/register"        element={<RegisterPage />} />
            <Route path="/verify-email"    element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password"  element={<ResetPasswordPage />} />
            <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />

            <Route path="/runs"              element={<RunsPage />} />
            <Route path="/runs/new"          element={<NewRunPage />} />
            <Route path="/runs/:runId"       element={<RunDetailPage />} />
            <Route path="/runs/:runId/team"  element={<TeamPage />} />
            <Route path="/runs/:runId/stats" element={<ProtectedRoute><RunStatsPage /></ProtectedRoute>} />
            <Route path="/profile"           element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/feed"              element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
            <Route path="/u/:username"       element={<ProtectedRoute><PublicProfilePage /></ProtectedRoute>} />

            <Route path="/settings"                      element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/runs" replace />} />
          </Routes>
        </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
