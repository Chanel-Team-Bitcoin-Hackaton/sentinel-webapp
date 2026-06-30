'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/app/lib/api';

interface LNInvoiceModalProps {
  testamentId: string;
  isOpen: boolean;
  onClose: () => void;
  onPaymentConfirmed: () => void;
}

export default function LNInvoiceModal({ testamentId, isOpen, onClose, onPaymentConfirmed }: LNInvoiceModalProps) {
  const [invoice, setInvoice] = useState<string | null>(null);
  const [paymentHash, setPaymentHash] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'waiting' | 'paid' | 'error'>('loading');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Request invoice on open
  useEffect(() => {
    if (!isOpen) return;
    setStatus('loading');
    setInvoice(null);
    setPaymentHash(null);

    api.checkin
      .requestInvoice(testamentId)
      .then((res) => {
        setInvoice(res.payment_request);
        setPaymentHash(res.payment_hash);
        setStatus('waiting');
      })
      .catch((err) => {
        setErrorMsg(err.message || "Impossible de générer l'invoice.");
        setStatus('error');
      });
  }, [isOpen, testamentId]);

  // Poll for payment status
  useEffect(() => {
    if (status !== 'waiting' || !paymentHash) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.checkin.checkStatus(testamentId, paymentHash);
        if (res.paid) {
          setStatus('paid');
          clearInterval(interval);
          setTimeout(() => {
            onPaymentConfirmed();
          }, 2000);
        }
      } catch {
        // silently retry
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status, paymentHash, testamentId, onPaymentConfirmed]);

  const copyInvoice = useCallback(() => {
    if (invoice) {
      navigator.clipboard.writeText(invoice);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [invoice]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 32,
          width: '100%',
          maxWidth: 420,
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--text)',
              margin: 0,
            }}
          >
            ⚡ Check-in Lightning
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 4,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              close
            </span>
          </button>
        </div>

        {status === 'loading' && (
          <div style={{ padding: '40px 0', color: 'var(--text-dim)' }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: '3px solid var(--border)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <p style={{ fontSize: 14 }}>Génération de l&apos;invoice…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {status === 'waiting' && invoice && (
          <>
            {/* QR Placeholder */}
            <div
              style={{
                width: 200,
                height: 200,
                margin: '0 auto 20px',
                background: '#fff',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid var(--border)',
              }}
            >
              <div style={{ textAlign: 'center', color: '#333', padding: 16 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#F7931A' }}>
                  qr_code_2
                </span>
                <div style={{ fontSize: 10, marginTop: 8, fontFamily: 'JetBrains Mono, monospace', color: '#666' }}>
                  QR Lightning
                </div>
              </div>
            </div>

            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>1 sat</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Scannez ou copiez l&apos;invoice ci-dessous
            </div>

            {/* Invoice string */}
            <div
              style={{
                background: 'var(--panel-inner)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 16,
                fontSize: 11,
                fontFamily: 'JetBrains Mono, monospace',
                color: 'var(--text-dim)',
                wordBreak: 'break-all',
                maxHeight: 60,
                overflow: 'hidden',
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
                border: '1px solid var(--border)',
                background: 'var(--panel-inner)',
                color: 'var(--text-soft)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                {copied ? 'check' : 'content_copy'}
              </span>
              {copied ? 'Copié !' : "Copier l'invoice"}
            </button>

            <div
              className="animate-glowfade"
              style={{
                marginTop: 20,
                fontSize: 12,
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                hourglass_top
              </span>
              En attente du paiement…
            </div>
          </>
        )}

        {status === 'paid' && (
          <div style={{ padding: '40px 0' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(var(--success-rgb), 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 36, color: 'var(--success)', fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
            <h4 style={{ fontSize: 18, fontWeight: 600, color: 'var(--success)', marginBottom: 8 }}>
              Paiement confirmé !
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              Votre présence a été prouvée. Le compteur a été réinitialisé.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div style={{ padding: '40px 0' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#EF4444' }}>
              error
            </span>
            <p style={{ fontSize: 14, color: '#EF4444', marginTop: 12 }}>{errorMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
}
