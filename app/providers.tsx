'use client';

import { AuthProvider } from '@/app/context/AuthContext';
import { TestamentProvider } from '@/app/context/TestamentContext';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <TestamentProvider>{children}</TestamentProvider>
    </AuthProvider>
  );
}
