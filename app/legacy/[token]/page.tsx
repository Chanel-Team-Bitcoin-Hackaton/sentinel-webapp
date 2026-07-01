'use client';

import React, { use, useState, useEffect } from 'react';
import { api, type Testament, type Beneficiary, type EncryptedSecret } from '@/app/lib/api';
import { decryptSecret } from '@/app/lib/crypto';
import { useLanguage } from '@/app/context/LanguageContext';
import { translations } from '@/app/lib/translations';

type DecryptedSecret = {
  id: string;
  title: string;
  type: string;
  content: string;
};

export default function BeneficiaryPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { lang, toggleLang } = useLanguage();
  const L = translations[lang].legacy;

  // States
  const [testament, setTestament] = useState<Testament | null>(null);
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [portalStep, setPortalStep] = useState<0 | 1 | 2 | 3>(0); // 0: Info/Timeline, 1: Question, 2: Secret Word, 3: Revealed

  // Challenge answers
  const [questionAnswer, setQuestionAnswer] = useState('');
  const [secretWord, setSecretWord] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [isVerifying, setIsVerifying] = useState(false);

  // Decrypted secrets result
  const [decryptedSecrets, setDecryptedSecrets] = useState<DecryptedSecret[]>([]);
  const [visibleSecretId, setVisibleSecretId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortalData = async () => {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const res = await api.legacy.getPortalData(token);
        setTestament(res.testament);
        setBeneficiary(res.beneficiary);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : L.loadError);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPortalData();
  }, [token, L.loadError]);

  const handleVerifyQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionAnswer.trim()) return;

    setIsVerifying(true);
    try {
      await api.legacy.verifyQuestion(token, questionAnswer);
      setPortalStep(2); // Go to secret word entry
    } catch {
      setErrorMsg(L.questionWrongAnswer);
      setPortalStep(2); // Proceed anyway as it's non-blocking
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUnlockSecrets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretWord.trim()) return;

    setIsVerifying(true);
    setErrorMsg('');
    try {
      // 1. Fetch encrypted blobs from server (rate-limited route)
      const encryptedSecrets = await api.legacy.unlockSecrets(token, secretWord);

      // 2. Try to decrypt them client-side
      const decryptedList: DecryptedSecret[] = [];
      for (const secret of encryptedSecrets) {
        const decryptedStr = await decryptSecret(
          secret.encryptedBlob,
          secret.ivHex,
          secret.saltHex,
          secretWord
        );
        const parsed = JSON.parse(decryptedStr);
        decryptedList.push({
          id: secret.id,
          title: secret.title,
          type: secret.type,
          content: parsed.content || '',
        });
      }

      setDecryptedSecrets(decryptedList);
      setPortalStep(3); // Decryption success!
    } catch (err: unknown) {
      setAttemptsLeft((a) => Math.max(0, a - 1));
      setErrorMsg(err instanceof Error ? err.message : L.decryptFailed);
    } finally {
      setIsVerifying(false);
    }
  };

  const downloadSecret = (secret: DecryptedSecret) => {
    const blob = new Blob([secret.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${secret.title.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ color: 'var(--text-muted)' }}>{L.loading}</div>
      </div>
    );
  }

  if (errorMsg && !testament) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#EF4444', marginBottom: 12 }}>error</span>
          <h2 style={{ fontSize: 20, color: 'var(--text)' }}>{L.unauthorizedTitle}</h2>
          <p style={{ fontSize: 14, color: 'var(--text-dim)' }}>{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (!testament || !beneficiary) return null;

  const isTriggered = testament.status === 'TRIGGERED';

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
      <div style={{ width: '100%', maxWidth: 540, position: 'relative' }}>
        <button
          onClick={toggleLang}
          title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
          style={{ position: 'absolute', top: 0, right: 0, border: '1px solid var(--border)', cursor: 'pointer', background: 'transparent', color: 'var(--text-dim)', height: 32, borderRadius: 7, padding: '0 10px', fontSize: 12, fontWeight: 600, fontFamily: 'monospace', letterSpacing: '0.06em' }}
        >
          {lang === 'fr' ? 'EN' : 'FR'}
        </button>
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
            {L.portalTitle}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            {L.portalSubtitle}
          </p>
        </div>

        {/* Step 0: Welcome & Timeline */}
        {portalStep === 0 && (
          <div
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 28,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-soft)', marginBottom: 20 }}>
              {L.statusTitle}
            </h2>

            {/* Timeline ECG graph representation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 15, top: 8, bottom: 8, width: 2, background: 'var(--border)' }} />

              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(var(--accent-rgb), 0.1)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', flexShrink: 0, justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--accent)' }}>publish</span>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-soft)' }}>{L.testamentCreated}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{L.testamentCreatedDesc}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: isTriggered ? 'rgba(239, 68, 68, 0.1)' : 'rgba(52, 211, 153, 0.1)', border: `1px solid ${isTriggered ? '#EF4444' : 'var(--success)'}`, display: 'flex', alignItems: 'center', flexShrink: 0, justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: isTriggered ? '#EF4444' : 'var(--success)' }}>
                    {isTriggered ? 'favorite_border' : 'favorite'}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-soft)' }}>
                    {isTriggered ? L.absenceConfirmed : L.activityDetected}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {isTriggered ? L.absenceConfirmedDesc : L.activityDetectedDesc}
                  </div>
                </div>
              </div>
            </div>

            {isTriggered ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 13, color: '#EF4444', lineHeight: 1.5 }}>
                  <strong>{L.triggerNoticeStrong}</strong> {L.triggerNoticeDesc}
                </div>
                <button
                  onClick={() => setPortalStep(beneficiary.secretQuestion ? 1 : 2)}
                  style={{
                    width: '100%',
                    padding: '12px 0',
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
                  {L.startRecovery}
                </button>
              </div>
            ) : (
              <div style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--panel-inner)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--success)', marginBottom: 8, display: 'block' }}>lock</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-soft)', marginBottom: 4 }}>{L.secretsSecure}</div>
                <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>
                  {L.secretsSecureDesc}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Secret Question Challenge */}
        {portalStep === 1 && (
          <div
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 28,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-soft)', marginBottom: 8 }}>
              {L.identityCheckTitle}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 20, lineHeight: 1.5 }}>
              {L.identityCheckDesc}
            </p>

            <form onSubmit={handleVerifyQuestion}>
              <div style={{ marginBottom: 20, padding: 16, borderRadius: 10, background: 'var(--panel-inner)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {L.questionLabel}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-soft)', lineHeight: 1.5 }}>
                  {beneficiary.secretQuestion}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-dim)', marginBottom: 6 }}>
                  {L.answerLabel}
                </label>
                <input
                  value={questionAnswer}
                  onChange={(e) => setQuestionAnswer(e.target.value)}
                  placeholder={L.answerPlaceholder}
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

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setPortalStep(2)}
                  style={{
                    flex: 1,
                    padding: '11px 0',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--panel)',
                    color: 'var(--text-soft)',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  {L.skipStep}
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  style={{
                    flex: 2,
                    padding: '11px 0',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, var(--accent), #E8820C)',
                    color: 'var(--btn-text)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isVerifying ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 10px rgba(var(--accent-rgb), 0.2)',
                  }}
                >
                  {L.validateContinue}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Secret Word (Decryption Key) Entry */}
        {portalStep === 2 && (
          <div
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 28,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-soft)', marginBottom: 8 }}>
              {L.decryptTitle}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 20, lineHeight: 1.5 }}>
              {L.decryptDescPrefix} <strong>{L.decryptDescStrong}</strong> {L.decryptDescSuffix}
            </p>

            <form onSubmit={handleUnlockSecrets}>
              {errorMsg && (
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#EF4444' }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-dim)', marginBottom: 6 }}>
                  {L.secretWordLabel}
                </label>
                <input
                  type="password"
                  value={secretWord}
                  onChange={(e) => setSecretWord(e.target.value)}
                  placeholder={L.secretWordPlaceholder}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  <span>{L.rateLimitNote}</span>
                  <span style={{ color: attemptsLeft <= 2 ? '#EF4444' : 'var(--text-muted)' }}>
                    {L.attemptsLeft} {attemptsLeft}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifying || attemptsLeft === 0}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  borderRadius: 10,
                  border: 'none',
                  background: attemptsLeft === 0 ? 'var(--border)' : 'linear-gradient(135deg, var(--accent), #E8820C)',
                  color: attemptsLeft === 0 ? 'var(--text-faint)' : 'var(--btn-text)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isVerifying || attemptsLeft === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: attemptsLeft > 0 ? '0 2px 12px rgba(var(--accent-rgb), 0.25)' : 'none',
                }}
              >
                {isVerifying ? L.decrypting : L.unlockCta}
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Revealed Secrets */}
        {portalStep === 3 && (
          <div
            style={{
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 28,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--success)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>verified_user</span>
              {L.decryptSuccess}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 24, lineHeight: 1.5 }}>
              {L.decryptSuccessDesc}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {decryptedSecrets.map((secret) => {
                const isVisible = visibleSecretId === secret.id;
                return (
                  <div
                    key={secret.id}
                    style={{
                      background: 'var(--panel-inner)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--accent-ink)' }}>
                          {secret.type === 'SEED' ? 'key' : 'notes'}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-soft)' }}>
                          {secret.title}
                        </span>
                      </div>
                      <span style={{ fontSize: 10, background: 'var(--border)', borderRadius: 4, padding: '2px 6px', color: 'var(--text-muted)' }}>
                        {secret.type}
                      </span>
                    </div>

                    {/* Content text block */}
                    <div style={{ position: 'relative', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                      <pre
                        style={{
                          margin: 0,
                          fontSize: 12,
                          fontFamily: 'JetBrains Mono, monospace',
                          color: isVisible ? 'var(--text)' : 'transparent',
                          textShadow: isVisible ? 'none' : '0 0 10px rgba(255,255,255,0.4)',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                          userSelect: isVisible ? 'all' : 'none',
                          maxHeight: 150,
                          overflowY: 'auto',
                        }}
                      >
                        {secret.content}
                      </pre>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <button
                        onClick={() => setVisibleSecretId(isVisible ? null : secret.id)}
                        style={{
                          flex: 1,
                          padding: '8px 0',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--panel-inner)',
                          color: 'var(--text-soft)',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          {isVisible ? 'visibility_off' : 'visibility'}
                        </span>
                        {isVisible ? L.hide : L.show}
                      </button>

                      <button
                        onClick={() => downloadSecret(secret)}
                        style={{
                          flex: 1,
                          padding: '8px 0',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--panel-inner)',
                          color: 'var(--text-soft)',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                        {L.download}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
