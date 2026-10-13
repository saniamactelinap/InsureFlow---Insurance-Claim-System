import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, getRoleDashboardPath } from '../../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-600">Verifying session authorization...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the user's role-appropriate dashboard if they try to access another role's portal
    const targetPath = getRoleDashboardPath(user.role);
    return <Navigate to={targetPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
