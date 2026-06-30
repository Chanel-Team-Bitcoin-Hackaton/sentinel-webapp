'use client';

import React from 'react';

interface HeartbeatCardProps {
  status: 'ACTIVE' | 'WARNING' | 'TRIGGERED';
  nextCheckinAt: string;
  lastSeenAt: string;
}

export default function HeartbeatCard({ status, nextCheckinAt, lastSeenAt }: HeartbeatCardProps) {
  const statusConfig = {
    ACTIVE: { label: 'Actif', color: 'var(--success)', icon: 'favorite', glow: 'var(--success-rgb)' },
    WARNING: { label: 'En retard', color: '#FBBF24', icon: 'warning', glow: '251, 191, 36' },
    TRIGGERED: { label: 'Déclenché', color: '#EF4444', icon: 'error', glow: '239, 68, 68' },
  };

  const config = statusConfig[status];

  // Calculate countdown
  const now = new Date();
  const target = new Date(nextCheckinAt);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  // ECG SVG wave path
  const ecgPath = 'M0,50 L30,50 L35,50 L40,20 L45,80 L50,10 L55,90 L60,50 L65,50 L100,50 L130,50 L135,50 L140,20 L145,80 L150,10 L155,90 L160,50 L165,50 L200,50 L230,50 L235,50 L240,20 L245,80 L250,10 L255,90 L260,50 L265,50 L300,50 L330,50 L335,50 L340,20 L345,80 L350,10 L355,90 L360,50 L365,50 L400,50';

  return (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 28,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background ECG wave */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none' }}>
        <svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none">
          <path
            d={ecgPath}
            fill="none"
            stroke={config.color}
            strokeWidth="2"
            className="animate-ecg-dash"
            style={{ strokeDasharray: 1000 }}
          />
        </svg>
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Pulsating dot */}
            <div
              className={status === 'ACTIVE' ? 'animate-heartbeat' : ''}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: config.color,
                boxShadow: `0 0 8px rgba(${config.glow}, 0.5)`,
              }}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: config.color,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {config.label}
            </span>
          </div>

          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 28,
              color: config.color,
              fontVariationSettings: "'FILL' 1",
              opacity: 0.7,
            }}
          >
            {config.icon}
          </span>
        </div>

        {/* Countdown */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Prochain check-in
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: 42,
                fontWeight: 700,
                color: 'var(--text)',
                lineHeight: 1,
              }}
            >
              {status === 'TRIGGERED' ? '—' : diffDays}
            </span>
            {status !== 'TRIGGERED' && (
              <span style={{ fontSize: 14, color: 'var(--text-dim)', fontWeight: 500 }}>
                jour{diffDays !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', gap: 24, fontSize: 12, color: 'var(--text-muted)' }}>
          <div>
            <span style={{ opacity: 0.7 }}>Dernière activité : </span>
            <span style={{ color: 'var(--text-dim)' }}>
              {new Date(lastSeenAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div>
            <span style={{ opacity: 0.7 }}>Échéance : </span>
            <span style={{ color: 'var(--text-dim)' }}>
              {new Date(nextCheckinAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
