'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useTestament } from '@/app/context/TestamentContext';
import DashboardLayout from '@/app/components/DashboardLayout';

export default function BeneficiaryPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { testament, beneficiary, isLoading, refresh, upsertBeneficiary } = useTestament();
  const router = useRouter();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [secretQuestion, setSecretQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
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

  // Sync state once beneficiary is loaded
  useEffect(() => {
    if (beneficiary) {
      setName(beneficiary.name);
      setEmail(beneficiary.email);
      setPhone(beneficiary.phone || '');
      setSecretQuestion(beneficiary.secretQuestion || '');
    }
  }, [beneficiary]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    if (!testament) return;

    if (!name || !email) {
      setErrorMsg('Le nom et l\'email sont requis.');
      return;
    }

    setIsSubmitting(true);
    try {
      await upsertBeneficiary({
        name,
        email,
        phone,
        secretQuestion,
        secretQuestionHash: secretQuestion ? 'bcrypt_hash_placeholder' : '',
      });
      setSuccessMsg('Informations du bénéficiaire mises à jour avec succès.');
      refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la mise à jour.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout title="Bénéficiaire">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, color: 'var(--text-muted)' }}>
          Chargement…
        </div>
      </DashboardLayout>
    );
  }

  if (!testament) {
    return (
      <DashboardLayout title="Bénéficiaire">
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          Veuillez d&apos;abord configurer votre testament.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Bénéficiaire" subtitle="Gérez le bénéficiaire désigné pour votre testament">
      <div style={{ maxWidth: 600 }}>
        {/* Form Card */}
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 32,
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {successMsg && (
              <div
                style={{
                  background: 'rgba(52, 211, 153, 0.08)',
                  border: '1px solid rgba(52, 211, 153, 0.2)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 13,
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 13,
                  color: '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
                {errorMsg}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-dim)', marginBottom: 6 }}>
                Nom complet du bénéficiaire
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Koffi Adjovi"
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

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-dim)', marginBottom: 6 }}>
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: koffi.adjovi@example.com"
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

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-dim)', marginBottom: 6 }}>
                Téléphone (optionnel — format international SMS)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: +228 90 00 00 00"
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

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-dim)', marginBottom: 6 }}>
                Question secrète émotionnelle
              </label>
              <textarea
                value={secretQuestion}
                onChange={(e) => setSecretQuestion(e.target.value)}
                placeholder="Ex: Quel est le nom de la chèvre préférée de ton grand-père ?"
                rows={3}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--panel-inner)',
                  color: 'var(--text)',
                  fontSize: 14,
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, margin: 0, lineHeight: 1.4 }}>
                Cette question sert de validation émotionnelle facultative lors de l&apos;accès public à vos secrets.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px 0',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, var(--accent), #E8820C)',
                color: 'var(--btn-text)',
                fontSize: 14,
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                boxShadow: '0 2px 12px rgba(var(--accent-rgb), 0.25)',
                marginTop: 8,
              }}
            >
              {isSubmitting ? 'Mise à jour…' : 'Enregistrer les modifications'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
