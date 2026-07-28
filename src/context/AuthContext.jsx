import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create the Context
const AuthContext = createContext(null);

// Central API base URL setup
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create a custom hook to use the auth context easily in other pages/components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set default authorization header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  // Fetch current user details on initial load if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/auth/me`);
        if (res.data && res.data.success) {
          setUser(res.data.user);
        } else {
          setToken('');
        }
      } catch (err) {
        console.error('Failed to load user profile:', err.response?.data?.message || err.message);
        // If token is invalid or expired, clear it
        setToken('');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  /**
   * Log in user (Student or Staff)
   * @param {string} email 
   * @param {string} password 
   * @param {string} role - 'student' or 'staff'
   */
  const login = async (email, password, role) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/auth/login/${role}`, { email, password });
      if (res.data && res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true, role };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register a new user (Student or Staff)
   * @param {Object} formData - Sign up details
   * @param {string} role - 'student' or 'staff'
   */
  const register = async (formData, role) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = `${API_URL}/auth/register/${role}`;
      const res = await axios.post(endpoint, formData);
      if (res.data && res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true, role };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logs out the user by clearing state and token
   */
  const logout = () => {
    setToken('');
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    setError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
