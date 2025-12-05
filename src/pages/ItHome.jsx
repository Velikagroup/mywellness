import React from 'react';
import Home from './Home';
import { LanguageProvider } from '@/components/i18n/LanguageContext';

export default function ItHome() {
  React.useEffect(() => {
    window.scrollTo(0, 0);
    localStorage.setItem('preferred_language', 'it');
  }, []);

  return (
    <LanguageProvider forcedLanguage="it">
      <Home />
    </LanguageProvider>
  );
}