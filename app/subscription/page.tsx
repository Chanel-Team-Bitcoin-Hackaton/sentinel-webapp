'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/app/lib/api';
import { useLanguage } from '@/app/context/LanguageContext';
import { useTheme } from '@/app/context/ThemeContext';
import { translations } from '@/app/lib/translations';

type Status = 'loading' | 'waiting' | 'paid' | 'error';

export default function SubscriptionPage() {
  const router = useRouter();
  const { lang, toggleLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const L = translations[lang].subscription;
  const LD = translations[lang].dashboardLayout;
  const [status, setStatus] = useState<Status>('loading');
  const [invoice, setInvoice] = useState('');
  const [paymentHash, setPaymentHash] = useState('');
  const [amountSats, setAmountSats] = useState(21000);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadInvoice = useCallback(async () => {
    setStatus('loading');
    setInvoice('');
    setPaymentHash('');
    try {
      const res = await api.subscription.requestInvoice();
      setInvoice(res.payment_request);
      setPaymentHash(res.payment_hash);
      setAmountSats(res.amountSats);
      setStatus('waiting');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : L.invoiceError);
      setStatus('error');
    }
  }, [L.invoiceError]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  // Poll payment status
  useEffect(() => {
    if (status !== 'waiting' || !paymentHash) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.subscription.checkStatus(paymentHash);
        if (res.paid) {
          clearInterval(interval);
          setStatus('paid');
          setTimeout(() => router.push('/setup'), 2000);
        }
      } catch {
        // silently retry
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status, paymentHash, router]);

  const copyInvoice = useCallback(() => {
    navigator.clipboard.writeText(invoice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [invoice]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes glowfade { 0%,100%{opacity:0.55} 50%{opacity:0.9} }
        @keyframes confetti { 0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
      `}</style>

      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -8, right: 0, display: 'flex', gap: 8 }}>
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

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 18, color: 'var(--btn-text)' }}>S</span>
          </div>
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600, fontSize: 22, color: 'var(--text)' }}>
            Sentinel
          </span>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontFamily: 'Playfair Display, serif',
            fontStyle: 'italic',
            fontSize: 26,
            fontWeight: 600,
            color: 'var(--text)',
            margin: '0 0 10px',
            textAlign: 'center',
          }}
        >
          {L.heading}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-dim)', textAlign: 'center', margin: '0 0 32px', lineHeight: 1.55 }}>
          {L.desc1}<br />
          {L.desc2}
        </p>

        {/* Card */}
        <div
          style={{
            width: '100%',
            background: 'var(--panel)',
            border: '0.5px solid var(--border)',
            borderRadius: 20,
            padding: 32,
            textAlign: 'center',
          }}
        >
          {status === 'loading' && (
            <div style={{ padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  border: '3px solid rgba(var(--accent-rgb), 0.2)',
                  borderTopColor: 'var(--accent-ink)',
                  borderRadius: '50%',
                  animation: 'spin 0.9s linear infinite',
                }}
              />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{L.generating}</span>
            </div>
          )}

          {status === 'waiting' && (
            <>
              {/* Amount badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(var(--accent-rgb), 0.08)',
                  border: '0.5px solid rgba(var(--accent-rgb), 0.25)',
                  borderRadius: 12,
                  padding: '10px 20px',
                  marginBottom: 20,
                }}
              >
                <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-ink)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {amountSats.toLocaleString()}
                </span>
                <span style={{ fontSize: 14, color: 'var(--text-dim)', fontWeight: 500 }}>{L.sats}</span>
              </div>

              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 24px' }}>
                {L.accessNote}
              </p>

              {/* QR placeholder */}
              <div
                style={{
                  width: 180,
                  height: 180,
                  margin: '0 auto 20px',
                  background: '#fff',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 6px rgba(var(--accent-rgb), 0.08)',
                }}
              >
                <div style={{ textAlign: 'center', color: '#333' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--accent-ink)' }}>
                    qr_code_2
                  </span>
                  <div style={{ fontSize: 9, marginTop: 4, fontFamily: 'JetBrains Mono, monospace', color: '#999' }}>
                    LIGHTNING
                  </div>
                </div>
              </div>

              {/* Invoice string */}
              <div
                style={{
                  background: 'var(--bg)',
                  border: '0.5px solid var(--border)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 12,
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono, monospace',
                  color: 'var(--text-muted)',
                  wordBreak: 'break-all',
                  maxHeight: 56,
                  overflow: 'hidden',
                  textAlign: 'left',
                }}
              >
                {invoice}
              </div>

              <button
                onClick={copyInvoice}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  borderRadius: 10,
                  border: '0.5px solid var(--border)',
                  background: 'var(--panel-inner)',
                  color: 'var(--text-soft)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  {copied ? 'check' : 'content_copy'}
                </span>
                {copied ? L.copied : L.copy}
              </button>

              {/* Wallet suggestions */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <a
                  href={`lightning:${invoice}`}
                  style={{
                    flex: 1,
                    border: '0.5px solid var(--border)',
                    borderRadius: 20,
                    padding: '7px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    background: 'var(--panel-inner)',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-soft)' }}>Phoenix</span>
                </a>
                <a
                  href={`lightning:${invoice}`}
                  style={{
                    flex: 1,
                    border: '0.5px solid var(--border)',
                    borderRadius: 20,
                    padding: '7px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    background: 'var(--panel-inner)',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: 4, background: '#0066FF' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-soft)' }}>Breez</span>
                </a>
              </div>

              {/* Waiting indicator */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  animation: 'glowfade 3s ease-in-out infinite',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>hourglass_top</span>
                {L.waitingPayment}
              </div>
            </>
          )}

          {status === 'paid' && (
            <div style={{ padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: 'rgba(var(--success-rgb), 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'confetti 0.5s ease-out',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 40, color: 'var(--success)', fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              </div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, color: 'var(--success)', margin: 0 }}>
                {L.activated}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: 0 }}>
                {L.redirecting}
              </p>
            </div>
          )}

          {status === 'error' && (
            <div style={{ padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#EF4444' }}>error</span>
              <p style={{ fontSize: 13, color: '#EF4444', margin: 0 }}>{errorMsg}</p>
              <button
                onClick={loadInvoice}
                style={{
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '11px 24px',
                  color: 'var(--btn-text)',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                {L.retry}
              </button>
            </div>
          )}
        </div>

        {/* Trust line */}
        <div style={{ marginTop: 24, display: 'flex', gap: 10, alignItems: 'flex-start', padding: '0 8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-muted)', marginTop: 1, flexShrink: 0 }}>lock</span>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            {L.trustNote}
          </p>
        </div>
      </div>
    </div>
  );
}
