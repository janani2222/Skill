import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import DiscoverStudentsPage from './pages/DiscoverStudentsPage';
import PublicProfilePage from './pages/PublicProfilePageFixed';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import ExploreProjectsPage from './pages/ExploreProjectsPage';
import NotificationsPage from './pages/NotificationsPage';
import TeamDashboardPage from './pages/TeamDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminStudentsPage from './pages/AdminStudentsPage';
import AdminProjectsPage from './pages/AdminProjectsPage';
import AdminWorkshopsPage from './pages/AdminWorkshopsPage';
import AdminCommunitiesPage from './pages/AdminCommunitiesPage';
import AdminJoinRequestsPage from './pages/AdminJoinRequestsPage';
import AdminAnnouncementsPage from './pages/AdminAnnouncementsPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import CurrentProjectsPage from './pages/CurrentProjectsPage';
import PublicProjectsPage from './pages/PublicProjectsPage';
import PublicProjectDetailsPage from './pages/PublicProjectDetailsPage';
import MessagesPage from './pages/MessagesPage';
import SettingsPage from './pages/SettingsPage';
import { getSettings } from './services/authService';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ThemeSync />
        <SessionExpiryHandler />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/public-projects" element={<PublicProjectsPage />} />
          <Route path="/public-projects/:id" element={<PublicProjectDetailsPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Collegiate Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/discover" element={<ProtectedRoute><DiscoverStudentsPage /></ProtectedRoute>} />
          <Route path="/students/:id" element={<ProtectedRoute><PublicProfilePage /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
          <Route path="/current-projects" element={<ProtectedRoute><CurrentProjectsPage /></ProtectedRoute>} />
          <Route path="/showcase" element={<Navigate to="/current-projects" replace />} />
          <Route path="/explore" element={<ProtectedRoute><ExploreProjectsPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailsPage /></ProtectedRoute>} />
          <Route path="/projects/:id/team" element={<ProtectedRoute><TeamDashboardPage /></ProtectedRoute>} />

          {/* Admin Portal Protected Routes */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="admin"><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute allowedRole="admin"><AdminStudentsPage /></ProtectedRoute>} />
          <Route path="/admin/projects" element={<ProtectedRoute allowedRole="admin"><AdminProjectsPage /></ProtectedRoute>} />
          <Route path="/admin/workshops" element={<ProtectedRoute allowedRole="admin"><AdminWorkshopsPage /></ProtectedRoute>} />
          <Route path="/admin/communities" element={<ProtectedRoute allowedRole="admin"><AdminCommunitiesPage /></ProtectedRoute>} />
          <Route path="/admin/join-requests" element={<ProtectedRoute allowedRole="admin"><AdminJoinRequestsPage /></ProtectedRoute>} />
          <Route path="/admin/announcements" element={<ProtectedRoute allowedRole="admin"><AdminAnnouncementsPage /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedRole="admin"><AdminReportsPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRole="admin"><AdminSettingsPage /></ProtectedRoute>} />

          {/* Catch-all Fallback */}
          <Route path="/dashboard" element={<Navigate to="/discover" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function ThemeSync() {
  const { isAuthenticated } = useAuth();
  React.useEffect(() => {
    const cached = localStorage.getItem('skillbridge_theme');
    if (cached) document.documentElement.dataset.theme = cached;
    if (isAuthenticated) getSettings().then(({ settings }) => {
      document.documentElement.dataset.theme = settings.appearance;
      localStorage.setItem('skillbridge_theme', settings.appearance);
    }).catch(() => {});
  }, [isAuthenticated]);
  return null;
}

function SessionExpiryHandler() {
  const navigate = useNavigate();
  React.useEffect(() => {
    const onExpired = () => navigate('/', { replace: true });
    window.addEventListener('skillbridge:session-expired', onExpired);
    return () => window.removeEventListener('skillbridge:session-expired', onExpired);
  }, [navigate]);
  return null;
}

export default App;

