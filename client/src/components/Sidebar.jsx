import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  FolderGit2,
  Bell,
  Settings,
  LogOut,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`dashboard-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand">
          <NavLink to="/" className="sidebar-brand-link">
            <div className="sidebar-shield">
              <Shield size={24} />
            </div>
            <div>
              <span className="sidebar-title">SkillBridge</span>
              <span className="sidebar-tag">STUDENT PORTAL</span>
            </div>
          </NavLink>
        </div>

        {/* Main Navigation Menu */}
        <div className="sidebar-menu">
          <span className="sidebar-category">MAIN MENU</span>

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
            <div className="gold-active-bar" />
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <User size={20} />
            <span>My Profile</span>
            <div className="gold-active-bar" />
          </NavLink>

          <div className="sidebar-link disabled" title="Available in Phase 2">
            <FolderGit2 size={20} />
            <span>My Projects</span>
            <span className="sidebar-badge">Phase 2</span>
          </div>

          <div className="sidebar-link disabled" title="Available in Phase 2">
            <Bell size={20} />
            <span>Notifications</span>
            <span className="sidebar-badge">Phase 2</span>
          </div>

          <span className="sidebar-category">PREFERENCES</span>

          <NavLink
            to="/profile"
            className="sidebar-link"
            onClick={onClose}
          >
            <Settings size={20} />
            <span>Settings & Edit</span>
          </NavLink>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="sidebar-link"
          >
            <ExternalLink size={20} />
            <span>View Landing Site</span>
          </a>
        </div>

        {/* Sidebar Footer with Student Snippet & Logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="sidebar-user-details">
              <p className="sidebar-user-name">{user?.name || 'Student'}</p>
              <p className="sidebar-user-dept">{user?.department || 'Engineering'}</p>
            </div>
          </div>

          <button onClick={handleLogout} className="sidebar-logout-btn">
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
