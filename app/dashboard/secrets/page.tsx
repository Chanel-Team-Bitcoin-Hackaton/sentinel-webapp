'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useTestament } from '@/app/context/TestamentContext';
import DashboardLayout from '@/app/components/DashboardLayout';
import { encryptSecret } from '@/app/lib/crypto';
import { useLanguage } from '@/app/context/LanguageContext';
import { translations } from '@/app/lib/translations';

export default function SecretsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { testament, secrets, isLoading, refresh, addSecret, removeSecret } = useTestament();
  const router = useRouter();
  const { lang } = useLanguage();
  const L = translations[lang].dashboardSecrets;

  // Modal / Form state
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'SEED' | 'PDF' | 'TEXT' | 'CREDENTIALS'>('SEED');
  const [plaintext, setPlaintext] = useState('');
  const [secretWord, setSecretWord] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleAddSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!testament) return;

    if (!title || !plaintext || !secretWord) {
      setErrorMsg(L.errorRequiredFields);
      return;
    }

    if (secretWord.length < 10) {
      setErrorMsg(L.errorSecretWordTooShort);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Encrypt client-side using Web Crypto
      const { encryptedBlob, ivHex, saltHex } = await encryptSecret(
        JSON.stringify({ content: plaintext }),
        secretWord
      );

      // 2. Upload to backend
      await addSecret(title, type, encryptedBlob, ivHex, saltHex);

      // Reset
      setTitle('');
      setType('SEED');
      setPlaintext('');
      setSecretWord('');
      setIsOpen(false);
      refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : L.errorSaveFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(L.deleteConfirm)) {
      await removeSecret(id);
      refresh();
    }
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout title={L.title}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: 'var(--text-muted)' }}>
          {L.loading}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={L.title} subtitle={L.subtitle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-soft)', margin: 0 }}>
          {L.vaultTitle} ({secrets.length} {secrets.length !== 1 ? L.secretPlural : L.secretSingular})
        </h2>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, var(--accent), #E8820C)',
            color: 'var(--btn-text)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 8px rgba(var(--accent-rgb), 0.2)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          {L.depositSecret}
        </button>
      </div>

      {secrets.length === 0 ? (
        <div
          style={{
            background: 'var(--panel)',
            border: '1px dashed var(--border)',
            borderRadius: 16,
            padding: '60px 20px',
            textAlign: 'center',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--text-muted)', marginBottom: 12, display: 'block' }}>
            lock_open
          </span>
          <p style={{ fontSize: 14, color: 'var(--text-dim)', margin: '0 0 16px' }}>
            {L.emptyVault}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {secrets.map((secret) => (
            <div
              key={secret.id}
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'var(--panel-inner)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--accent-ink)' }}>
                    {secret.type === 'SEED' ? 'key' : secret.type === 'PDF' ? 'description' : secret.type === 'CREDENTIALS' ? 'lock' : 'notes'}
                  </span>
                </div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-soft)', margin: '0 0 4px' }}>
                    {secret.title}
                  </h4>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                    <span>{L.typeLabel}: {secret.type}</span>
                    <span>•</span>
                    <span>{L.addedOnLabel}: {new Date(secret.createdAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: 'JetBrains Mono, monospace',
                    background: 'var(--panel-inner)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '3px 8px',
                    color: 'var(--text-muted)',
                  }}
                >
                  {L.encryptedBadge}
                </span>
                <button
                  onClick={() => handleDelete(secret.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 6,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Secret Modal */}
      {isOpen && (
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
          onClick={() => setIsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: 32,
              width: 'calc(100% - 32px)',
              margin: 16,
              maxWidth: 480,
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                {L.modalTitle}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            <form onSubmit={handleAddSecret} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {errorMsg && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#EF4444' }}>
                  {errorMsg}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-dim)', marginBottom: 6 }}>
                  {L.secretTitleLabel}
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={L.secretTitlePlaceholder}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--panel-inner)', color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-dim)', marginBottom: 6 }}>
                  {L.dataTypeLabel}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--panel-inner)', color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="SEED">{L.typeSeed}</option>
                  <option value="TEXT">{L.typeText}</option>
                  <option value="CREDENTIALS">{L.typeCredentials}</option>
                  <option value="PDF">{L.typePdf}</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-dim)', marginBottom: 6 }}>
                  {L.plaintextLabel}
                </label>
                <textarea
                  value={plaintext}
                  onChange={(e) => setPlaintext(e.target.value)}
                  placeholder={L.plaintextPlaceholder}
                  rows={4}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--panel-inner)', color: 'var(--text)', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--accent-ink)', marginBottom: 6 }}>
                  {L.secretWordLabel}
                </label>
                <input
                  type="password"
                  value={secretWord}
                  onChange={(e) => setSecretWord(e.target.value)}
                  placeholder={L.secretWordPlaceholder}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--panel-inner)', color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '11px 0',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--accent), #E8820C)',
                  color: 'var(--btn-text)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                  boxShadow: '0 2px 10px rgba(var(--accent-rgb), 0.2)',
                  marginTop: 10,
                }}
              >
                {isSubmitting ? L.submitting : L.submit}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
