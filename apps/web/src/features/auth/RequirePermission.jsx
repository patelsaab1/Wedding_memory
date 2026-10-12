import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';

/**
 * Protects UI using centralized permission keys (not raw role checks).
 */
export function RequirePermission({ permission, children, fallback = '/' }) {
  const { isAuthenticated, isLoading, can } = useAuth();

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

  if (!can(permission)) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}
