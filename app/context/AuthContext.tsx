'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, type User } from '@/app/lib/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  // Only exposing logout and clearError since login is handled natively in page.tsx via LNURL
  // Wait, I will keep login here if it's used elsewhere, but for LNURL, we might not need context for login.
  // We'll keep login just in case but LNURL is the main way. Actually, LNURL will just redirect to dashboard which triggers a reload or re-auth.
  // Wait, I will expose a `setUser` or `refreshSession` so LNURL can set the user.
  refreshSession: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  const refreshSession = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await api.auth.getCurrentUser();
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
    } catch {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    }
  }, []);

  // Restore session from cookie/API on mount
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await api.auth.logout();
    } catch (e) {
      console.error(e);
    }
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
    // Force a hard reload to clear any server-side cookies or states if we use next/navigation
    window.location.href = '/login';
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, refreshSession, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

