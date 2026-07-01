'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, type User, type AuthResponse } from '@/app/lib/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  signup: (email: string, password: string) => Promise<AuthResponse>;
  login: (email: string, password: string) => Promise<AuthResponse>;
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

  const signup = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await api.auth.signup(email, password);
      setState({ user: result.user, isLoading: false, isAuthenticated: true, error: null });
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création du compte.';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw err;
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await api.auth.login(email, password);
      setState({ user: result.user, isLoading: false, isAuthenticated: true, error: null });
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Email ou mot de passe incorrect.';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw err;
    }
  }, []);

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
    <AuthContext.Provider value={{ ...state, signup, login, refreshSession, logout, clearError }}>
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

