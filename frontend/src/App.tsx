import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { RunsPage } from './pages/RunsPage';
import { NewRunPage } from './pages/NewRunPage';
import { RunDetailPage } from './pages/RunDetailPage';
import { TeamPage } from './pages/TeamPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"        element={<LoginPage />} />
            <Route path="/register"     element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            <Route path="/runs"         element={<ProtectedRoute><RunsPage /></ProtectedRoute>} />
            <Route path="/runs/new"     element={<ProtectedRoute><NewRunPage /></ProtectedRoute>} />
            <Route path="/runs/:runId"  element={<ProtectedRoute><RunDetailPage /></ProtectedRoute>} />
            <Route path="/runs/:runId/team" element={<ProtectedRoute><TeamPage /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/runs" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
