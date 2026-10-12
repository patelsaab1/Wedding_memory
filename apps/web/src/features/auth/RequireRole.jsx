import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';

/**
 * Protects routes that require one of the given roles.
 * Prefer RequirePermission for feature gates.
 */
export function RequireRole({ roles = [], children, fallback = '/' }) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="text-muted flex min-h-[40vh] items-center justify-center text-sm">
        Checking session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(...roles)) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}
