'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { translations } from '@/app/lib/translations';

export default function SignupPage() {
  const { signup, isLoading, error, clearError } = useAuth();
  const router = useRouter();
  const { lang, toggleLang } = useLanguage();
  const L = translations[lang].signup;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nsec, setNsec] = useState<string | null>(null);
  const [nsecCopied, setNsecCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError(L.passwordMismatch);
      return;
    }
    if (password.length < 8) {
      setLocalError(L.passwordTooShort);
      return;
    }

    try {
      const result = await signup(email, password);
      if (result.nsec) {
        setNsec(result.nsec);
      } else {
        router.push('/setup');
      }
    } catch {
      // error is set in context
    }
  };

  const copyNsec = () => {
    if (nsec) {
      navigator.clipboard.writeText(nsec);
      setNsecCopied(true);
      setTimeout(() => setNsecCopied(false), 2500);
    }
  };

  const displayError = localError || error;

  // If nsec was returned, show the Nostr key screen
  if (nsec) {
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
        <div style={{ width: '100%', maxWidth: 480, position: 'relative' }}>
          <button
            onClick={toggleLang}
            title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
            style={{ position: 'absolute', top: -44, right: 0, border: '1px solid var(--border)', cursor: 'pointer', background: 'transparent', color: 'var(--text-dim)', height: 32, borderRadius: 7, padding: '0 10px', fontSize: 12, fontWeight: 600, fontFamily: 'monospace', letterSpacing: '0.06em' }}
          >
            {lang === 'fr' ? 'EN' : 'FR'}
          </button>
          <div
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 32,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(var(--success-rgb), 0.12)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 32, color: 'var(--success)', fontVariationSettings: "'FILL' 1" }}
              >
                key
              </span>
            </div>

            <h2
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 22,
                fontWeight: 600,
                color: 'var(--text)',
                marginBottom: 8,
              }}
            >
              {L.nsecTitle}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 24, lineHeight: 1.6 }}>
              {L.nsecDesc}
            </p>

            {/* nsec display */}
            <div
              style={{
                background: 'var(--panel-inner)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {L.nsecLabel}
              </div>
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 13,
                  color: 'var(--accent-ink)',
                  wordBreak: 'break-all',
                  lineHeight: 1.5,
                }}
              >
                {nsec}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={copyNsec}
                style={{
                  flex: 1,
                  padding: '11px 0',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--panel-inner)',
                  color: 'var(--text-soft)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  {nsecCopied ? 'check' : 'content_copy'}
                </span>
                {nsecCopied ? L.copied : L.copy}
              </button>
              <button
                onClick={() => router.push('/setup')}
                style={{
                  flex: 2,
                  padding: '11px 0',
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
                {L.continueSetup}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        <button
          onClick={toggleLang}
          title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
          style={{ position: 'absolute', top: 0, right: 0, border: '1px solid var(--border)', cursor: 'pointer', background: 'transparent', color: 'var(--text-dim)', height: 32, borderRadius: 7, padding: '0 10px', fontSize: 12, fontWeight: 600, fontFamily: 'monospace', letterSpacing: '0.06em' }}
        >
          {lang === 'fr' ? 'EN' : 'FR'}
        </button>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, var(--accent), #E8820C)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(var(--accent-rgb), 0.3)',
              marginBottom: 16,
            }}
          >
            <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 26, color: '#fff' }}>
              S
            </span>
          </div>
          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 26,
              fontWeight: 600,
              color: 'var(--text)',
              margin: '0 0 6px',
            }}
          >
            {L.heading}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-dim)' }}>
            {L.tagline}
          </p>
        </div>

        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 28,
          }}
        >
          <form onSubmit={handleSubmit}>
            {displayError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 20,
                  fontSize: 13,
                  color: '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
                {displayError}
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <label htmlFor="signup-email" style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-dim)', marginBottom: 6 }}>
                {L.emailLabel}
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={L.emailPlaceholder}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--panel-inner)',
                  color: 'var(--text)',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label htmlFor="signup-password" style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-dim)', marginBottom: 6 }}>
                {L.passwordLabel}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={L.passwordPlaceholder}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 42px 11px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--panel-inner)',
                    color: 'var(--text)',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 4,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label htmlFor="signup-confirm" style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-dim)', marginBottom: 6 }}>
                {L.confirmLabel}
              </label>
              <input
                id="signup-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={L.confirmPlaceholder}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--panel-inner)',
                  color: 'var(--text)',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 0',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, var(--accent), #E8820C)',
                color: 'var(--btn-text)',
                fontSize: 14,
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                boxShadow: '0 2px 12px rgba(var(--accent-rgb), 0.25)',
              }}
            >
              {isLoading ? L.creating : L.submit}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
          {L.haveAccount}{' '}
          <Link href="/login" style={{ color: 'var(--accent-ink)', textDecoration: 'none', fontWeight: 500 }}>
            {L.signIn}
          </Link>
        </p>
      </div>
    </div>
  );
}
