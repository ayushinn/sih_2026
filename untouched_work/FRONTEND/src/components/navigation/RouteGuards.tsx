import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getHomeRouteForRole, isRouteAllowed } from '../../lib/permissions';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs text-muted tracking-widest uppercase">Verifying Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectUrl}`} replace />;
  }

  // Check role authorization for this specific path
  if (!isRouteAllowed(user.role, location.pathname)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};

export const PublicOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (user) {
    const home = getHomeRouteForRole(user.role);
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
};
