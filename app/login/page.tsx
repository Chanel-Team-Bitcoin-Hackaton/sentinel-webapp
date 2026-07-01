'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/app/lib/api';
import { useLanguage } from '@/app/context/LanguageContext';
import { useTheme } from '@/app/context/ThemeContext';
import { translations } from '@/app/lib/translations';

type AuthStatus = 'LOADING' | 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'ERROR' | 'NETWORK_ERROR';

// Minimal QR code renderer — uses the free qrserver.com API as an <img src>.
// Fallback: display the raw LNURL string only.
function QRCode({ value, size = 180 }: { value: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(value)}&size=${size}x${size}&bgcolor=ffffff&margin=2`;

  if (failed) {
    return (
      <div
        style={{
          width: size,
          height: size,
          background: '#fff',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12,
        }}
      >
        <span style={{ fontSize: 10, color: '#333', wordBreak: 'break-all', textAlign: 'center', fontFamily: 'monospace' }}>
          {value}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="LNURL QR code"
      width={size}
      height={size}
      style={{ borderRadius: 8, display: 'block' }}
      onError={() => setFailed(true)}
    />
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { lang, toggleLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const L = translations[lang].login;
  const LD = translations[lang].dashboardLayout;

  const [status, setStatus] = useState<AuthStatus>('LOADING');
  const [lnurl, setLnurl] = useState('');
  const [k1, setK1] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const currentK1 = useRef<string | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  const clearPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (activeK1: string, expireString: string) => {
      const expireTime = new Date(expireString).getTime();

      pollingInterval.current = setInterval(async () => {
        if (Date.now() > expireTime) {
          clearPolling();
          if (currentK1.current === activeK1) setStatus('EXPIRED');
          return;
        }

        try {
          const result = await api.auth.checkLnurlStatus(activeK1);
          if (currentK1.current !== activeK1) return;

          if (result.status === 'CONFIRMED') {
            clearPolling();
            setStatus('CONFIRMED');
            setTimeout(() => router.push('/dashboard'), 800);
          } else if (result.status === 'ERROR') {
            clearPolling();
            setStatus('ERROR');
            setErrorMessage(L.invalidSignature);
          }
        } catch {
          // network hiccup — keep polling
        }
      }, 2000);
    },
    [clearPolling, router, L.invalidSignature]
  );

  const generateChallenge = useCallback(async () => {
    clearPolling();
    setStatus('LOADING');
    setErrorMessage('');

    try {
      const challenge = await api.auth.getLnurlChallenge();
      setLnurl(challenge.lnurl);
      setK1(challenge.k1);
      setExpiresAt(challenge.expiresAt);
      currentK1.current = challenge.k1;
      setStatus('PENDING');
      startPolling(challenge.k1, challenge.expiresAt);
    } catch {
      setStatus('NETWORK_ERROR');
      setErrorMessage(L.networkError);
    }
  }, [clearPolling, startPolling, L.networkError]);

  useEffect(() => {
    generateChallenge();
    return () => {
      clearPolling();
      currentK1.current = null;
    };
  }, [generateChallenge, clearPolling]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(lnurl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard denied
    }
  };

  const handleDevConfirm = async () => {
    if (!k1 || simulating) return;
    setSimulating(true);
    try {
      await api.auth.devConfirmLnurl(k1);
      clearPolling();
      setStatus('CONFIRMED');
      setTimeout(() => router.push('/dashboard'), 800);
    } catch {
      setSimulating(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: 24,
      }}
    >
      <style>{`
        @keyframes sigpulse {
          0%   { opacity: 1; transform: scale(1); }
          50%  { opacity: 0.5; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ width: '100%', maxWidth: 390, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 18, color: 'var(--btn-text)' }}>S</span>
          </div>
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600, fontSize: 24, color: 'var(--text)', letterSpacing: '0.5px' }}>
            Sentinel
          </span>
        </div>

        {/* Heading */}
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: 28, fontWeight: 600, color: 'var(--text)', margin: '0 0 12px', textAlign: 'center' }}>
          {L.heading}
        </h1>
        <p style={{ textAlign: 'center', fontSize: 15, color: 'var(--text-dim)', margin: '0 0 32px', lineHeight: 1.5 }}>
          {L.subheading1}<br />{L.subheading2}
        </p>

        {/* Language & theme toggles */}
        <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 8 }}>
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

        {/* Main Card */}
        <div
          style={{
            background: 'var(--panel)',
            border: '0.5px solid var(--border)',
            borderRadius: 16,
            padding: 32,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: 460,
            justifyContent: 'center',
          }}
        >
          {status === 'LOADING' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 32, height: 32, border: '3px solid rgba(var(--accent-rgb), 0.2)', borderTopColor: 'var(--accent-ink)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>{L.generating}</span>
            </div>
          )}

          {status === 'CONFIRMED' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(var(--success-rgb), 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--success)' }}>check_circle</span>
              </div>
              <span style={{ color: 'var(--success)', fontSize: 16, fontWeight: 600 }}>{L.confirmed}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{L.redirecting}</span>
            </div>
          )}

          {(status === 'ERROR' || status === 'NETWORK_ERROR' || status === 'EXPIRED') && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#EF4444' }}>
                  {status === 'EXPIRED' ? 'timer_off' : 'error'}
                </span>
              </div>
              <span style={{ color: '#EF4444', fontSize: 15, fontWeight: 500, textAlign: 'center' }}>
                {status === 'EXPIRED' ? L.qrExpired : errorMessage}
              </span>
              <button
                onClick={generateChallenge}
                style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '12px 24px', color: 'var(--btn-text)', fontWeight: 600, fontSize: 14, cursor: 'pointer', width: '100%' }}
              >
                {L.newQr}
              </button>
            </div>
          )}

          {status === 'PENDING' && (
            <>
              <span style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 20, fontWeight: 500 }}>
                {L.scanPrompt}
              </span>

              {/* Real QR code */}
              <div style={{ background: '#FFFFFF', padding: 12, borderRadius: 12, marginBottom: 20 }}>
                <QRCode value={lnurl} size={180} />
              </div>

              {/* LNURL copyable */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '10px 14px', width: '100%', marginBottom: 20 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 12 }}>
                  {lnurl.substring(0, 26)}…
                </span>
                <button
                  onClick={copyToClipboard}
                  style={{ background: 'transparent', border: 'none', color: copied ? 'var(--success)' : 'var(--accent-ink)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, flexShrink: 0 }}
                >
                  {copied ? L.copied : L.copy}
                </button>
              </div>

              {/* Wallet links */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, width: '100%' }}>
                {[
                  { name: 'Phoenix', color: 'var(--accent-ink)', shape: 'circle' as const },
                  { name: 'Breez',   color: '#0066FF', shape: 'square' as const },
                  { name: 'Muun',    color: '#6B4EFF', shape: 'circle' as const },
                ].map(({ name, color, shape }) => (
                  <a
                    key={name}
                    href={`lightning:${lnurl}`}
                    style={{ flex: 1, border: '0.5px solid var(--border)', borderRadius: 20, padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--panel-inner)', textDecoration: 'none' }}
                  >
                    <div style={{ width: 12, height: 12, borderRadius: shape === 'circle' ? '50%' : 3, background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-soft)', fontWeight: 500 }}>{name}</span>
                  </a>
                ))}
              </div>

              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>{L.anyWallet}</span>

              {/* Polling indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'sigpulse 2s infinite', boxShadow: '0 0 8px rgba(var(--accent-rgb), 0.6)' }} />
                <span style={{ fontSize: 13, color: 'var(--accent-ink)', fontWeight: 500 }}>{L.waitingSignature}</span>
              </div>

              {/* Dev / demo button */}
              <div style={{ width: '100%', borderTop: '0.5px solid var(--border)', paddingTop: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--text-faint)', textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace' }}>
                  {L.demoMode}
                </div>
                <button
                  onClick={handleDevConfirm}
                  disabled={simulating}
                  style={{
                    width: '100%',
                    padding: '11px 0',
                    borderRadius: 10,
                    border: '1px dashed rgba(var(--accent-rgb), 0.35)',
                    background: simulating ? 'rgba(var(--accent-rgb), 0.04)' : 'rgba(var(--accent-rgb), 0.06)',
                    color: simulating ? 'var(--text-muted)' : 'var(--accent-ink)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: simulating ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.15s',
                  }}
                >
                  {simulating
                    ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(var(--accent-rgb), 0.3)', borderTopColor: 'var(--accent-ink)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> {L.connecting}</>
                    : <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>bolt</span> {L.simulateScan}</>
                  }
                </button>
              </div>
            </>
          )}
        </div>

        {/* Security notice */}
        <div style={{ display: 'flex', gap: 10, marginTop: 28, padding: '0 8px', alignItems: 'flex-start' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-muted)', marginTop: 1 }}>lock</span>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            {L.securityNotice}
          </p>
        </div>

        <div style={{ marginTop: 32 }}>
          <Link href="/signup" style={{ fontSize: 13, color: 'var(--text-dim)', textDecoration: 'none' }}>
            {L.noAccount}{' '}
            <span style={{ color: 'var(--accent-ink)', fontWeight: 600 }}>{L.createAccount}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
