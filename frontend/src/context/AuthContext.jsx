import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('civic_token') || null;
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('civic_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Khi tải ứng dụng, nếu có token thì kiểm tra lại thông tin người dùng từ backend
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('civic_token');
      if (storedToken) {
        try {
          const profile = await api.getMe();
          if (profile) {
            setUser(profile);
            localStorage.setItem('civic_user', JSON.stringify(profile));
          }
        } catch (err) {
          console.warn('Phiên đăng nhập hết hạn hoặc backend offline:', err);
        }
      }
      setLoading(false);
    };

    verifySession();
  }, []);

  /**
   * Đăng nhập hệ thống
   * @param {string} username 
   * @param {string} password 
   */
  const login = async (username, password) => {
    const res = await api.login({ username, password });
    const authToken = res.access_token;
    const authUser = res.user;

    setToken(authToken);
    setUser(authUser);

    localStorage.setItem('civic_token', authToken);
    localStorage.setItem('civic_user', JSON.stringify(authUser));

    return authUser;
  };

  /**
   * Đăng xuất phiên làm việc
   */
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('civic_token');
    localStorage.removeItem('civic_user');
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: Boolean(user && token),
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

