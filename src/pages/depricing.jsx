import React, { useEffect } from 'react';
import { LanguageProvider } from '@/components/i18n/LanguageContext';
import PricingPageContent from '@/components/pricing/PricingPageContent.jsx';

export default function Depricing() {
  useEffect(() => {
    window.scrollTo(0, 0);
    localStorage.setItem('preferred_language', 'de');
  }, []);

  return (
    <LanguageProvider forcedLanguage="de">
      <PricingPageContent />
    </LanguageProvider>
  );
}