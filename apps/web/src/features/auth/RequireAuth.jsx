import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';

/**
 * Protects routes that require an authenticated session.
 */
export function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="text-muted flex min-h-[40vh] items-center justify-center text-sm">
        Checking session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
