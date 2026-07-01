'use client';

import React, { useEffect, useState, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import { useLanguage } from '@/app/context/LanguageContext';
import { useTheme } from '@/app/context/ThemeContext';
import { translations } from '@/app/lib/translations';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { lang, toggleLang } = useLanguage();
  const L = translations[lang].dashboardLayout;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Backdrop for Mobile */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 45,
          }}
        />
      )}

      <Sidebar
        isMobile={isMobile}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main
        style={{
          marginLeft: isMobile ? 0 : 260,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0, // prevents flex item overflow
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Top Header */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '12px 16px' : '16px 32px',
            background: 'var(--header-bg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4,
                  margin: 0,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>menu</span>
              </button>
            )}

            <div style={{ minWidth: 0 }}>
              {title && (
                <h1
                  style={{
                    fontFamily: 'Playfair Display, serif',
                    fontSize: isMobile ? 18 : 22,
                    fontWeight: 600,
                    color: 'var(--text)',
                    margin: 0,
                    letterSpacing: '-0.01em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {title}
                </h1>
              )}
              {subtitle && !isMobile && (
                <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: '2px 0 0', letterSpacing: '-0.005em' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={toggleLang}
              title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                height: 36,
                padding: '0 10px',
                cursor: 'pointer',
                color: 'var(--text-dim)',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'monospace',
                letterSpacing: '0.06em',
              }}
            >
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? L.lightMode : L.darkMode}
              style={{
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: isMobile ? '6px 8px' : '8px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-dim)' }}>
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ padding: isMobile ? '16px' : '28px 32px', flex: 1 }}>{children}</div>
      </main>
    </div>
  );
}
