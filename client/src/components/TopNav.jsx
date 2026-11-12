import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, Menu, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TopNav = ({ onToggleSidebar }) => {
  const { user, profile } = useAuth();

  return (
    <header className="dashboard-topnav">
      <div className="topnav-left">
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation drawer"
        >
          <Menu size={22} />
        </button>

        <div className="topnav-search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search student skills, peer innovators, departments..."
            aria-label="Search"
          />
        </div>
      </div>

      <div className="topnav-right">
        {/* Notification bell */}
        <div className="topnav-bell-wrapper" title="Phase 1: No unread notifications">
          <button className="topnav-icon-btn">
            <Bell size={20} />
            <span className="notification-dot" />
          </button>
        </div>

        {/* Profile Pill */}
        <Link to="/profile" className="topnav-profile-pill">
          <div className="profile-pill-avatar">
            {profile?.avatar ? (
              <img src={profile.avatar} alt={user?.name} />
            ) : (
              <div className="avatar-placeholder">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
            )}
          </div>
          <div className="profile-pill-meta">
            <span className="profile-pill-name">{user?.name || 'Student User'}</span>
            <span className="profile-pill-role">{user?.year || 'Undergraduate'}</span>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default TopNav;

