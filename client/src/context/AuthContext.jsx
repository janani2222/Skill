import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  loginStudent,
  registerStudent,
  logoutStudent,
  getMe,
} from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check user session on initial load
  const checkAuth = async () => {
    try {
      const data = await getMe();
      if (data.success && data.user) {
        setUser(data.user);
        setProfile(data.profile);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      setUser(null);
      setProfile(null);
      localStorage.removeItem('skillbridge_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (credentials) => {
    const data = await loginStudent(credentials);
    if (data.success && data.user) {
      setUser(data.user);
      if (data.token) {
        localStorage.setItem('skillbridge_token', data.token);
      }
      await checkAuth();
      return data;
    }
    throw new Error(data.message || 'Login failed');
  };

  const register = async (userData) => {
    const data = await registerStudent(userData);
    if (data.success && data.user) {
      setUser(data.user);
      if (data.token) {
        localStorage.setItem('skillbridge_token', data.token);
      }
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
      setUser(null);
      setProfile(null);
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
        isAuthenticated: !!user,
        login,
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
