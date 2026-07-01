'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/app/lib/api';

type Status = 'loading' | 'waiting' | 'paid' | 'error';

export default function SubscriptionPage() {
  const router = useRouter();
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
      setErrorMsg(err instanceof Error ? err.message : "Impossible de générer l'invoice.");
      setStatus('error');
    }
  }, []);

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
        background: '#0D0D0D',
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

      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
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
            <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 18, color: '#000' }}>S</span>
          </div>
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600, fontSize: 22, color: '#F4F1EE' }}>
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
            color: '#F4F1EE',
            margin: '0 0 10px',
            textAlign: 'center',
          }}
        >
          Activez votre testament
        </h1>
        <p style={{ fontSize: 14, color: '#A8A29B', textAlign: 'center', margin: '0 0 32px', lineHeight: 1.55 }}>
          Un abonnement annuel unique vous donne accès à la protection Sentinel.<br />
          Paiement en satoshis via Lightning — aucune carte, aucun email.
        </p>

        {/* Card */}
        <div
          style={{
            width: '100%',
            background: '#161616',
            border: '0.5px solid rgba(255,255,255,0.1)',
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
                  border: '3px solid rgba(247,147,26,0.2)',
                  borderTopColor: '#F7931A',
                  borderRadius: '50%',
                  animation: 'spin 0.9s linear infinite',
                }}
              />
              <span style={{ fontSize: 13, color: '#6F6A64' }}>Génération de l'invoice…</span>
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
                  background: 'rgba(247,147,26,0.08)',
                  border: '0.5px solid rgba(247,147,26,0.25)',
                  borderRadius: 12,
                  padding: '10px 20px',
                  marginBottom: 20,
                }}
              >
                <span style={{ fontSize: 28, fontWeight: 700, color: '#F7931A', fontFamily: 'JetBrains Mono, monospace' }}>
                  {amountSats.toLocaleString()}
                </span>
                <span style={{ fontSize: 14, color: '#A8A29B', fontWeight: 500 }}>sats</span>
              </div>

              <p style={{ fontSize: 12, color: '#6F6A64', margin: '0 0 24px' }}>
                ≈ 1 an d'accès · renouvelable à tout moment
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
                  boxShadow: '0 0 0 6px rgba(247,147,26,0.08)',
                }}
              >
                <div style={{ textAlign: 'center', color: '#333' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 56, color: '#F7931A' }}>
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
                  background: '#0D0D0D',
                  border: '0.5px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 12,
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono, monospace',
                  color: '#6F6A64',
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
                  border: '0.5px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#D8D4CE',
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
                {copied ? 'Copié !' : "Copier l'invoice"}
              </button>

              {/* Wallet suggestions */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <a
                  href={`lightning:${invoice}`}
                  style={{
                    flex: 1,
                    border: '0.5px solid rgba(255,255,255,0.1)',
                    borderRadius: 20,
                    padding: '7px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    background: 'rgba(255,255,255,0.02)',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F7931A' }} />
                  <span style={{ fontSize: 12, color: '#D8D4CE' }}>Phoenix</span>
                </a>
                <a
                  href={`lightning:${invoice}`}
                  style={{
                    flex: 1,
                    border: '0.5px solid rgba(255,255,255,0.1)',
                    borderRadius: 20,
                    padding: '7px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    background: 'rgba(255,255,255,0.02)',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: 4, background: '#0066FF' }} />
                  <span style={{ fontSize: 12, color: '#D8D4CE' }}>Breez</span>
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
                  color: '#6F6A64',
                  animation: 'glowfade 3s ease-in-out infinite',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>hourglass_top</span>
                En attente du paiement Lightning…
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
                  background: 'rgba(52,211,153,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'confetti 0.5s ease-out',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 40, color: '#34D399', fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              </div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, color: '#34D399', margin: 0 }}>
                Abonnement activé !
              </h3>
              <p style={{ fontSize: 13, color: '#A8A29B', margin: 0 }}>
                Redirection vers la configuration…
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
                  background: '#F7931A',
                  border: 'none',
                  borderRadius: 10,
                  padding: '11px 24px',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Réessayer
              </button>
            </div>
          )}
        </div>

        {/* Trust line */}
        <div style={{ marginTop: 24, display: 'flex', gap: 10, alignItems: 'flex-start', padding: '0 8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#6F6A64', marginTop: 1, flexShrink: 0 }}>lock</span>
          <p style={{ fontSize: 12, color: '#6F6A64', margin: 0, lineHeight: 1.5 }}>
            Paiement Lightning anonyme. Sentinel ne collecte aucune donnée personnelle liée à ce paiement.
          </p>
        </div>
      </div>
    </div>
  );
}
