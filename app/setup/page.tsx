'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTestament } from '@/app/context/TestamentContext';
import { encryptSecret, validateSecretStrength } from '@/app/lib/crypto';
import { useLanguage } from '@/app/context/LanguageContext';
import { translations } from '@/app/lib/translations';

type SecretEntry = {
  title: string;
  type: 'SEED' | 'PDF' | 'TEXT' | 'CREDENTIALS';
  plaintext: string;
};

export default function SetupPage() {
  const router = useRouter();
  const { createTestament, addSecret, upsertBeneficiary } = useTestament();
  const { lang } = useLanguage();
  const L = translations[lang].setup;
  const STEPS = L.steps;

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Delay
  const [delayDays, setDelayDays] = useState(30);

  // Step 2: Secrets
  const [secretWord, setSecretWord] = useState('');
  const [secretWordConfirm, setSecretWordConfirm] = useState('');
  const [secretEntries, setSecretEntries] = useState<SecretEntry[]>([
    { title: '', type: 'SEED', plaintext: '' },
  ]);

  // Step 3: Beneficiary
  const [benName, setBenName] = useState('');
  const [benEmail, setBenEmail] = useState('');
  const [benPhone, setBenPhone] = useState('');

  // Step 4: Secret question
  const [secretQuestion, setSecretQuestion] = useState('');

  // Step 5: Anchor result (simulated)
  const [anchorTxid, setAnchorTxid] = useState<string | null>(null);

  // Validation helpers
  const secretStrength = validateSecretStrength(secretWord);

  const nextStep = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleCreateTestament = async () => {
    setIsSubmitting(true);
    try {
      const testament = await createTestament(delayDays);
      setAnchorTxid(testament.anchorTxid);

      // Encrypt and upload each secret
      for (const entry of secretEntries) {
        if (entry.title && entry.plaintext) {
          const { encryptedBlob, ivHex, saltHex } = await encryptSecret(
            JSON.stringify({ content: entry.plaintext }),
            secretWord
          );
          await addSecret(entry.title, entry.type, encryptedBlob, ivHex, saltHex);
        }
      }

      // Upsert beneficiary
      if (benName && benEmail) {
        await upsertBeneficiary({
          name: benName,
          email: benEmail,
          phone: benPhone,
          secretQuestion: secretQuestion || '',
          secretQuestionHash: secretQuestion ? 'bcrypt_placeholder_hash' : '',
        });
      }

      setStep(4); // Go to anchor step
    } catch (err) {
      console.error(err);
      alert(L.creationError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSecretEntry = () => {
    setSecretEntries([...secretEntries, { title: '', type: 'TEXT', plaintext: '' }]);
  };

  const updateSecretEntry = (index: number, field: keyof SecretEntry, value: string) => {
    const updated = [...secretEntries];
    updated[index] = { ...updated[index], [field]: value };
    setSecretEntries(updated);
  };

  const removeSecretEntry = (index: number) => {
    if (secretEntries.length > 1) {
      setSecretEntries(secretEntries.filter((_, i) => i !== index));
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              {L.delayTitle}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 28, lineHeight: 1.6 }}>
              {L.delayDesc}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 12 }}>
              {[30, 60, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setDelayDays(days)}
                  style={{
                    padding: '20px 16px',
                    borderRadius: 14,
                    border: `2px solid ${delayDays === days ? 'var(--accent)' : 'var(--border)'}`,
                    background: delayDays === days ? 'rgba(var(--accent-rgb), 0.06)' : 'var(--panel-inner)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: delayDays === days ? 'var(--accent-ink)' : 'var(--text)' }}>
                    {days}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{L.days}</div>
                </button>
              ))}
            </div>

            <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 10, background: 'var(--panel-inner)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--accent-ink)' }}>info</span>
                {L.delayNote}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              {L.secretsTitle}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 24, lineHeight: 1.6 }}>
              {L.secretsDescPrefix} <strong>{L.secretsDescStrong}</strong> {L.secretsDescSuffix}
            </p>

            {/* Secret word */}
            <div style={{ marginBottom: 20, padding: 20, borderRadius: 12, background: 'var(--panel-inner)', border: '1px solid var(--border)' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--accent-ink)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {L.secretWordLabel}
              </label>
              <input
                type="password"
                value={secretWord}
                onChange={(e) => setSecretWord(e.target.value)}
                placeholder={L.secretWordPlaceholder}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: 14,
                  outline: 'none',
                  marginBottom: 8,
                  boxSizing: 'border-box',
                }}
              />
              {secretWord && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        style={{
                          width: 32,
                          height: 4,
                          borderRadius: 2,
                          background: level <= secretStrength.score
                            ? secretStrength.score <= 2 ? '#EF4444' : secretStrength.score === 3 ? '#FBBF24' : 'var(--success)'
                            : 'var(--border)',
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: 11, color: secretStrength.isValid ? 'var(--success)' : '#EF4444' }}>
                    {secretStrength.message || (secretStrength.score >= 4 ? L.strengthExcellent : secretStrength.score >= 3 ? L.strengthGood : L.strengthMedium)}
                  </span>
                </div>
              )}
              <input
                type="password"
                value={secretWordConfirm}
                onChange={(e) => setSecretWordConfirm(e.target.value)}
                placeholder={L.secretWordConfirmPlaceholder}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  border: `1px solid ${secretWordConfirm && secretWordConfirm !== secretWord ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`,
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: 14,
                  outline: 'none',
                  marginTop: 8,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Secret entries */}
            {secretEntries.map((entry, i) => (
              <div key={i} style={{ marginBottom: 16, padding: 16, borderRadius: 12, background: 'var(--panel-inner)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-soft)' }}>{L.secretLabel} #{i + 1}</span>
                  {secretEntries.length > 1 && (
                    <button onClick={() => removeSecretEntry(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                    </button>
                  )}
                </div>
                <input
                  value={entry.title}
                  onChange={(e) => updateSecretEntry(i, 'title', e.target.value)}
                  placeholder={L.secretTitlePlaceholder}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: 13,
                    outline: 'none',
                    marginBottom: 8,
                    boxSizing: 'border-box',
                  }}
                />
                <select
                  value={entry.type}
                  onChange={(e) => updateSecretEntry(i, 'type', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: 13,
                    outline: 'none',
                    marginBottom: 8,
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="SEED">{L.typeSeed}</option>
                  <option value="TEXT">{L.typeText}</option>
                  <option value="CREDENTIALS">{L.typeCredentials}</option>
                  <option value="PDF">{L.typePdf}</option>
                </select>
                <textarea
                  value={entry.plaintext}
                  onChange={(e) => updateSecretEntry(i, 'plaintext', e.target.value)}
                  placeholder={entry.type === 'SEED' ? L.seedPlaceholder : L.contentPlaceholder}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: 13,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: entry.type === 'SEED' ? 'JetBrains Mono, monospace' : 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}

            <button
              onClick={addSecretEntry}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px dashed var(--border)',
                background: 'transparent',
                color: 'var(--text-dim)',
                fontSize: 13,
                cursor: 'pointer',
                width: '100%',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
              {L.addSecret}
            </button>
          </div>
        );

      case 2:
        return (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              {L.beneficiaryTitle}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 24, lineHeight: 1.6 }}>
              {L.beneficiaryDesc}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-dim)', marginBottom: 6 }}>
                  {L.fullNameLabel}
                </label>
                <input
                  value={benName}
                  onChange={(e) => setBenName(e.target.value)}
                  placeholder={L.fullNamePlaceholder}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--panel-inner)', color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-dim)', marginBottom: 6 }}>
                  {L.emailLabel}
                </label>
                <input
                  type="email"
                  value={benEmail}
                  onChange={(e) => setBenEmail(e.target.value)}
                  placeholder={L.emailPlaceholder}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--panel-inner)', color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-dim)', marginBottom: 6 }}>
                  {L.phoneLabel}
                </label>
                <input
                  type="tel"
                  value={benPhone}
                  onChange={(e) => setBenPhone(e.target.value)}
                  placeholder={L.phonePlaceholder}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--panel-inner)', color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              {L.questionTitle}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 24, lineHeight: 1.6 }}>
              {L.questionDesc}
            </p>

            <textarea
              value={secretQuestion}
              onChange={(e) => setSecretQuestion(e.target.value)}
              placeholder={L.questionPlaceholder}
              rows={3}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--panel-inner)',
                color: 'var(--text)',
                fontSize: 14,
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.5,
                boxSizing: 'border-box',
              }}
            />

            <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'var(--panel-inner)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--accent-ink)', flexShrink: 0, marginTop: 1 }}>tips_and_updates</span>
              <span>{L.questionHint}</span>
            </div>
          </div>
        );

      case 4:
        return (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(var(--success-rgb), 0.12)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--success)', fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
            </div>

            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              {L.anchorTitle}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 24, lineHeight: 1.6 }}>
              {L.anchorDesc}
            </p>

            {anchorTxid && (
              <div
                style={{
                  background: 'var(--panel-inner)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {L.txidLabel}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent-ink)', wordBreak: 'break-all' }}>
                  {anchorTxid}
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              {L.checklistTitle}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 24, lineHeight: 1.6 }}>
              {L.checklistDesc}
            </p>

            {[
              { icon: 'key', label: L.checklistItems[0] },
              { icon: 'description', label: L.checklistItems[1] },
              { icon: 'backup', label: L.checklistItems[2] },
              { icon: 'verified_user', label: L.checklistItems[3] },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: 'var(--panel-inner)',
                  border: '1px solid var(--border)',
                  marginBottom: 10,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--accent-ink)' }}>
                  {item.icon}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.4 }}>{item.label}</span>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return delayDays > 0;
      case 1:
        return secretWord.length >= 10 && secretWord === secretWordConfirm && secretStrength.isValid && secretEntries.some((e) => e.title && e.plaintext);
      case 2:
        return benName.trim().length > 0 && benEmail.trim().length > 0;
      case 3:
        return true; // optional
      default:
        return true;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: i <= step ? 'var(--accent)' : 'var(--border)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        {/* Step indicator */}
        <div style={{ marginBottom: 8, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'JetBrains Mono, monospace' }}>
          {L.stepIndicator} {step + 1} / {STEPS.length} — {STEPS[step]}
        </div>

        {/* Card */}
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 32,
            marginBottom: 20,
          }}
        >
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={prevStep}
            disabled={step === 0}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--panel)',
              color: step === 0 ? 'var(--text-faint)' : 'var(--text-soft)',
              fontSize: 13,
              fontWeight: 500,
              cursor: step === 0 ? 'not-allowed' : 'pointer',
              opacity: step === 0 ? 0.5 : 1,
            }}
          >
            {L.back}
          </button>

          {step < 3 ? (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                border: 'none',
                background: canProceed() ? 'linear-gradient(135deg, var(--accent), #E8820C)' : 'var(--border)',
                color: canProceed() ? 'var(--btn-text)' : 'var(--text-faint)',
                fontSize: 13,
                fontWeight: 600,
                cursor: canProceed() ? 'pointer' : 'not-allowed',
                boxShadow: canProceed() ? '0 2px 12px rgba(var(--accent-rgb), 0.25)' : 'none',
              }}
            >
              {L.next}
            </button>
          ) : step === 3 ? (
            <button
              onClick={handleCreateTestament}
              disabled={isSubmitting}
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, var(--accent), #E8820C)',
                color: 'var(--btn-text)',
                fontSize: 13,
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                boxShadow: '0 2px 12px rgba(var(--accent-rgb), 0.25)',
              }}
            >
              {isSubmitting ? L.creating : L.submit}
            </button>
          ) : step === 5 ? (
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, var(--accent), #E8820C)',
                color: 'var(--btn-text)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(var(--accent-rgb), 0.25)',
              }}
            >
              {L.goToDashboard}
            </button>
          ) : (
            <button
              onClick={nextStep}
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, var(--accent), #E8820C)',
                color: 'var(--btn-text)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(var(--accent-rgb), 0.25)',
              }}
            >
              {L.next}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
