'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Loading splash
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg, var(--accent), #E8820C)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 24px rgba(var(--accent-rgb), 0.3)',
          }}
        >
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 28, color: '#fff' }}>S</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          Chargement…
        </p>
      </div>
    </div>
  );
}
