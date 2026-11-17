import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  loginStudent,
  loginAdmin,
  registerStudent,
  logoutStudent,
  getMe,
} from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expiresAt, setExpiresAt] = useState(null);

  const expireSession = () => {
    localStorage.removeItem('skillbridge_token');
    localStorage.removeItem('skillbridge_session_expires_at');
    sessionStorage.setItem('skillbridge_session_expired_message', 'Your session has expired. Please log in again.');
    setUser(null); setProfile(null); setExpiresAt(null);
    window.dispatchEvent(new Event('skillbridge:session-expired'));
  };

  // Check user session on initial load
  const checkAuth = async () => {
    try {
      const data = await getMe();
      if (data.success && data.user) {
        if (data.expiresAt && Number(data.expiresAt) <= Date.now()) { expireSession(); return; }
        setUser(data.user);
        setProfile(data.profile);
        const expiry = Number(data.expiresAt || localStorage.getItem('skillbridge_session_expires_at')) || null;
        setExpiresAt(expiry);
        if (expiry) localStorage.setItem('skillbridge_session_expires_at', String(expiry));
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      setUser(null);
      setProfile(null);
      const previousExpiry = Number(localStorage.getItem('skillbridge_session_expires_at'));
      if (previousExpiry && previousExpiry <= Date.now()) expireSession();
      else { localStorage.removeItem('skillbridge_token'); setExpiresAt(null); }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!expiresAt) return undefined;
    const timer = window.setInterval(() => { if (Date.now() >= expiresAt) { expireSession(); } }, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const login = async (credentials) => {
    const data = await loginStudent(credentials);
    if (data.success && data.user) {
      setUser(data.user);
      const expiry = Number(data.expiresAt) || Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('skillbridge_session_expires_at', String(expiry)); setExpiresAt(expiry);
      await checkAuth();
      return data;
    }
    throw new Error(data.message || 'Login failed');
  };

  const loginAsAdmin = async (credentials) => {
    const data = await loginAdmin(credentials);
    if (data.success && data.user?.role === 'admin') {
      setUser(data.user);
      const expiry = Number(data.expiresAt) || Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('skillbridge_session_expires_at', String(expiry)); setExpiresAt(expiry);
      await checkAuth();
      return data;
    }
    throw new Error(data.message || 'Administrator login failed');
  };

  const register = async (userData) => {
    const data = await registerStudent(userData);
    if (data.success && data.user) {
      setUser(data.user);
      const expiry = Number(data.expiresAt) || Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('skillbridge_session_expires_at', String(expiry)); setExpiresAt(expiry);
      await checkAuth();
      return data;
    }
    throw new Error(data.message || 'Registration failed');
  };

  const logout = async () => {
    try {
      await logoutStudent();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('skillbridge_token');
      localStorage.removeItem('skillbridge_session_expires_at');
      setUser(null);
      setProfile(null);
      setExpiresAt(null);
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const updateProfileState = (updatedProfile) => {
    setProfile(updatedProfile);
  };

  const updateUserState = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        expiresAt,
        isAuthenticated: !!user,
        login,
        loginAsAdmin,
        register,
        logout,
        refreshUser,
        updateProfileState,
        updateUserState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

