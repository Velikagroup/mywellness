import React from 'react';
import { LanguageProvider } from '@/components/i18n/LanguageContext';
import { HomeContent } from './Home';

// Set language BEFORE rendering
if (typeof window !== 'undefined') {
  localStorage.setItem('preferred_language', 'it');
}

export default function ItHome() {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <LanguageProvider forcedLanguage="it">
      <HomeContent />
    </LanguageProvider>
  );
}