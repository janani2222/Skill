import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import DiscoverStudentsPage from './pages/DiscoverStudentsPage';
import PublicProfilePage from './pages/PublicProfilePageFixed';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import ExploreProjectsPage from './pages/ExploreProjectsPage';
import NotificationsPage from './pages/NotificationsPage';
import TeamDashboardPage from './pages/TeamDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import CurrentProjectsPage from './pages/CurrentProjectsPage';
import PublicProjectsPage from './pages/PublicProjectsPage';
import PublicProjectDetailsPage from './pages/PublicProjectDetailsPage';
import MessagesPage from './pages/MessagesPage';

function App() {
  return (
    <AuthProvider>
      <Router>
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
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
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
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailsPage /></ProtectedRoute>} />
          <Route path="/projects/:id/team" element={<ProtectedRoute><TeamDashboardPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
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

