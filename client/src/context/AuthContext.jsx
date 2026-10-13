import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const getRoleDashboardPath = (role) => {
  switch (role) {
    case 'CUSTOMER':
      return '/customer/dashboard';
    case 'OFFICER':
      return '/officer/dashboard';
    case 'SURVEYOR':
      return '/surveyor/dashboard';
    case 'MANAGER':
      return '/manager/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    default:
      return '/';
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('insureflow_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('insureflow_token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('insureflow_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('insureflow_user', JSON.stringify(res.data.user));
          }
        } catch {
          // Token expired or invalid
          setUser(null);
          setToken('');
          localStorage.removeItem('insureflow_token');
          localStorage.removeItem('insureflow_user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('insureflow_token', newToken);
      localStorage.setItem('insureflow_user', JSON.stringify(newUser));
      return newUser;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('insureflow_token', newToken);
      localStorage.setItem('insureflow_user', JSON.stringify(newUser));
      return newUser;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('insureflow_token');
    localStorage.removeItem('insureflow_user');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        role: user?.role || null,
        login,
        register,
        logout,
        getRoleDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
