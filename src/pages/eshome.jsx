import React from 'react';
import Home from './Home';
import { LanguageProvider } from '@/components/i18n/LanguageContext';

export default function EsHome() {
  React.useEffect(() => {
    window.scrollTo(0, 0);
    localStorage.setItem('preferred_language', 'es');
  }, []);

  return (
    <LanguageProvider forcedLanguage="es">
      <Home />
    </LanguageProvider>
  );
}