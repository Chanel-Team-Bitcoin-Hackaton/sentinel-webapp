'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useTestament } from '@/app/context/TestamentContext';
import DashboardLayout from '@/app/components/DashboardLayout';
import { useLanguage } from '@/app/context/LanguageContext';
import { translations } from '@/app/lib/translations';

export default function HistoryPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { testament, checkins, isLoading, refresh } = useTestament();
  const router = useRouter();
  const { lang } = useLanguage();
  const L = translations[lang].dashboardHistory;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    }
  }, [isAuthenticated, refresh]);

  if (authLoading || isLoading) {
    return (
      <DashboardLayout title={L.title}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: 'var(--text-muted)' }}>
          {L.loading}
        </div>
      </DashboardLayout>
    );
  }

  if (!testament) {
    return (
      <DashboardLayout title={L.title}>
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          {L.configureFirst}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={L.title} subtitle={L.subtitle}>
      <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-soft)', margin: 0 }}>
            {L.sectionTitle}
          </h3>
          <span
            style={{
              fontSize: 11,
              fontFamily: 'JetBrains Mono, monospace',
              background: 'rgba(52, 211, 153, 0.08)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              borderRadius: 6,
              padding: '3px 8px',
              color: 'var(--success)',
            }}
          >
            {L.proofOfLifeBadge}
          </span>
        </div>

        {checkins.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            {L.noCheckins}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--panel-inner)' }}>
                  <th style={{ padding: '14px 24px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{L.colDate}</th>
                  <th style={{ padding: '14px 24px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{L.colAmount}</th>
                  <th style={{ padding: '14px 24px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{L.colPreimage}</th>
                  <th style={{ padding: '14px 24px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{L.colStatus}</th>
                </tr>
              </thead>
              <tbody>
                {checkins.map((checkin) => (
                  <tr key={checkin.id} style={{ borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <td style={{ padding: '16px 24px', color: 'var(--text-soft)' }}>
                      {new Date(checkin.createdAt).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-soft)', fontWeight: 500 }}>
                      {checkin.amountSats} sat
                    </td>
                    <td style={{ padding: '16px 24px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent-ink)' }}>
                      {checkin.preimage || '—'}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 500,
                          color: checkin.status === 'PAID' ? 'var(--success)' : '#FBBF24',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          {checkin.status === 'PAID' ? 'check_circle' : 'hourglass_bottom'}
                        </span>
                        {checkin.status === 'PAID' ? L.statusPaid : L.statusPending}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
