'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Lang = 'fr' | 'en';

interface LanguageContextValue {
  lang: Lang;
  toggleLang: () => void;
}

export const LanguageContext = createContext<LanguageContextValue>({
  lang: 'fr',
  toggleLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('fr');

  useEffect(() => {
    const saved = localStorage.getItem('sentinel-app-lang') as Lang | null;
    if (saved === 'fr' || saved === 'en') setLang(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = () => {
    setLang((l) => {
      const next: Lang = l === 'fr' ? 'en' : 'fr';
      localStorage.setItem('sentinel-app-lang', next);
      return next;
    });
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
