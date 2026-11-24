import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getNotifications } from '../services/phase2Service';

export default function SkillBridgeNavbar() {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check notifications
  useEffect(() => {
    let active = true;
    getNotifications()
      .then((data) => {
        if (active && data.notifications) {
          const unread = data.notifications.some((n) => !n.isRead);
          setHasUnread(unread);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const avatarUrl = profile?.avatar || user?.avatar || '/college-building.png';

  return (
    <header className="skillbridge-navbar">
      {/* SkillBridge Logo */}
      <Link to="/" className="skillbridge-nav-logo">
        <span className="logo-skill">Skill</span>
        <span className="logo-bridge">Bridge</span>
      </Link>

      {/* Main Navigation */}
      <nav>
        <Link to="/" className={isActive('/') ? 'active' : ''}>Home</Link>
        <Link to="/discover" className={isActive('/discover') ? 'active' : ''}>Explore</Link>
        <Link to="/workshops" className={isActive('/workshops') ? 'active' : ''}>Workshops</Link>
        <Link to="/communities" className={isActive('/communities') ? 'active' : ''}>Communities</Link>
      </nav>

      {/* Right Actions: Notifications & Profile */}
      <div className="skillbridge-nav-actions" ref={menuRef}>
        <Link to="/notifications" className="skillbridge-nav-bell" aria-label="Notifications" title="Notifications">
          <Bell size={19} />
          {hasUnread && <span className="skillbridge-nav-bell-dot" />}
        </Link>

        <button
          type="button"
          className="skillbridge-nav-profile-group"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label="User menu"
        >
          <div className="skillbridge-nav-avatar">
            <img
              src={avatarUrl}
              alt={user?.name || 'User'}
              onError={(e) => {
                e.currentTarget.src = '/college-building.png';
              }}
            />
          </div>
          <ChevronDown
            size={14}
            className="skillbridge-nav-chevron"
            style={{ transform: menuOpen ? 'rotate(180deg)' : 'none' }}
          />
        </button>

        {/* User Profile Dropdown Menu */}
        {menuOpen && (
          <div className="skillbridge-profile-menu">
            <div style={{ padding: '10px 16px 8px 16px', borderBottom: '1px solid #E6DED2' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#10243E' }}>
                {user?.name || 'Student'}
              </div>
              <div style={{ fontSize: '11.5px', color: '#65758A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email || ''}
              </div>
            </div>
            <Link to="/profile" onClick={() => setMenuOpen(false)}>
              <User size={15} /> My Profile
            </Link>
            <Link to="/settings" onClick={() => setMenuOpen(false)}>
              <Settings size={15} /> Settings
            </Link>
            <div className="menu-divider" />
            <button type="button" className="danger" onClick={handleLogout}>
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
