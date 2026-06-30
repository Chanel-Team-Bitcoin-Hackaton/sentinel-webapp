'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { api, type Testament, type EncryptedSecret, type Beneficiary, type Checkin } from '@/app/lib/api';

interface TestamentState {
  testament: Testament | null;
  secrets: EncryptedSecret[];
  beneficiary: Beneficiary | null;
  checkins: Checkin[];
  isLoading: boolean;
  error: string | null;
}

interface TestamentContextValue extends TestamentState {
  refresh: () => Promise<void>;
  createTestament: (delayDays: number) => Promise<Testament>;
  updateDelay: (delayDays: number) => Promise<void>;
  addSecret: (title: string, type: EncryptedSecret['type'], encryptedBlob: string, ivHex: string, saltHex: string) => Promise<void>;
  removeSecret: (secretId: string) => Promise<void>;
  upsertBeneficiary: (data: { name: string; email: string; phone: string; secretQuestion: string; secretQuestionHash: string }) => Promise<void>;
  refreshCheckins: () => Promise<void>;
}

const TestamentContext = createContext<TestamentContextValue | undefined>(undefined);

export function TestamentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TestamentState>({
    testament: null,
    secrets: [],
    beneficiary: null,
    checkins: [],
    isLoading: false,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const testament = await api.testament.getMe();
      if (testament) {
        const [secrets, beneficiary, checkins] = await Promise.all([
          api.secrets.list(testament.id),
          api.beneficiary.get(testament.id),
          api.checkin.list(testament.id),
        ]);
        setState({
          testament,
          secrets,
          beneficiary,
          checkins,
          isLoading: false,
          error: null,
        });
      } else {
        setState({
          testament: null,
          secrets: [],
          beneficiary: null,
          checkins: [],
          isLoading: false,
          error: null,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement.';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, []);

  const createTestament = useCallback(async (delayDays: number): Promise<Testament> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const testament = await api.testament.create(delayDays);
      setState((prev) => ({ ...prev, testament, isLoading: false }));
      return testament;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création.';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw err;
    }
  }, []);

  const updateDelay = useCallback(async (delayDays: number) => {
    if (!state.testament) return;
    try {
      const updated = await api.testament.updateDelay(state.testament.id, delayDays);
      setState((prev) => ({ ...prev, testament: updated }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour.';
      setState((prev) => ({ ...prev, error: message }));
    }
  }, [state.testament]);

  const addSecret = useCallback(
    async (title: string, type: EncryptedSecret['type'], encryptedBlob: string, ivHex: string, saltHex: string) => {
      if (!state.testament) return;
      try {
        const newSecret = await api.secrets.create(state.testament.id, title, type, encryptedBlob, ivHex, saltHex);
        setState((prev) => ({ ...prev, secrets: [...prev.secrets, newSecret] }));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur lors de l'ajout du secret.";
        setState((prev) => ({ ...prev, error: message }));
      }
    },
    [state.testament]
  );

  const removeSecret = useCallback(async (secretId: string) => {
    try {
      await api.secrets.delete(secretId);
      setState((prev) => ({
        ...prev,
        secrets: prev.secrets.filter((s) => s.id !== secretId),
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression.';
      setState((prev) => ({ ...prev, error: message }));
    }
  }, []);

  const upsertBeneficiary = useCallback(
    async (data: { name: string; email: string; phone: string; secretQuestion: string; secretQuestionHash: string }) => {
      if (!state.testament) return;
      try {
        const beneficiary = await api.beneficiary.upsert(state.testament.id, data);
        setState((prev) => ({ ...prev, beneficiary }));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur bénéficiaire.';
        setState((prev) => ({ ...prev, error: message }));
      }
    },
    [state.testament]
  );

  const refreshCheckins = useCallback(async () => {
    if (!state.testament) return;
    try {
      const checkins = await api.checkin.list(state.testament.id);
      setState((prev) => ({ ...prev, checkins }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur check-in.';
      setState((prev) => ({ ...prev, error: message }));
    }
  }, [state.testament]);

  return (
    <TestamentContext.Provider
      value={{
        ...state,
        refresh,
        createTestament,
        updateDelay,
        addSecret,
        removeSecret,
        upsertBeneficiary,
        refreshCheckins,
      }}
    >
      {children}
    </TestamentContext.Provider>
  );
}

export function useTestament(): TestamentContextValue {
  const ctx = useContext(TestamentContext);
  if (!ctx) {
    throw new Error('useTestament must be used within a TestamentProvider');
  }
  return ctx;
}
