import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * Route guard component that restricts access to authenticated users and validates their roles.
 * 
 * @param {React.ReactNode} children - Components to render if authorized
 * @param {Array<string>} allowedRoles - Optional list of roles that are allowed to access (e.g. ['student'])
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useAuth();

  // If AuthContext is still fetching user profile, show loading indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // If there is no token or user, redirect to login page
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required, check if user's role is permitted
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If student attempts to access staff, or vice versa, redirect them to their correct dashboard
    if (user.role === 'student') {
      return <Navigate to="/student-dashboard" replace />;
    } else if (user.role === 'staff') {
      return <Navigate to="/staff-dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // If authorized, render requested children
  return children;
};

export default ProtectedRoute;
