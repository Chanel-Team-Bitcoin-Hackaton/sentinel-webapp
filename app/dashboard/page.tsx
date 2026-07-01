'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useTestament } from '@/app/context/TestamentContext';
import DashboardLayout from '@/app/components/DashboardLayout';
import HeartbeatCard from '@/app/components/HeartbeatCard';
import LNInvoiceModal from '@/app/components/LNInvoiceModal';
import { useLanguage } from '@/app/context/LanguageContext';
import { translations } from '@/app/lib/translations';

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { testament, secrets, beneficiary, checkins, isLoading, refresh } = useTestament();
  const router = useRouter();
  const { lang } = useLanguage();
  const L = translations[lang].dashboard;
  const [showInvoice, setShowInvoice] = useState(false);

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

  const handlePaymentConfirmed = useCallback(() => {
    setShowInvoice(false);
    refresh();
  }, [refresh]);

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
      <DashboardLayout title={L.title} subtitle={L.welcomeSubtitle}>
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 40,
            textAlign: 'center',
            maxWidth: 480,
            margin: '60px auto',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--accent)', marginBottom: 16, display: 'block' }}>
            shield
          </span>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            {L.noTestamentTitle}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 24, lineHeight: 1.6 }}>
            {L.noTestamentDesc}
          </p>
          <button
            onClick={() => router.push('/setup')}
            style={{
              padding: '12px 28px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, var(--accent), #E8820C)',
              color: 'var(--btn-text)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(var(--accent-rgb), 0.25)',
            }}
          >
            {L.configureCta}
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={L.title} subtitle={L.overviewSubtitle}>
      {/* Heartbeat Card */}
      <HeartbeatCard
        status={testament.status}
        nextCheckinAt={testament.nextCheckinAt}
        lastSeenAt={testament.lastSeenAt}
      />

      {/* Check-in button */}
      <div style={{ marginTop: 20 }}>
        <button
          onClick={() => setShowInvoice(true)}
          disabled={testament.status === 'TRIGGERED'}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 12,
            border: 'none',
            background: testament.status === 'TRIGGERED' ? 'var(--border)' : 'linear-gradient(135deg, var(--accent), #E8820C)',
            color: testament.status === 'TRIGGERED' ? 'var(--text-faint)' : 'var(--btn-text)',
            fontSize: 15,
            fontWeight: 600,
            cursor: testament.status === 'TRIGGERED' ? 'not-allowed' : 'pointer',
            boxShadow: testament.status !== 'TRIGGERED' ? '0 2px 16px rgba(var(--accent-rgb), 0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {L.checkinCta}
        </button>
      </div>

      {/* Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 24 }}>
        {/* Secrets count */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--accent-ink)' }}>lock</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{L.secrets}</span>
          </div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>
            {secrets.length}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{secrets.length !== 1 ? L.secretPlural : L.secretSingular}</div>
        </div>

        {/* Beneficiary */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--accent-ink)' }}>person</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{L.beneficiary}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
            {beneficiary ? beneficiary.name : '—'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
            {beneficiary ? beneficiary.email : L.notDesignated}
          </div>
        </div>

        {/* Check-ins */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--accent-ink)' }}>history</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{L.checkins}</span>
          </div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>
            {checkins.filter((c) => c.status === 'PAID').length}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{checkins.length !== 1 ? L.confirmationPlural : L.confirmationSingular}</div>
        </div>
      </div>

      {/* Anchor Info */}
      {testament.anchorTxid && (
        <div style={{ marginTop: 20, background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--accent-ink)' }}>link</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {L.bitcoinAnchor}
            </span>
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-dim)', wordBreak: 'break-all' }}>
            {testament.anchorTxid}
          </div>
        </div>
      )}

      {/* LN Invoice Modal */}
      <LNInvoiceModal
        testamentId={testament.id}
        isOpen={showInvoice}
        onClose={() => setShowInvoice(false)}
        onPaymentConfirmed={handlePaymentConfirmed}
      />
    </DashboardLayout>
  );
}
