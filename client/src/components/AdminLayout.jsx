import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CalendarDays,
  UsersRound,
  UserCheck,
  Megaphone,
  BarChart3,
  Settings,
  Bell,
  ChevronDown,
  LogOut,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Students', path: '/admin/students', icon: Users },
  { label: 'Projects', path: '/admin/projects', icon: FolderKanban },
  { label: 'Workshops', path: '/admin/workshops', icon: CalendarDays },
  { label: 'Communities', path: '/admin/communities', icon: UsersRound },
  { label: 'Join Requests', path: '/admin/join-requests', icon: UserCheck },
  { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
  { label: 'Reports & Analytics', path: '/admin/reports', icon: BarChart3 },
  { label: 'Settings', path: '/admin/settings', icon: Settings }
];

export default function AdminLayout({ children, pageTitle = 'Admin Dashboard', pageSubtitle = 'Monitor platform activity, users, projects and events.' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  return (
    <div className="admin-portal-shell">
      {/* 1. Dark Navy Fixed Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link to="/admin/dashboard" className="admin-logo">
            <span className="logo-skill">Skill</span>
            <span className="logo-bridge">Bridge</span>
          </Link>
          <span className="admin-portal-subtitle">Admin Portal</span>
        </div>

        {/* Navigation Items */}
        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path === '/admin/dashboard' && location.pathname === '/admin');

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="admin-nav-icon">
                  <Icon size={18} />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Neoclassical university building photograph at bottom of sidebar */}
        <div className="admin-sidebar-footer" title="Southfield University Campus" />
      </aside>

      {/* 2. Main Content Wrapper */}
      <div className="admin-main-wrap">
        {/* Top Header */}
        <header className="admin-top-header">
          <div className="admin-header-title-box">
            <h1>{pageTitle}</h1>
            <p>{pageSubtitle}</p>
          </div>

          <div className="admin-header-right">
            <div className="admin-header-bell" title="Notifications">
              <Bell size={18} />
              <span className="admin-bell-dot" />
            </div>

            <div
              className="admin-user-badge"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              style={{ position: 'relative' }}
            >
              <div className="admin-user-avatar">
                <Shield size={16} />
              </div>
              <span className="admin-user-label">{user?.name || 'Admin'}</span>
              <ChevronDown size={14} className="admin-user-chevron" />

              {isUserMenuOpen && (
                <div
                  className="admin-action-menu"
                  style={{ top: '100%', right: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link to="/admin/settings" onClick={() => setIsUserMenuOpen(false)}>
                    <Settings size={14} /> Admin Settings
                  </Link>
                  <button onClick={handleLogout} className="danger">
                    <LogOut size={14} /> Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="admin-page-container">{children}</main>
      </div>
    </div>
  );
}

