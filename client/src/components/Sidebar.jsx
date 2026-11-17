import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  User,
  FolderGit2,
  Bell,
  Settings,
  LogOut,
  Shield,
  ExternalLink,
  Compass,
  BriefcaseBusiness,
  Presentation,
  SearchCheck,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { logout, user, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
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
            to="/discover"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          ><Compass size={20} /><span>Discover Students</span><div className="gold-active-bar" /></NavLink>

          <NavLink
            to="/projects"
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          ><BriefcaseBusiness size={20} /><span>My Projects</span><div className="gold-active-bar" /></NavLink>

          <NavLink to="/current-projects" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
            <Presentation size={20} /><span>Current Projects</span><div className="gold-active-bar" />
          </NavLink>
          <NavLink to="/explore" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}><SearchCheck size={20}/><span>Explore Projects</span><div className="gold-active-bar" /></NavLink>

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

          <NavLink to="/notifications" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
            <Bell size={20} />
            <span>Notifications</span>
            <div className="gold-active-bar" />
          </NavLink>
          <NavLink to="/messages" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
            <MessageCircle size={20} /><span>Messages</span><div className="gold-active-bar" />
          </NavLink>
          {user?.role === 'admin' && <NavLink to="/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}><Shield size={20}/><span>Admin Dashboard</span><div className="gold-active-bar"/></NavLink>}

          <span className="sidebar-category">PREFERENCES</span>

          <NavLink
            to="/settings"
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

        <div className="sidebar-campus-image" aria-hidden="true" />

        {/* Sidebar Footer with Student Snippet & Logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              <img src={profile?.avatar || '/avatars/professional-neutral.svg'} alt="" onError={(event) => { event.currentTarget.src = '/avatars/professional-neutral.svg'; }} />
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

