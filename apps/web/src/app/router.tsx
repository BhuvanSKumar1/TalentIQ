import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthProvider } from '@/lib/auth';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

// Lazy loaded pages
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const VerifyEmailPage = lazy(() => import('@/pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const JobsPage = lazy(() => import('@/pages/JobsPage'));
const CreateJobPage = lazy(() => import('@/pages/CreateJobPage'));
const EditJobPage = lazy(() => import('@/pages/EditJobPage'));
const JobDetailPage = lazy(() => import('@/pages/JobDetailPage'));
const CandidatesPage = lazy(() => import('@/pages/CandidatesPage').then(m => ({ default: m.CandidatesPage })));
const CandidateDetailPage = lazy(() => import('@/pages/CandidateDetailPage').then(m => ({ default: m.CandidateDetailPage })));
const SkillsPage = lazy(() => import('@/pages/SkillsPage').then(m => ({ default: m.SkillsPage })));
const MatchingPage = lazy(() => import('@/pages/MatchingPage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const ChatPage = lazy(() => import('@/pages/ChatPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const FairnessPage = lazy(() => import('@/pages/FairnessPage'));
const InterviewsPage = lazy(() => import('@/pages/InterviewsPage'));
const AuditLogsPage = lazy(() => import('@/pages/AuditLogsPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const SkillGapPage = lazy(() => import('@/pages/SkillGapPage'));
const ObservabilityPage = lazy(() => import('@/pages/ObservabilityPage'));

function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-surface-0">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-300 border-t-brand-500" />
        <p className="text-sm text-surface-600">Loading...</p>
      </div>
    </div>
  );
}

export function AppRouter() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />

              {/* Protected routes */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/jobs/new" element={<CreateJobPage />} />
                <Route path="/jobs/:id" element={<JobDetailPage />} />
                <Route path="/jobs/:id/edit" element={<EditJobPage />} />
                <Route path="/candidates" element={<CandidatesPage />} />
                <Route path="/candidates/:id" element={<CandidateDetailPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/ai" element={<ChatPage />} />
                <Route path="/matching" element={<MatchingPage />} />
                <Route path="/skills" element={<SkillsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/fairness" element={<FairnessPage />} />
                <Route path="/interviews" element={<InterviewsPage />} />
                <Route path="/audit" element={<AuditLogsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/skill-gap" element={<SkillGapPage />} />
                <Route path="/observability" element={<ObservabilityPage />} />
              </Route>

              {/* Redirect unknown to landing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
