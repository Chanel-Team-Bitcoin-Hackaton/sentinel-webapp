'use client';

import { AuthProvider } from '@/app/context/AuthContext';
import { TestamentProvider } from '@/app/context/TestamentContext';
import { LanguageProvider } from '@/app/context/LanguageContext';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <TestamentProvider>{children}</TestamentProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
