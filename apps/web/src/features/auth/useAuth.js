import { useContext } from 'react';
import { AuthContext } from './auth-context.js';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function useCurrentUser() {
  const { user, status, isLoading, isAuthenticated, refreshUser } = useAuth();
  return { user, status, isLoading, isAuthenticated, refreshUser };
}
