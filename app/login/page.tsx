'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/app/lib/api';

type AuthStatus = 'LOADING' | 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'ERROR' | 'NETWORK_ERROR';

export default function LoginPage() {
  const router = useRouter();
  
  const [status, setStatus] = useState<AuthStatus>('LOADING');
  const [lnurl, setLnurl] = useState('');
  const [k1, setK1] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  // Use refs to keep track of active instances and prevent race conditions
  const currentK1 = useRef<string | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  const clearPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, []);

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
    } catch (err) {
      console.error(err);
      setStatus('NETWORK_ERROR');
      setErrorMessage('Connexion impossible, réessayez');
    }
  }, [clearPolling]);

  const startPolling = useCallback((activeK1: string, expireString: string) => {
    const expireTime = new Date(expireString).getTime();
    
    pollingInterval.current = setInterval(async () => {
      // Check expiration
      if (Date.now() > expireTime) {
        clearPolling();
        if (currentK1.current === activeK1) {
          setStatus('EXPIRED');
        }
        return;
      }

      try {
        const result = await api.auth.checkLnurlStatus(activeK1);
        
        // If this polling is no longer the active one, ignore the result
        if (currentK1.current !== activeK1) return;

        if (result.status === 'CONFIRMED') {
          clearPolling();
          setStatus('CONFIRMED');
          router.push('/dashboard');
        } else if (result.status === 'ERROR') {
          clearPolling();
          setStatus('ERROR');
          setErrorMessage('Signature invalide, réessayez');
        }
        // If PENDING, just continue
      } catch (err) {
        // Network error during polling
        console.error('Polling error', err);
        // Let it continue polling, maybe network comes back before expiration, 
        // but if it fails too many times we could set NETWORK_ERROR.
        // For simplicity and resilience, we just log it and try again next tick.
        // Or if the user wants an explicit NETWORK_ERROR state to stop polling:
        // clearPolling();
        // if (currentK1.current === activeK1) {
        //   setStatus('NETWORK_ERROR');
        //   setErrorMessage('Connexion interrompue, réessayez');
        // }
      }
    }, 2000);
  }, [clearPolling, router]);

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
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0D0D0D',
        padding: 24,
      }}
    >
      <style>{`
        @keyframes sigpulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ width: '100%', maxWidth: 390, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Logo and Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#F7931A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 18, color: '#000' }}>
              S
            </span>
          </div>
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600, fontSize: 24, color: '#F4F1EE', letterSpacing: '0.5px' }}>
            Sentinel
          </span>
        </div>

        {/* Heading & Subtext */}
        <h1
          style={{
            fontFamily: 'Playfair Display, serif',
            fontStyle: 'italic',
            fontSize: 28,
            fontWeight: 600,
            color: '#F4F1EE',
            margin: '0 0 12px',
            textAlign: 'center',
          }}
        >
          Your wallet is your identity.
        </h1>
        <p style={{ textAlign: 'center', fontSize: 15, color: '#A8A29B', margin: '0 0 32px', lineHeight: 1.5 }}>
          No email. No password. Sign in with your<br/>Bitcoin Lightning wallet.
        </p>

        {/* Main Card */}
        <div
          style={{
            background: '#161616',
            border: '0.5px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 16,
            padding: 32,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: 460, // Keep card height stable during state changes
            justifyContent: 'center',
          }}
        >
          {status === 'LOADING' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  border: '3px solid rgba(247, 147, 26, 0.2)',
                  borderTopColor: '#F7931A',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <span style={{ color: '#A8A29B', fontSize: 14 }}>Génération du challenge...</span>
            </div>
          )}

          {status === 'CONFIRMED' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(52, 211, 153, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34D399',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>check</span>
              </div>
              <span style={{ color: '#34D399', fontSize: 15, fontWeight: 500 }}>Connexion réussie !</span>
            </div>
          )}

          {(status === 'ERROR' || status === 'NETWORK_ERROR' || status === 'EXPIRED') && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: '100%' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#EF4444',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                  {status === 'EXPIRED' ? 'timer_off' : 'error'}
                </span>
              </div>
              <span style={{ color: '#EF4444', fontSize: 15, fontWeight: 500, textAlign: 'center' }}>
                {status === 'EXPIRED' ? 'QR code expiré' : errorMessage}
              </span>
              <button
                onClick={generateChallenge}
                style={{
                  background: '#F7931A',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 24px',
                  color: '#000',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Générer un nouveau QR
              </button>
            </div>
          )}

          {status === 'PENDING' && (
            <>
              <span style={{ fontSize: 13, color: '#A8A29B', marginBottom: 20, fontWeight: 500 }}>
                Scan to sign in
              </span>
              
              {/* QR Code Placeholder (could be a real react-qr-code in production) */}
              <div
                style={{
                  background: '#FFFFFF',
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 24,
                }}
              >
                <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="10" width="40" height="40" stroke="#000" strokeWidth="6" />
                  <rect x="20" y="20" width="20" height="20" fill="#000" />
                  <rect x="130" y="10" width="40" height="40" stroke="#000" strokeWidth="6" />
                  <rect x="140" y="20" width="20" height="20" fill="#000" />
                  <rect x="10" y="130" width="40" height="40" stroke="#000" strokeWidth="6" />
                  <rect x="20" y="140" width="20" height="20" fill="#000" />
                  
                  <rect x="70" y="10" width="20" height="20" fill="#000" />
                  <rect x="100" y="30" width="20" height="20" fill="#000" />
                  <rect x="70" y="50" width="40" height="20" fill="#000" />
                  <rect x="10" y="70" width="40" height="20" fill="#000" />
                  <rect x="60" y="80" width="20" height="20" fill="#000" />
                  <rect x="100" y="90" width="20" height="40" fill="#000" />
                  <rect x="140" y="70" width="30" height="20" fill="#000" />
                  <rect x="130" y="110" width="20" height="20" fill="#000" />
                  <rect x="70" y="130" width="20" height="40" fill="#000" />
                  <rect x="100" y="150" width="40" height="20" fill="#000" />
                  <rect x="150" y="140" width="20" height="30" fill="#000" />
                </svg>
              </div>

              {/* Monospace Fallback */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#0D0D0D',
                  border: '0.5px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  width: '100%',
                  marginBottom: 24,
                }}
              >
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 13,
                    color: '#D8D4CE',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginRight: 12,
                  }}
                >
                  {lnurl.substring(0, 24)}...
                </span>
                <button
                  onClick={copyToClipboard}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#F7931A',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Copy
                </button>
              </div>

              {/* Wallet Suggestion Pills */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 12, width: '100%' }}>
                <a
                  href={`lightning:${lnurl}`}
                  style={{
                    flex: 1,
                    border: '0.5px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 24,
                    padding: '8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: 'rgba(255, 255, 255, 0.02)',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#F7931A' }}></div>
                  <span style={{ fontSize: 13, color: '#D8D4CE', fontWeight: 500 }}>Phoenix</span>
                </a>
                <a
                  href={`lightning:${lnurl}`}
                  style={{
                    flex: 1,
                    border: '0.5px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 24,
                    padding: '8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    background: 'rgba(255, 255, 255, 0.02)',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ width: 14, height: 14, borderRadius: '4px', background: '#0066FF' }}></div>
                  <span style={{ fontSize: 13, color: '#D8D4CE', fontWeight: 500 }}>Breez</span>
                </a>
              </div>
              <span style={{ fontSize: 12, color: '#6F6A64' }}>Any Lightning wallet works</span>

              {/* Status Indicator */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 32,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#F7931A',
                    animation: 'sigpulse 2s infinite',
                    boxShadow: '0 0 8px rgba(247, 147, 26, 0.6)',
                  }}
                />
                <span style={{ fontSize: 13, color: '#F7931A', fontWeight: 500 }}>
                  En attente de signature...
                </span>
              </div>
            </>
          )}
        </div>

        {/* Security Notice */}
        <div style={{ display: 'flex', gap: 12, marginTop: 32, padding: '0 16px', alignItems: 'flex-start' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#6F6A64', marginTop: 2 }}>lock</span>
          <p style={{ fontSize: 12, color: '#6F6A64', lineHeight: 1.5, margin: 0 }}>
            Sentinel never asks for your seed phrase. Your wallet only signs a login challenge &mdash; it never sends funds or sensitive data.
          </p>
        </div>

        {/* Bottom Link */}
        <div style={{ marginTop: 40 }}>
          <Link
            href="/help"
            style={{ fontSize: 12, color: '#A8A29B', textDecoration: 'none', fontWeight: 500 }}
          >
            Don't have a Lightning wallet yet? <span style={{ color: '#F7931A' }}>&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
