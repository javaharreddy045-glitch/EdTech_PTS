import { Route, Routes } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout.jsx';
import { AuthLayout } from './layouts/AuthLayout.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';

import { LandingPage } from './pages/LandingPage.jsx';
import { SignupPage } from './pages/SignupPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from './pages/ResetPasswordPage.jsx';
import { OnboardingPage } from './pages/OnboardingPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { JourneysPage } from './pages/JourneysPage.jsx';
import { JourneyDetailPage } from './pages/JourneyDetailPage.jsx';
import { MyLearningPathPage } from './pages/MyLearningPathPage.jsx';
import { CoursesPage } from './pages/CoursesPage.jsx';
import { CourseDetailPage } from './pages/CourseDetailPage.jsx';
import { LessonPage } from './pages/LessonPage.jsx';
import { ProjectsPage } from './pages/ProjectsPage.jsx';
import { ProjectDetailPage } from './pages/ProjectDetailPage.jsx';
import { AssessmentsPage } from './pages/AssessmentsPage.jsx';
import { AssessmentTakePage } from './pages/AssessmentTakePage.jsx';
import { ProgressPage } from './pages/ProgressPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { NotificationsPage } from './pages/NotificationsPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route path="/onboarding" element={<OnboardingPage />} />

      <Route element={<RootLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/journeys" element={<JourneysPage />} />
        <Route path="/journeys/:slug" element={<JourneyDetailPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:slug" element={<CourseDetailPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:slug" element={<ProjectDetailPage />} />
        <Route path="/assessments" element={<AssessmentsPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/learning-path" element={<MyLearningPathPage />} />
          <Route path="/lessons/:id" element={<LessonPage />} />
          <Route path="/assessments/:slug" element={<AssessmentTakePage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
