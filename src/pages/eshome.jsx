import React from 'react';
import { LanguageProvider } from '@/components/i18n/LanguageContext';
import { HomeContent } from './Home';

export default function EsHome() {
  React.useEffect(() => {
    window.scrollTo(0, 0);
    localStorage.setItem('preferred_language', 'es');
  }, []);

  return (
    <LanguageProvider forcedLanguage="es">
      <HomeContent />
    </LanguageProvider>
  );
}