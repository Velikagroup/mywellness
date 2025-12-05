import React from 'react';
import Home from './Home';
import { LanguageProvider } from '@/components/i18n/LanguageContext';

export default function PtHome() {
  React.useEffect(() => {
    window.scrollTo(0, 0);
    localStorage.setItem('preferred_language', 'pt');
  }, []);

  return (
    <LanguageProvider forcedLanguage="pt">
      <Home />
    </LanguageProvider>
  );
}