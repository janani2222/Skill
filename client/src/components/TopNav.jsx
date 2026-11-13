import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, Menu, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getNotifications } from '../services/phase2Service';

const TopNav = ({ onToggleSidebar }) => {
  const { user, profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => { let active=true; const load=()=>getNotifications().then(d=>{if(active)setUnreadCount((d.notifications||[]).filter(n=>!n.isRead).length);}).catch(()=>{}); load(); const timer=setInterval(load,15000); return()=>{active=false;clearInterval(timer);}; },[]);

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
        <Link to="/notifications" className="topnav-bell-wrapper" title="Notifications">
          <button className="topnav-icon-btn" type="button">
            <Bell size={20} />
            {unreadCount>0&&<span className="notification-count">{unreadCount>99?'99+':unreadCount}</span>}
          </button>
        </Link>

        {/* Profile Pill */}
        <Link to="/profile" className="topnav-profile-pill">
          <div className="profile-pill-avatar">
            {profile?.avatar ? (
              <img src={profile.avatar} alt={user?.name} onError={(event) => { event.currentTarget.src = '/avatars/professional-neutral.svg'; }} />
            ) : (
              <img src="/avatars/professional-neutral.svg" alt="" />
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

