import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, Menu, X, User as UserIcon, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="university-header">
      {/* Top University Info Bar */}
      <div className="top-bar">
        <div className="container top-bar-content">
          <div className="top-bar-left">
            <span>Academic Excellence &bull; Peer Innovation &bull; Campus Collaboration</span>
          </div>
          <div className="top-bar-right">
            <span className="portal-tag">Official Student Portal</span>
            <span className="divider">|</span>
            <a href="mailto:support@skillbridge.edu">helpdesk@skillbridge.edu</a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="main-navbar">
        <div className="container nav-container">
          {/* Logo with Shield Icon */}
          <Link to="/" className="nav-logo">
            <div className="logo-shield-badge">
              <Shield className="shield-icon" size={26} />
            </div>
            <div className="logo-text-group">
              <span className="logo-title">SkillBridge</span>
              <span className="logo-subtitle">COLLEGIATE NETWORK</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="nav-links">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Home
              {isActive('/') && <span className="nav-gold-line" />}
            </Link>
            <a href="#about" className="nav-link">
              About
            </a>
            <a href="#programs" className="nav-link">
              Programs
            </a>
            <a href="#how-it-works" className="nav-link">
              How It Works
            </a>
            <a href="#events" className="nav-link">
              Events
            </a>
          </div>

          {/* Right Action Buttons */}
          <div className="nav-actions">
            {isAuthenticated ? (
              <div className="user-nav-dropdown">
                <button
                  className="user-profile-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                >
                  <div className="user-avatar-tiny">
                    {profile?.avatar ? (
                      <img src={profile.avatar} alt={user?.name} />
                    ) : (
                      <UserIcon size={16} />
                    )}
                  </div>
                  <span className="user-nav-name">{user?.name?.split(' ')[0]}</span>
                  <ChevronDown size={14} />
                </button>

                {dropdownOpen && (
                  <div className="user-dropdown-menu">
                    <div className="user-dropdown-header">
                      <p className="ud-name">{user?.name}</p>
                      <p className="ud-email">{user?.email}</p>
                      <span className="badge badge-gold">{user?.department}</span>
                    </div>
                    <div className="ud-divider" />
                    <Link
                      to="/dashboard"
                      className="ud-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <LayoutDashboard size={16} />
                      Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      className="ud-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <UserIcon size={16} />
                      My Profile
                    </Link>
                    <div className="ud-divider" />
                    <button
                      className="ud-item ud-logout"
                      onClick={() => {
                        setDropdownOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="guest-actions">
                <Link to="/login" className="nav-login-link">
                  Login
                </Link>
                <Link to="/register" className="btn-gold nav-cta-btn">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              className="mobile-hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu-drawer">
            <Link to="/" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <a href="#about" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
              About
            </a>
            <a href="#programs" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
              Programs
            </a>
            <a href="#how-it-works" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
              How It Works
            </a>
            <a href="#events" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>
              Events
            </a>

            <div className="mobile-divider" />

            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="mobile-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Student Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="mobile-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Profile
                </Link>
                <button
                  className="mobile-link mobile-logout"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="mobile-auth-btns">
                <Link
                  to="/login"
                  className="btn-outline-gold"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Student Login
                </Link>
                <Link
                  to="/register"
                  className="btn-gold"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;

