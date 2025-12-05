import React from 'react';
import Home from './Home';
import { LanguageProvider } from '@/components/i18n/LanguageContext';

export default function FrHome() {
  React.useEffect(() => {
    window.scrollTo(0, 0);
    localStorage.setItem('preferred_language', 'fr');
  }, []);

  return (
    <LanguageProvider forcedLanguage="fr">
      <Home />
    </LanguageProvider>
  );
}