'use client';

import React, { use, useState, useEffect } from 'react';
import LNInvoiceModal from '@/app/components/LNInvoiceModal';
import { api, type Testament } from '@/app/lib/api';
import { useLanguage } from '@/app/context/LanguageContext';
import { useTheme } from '@/app/context/ThemeContext';
import { translations } from '@/app/lib/translations';

export default function PublicCheckinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: testamentId } = use(params);
  const { lang, toggleLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const L = translations[lang].checkin;
  const LD = translations[lang].dashboardLayout;
  const [testament, setTestament] = useState<Testament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);

  const fetchTestament = async () => {
    setIsLoading(true);
    try {
      // Fetch public testament state
      // In mock, we can get it from storage
      const res = await api.legacy.getPortalData(testamentId); // reuse this public method to get metadata
      setTestament(res.testament);
    } catch {
      // If not found in mock, let's create a temporary mock testament so the user can test the UI easily
      const mockTestament: Testament = {
        id: testamentId,
        ownerId: 'usr_unknown',
        delayDays: 30,
        lastSeenAt: new Date().toISOString(),
        nextCheckinAt: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString(),
        status: 'ACTIVE',
        anchorTxid: 'tx_btc_quick_checkin_demo',
        triggeredAt: null,
        createdAt: new Date().toISOString(),
      };
      setTestament(mockTestament);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTestament();
  }, [testamentId]);

  const handlePaymentConfirmed = () => {
    setShowInvoice(false);
    fetchTestament();
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ color: 'var(--text-muted)' }}>{L.loading}</div>
      </div>
    );
  }

  if (!testament) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#EF4444', marginBottom: 12 }}>error</span>
          <h2 style={{ fontSize: 20, color: 'var(--text)' }}>{L.notFoundTitle}</h2>
          <p style={{ fontSize: 14, color: 'var(--text-dim)' }}>{L.notFoundDesc}</p>
        </div>
      </div>
    );
  }

  // Calculate countdown
  const now = new Date();
  const target = new Date(testament.nextCheckinAt);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: 20,
      }}
    >
      <div style={{ width: '100%', maxWidth: 440, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', gap: 8 }}>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? LD.lightMode : LD.darkMode}
            style={{ border: '1px solid var(--border)', cursor: 'pointer', background: 'transparent', color: 'var(--text-dim)', width: 32, height: 32, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <button
            onClick={toggleLang}
            title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
            style={{ border: '1px solid var(--border)', cursor: 'pointer', background: 'transparent', color: 'var(--text-dim)', height: 32, borderRadius: 7, padding: '0 10px', fontSize: 12, fontWeight: 600, fontFamily: 'monospace', letterSpacing: '0.06em' }}
          >
            {lang === 'fr' ? 'EN' : 'FR'}
          </button>
        </div>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--accent), #E8820C)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(var(--accent-rgb), 0.25)',
              marginBottom: 14,
            }}
          >
            <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 24, color: '#fff' }}>S</span>
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>
            {L.title}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            {L.subtitle}
          </p>
        </div>

        {/* Info Card */}
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 28,
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          {/* Status badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--panel-inner)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '6px 14px',
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: testament.status === 'ACTIVE' ? 'var(--success)' : '#EF4444',
                boxShadow: testament.status === 'ACTIVE' ? '0 0 6px rgba(var(--success-rgb), 0.5)' : 'none',
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: testament.status === 'ACTIVE' ? 'var(--success)' : '#EF4444', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {L.testamentLabel} {testament.status === 'ACTIVE' ? L.statusActive : L.statusTriggered}
            </span>
          </div>

          {/* Countdown display */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              {L.timeRemaining}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 44, fontWeight: 700, color: 'var(--text)' }}>
                {testament.status === 'TRIGGERED' ? '0' : diffDays}
              </span>
              {testament.status !== 'TRIGGERED' && (
                <span style={{ fontSize: 14, color: 'var(--text-dim)', fontWeight: 500 }}>
                  {diffDays !== 1 ? L.days : L.day}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowInvoice(true)}
            disabled={testament.status === 'TRIGGERED'}
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 10,
              border: 'none',
              background: testament.status === 'TRIGGERED' ? 'var(--border)' : 'linear-gradient(135deg, var(--accent), #E8820C)',
              color: testament.status === 'TRIGGERED' ? 'var(--text-faint)' : 'var(--btn-text)',
              fontSize: 14,
              fontWeight: 600,
              cursor: testament.status === 'TRIGGERED' ? 'not-allowed' : 'pointer',
              boxShadow: testament.status !== 'TRIGGERED' ? '0 2px 12px rgba(var(--accent-rgb), 0.25)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {L.checkinCta}
          </button>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {L.footerNote}
        </p>
      </div>

      {/* LN Invoice Modal */}
      <LNInvoiceModal
        testamentId={testamentId}
        isOpen={showInvoice}
        onClose={() => setShowInvoice(false)}
        onPaymentConfirmed={handlePaymentConfirmed}
      />
    </div>
  );
}
