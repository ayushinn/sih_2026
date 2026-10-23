import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getHomeRouteForRole } from '../../lib/permissions';
import { ShieldX, AlertTriangle, FileQuestion, RefreshCw, Home, ArrowLeft } from 'lucide-react';

export const Forbidden403: React.FC<{ requestId?: string }> = ({ requestId }) => {
  const { user } = useAuth();
  const location = useLocation();
  const homeRoute = getHomeRouteForRole(user?.role);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-tint-danger text-danger flex items-center justify-center mb-6">
        <ShieldX className="w-8 h-8" />
      </div>

      <p className="font-mono text-xs uppercase tracking-widest text-muted mb-2">403 · Access Denied</p>
      <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-ink mb-4">
        You do not have access to this page.
      </h1>

      <p className="text-muted max-w-md mx-auto text-sm md:text-base mb-6 leading-relaxed">
        Your current authenticated role{' '}
        <span className="font-mono font-semibold uppercase text-ink px-1.5 py-0.5 rounded bg-muted/10">
          {user?.role || 'Guest'}
        </span>{' '}
        is not authorised to view this resource. Regulatory boundaries are strictly enforced.
      </p>

      {requestId && (
        <p className="font-mono text-xs text-muted/70 mb-8">
          Request ID: <span className="text-ink">{requestId}</span>
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          to={homeRoute}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand text-white font-medium hover:bg-brand-deep transition-colors text-sm shadow-sm"
        >
          <Home className="w-4 h-4" />
          Back to Authorized Workspace
        </Link>
      </div>
    </div>
  );
};

export const Unauthorized401: React.FC<{ requestId?: string }> = ({ requestId }) => {
  const location = useLocation();
  const redirectTarget = encodeURIComponent(location.pathname + location.search);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-tint-warn text-warn flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <p className="font-mono text-xs uppercase tracking-widest text-muted mb-2">401 · Session Expired</p>
      <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-ink mb-4">
        Authentication required.
      </h1>

      <p className="text-muted max-w-md mx-auto text-sm md:text-base mb-6 leading-relaxed">
        Your secure session has expired or you are not signed in. Please sign in to resume your session.
      </p>

      {requestId && (
        <p className="font-mono text-xs text-muted/70 mb-8">
          Request ID: <span className="text-ink">{requestId}</span>
        </p>
      )}

      <Link
        to={`/login?redirect=${redirectTarget}`}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand text-white font-medium hover:bg-brand-deep transition-colors text-sm shadow-sm"
      >
        Sign in with Credentials
      </Link>
    </div>
  );
};

export const NotFound404: React.FC = () => {
  const { user } = useAuth();
  const homeRoute = getHomeRouteForRole(user?.role);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-muted/10 text-muted flex items-center justify-center mb-6">
        <FileQuestion className="w-8 h-8" />
      </div>

      <p className="font-mono text-xs uppercase tracking-widest text-muted mb-2">404 · Resource Not Found</p>
      <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-ink mb-4">
        Not found or unavailable.
      </h1>

      <p className="text-muted max-w-md mx-auto text-sm md:text-base mb-8 leading-relaxed">
        The requested record or endpoint does not exist or is not available under your current regulatory scope.
      </p>

      <Link
        to={homeRoute}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-ink/20 text-ink font-medium hover:bg-ink hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Safety
      </Link>
    </div>
  );
};

export const ServerError500: React.FC<{ requestId?: string; onRetry?: () => void }> = ({
  requestId,
  onRetry,
}) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-tint-danger text-danger flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <p className="font-mono text-xs uppercase tracking-widest text-muted mb-2">500 · System Anomaly</p>
      <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-ink mb-4">
        Service temporarily unavailable.
      </h1>

      <p className="text-muted max-w-md mx-auto text-sm md:text-base mb-6 leading-relaxed">
        A recoverable server or network anomaly occurred. Internal stack details are omitted for security.
      </p>

      {requestId && (
        <p className="font-mono text-xs text-muted/70 mb-8">
          Incident Tracking ID: <span className="text-ink font-semibold">{requestId}</span>
        </p>
      )}

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand text-white font-medium hover:bg-brand-deep transition-colors text-sm shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Request
        </button>
      )}
    </div>
  );
};
