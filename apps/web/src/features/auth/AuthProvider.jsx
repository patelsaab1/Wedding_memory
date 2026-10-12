import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCurrentUser, loginRequest, logoutRequest } from '@/services/auth.service';
import { hasPermission, hasPermissions, hasRole } from '@wedding-memory/shared';
import { AuthContext } from './auth-context.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | anonymous
  const [error, setError] = useState(null);

  const bootstrap = useCallback(async () => {
    setStatus('loading');
    try {
      const current = await fetchCurrentUser();
      setUser(current);
      setStatus('authenticated');
      setError(null);
    } catch {
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email, password) => {
    setError(null);
    const nextUser = await loginRequest(email, password);
    setUser(nextUser);
    setStatus('authenticated');
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      error,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'loading',
      login,
      logout,
      refreshUser: bootstrap,
      can: (permission) => hasPermission(user, permission),
      canAll: (permissions) => hasPermissions(user, permissions, 'all'),
      canAny: (permissions) => hasPermissions(user, permissions, 'any'),
      hasRole: (...roles) => hasRole(user, ...roles),
    }),
    [user, status, error, login, logout, bootstrap],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
