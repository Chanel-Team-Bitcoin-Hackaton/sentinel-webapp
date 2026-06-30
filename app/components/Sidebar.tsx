'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'Secrets', href: '/dashboard/secrets', icon: 'lock' },
  { label: 'Bénéficiaire', href: '/dashboard/beneficiary', icon: 'person' },
  { label: 'Historique', href: '/dashboard/history', icon: 'history' },
];

interface SidebarProps {
  isOpen?: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, isMobile = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <aside
      style={{
        width: 260,
        height: '100vh',
        background: 'var(--panel)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 50,
        transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isMobile && isOpen ? '0 0 30px rgba(0, 0, 0, 0.5)' : 'none',
      }}
    >
      {/* Logo & Close Button (Mobile Only) */}
      <div>
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, var(--accent), #E8820C)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 12px rgba(var(--accent-rgb), 0.25)',
              }}
            >
              <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 18, color: '#fff' }}>
                S
              </span>
            </div>
            <div>
              <span
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: 17,
                  fontWeight: 600,
                  color: 'var(--text)',
                  letterSpacing: '-0.01em',
                }}
              >
                Sentinel
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  fontFamily: 'JetBrains Mono, monospace',
                  letterSpacing: '0.04em',
                }}
              >
                BITCOIN TESTAMENT
              </span>
            </div>
          </div>

          {isMobile && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--accent-ink)' : 'var(--text-dim)',
                  background: isActive ? 'rgba(var(--accent-rgb), 0.08)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  letterSpacing: '-0.01em',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 20,
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                    color: isActive ? 'var(--accent-ink)' : 'var(--text-muted)',
                  }}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 12px 24px', borderTop: '1px solid var(--border)' }}>
        {/* User card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--avatar-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-dim)',
            }}
          >
            {user?.email?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-soft)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 140,
              }}
            >
              {user?.email || 'testateur@sentinel.btc'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Testateur</div>
          </div>
        </div>

        <button
          onClick={() => {
            handleLinkClick();
            logout();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 13,
            color: 'var(--text-muted)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.2s',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            logout
          </span>
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
