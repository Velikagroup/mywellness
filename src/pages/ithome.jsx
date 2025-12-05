import React from 'react';
import { LanguageProvider } from '@/components/i18n/LanguageContext';

function HomeContentWrapper() {
  const { HomeContent } = require('./Home');
  return <HomeContent />;
}

export default function ItHome() {
  React.useEffect(() => {
    window.scrollTo(0, 0);
    localStorage.setItem('preferred_language', 'it');
  }, []);

  return (
    <LanguageProvider forcedLanguage="it">
      <HomeContentWrapper />
    </LanguageProvider>
  );
}